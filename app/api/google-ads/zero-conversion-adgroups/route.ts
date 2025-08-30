import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { buildDateFilter, googleAdsApiRequest } from '../utils'
import { getLimit } from '../limits'

export async function POST(req: NextRequest) {
  return handleRequest(req, getZeroConversionAdGroups)
}

interface ZeroConversionAdGroups {
  adGroups: {
    id: string
    name: string
    campaign: string
    spend: number
    clicks: number
    impressions: number
  }[]
}

async function getZeroConversionAdGroups(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
): Promise<ZeroConversionAdGroups> {
  // Build date filter (empty for ALL_TIME)
  const dateFilter = buildDateFilter(timeRange)

  // Build campaign filter if campaign ID is provided
  const campaignFilter = campaignId ? `AND campaign.id = '${campaignId}'` : ''

  // GAQL query for ad groups with zero conversions but with impressions/clicks
  const zeroConvAdGroupsQuery = `
    SELECT
      ad_group.id,
      ad_group.name,
      ad_group.status,
      campaign.name,
      campaign.status,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM ad_group
    WHERE 
      ${dateFilter ? `${dateFilter} AND` : ''}
      metrics.conversions = 0
      AND metrics.impressions > 0
      AND campaign.status IN ('ENABLED', 'PAUSED')
      AND ad_group.status IN ('ENABLED', 'PAUSED')
      ${campaignFilter}
    ORDER BY metrics.cost_micros DESC
    LIMIT ${getLimit('ZERO_CONVERSION_ADGROUPS')}
  `

  try {
    // Execute the Google Ads API query
    const response = await googleAdsApiRequest(
      accessToken,
      accountId,
      zeroConvAdGroupsQuery,
      userId,
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch zero conversion ad groups: ${errorText}`)
    }

    // Parse the API response
    const apiData = (await response.json()) as {
      results?: {
        adGroup: {
          id: string
          name: string
        }
        campaign: {
          name: string
        }
        metrics: {
          impressions: string
          clicks: string
          costMicros: string
          conversions: string
        }
      }[]
    }

    // Transform the response data
    const data: ZeroConversionAdGroups = {
      adGroups: [],
    }

    if (apiData.results && apiData.results.length > 0) {
      data.adGroups = apiData.results.map((result) => ({
        id: result.adGroup.id,
        name: result.adGroup.name,
        campaign: result.campaign.name,
        spend: parseInt(result.metrics.costMicros || '0') / 1000000, // Convert micros to standard currency
        clicks: parseInt(result.metrics.clicks || '0'),
        impressions: parseInt(result.metrics.impressions || '0'),
      }))
    }

    return data
  } catch (error) {
    console.error('Error fetching zero conversion ad groups:', error)

    // In case of error, return empty data
    const data: ZeroConversionAdGroups = {
      adGroups: [],
    }

    return data
  }
}
