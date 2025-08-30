import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { GeoHotColdPerformance } from '../types'
import {
  buildDateFilter,
  buildCampaignFilter,
  googleAdsApiRequest,
} from '../utils'
import { getLimit } from '../limits'

interface GoogleAdsResult {
  geographicView: {
    locationType: string
    countryCriterionId: string
  }
  metrics: {
    costMicros: string
    clicks: string
    conversions: string
    conversionsValue: string
  }
}

interface GoogleAdsResponse {
  results: GoogleAdsResult[]
}

export async function POST(req: NextRequest) {
  return handleRequest(req, getGeoHotColdPerformance, {
    skipUsageRecording: true,
  })
}

async function getGeoHotColdPerformance(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
): Promise<GeoHotColdPerformance> {
  const dateFilter = buildDateFilter(timeRange)
  const campaignFilter = buildCampaignFilter(campaignId)

  console.log('Geo Hot Cold Performance - Debug info:', {
    timeRange,
    campaignId,
    dateFilter,
    campaignFilter,
    accountId,
  })

  const query = `
    SELECT
      geographic_view.location_type,
      geographic_view.country_criterion_id,
      metrics.cost_micros,
      metrics.clicks,
      metrics.conversions,
      metrics.conversions_value
    FROM geographic_view
    WHERE
      geographic_view.location_type IN (AREA_OF_INTEREST, LOCATION_OF_PRESENCE)
      ${dateFilter ? ` AND ${dateFilter}` : ''}
      ${campaignFilter}
    ORDER BY metrics.clicks DESC
    LIMIT ${getLimit('GEO_HOT_COLD_PERFORMANCE')}
  `

  try {
    console.log('Geo Hot Cold Performance - Executing GAQL query:', query)
    const response = await googleAdsApiRequest(
      accessToken,
      accountId,
      query,
      userId,
    )

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Google Ads API error: ${errText}`)
    }

    const json = (await response.json()) as GoogleAdsResponse
    console.log(
      'Geo Hot Cold Performance - Query successful, results count:',
      json?.results?.length || 0,
    )
    console.log(
      'Geo Hot Cold Performance - Raw response sample:',
      JSON.stringify(json?.results?.slice(0, 2), null, 2),
    )

    const locations: GeoHotColdPerformance['locations'] = (
      json.results ?? []
    ).map((r: GoogleAdsResult) => {
      const cost = parseInt(r.metrics.costMicros ?? '0') / 1_000_000
      const conversionValue = parseFloat(r.metrics.conversionsValue ?? '0')
      const conversions = parseFloat(r.metrics.conversions ?? '0')
      const clicks = parseInt(r.metrics.clicks ?? '0')
      const roas =
        cost > 0 ? parseFloat((conversionValue / cost).toFixed(2)) : 0

      return {
        locationType: r.geographicView.locationType,
        locationName: r.geographicView.countryCriterionId || 'Unknown',
        countryId: r.geographicView.countryCriterionId,
        cost: parseFloat(cost.toFixed(2)),
        clicks,
        conversions: parseFloat(conversions.toFixed(2)),
        conversionValue: parseFloat(conversionValue.toFixed(2)),
        roas,
      }
    })

    return { locations }
  } catch (error) {
    console.error('Error fetching geo performance:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      accessToken: accessToken ? 'present' : 'missing',
      accountId,
      timeRange,
      campaignId,
      query: query.replace(/\s+/g, ' ').trim(),
    })

    // Return empty data instead of mock data
    return {
      locations: [],
    }
  }
}
