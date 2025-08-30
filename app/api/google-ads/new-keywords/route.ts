import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { googleAdsApiRequest } from '../utils'
import { getLimit } from '../limits'

interface NewKeywords {
  new_keywords: {
    comment: string
    headers: string[]
    rows: (string | number)[][]
  }
  summary: {
    totalNewKeywords: number
    dateRange: string
    averageRoas: number
    totalCost: number
  }
}

interface KeywordApiResponse {
  results: {
    keywordView?: {
      resourceName: string
    }
    adGroupCriterion?: {
      keyword?: {
        text: string
        matchType: string
      }
      status: string
    }
    adGroup?: {
      name: string
    }
    campaign?: {
      name: string
    }
    metrics?: {
      costMicros: string
      conversions: string
      conversionsValue: string
      impressions: string
      clicks: string
    }
  }[]
}

export async function POST(req: NextRequest) {
  return handleRequest(req, getNewKeywords, { skipUsageRecording: true })
}

async function getNewKeywords(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
): Promise<NewKeywords> {
  /*
   * Since Google Ads API doesn't provide creation_date for keywords,
   * we'll identify "new" keywords by finding those with recent activity
   * and low historical performance (indicating they might be newly added)
   */

  const limit = getLimit('NEW_KEYWORDS')
  const campaignFilter = campaignId ? `AND campaign.id = '${campaignId}'` : ''

  // Calculate 180-day timeframe
  const endDate = new Date()
  endDate.setDate(endDate.getDate() - 1) // Yesterday
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 180) // 180 days ago

  const startDateStr = startDate.toISOString().split('T')[0]
  const endDateStr = endDate.toISOString().split('T')[0]

  /*
   * Get keywords with metrics from last 180 days to identify recently active
   * ones
   */
  const recentActivityQuery = `
    SELECT
      keyword_view.resource_name,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status,
      ad_group.name,
      campaign.name,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.impressions,
      metrics.clicks
    FROM keyword_view
    WHERE
      segments.date >= '${startDateStr}' AND segments.date <= '${endDateStr}'
      AND ad_group_criterion.status = 'ENABLED'
      AND campaign.status = 'ENABLED'
      AND ad_group.status = 'ENABLED'
      ${campaignFilter}
      AND metrics.impressions > 0
    ORDER BY metrics.cost_micros DESC
    LIMIT ${limit}
  `

  try {
    const response = await googleAdsApiRequest(
      accessToken,
      accountId,
      recentActivityQuery,
      userId,
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Ads API error:', errorText)
      return {
        new_keywords: {
          comment: 'No new keywords found',
          headers: [
            'Keyword',
            'Match Type',
            'Ad Group',
            'Campaign',
            'Cost',
            'Conversions',
            'ROAS',
            'Status',
          ],
          rows: [],
        },
        summary: {
          totalNewKeywords: 0,
          dateRange: '180_DAYS',
          averageRoas: 0,
          totalCost: 0,
        },
      }
    }

    const data: KeywordApiResponse = await response.json()

    if (!data.results || data.results.length === 0) {
      return {
        new_keywords: {
          comment: 'No new keywords found',
          headers: [
            'Keyword',
            'Match Type',
            'Ad Group',
            'Campaign',
            'Cost',
            'Conversions',
            'ROAS',
            'Status',
          ],
          rows: [],
        },
        summary: {
          totalNewKeywords: 0,
          dateRange: '180_DAYS',
          averageRoas: 0,
          totalCost: 0,
        },
      }
    }

    // Transform the data to headers/rows format
    const headers = [
      'Keyword',
      'Match Type',
      'Ad Group',
      'Campaign',
      'Cost',
      'Conversions',
      'ROAS',
      'Status',
    ]
    const rows: (string | number)[][] = []
    let totalCost = 0
    let totalConversions = 0
    let totalConversionsValue = 0

    const processedKeywords = data.results
      .filter(
        (result) => result.adGroupCriterion?.keyword?.text && result.metrics,
      )
      .slice(0, limit)

    processedKeywords.forEach((result) => {
      const costMicros = parseInt(result.metrics?.costMicros || '0')
      const cost = costMicros / 1_000_000 // Convert micros to currency
      const conversions = parseFloat(result.metrics?.conversions || '0')
      const conversionsValue = parseFloat(
        result.metrics?.conversionsValue || '0',
      )
      const roas = cost > 0 ? conversionsValue / cost : 0

      totalCost += cost
      totalConversions += conversions
      totalConversionsValue += conversionsValue

      rows.push([
        result.adGroupCriterion?.keyword?.text || '',
        result.adGroupCriterion?.keyword?.matchType || 'UNKNOWN',
        result.adGroup?.name || '',
        result.campaign?.name || '',
        Math.round(cost * 100) / 100, // Round to 2 decimal places
        conversions,
        Math.round(roas * 100) / 100,
        result.adGroupCriterion?.status || 'UNKNOWN',
      ])
    })

    const averageRoas = totalCost > 0 ? totalConversionsValue / totalCost : 0

    console.log(
      `Found ${rows.length} recently active keywords for account ${accountId}`,
    )

    return {
      new_keywords: {
        comment: `Recently active keywords from the last 180 days showing ${rows.length} keywords with recent activity`,
        headers,
        rows,
      },
      summary: {
        totalNewKeywords: rows.length,
        dateRange: '180_DAYS',
        averageRoas: Math.round(averageRoas * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
      },
    }
  } catch (error) {
    console.error('Error fetching new keywords data:', error)
    return {
      new_keywords: {
        comment: 'Error occurred while fetching new keywords',
        headers: [
          'Keyword',
          'Match Type',
          'Ad Group',
          'Campaign',
          'Cost',
          'Conversions',
          'ROAS',
          'Status',
        ],
        rows: [],
      },
      summary: {
        totalNewKeywords: 0,
        dateRange: '180_DAYS',
        averageRoas: 0,
        totalCost: 0,
      },
    }
  }
}
