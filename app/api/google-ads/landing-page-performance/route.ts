import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { LandingPagePerformance } from '../types'
import {
  buildDateFilter,
  buildCampaignFilter,
  googleAdsApiRequest,
} from '../utils'
import { getLimit } from '../limits'

interface GoogleAdsResult {
  adGroupAd: {
    ad: {
      finalUrls: string[]
    }
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
  return handleRequest(req, getLandingPagePerformance, {
    skipUsageRecording: true,
  })
}

async function getLandingPagePerformance(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
): Promise<LandingPagePerformance> {
  const dateFilter = buildDateFilter(timeRange)
  const campaignFilter = buildCampaignFilter(campaignId)

  // GAQL query to aggregate performance by final URL
  const query = `
    SELECT
      ad_group_ad.ad.final_urls,
      metrics.cost_micros,
      metrics.clicks,
      metrics.conversions,
      metrics.conversions_value
    FROM ad_group_ad
    WHERE
      ad_group_ad.status IN ('ENABLED', 'PAUSED')
      AND metrics.cost_micros > 0
      ${dateFilter ? ` AND ${dateFilter}` : ''}
      ${campaignFilter}
    ORDER BY metrics.cost_micros DESC
    LIMIT ${getLimit('LANDING_PAGE_PERFORMANCE')}
  `

  try {
    console.log('Landing Page Performance - Executing GAQL query:', query)
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
    console.log('Landing Page Performance - Query successful, results count:', json?.results?.length || 0)

    const pages: LandingPagePerformance['pages'] = (json.results ?? []).map(
      (r: GoogleAdsResult) => {
        const cost = parseInt(r.metrics.costMicros ?? '0') / 1_000_000
        const conversionValue = parseFloat(r.metrics.conversionsValue ?? '0')
        const conversions = parseFloat(r.metrics.conversions ?? '0')
        const clicks = parseInt(r.metrics.clicks ?? '0')
        const roas =
          cost > 0 ? parseFloat((conversionValue / cost).toFixed(2)) : 0
        // final_urls is a repeated field; take first url or join
        const urls: string[] = r.adGroupAd.ad.finalUrls ?? []
        const finalUrl = urls.length > 0 ? urls[0] : 'UNKNOWN'

        return {
          finalUrl,
          cost: parseFloat(cost.toFixed(2)),
          clicks,
          conversions: parseFloat(conversions.toFixed(2)),
          conversionValue: parseFloat(conversionValue.toFixed(2)),
          roas,
        }
      },
    )

    return { pages }
  } catch (error) {
    console.error('Error fetching landing page performance:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      accessToken: accessToken ? 'present' : 'missing',
      accountId,
      timeRange,
      campaignId,
      query: query.replace(/\s+/g, ' ').trim()
    })

    // Return empty data instead of mock data
    return {
      pages: [],
    }
  }
}
