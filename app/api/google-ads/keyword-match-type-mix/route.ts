import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { KeywordMatchTypeMix } from '../types'
import { buildDateFilter, googleAdsApiRequest } from '../utils'
import { getLimit } from '../limits'

export async function POST(req: NextRequest) {
  return handleRequest(req, getKeywordMatchTypeMix, {
    skipUsageRecording: true,
  })
}

async function getKeywordMatchTypeMix(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
): Promise<KeywordMatchTypeMix> {
  const dateFilter = buildDateFilter(timeRange)
  const campaignFilter = campaignId ? `AND campaign.id = '${campaignId}'` : ''
  
  console.log('Keyword Match Type Mix - Time range info:', {
    originalTimeRange: timeRange,
    generatedDateFilter: dateFilter,
    campaignId,
    accountId
  })

  // Query for keyword performance by match type
  const keywordMatchTypeQuery = `
    SELECT
      ad_group_criterion.keyword.match_type,
      campaign.status,
      ad_group.status,
      ad_group_criterion.status,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.clicks
    FROM
      keyword_view
    WHERE
      ${dateFilter ? `${dateFilter} AND` : ''}
      ad_group_criterion.type = 'KEYWORD'
      AND metrics.impressions > 0
      AND campaign.status IN ('ENABLED', 'PAUSED')
      AND ad_group.status IN ('ENABLED', 'PAUSED')
      AND ad_group_criterion.status IN ('ENABLED', 'PAUSED')
      ${campaignFilter}
    ORDER BY metrics.cost_micros DESC
    LIMIT ${getLimit('KEYWORD_MATCH_TYPE_MIX')}
  `

  try {
    // Execute the Google Ads API query
    const response = await googleAdsApiRequest(
      accessToken,
      accountId,
      keywordMatchTypeQuery,
      userId,
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch keyword match type mix: ${errorText}`)
    }

    // Parse the API response
    const apiData = (await response.json()) as {
      results?: {
        adGroupCriterion: {
          keyword: {
            matchType: string
          }
        }
        metrics: {
          costMicros: string
          conversions: string
          conversionsValue: string
          clicks: string
        }
      }[]
    }

    // Aggregate data by match type
    const matchTypeAggregation = new Map<
      string,
      {
        keywordCount: number
        totalCost: number
        totalConversions: number
        totalConversionValue: number
        clicks: number
      }
    >()

    let totalCost = 0
    let totalConversions = 0
    let totalConversionValue = 0
    let totalKeywords = 0

    if (apiData.results && apiData.results.length > 0) {
      apiData.results.forEach((result) => {
        const matchType = result.adGroupCriterion.keyword.matchType
        const cost = parseFloat(result.metrics.costMicros || '0') / 1000000
        const conversions = parseFloat(result.metrics.conversions || '0')
        const conversionValue = parseFloat(
          result.metrics.conversionsValue || '0',
        )
        const clicks = parseInt(result.metrics.clicks || '0')

        // Update totals
        totalCost += cost
        totalConversions += conversions
        totalConversionValue += conversionValue
        totalKeywords += 1

        // Update match type aggregation
        if (matchTypeAggregation.has(matchType)) {
          const existing = matchTypeAggregation.get(matchType)!
          existing.keywordCount += 1
          existing.totalCost += cost
          existing.totalConversions += conversions
          existing.totalConversionValue += conversionValue
          existing.clicks += clicks
        } else {
          matchTypeAggregation.set(matchType, {
            keywordCount: 1,
            totalCost: cost,
            totalConversions: conversions,
            totalConversionValue: conversionValue,
            clicks,
          })
        }
      })
    }

    /*
     * Transform aggregated data to efficient headers/rows format with
     * intelligent rounding
     */
    const matchTypesData = Array.from(matchTypeAggregation.entries()).map(
      ([matchType, data]) => {
        const roas =
          data.totalCost > 0 ? data.totalConversionValue / data.totalCost : 0

        return {
          matchType,
          cost:
            data.totalCost >= 10
              ? Math.round(data.totalCost)
              : Math.round(data.totalCost * 100) / 100,
          roas: roas >= 10 ? Math.round(roas) : Math.round(roas * 10) / 10,
          keywordCount: data.keywordCount,
          clicks: data.clicks,
        }
      },
    )

    // Sort by total cost descending
    matchTypesData.sort((a, b) => b.cost - a.cost)

    const averageRoas = totalCost > 0 ? totalConversionValue / totalCost : 0
    const roundedAvgRoas =
      averageRoas >= 10
        ? Math.round(averageRoas)
        : Math.round(averageRoas * 10) / 10
    const roundedTotalCost =
      totalCost >= 10
        ? Math.round(totalCost)
        : Math.round(totalCost * 100) / 100
    const roundedTotalConvValue =
      totalConversionValue >= 10
        ? Math.round(totalConversionValue)
        : Math.round(totalConversionValue * 100) / 100

    const data: KeywordMatchTypeMix = {
      match_type_overview: {
        headers: ['matchType', 'cost', 'roas', 'keywordCount', 'clicks'],
        rows: matchTypesData.map((mt) => [
          mt.matchType,
          mt.cost,
          mt.roas,
          mt.keywordCount,
          mt.clicks,
        ]),
      },
      summary: {
        totalKeywords,
        totalCost: roundedTotalCost,
        totalConversions: Math.round(totalConversions * 10) / 10,
        totalConversionValue: roundedTotalConvValue,
        averageRoas: roundedAvgRoas,
      },
    }

    return data
  } catch (error) {
    console.error('Error fetching keyword match type mix:', error)

    // Return empty data structure if API call fails
    return {
      match_type_overview: {
        headers: ['matchType', 'cost', 'roas', 'keywordCount', 'clicks'],
        rows: [],
      },
      summary: {
        totalKeywords: 0,
        totalCost: 0,
        totalConversions: 0,
        totalConversionValue: 0,
        averageRoas: 0,
      },
    }
  }
}
