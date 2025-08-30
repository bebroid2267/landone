import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { CampaignStructureOverview } from '../types'
import { buildDateFilter, googleAdsApiRequest } from '../utils'
import { getLimit } from '../limits'

export async function POST(req: NextRequest) {
  return handleRequest(req, getCampaignStructureOverview, {
    skipUsageRecording: true,
  })
}

async function getCampaignStructureOverview(
  accessToken: string,
  accountId: string,
  timeRange?: string,
): Promise<CampaignStructureOverview> {
  const dateFilter = buildDateFilter(timeRange)
  
  console.log('Campaign Structure Overview - Time range info:', {
    originalTimeRange: timeRange,
    generatedDateFilter: dateFilter,
    accountId
  })

  // Query for campaign structure with budget and conversion goal information
  const campaignStructureQuery = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.bidding_strategy_type,
      campaign_budget.amount_micros,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value
    FROM
      campaign
    WHERE
      ${dateFilter ? `${dateFilter} AND` : ''}
      campaign.status IN ('ENABLED', 'PAUSED')
    ORDER BY metrics.cost_micros DESC
    LIMIT ${getLimit('CAMPAIGN_STRUCTURE_OVERVIEW')}
  `

  try {
    // Execute the Google Ads API query
    const response = await googleAdsApiRequest(
      accessToken,
      accountId,
      campaignStructureQuery,
    )

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          'Authentication required. Please log in to access Google Ads data.',
        )
      }
      const errorText = await response.text()
      throw new Error(
        `Failed to fetch campaign structure overview: ${errorText}`,
      )
    }

    // Parse the API response
    const apiData = (await response.json()) as {
      results?: {
        campaign: {
          id: string
          name: string
          status: string
          biddingStrategyType: string
        }
        campaignBudget?: {
          amountMicros: string
        }
        metrics: {
          costMicros: string
          conversions: string
          conversionsValue: string
        }
      }[]
    }

    // Transform to efficient headers/rows format with intelligent rounding
    const data: CampaignStructureOverview = {
      campaign_overview: {
        headers: [
          'campaignName',
          'biddingStrategy',
          'cost',
          'roas',
          'convValue',
        ],
        rows: [],
      },
      // Aggregate summary for strategic context
      summary: {
        totalCampaigns: 0,
        totalCost: 0,
        avgRoas: 0,
        topPerformers: 0, // campaigns with ROAS > 5
        underPerformers: 0, // campaigns with ROAS < 1
      },
    }

    if (apiData.results && apiData.results.length > 0) {
      let totalCost = 0
      let totalConvValue = 0
      let topPerformers = 0
      let underPerformers = 0

      data.campaign_overview.rows = apiData.results.map((result) => {
        const campaign = result.campaign
        const metrics = result.metrics
        const cost = parseFloat(metrics.costMicros || '0') / 1000000
        const conversionValue = parseFloat(metrics.conversionsValue || '0')

        // Calculate ROAS with intelligent rounding
        const roas = cost > 0 ? conversionValue / cost : 0
        const roundedRoas =
          roas >= 10 ? Math.round(roas) : Math.round(roas * 10) / 10
        const roundedCost =
          cost >= 10 ? Math.round(cost) : Math.round(cost * 100) / 100
        const roundedConvValue =
          conversionValue >= 10
            ? Math.round(conversionValue)
            : Math.round(conversionValue * 100) / 100

        // Aggregate for summary
        totalCost += cost
        totalConvValue += conversionValue
        if (roas > 5) {
          topPerformers++
        }
        if (roas < 1) {
          underPerformers++
        }

        return [
          campaign.name,
          campaign.biddingStrategyType,
          roundedCost,
          roundedRoas,
          roundedConvValue,
        ]
      })

      // Calculate summary metrics
      const avgRoas = totalCost > 0 ? totalConvValue / totalCost : 0
      data.summary = {
        totalCampaigns: apiData.results.length,
        totalCost:
          totalCost >= 10
            ? Math.round(totalCost)
            : Math.round(totalCost * 100) / 100,
        avgRoas:
          avgRoas >= 10 ? Math.round(avgRoas) : Math.round(avgRoas * 10) / 10,
        topPerformers,
        underPerformers,
      }
    }

    return data
  } catch (error) {
    console.error('Error fetching campaign structure overview:', error)

    // Return empty data structure if API call fails
    return {
      campaign_overview: {
        headers: [
          'campaignName',
          'biddingStrategy',
          'cost',
          'roas',
          'convValue',
        ],
        rows: [],
      },
      summary: {
        totalCampaigns: 0,
        totalCost: 0,
        avgRoas: 0,
        topPerformers: 0,
        underPerformers: 0,
      },
    }
  }
}
