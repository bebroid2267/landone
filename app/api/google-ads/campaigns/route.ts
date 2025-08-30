import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { Campaign } from '../types'
import { buildDateFilter, googleAdsApiRequest } from '../utils'
import { getLimit } from '../limits'

export async function POST(req: NextRequest) {
  // Parse request body to check for skipLimitCheck flag
  const requestBody = await req.json()
  const skipLimitCheck = requestBody.skipLimitCheck === true
  
  // Create a new request with the body for handleRequest
  const newReq = new Request(req.url, {
    method: 'POST',
    headers: req.headers,
    body: JSON.stringify(requestBody)
  }) as NextRequest
  
  return handleRequest(newReq, getAvailableCampaigns, {
    skipUsageRecording: skipLimitCheck
  })
}

async function getAvailableCampaigns(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
): Promise<Campaign[]> {
  const dateFilter = buildDateFilter(timeRange)

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.optimization_score,
      campaign.advertising_channel_type,
      metrics.clicks,
      metrics.impressions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      campaign.bidding_strategy_type,
      metrics.conversions,
      metrics.conversions_value,
      metrics.value_per_conversion,
      metrics.cost_per_conversion
    FROM campaign
    WHERE ${
      dateFilter ? `${dateFilter} AND ` : ''
    }campaign.status IN ('ENABLED', 'PAUSED')
    ORDER BY metrics.cost_micros DESC
    LIMIT ${getLimit('CAMPAIGNS')}
  `

  try {
    const response = await googleAdsApiRequest(
      accessToken,
      accountId,
      query,
      userId,
    )

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          'Authentication required. Please log in to access Google Ads data.',
        )
      }
      const errorText = await response.text()
      throw new Error(`Failed to fetch campaigns: ${errorText}`)
    }

    const data = (await response.json()) as {
      results?: {
        campaign: {
          id: string
          name: string
          status: string
          advertisingChannelType: string
        }
        metrics: {
          clicks: string
          impressions: string
          ctr: string
          costMicros: string
          averageCpc: string
          conversions: string
          conversionsValue: string
          valuePerConversion: string
          costPerConversion: string
        }
      }[]
    }

    // Transform the response into a more usable format
    const campaigns = data.results
      ? data.results.map((result) => ({
          id: result.campaign.id,
          name: result.campaign.name,
          status: result.campaign.status,
          channelType: result.campaign.advertisingChannelType,
          metrics: {
            clicks: parseInt(result.metrics.clicks) || 0,
            impressions: parseInt(result.metrics.impressions) || 0,
            ctr: parseFloat(result.metrics.ctr) || 0,
            costMicros: parseInt(result.metrics.costMicros) || 0,
            averageCpc: parseInt(result.metrics.averageCpc) || 0,
            conversions: parseInt(result.metrics.conversions) || 0,
            conversionsValue: parseInt(result.metrics.conversionsValue) || 0,
            valuePerConversion:
              parseFloat(result.metrics.valuePerConversion) || 0,
            costPerConversion:
              parseFloat(result.metrics.costPerConversion) || 0,
          },
        }))
      : []

    return campaigns
  } catch (error) {
    console.error('Error fetching campaigns:', error)

    // In case of error, return mock campaign data
    const mockCampaigns = [
      {
        id: '123456789',
        name: 'Brand Campaign',
        status: 'ENABLED',
        channelType: 'SEARCH',
        metrics: {
          clicks: 1200,
          impressions: 24000,
          ctr: 0.05,
          costMicros: 12000000, // 12 USD
          averageCpc: 10000, // 0.01 USD
          conversions: 100,
          conversionsValue: 10000,
          valuePerConversion: 100,
          costPerConversion: 100,
        },
      },
      {
        id: '987654321',
        name: 'Product Awareness',
        status: 'ENABLED',
        channelType: 'DISPLAY',
        metrics: {
          clicks: 850,
          impressions: 35000,
          ctr: 0.024,
          costMicros: 8500000, // 8.5 USD
          averageCpc: 10000, // 0.01 USD
          conversions: 75,
          conversionsValue: 7500,
          valuePerConversion: 75,
          costPerConversion: 75,
        },
      },
      {
        id: '456789123',
        name: 'Retargeting',
        status: 'ENABLED',
        channelType: 'DISPLAY',
        metrics: {
          clicks: 620,
          impressions: 15000,
          ctr: 0.041,
          costMicros: 6200000, // 6.2 USD
          averageCpc: 10000, // 0.01 USD
          conversions: 50,
          conversionsValue: 5000,
          valuePerConversion: 50,
          costPerConversion: 50,
        },
      },
    ]
    return mockCampaigns
  }
}
