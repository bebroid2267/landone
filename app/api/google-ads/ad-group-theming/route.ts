import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { AdGroupTheming } from '../types'
import { buildDateFilter, googleAdsApiRequest } from '../utils'
import { getLimit } from '../limits'

export async function POST(req: NextRequest) {
  return handleRequest(req, getAdGroupTheming, { skipUsageRecording: true })
}

async function getAdGroupTheming(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
): Promise<AdGroupTheming> {
  const dateFilter = buildDateFilter(timeRange)
  const campaignFilter = campaignId ? `AND campaign.id = '${campaignId}'` : ''
  
  console.log('Ad Group Theming - Time range info:', {
    originalTimeRange: timeRange,
    generatedDateFilter: dateFilter,
    campaignId,
    accountId
  })

  // Query for ad groups with performance metrics and keyword samples
  const adGroupThemingQuery = `
    SELECT
      campaign.name,
      ad_group.name,
      ad_group_criterion.keyword.text,
      metrics.cost_micros,
      metrics.conversions_value
    FROM
      keyword_view
    WHERE
      ${dateFilter ? `${dateFilter} AND` : ''}
      ad_group_criterion.type = 'KEYWORD'
      AND campaign.status = 'ENABLED'
      AND ad_group.status = 'ENABLED'
      AND ad_group_criterion.status IN ('ENABLED', 'PAUSED')
      ${campaignFilter}
    ORDER BY metrics.cost_micros DESC
    LIMIT ${getLimit('AD_GROUP_THEMING')}
  `

  try {
    // Execute the Google Ads API query
    const response = await googleAdsApiRequest(
      accessToken,
      accountId,
      adGroupThemingQuery,
      userId,
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch ad group theming: ${errorText}`)
    }

    // Parse the API response
    const apiData = (await response.json()) as {
      results?: {
        campaign: {
          name: string
        }
        adGroup: {
          name: string
        }
        adGroupCriterion: {
          keyword: {
            text: string
          }
        }
        metrics: {
          costMicros: string
          conversionsValue: string
        }
      }[]
    }

    // Group by campaign and ad group with performance metrics
    const campaignMap = new Map<
      string,
      {
        campaignName: string
        ad_group_summary: {
          adGroupName: string
          keywordCount: number
          cost: number
          roas: number
          top_spending_keywords_sample: string[]
        }[]
      }
    >()

    if (apiData.results && apiData.results.length > 0) {
      // First pass: collect all data by ad group
      const adGroupData = new Map<
        string,
        {
          campaignName: string
          adGroupName: string
          keywords: { text: string; cost: number; convValue: number }[]
        }
      >()

      apiData.results.forEach((result) => {
        const campaignName = result.campaign.name
        const adGroupName = result.adGroup.name
        const keywordText = result.adGroupCriterion.keyword.text
        const cost = parseFloat(result.metrics.costMicros || '0') / 1000000
        const convValue = parseFloat(result.metrics.conversionsValue || '0')

        const adGroupKey = `${campaignName}|${adGroupName}`

        if (!adGroupData.has(adGroupKey)) {
          adGroupData.set(adGroupKey, {
            campaignName,
            adGroupName,
            keywords: [],
          })
        }

        adGroupData.get(adGroupKey)!.keywords.push({
          text: keywordText,
          cost,
          convValue,
        })
      })

      // Second pass: aggregate by campaign and create summary
      adGroupData.forEach((adGroupInfo) => {
        const { campaignName, adGroupName, keywords } = adGroupInfo

        // Calculate aggregated metrics
        const totalCost = keywords.reduce((sum, kw) => sum + kw.cost, 0)
        const totalConvValue = keywords.reduce(
          (sum, kw) => sum + kw.convValue,
          0,
        )
        const roas = totalCost > 0 ? totalConvValue / totalCost : 0

        // Get top 5 keywords by cost as sample
        const topKeywords = keywords
          .sort((a, b) => b.cost - a.cost)
          .slice(0, 5)
          .map((kw) => kw.text)

        const adGroupSummary = {
          adGroupName,
          keywordCount: keywords.length,
          cost:
            totalCost >= 10
              ? Math.round(totalCost)
              : Math.round(totalCost * 100) / 100,
          roas: roas >= 10 ? Math.round(roas) : Math.round(roas * 10) / 10,
          top_spending_keywords_sample: topKeywords,
        }

        if (!campaignMap.has(campaignName)) {
          campaignMap.set(campaignName, {
            campaignName,
            ad_group_summary: [],
          })
        }

        campaignMap.get(campaignName)!.ad_group_summary.push(adGroupSummary)
      })

      // Sort ad groups within each campaign by cost DESC and limit to top 10
      campaignMap.forEach((campaign) => {
        campaign.ad_group_summary = campaign.ad_group_summary
          .sort((a, b) => b.cost - a.cost)
          .slice(0, 10)
      })
    }

    const data: AdGroupTheming = {
      campaigns: Array.from(campaignMap.values())
        .sort((a, b) => {
          const aTotalCost = a.ad_group_summary.reduce(
            (sum, ag) => sum + ag.cost,
            0,
          )
          const bTotalCost = b.ad_group_summary.reduce(
            (sum, ag) => sum + ag.cost,
            0,
          )
          return bTotalCost - aTotalCost
        })
        .slice(0, 10), // Top 10 campaigns by total cost
    }

    return data
  } catch (error) {
    console.error('Error fetching ad group theming:', error)

    // Return empty data if API call fails
    return { campaigns: [] }
  }
}
