import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { CampaignPacing } from '../types'
import { buildDateFilter, googleAdsApiRequest } from '../utils'
import { getLimit } from '../limits'

export async function POST(req: NextRequest) {
  return handleRequest(req, getCampaignPacing, {
    skipUsageRecording: true,
  })
}

async function getCampaignPacing(
  accessToken: string,
  accountId: string,
  timeRange?: string,
): Promise<CampaignPacing> {
  // Use THIS_MONTH for campaign pacing data
  const dateFilter = buildDateFilter('THIS_MONTH')

  // Query for campaign pacing with budget information
  const campaignPacingQuery = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign_budget.amount_micros,
      campaign_budget.total_amount_micros,
      metrics.cost_micros
    FROM
      campaign
    WHERE
      ${dateFilter} AND
      campaign.status = 'ENABLED'
    ORDER BY metrics.cost_micros DESC
    LIMIT ${getLimit('CAMPAIGN_PACING')}
  `

  try {
    // Execute the Google Ads API query
    const response = await googleAdsApiRequest(
      accessToken,
      accountId,
      campaignPacingQuery,
    )

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          'Authentication required. Please log in to access Google Ads data.',
        )
      }
      const errorText = await response.text()
      throw new Error(
        `Failed to fetch campaign pacing data: ${errorText}`,
      )
    }

    // Parse the API response
    const apiData = (await response.json()) as {
      results?: {
        campaign: {
          id: string
          name: string
          status: string
        }
        campaignBudget?: {
          amountMicros: string
          totalAmountMicros?: string
        }
        metrics: {
          costMicros: string
        }
      }[]
    }

    // Transform to efficient headers/rows format
    const data: CampaignPacing = {
      campaign_pacing: {
        headers: [
          'campaignName',
          'dailyBudget',
          'totalBudget',
          'currentSpend',
          'budgetUtilization',
          'pacingStatus'
        ],
        rows: [],
      },
      summary: {
        totalCampaigns: 0,
        totalBudget: 0,
        totalSpend: 0,
        budgetUtilization: 0,
        overBudgetCampaigns: 0,
        underBudgetCampaigns: 0,
      },
    }

    if (apiData.results && apiData.results.length > 0) {
      let totalBudget = 0
      let totalSpend = 0
      let overBudgetCount = 0
      let underBudgetCount = 0

      // Calculate days passed in current month
      const currentDate = new Date()
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
      const daysPassed = currentDate.getDate()
      const expectedUtilization = daysPassed / daysInMonth

      data.campaign_pacing.rows = apiData.results.map((result) => {
        const campaign = result.campaign
        const metrics = result.metrics
        const dailyBudget = parseFloat(result.campaignBudget?.amountMicros || '0') / 1000000
        const totalBudgetAmount = parseFloat(result.campaignBudget?.totalAmountMicros || '0') / 1000000
        const currentSpend = parseFloat(metrics.costMicros || '0') / 1000000

        // Calculate budget utilization
        const monthlyBudget = dailyBudget * daysInMonth
        const budgetUtilization = monthlyBudget > 0 ? (currentSpend / monthlyBudget) * 100 : 0
        
        // Determine pacing status
        let pacingStatus = 'On Track'
        if (budgetUtilization > (expectedUtilization * 100 + 20)) {
          pacingStatus = 'Over Pacing'
          overBudgetCount++
        } else if (budgetUtilization < (expectedUtilization * 100 - 20)) {
          pacingStatus = 'Under Pacing'
          underBudgetCount++
        }

        // Aggregate for summary
        totalBudget += monthlyBudget
        totalSpend += currentSpend

        return [
          campaign.name,
          Math.round(dailyBudget * 100) / 100,
          totalBudgetAmount > 0 ? Math.round(totalBudgetAmount * 100) / 100 : Math.round(monthlyBudget * 100) / 100,
          Math.round(currentSpend * 100) / 100,
          Math.round(budgetUtilization * 10) / 10,
          pacingStatus
        ]
      })

      // Calculate summary metrics
      const overallUtilization = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0
      data.summary = {
        totalCampaigns: apiData.results.length,
        totalBudget: Math.round(totalBudget * 100) / 100,
        totalSpend: Math.round(totalSpend * 100) / 100,
        budgetUtilization: Math.round(overallUtilization * 10) / 10,
        overBudgetCampaigns: overBudgetCount,
        underBudgetCampaigns: underBudgetCount,
      }
    }

    return data
  } catch (error) {
    console.error('Error fetching campaign pacing data:', error)

    // Return empty data structure if API call fails
    return {
      campaign_pacing: {
        headers: [
          'campaignName',
          'dailyBudget',
          'totalBudget',
          'currentSpend',
          'budgetUtilization',
          'pacingStatus'
        ],
        rows: [],
      },
      summary: {
        totalCampaigns: 0,
        totalBudget: 0,
        totalSpend: 0,
        budgetUtilization: 0,
        overBudgetCampaigns: 0,
        underBudgetCampaigns: 0,
      },
    }
  }
}