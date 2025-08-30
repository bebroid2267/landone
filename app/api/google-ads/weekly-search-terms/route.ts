import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { buildDateFilter, googleAdsApiRequest } from '../utils'
import { getLimit } from '../limits'

export async function POST(req: NextRequest) {
  return handleRequest(req, getWeeklySearchTerms, { skipUsageRecording: true })
}

interface WeeklySearchTermsResponse {
  weekly_search_terms: {
    high_performers: {
      comment: string
      headers: string[]
      rows: (string | number)[][]
    }
    negative_candidates: {
      comment: string
      headers: string[]
      rows: (string | number)[][]
    }
    new_opportunities: {
      comment: string
      headers: string[]
      rows: (string | number)[][]
    }
  }
}

async function getWeeklySearchTerms(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
): Promise<WeeklySearchTermsResponse> {
  const dateFilter = buildDateFilter(timeRange || 'LAST_QUARTER')
  const campaignFilter = campaignId ? `AND campaign.id = '${campaignId}'` : ''

  // GAQL query for search term analysis with keyword segments
  const searchTermQuery = `
    SELECT
      search_term_view.search_term,
      search_term_view.status,
      segments.keyword.info.text,
      segments.keyword.info.match_type,
      ad_group.name,
      campaign.name,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.conversions_value,
      metrics.cost_micros
    FROM search_term_view
    WHERE
      ${dateFilter ? `${dateFilter} AND` : ''}
      metrics.impressions > 0
      ${campaignFilter}
    ORDER BY metrics.cost_micros DESC
    LIMIT ${getLimit('WEEKLY_SEARCH_TERMS')}
  `

  // GAQL query to get all existing keywords for comparison
  const existingKeywordsQuery = `
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group.name,
      campaign.name
    FROM keyword_view
    WHERE
      ${dateFilter ? `${dateFilter} AND` : ''}
      ad_group_criterion.type = 'KEYWORD'
      AND ad_group_criterion.status IN ('ENABLED', 'PAUSED')
      ${campaignFilter}
    LIMIT ${getLimit('WEEKLY_SEARCH_TERMS')}
  `

  try {
    console.log('Executing search term query:', searchTermQuery.trim())
    console.log('Executing keywords query:', existingKeywordsQuery.trim())

    // Execute both queries in parallel
    const [searchTermResponse, keywordsResponse] = await Promise.all([
      googleAdsApiRequest(accessToken, accountId, searchTermQuery, userId),
      googleAdsApiRequest(
        accessToken,
        accountId,
        existingKeywordsQuery,
        userId,
      ),
    ])

    if (!searchTermResponse.ok) {
      const searchTermError = await searchTermResponse.text()
      throw new Error(`Search term query failed: ${searchTermError}`)
    }

    if (!keywordsResponse.ok) {
      const keywordsError = await keywordsResponse.text()
      console.warn(`Keywords query failed: ${keywordsError}`)
    }

    const searchTermData = (await searchTermResponse.json()) as {
      results?: any[]
    }
    const keywordsData = keywordsResponse.ok
      ? ((await keywordsResponse.json()) as { results?: any[] })
      : { results: [] }

    console.log(
      'Search term results count:',
      searchTermData.results?.length ?? 0,
    )
    console.log('Keywords results count:', keywordsData.results?.length ?? 0)

    // Create a set of existing keywords for fast lookup
    const existingKeywords = new Set<string>()
    if (keywordsData.results) {
      /* eslint-disable @typescript-eslint/no-unsafe-member-access */
      keywordsData.results.forEach((result: any) => {
        const keywordText = (
          result.adGroupCriterion?.keyword?.text as string
        )?.toLowerCase()
        const adGroupName = result.adGroup?.name as string
        const campaignName = result.campaign?.name as string
        if (keywordText && adGroupName && campaignName) {
          existingKeywords.add(`${keywordText}|${adGroupName}|${campaignName}`)
        }
      })
    }

    // Process search terms into strategic categories
    const processedTerms = searchTermData.results
      ? searchTermData.results.map((result: any) => {
          const searchTerm = (result.searchTermView?.searchTerm as string) ?? ''
          const cost =
            parseInt(String(result.metrics?.costMicros ?? '0')) / 1000000
          const conversions = parseFloat(
            String(result.metrics?.conversions ?? '0'),
          )
          const conversionValue = parseFloat(
            String(result.metrics?.conversionsValue ?? '0'),
          )
          const campaignName = (result.campaign?.name as string) ?? 'Unknown'
          const impressions = parseInt(
            String(result.metrics?.impressions ?? '0'),
          )
          const clicks = parseInt(String(result.metrics?.clicks ?? '0'))

          // Check if this search term is already added as a keyword
          const adGroupName = (result.adGroup?.name as string) ?? 'Unknown'
          const searchKey = `${searchTerm.toLowerCase()}|${adGroupName}|${campaignName}`
          const isAddedAsKeyword = existingKeywords.has(searchKey)

          // Calculate ROAS and CTR with intelligent rounding
          const roas = cost > 0 ? conversionValue / cost : 0
          const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
          const roundedRoas =
            roas >= 10 ? Math.round(roas) : Math.round(roas * 10) / 10
          const roundedCost =
            cost >= 10 ? Math.round(cost) : Math.round(cost * 100) / 100
          const roundedConvValue =
            conversionValue >= 10
              ? Math.round(conversionValue)
              : Math.round(conversionValue * 100) / 100
          const roundedCtr = Math.round(ctr * 100) / 100

          return {
            searchTerm,
            campaignName,
            cost: roundedCost,
            conversions,
            conversionValue: roundedConvValue,
            roas: roundedRoas,
            impressions,
            clicks,
            ctr: roundedCtr,
            isAddedAsKeyword,
          }
        })
      : []

    // Filter into three strategic categories for weekly analysis
    const highPerformers = processedTerms
      .filter(
        (term) =>
          term.roas >= 3.0 &&
          term.conversionValue > 0 &&
          term.cost >= 10,
      )
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 25)

    const negativeCandidates = processedTerms
      .filter((term) => term.conversions === 0 && term.cost >= 5)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 25)

    const newOpportunities = processedTerms
      .filter(
        (term) =>
          !term.isAddedAsKeyword &&
          term.roas >= 2.0 &&
          term.conversionValue > 0 &&
          term.cost >= 5,
      )
      .sort((a, b) => b.conversionValue - a.conversionValue)
      .slice(0, 25)

    const data: WeeklySearchTermsResponse = {
      weekly_search_terms: {
        high_performers: {
          comment:
            'Top 25 high-performing search terms by ROAS (min ROAS of 3.0, min cost of $10).',
          headers: ['searchTerm', 'campaign', 'roas', 'cost', 'convValue'],
          rows: highPerformers.map((term) => [
            term.searchTerm,
            term.campaignName,
            term.roas,
            term.cost,
            term.conversionValue,
          ]),
        },
        negative_candidates: {
          comment:
            'Top 25 zero-conversion search terms by Cost (min cost of $5).',
          headers: ['searchTerm', 'campaign', 'cost', 'clicks', 'ctr'],
          rows: negativeCandidates.map((term) => [
            term.searchTerm,
            term.campaignName,
            term.cost,
            term.clicks,
            term.ctr,
          ]),
        },
        new_opportunities: {
          comment:
            'Top 25 non-keyword search terms with good performance (min ROAS of 2.0, min cost of $5).',
          headers: ['searchTerm', 'campaign', 'roas', 'convValue', 'cost'],
          rows: newOpportunities.map((term) => [
            term.searchTerm,
            term.campaignName,
            term.roas,
            term.conversionValue,
            term.cost,
          ]),
        },
      },
    }

    return data
  } catch (error: unknown) {
    console.error('Error fetching weekly search terms data:', error)

    // Return empty data structure if API call fails
    return {
      weekly_search_terms: {
        high_performers: {
          comment: 'No high performers found.',
          headers: ['searchTerm', 'campaign', 'roas', 'cost', 'convValue'],
          rows: [],
        },
        negative_candidates: {
          comment: 'No negative candidates found.',
          headers: ['searchTerm', 'campaign', 'cost', 'clicks', 'ctr'],
          rows: [],
        },
        new_opportunities: {
          comment: 'No new opportunities found.',
          headers: ['searchTerm', 'campaign', 'roas', 'convValue', 'cost'],
          rows: [],
        },
      },
    }
  }
}