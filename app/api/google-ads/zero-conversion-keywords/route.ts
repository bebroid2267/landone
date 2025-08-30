import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { ZeroConversionKeywords } from '../types'
import { buildDateFilter, googleAdsApiRequest } from '../utils'
import { getLimit } from '../limits'

export async function POST(req: NextRequest) {
  return handleRequest(req, getZeroConversionKeywords, {
    skipUsageRecording: true,
  })
}

async function getZeroConversionKeywords(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
): Promise<ZeroConversionKeywords> {
  const dateFilter = buildDateFilter(timeRange)
  const campaignFilter = campaignId ? `AND campaign.id = '${campaignId}'` : ''

  // GAQL query for keywords with zero conversions and zero conversion value
  const zeroConvQuery = `
    SELECT
      ad_group_criterion.criterion_id,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status,
      ad_group_criterion.quality_info.quality_score,
      ad_group.name,
      ad_group.status,
      campaign.name,
      campaign.status,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value
    FROM keyword_view
    WHERE
      ${dateFilter ? `${dateFilter} AND` : ''}
      metrics.conversions = 0
      AND metrics.conversions_value = 0
      AND metrics.impressions > 0
      AND metrics.clicks > 0
      AND campaign.status = 'ENABLED'
      AND ad_group.status = 'ENABLED'
      AND ad_group_criterion.status IN ('ENABLED', 'PAUSED')
      ${campaignFilter}
    ORDER BY metrics.cost_micros DESC
    LIMIT ${getLimit('ZERO_CONVERSION_KEYWORDS')}
  `

  try {
    // Execute the Google Ads API query
    const response = await googleAdsApiRequest(
      accessToken,
      accountId,
      zeroConvQuery,
      userId,
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch zero conversion keywords: ${errorText}`)
    }

    // Parse the API response
    const apiData = (await response.json()) as {
      results?: {
        adGroupCriterion: {
          criterionId: string
          keyword: {
            text: string
            matchType: string
          }
          qualityInfo?: {
            qualityScore: number
          }
        }
        adGroup: {
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
          conversionsValue: string
        }
      }[]
    }

    /*
     * Transform to efficient headers/rows format,
     * focusing on top 25 worst offenders
     */
    const keywordsList = apiData.results
      ? apiData.results
          .map((result) => {
            const cost = parseFloat(result.metrics.costMicros || '0') / 1000000
            const clicks = parseInt(result.metrics.clicks || '0')
            return {
              keyword: result.adGroupCriterion.keyword.text,
              matchType: result.adGroupCriterion.keyword.matchType,
              campaign: result.campaign.name,
              cost:
                cost >= 10 ? Math.round(cost) : Math.round(cost * 100) / 100,
              clicks,
            }
          })
          .sort((a, b) => b.cost - a.cost) // Sort by cost DESC
          .slice(0, 25) // Top 25 worst offenders
      : []

    const data: ZeroConversionKeywords = {
      zero_conversion_keywords: {
        comment: 'Top 25 keywords by cost with zero conversions.',
        headers: ['keyword', 'matchType', 'campaign', 'cost', 'clicks'],
        rows: keywordsList.map((kw) => [
          kw.keyword,
          kw.matchType,
          kw.campaign,
          kw.cost,
          kw.clicks,
        ]),
      },
    }

    return data
  } catch (error) {
    console.error('Error fetching zero conversion keywords:', error)

    // Return empty data structure if API call fails
    return {
      zero_conversion_keywords: {
        comment: 'No zero conversion keywords found.',
        headers: ['keyword', 'matchType', 'campaign', 'cost', 'clicks'],
        rows: [],
      },
    }
  }
}
