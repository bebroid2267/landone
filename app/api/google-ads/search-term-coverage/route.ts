import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { SearchTermCoverage } from '../types'
import { googleAdsApiRequest, buildDateFilter } from '../utils'
import { getLimit } from '../limits'

interface KeywordsApiResponse {
  results: {
    adGroupCriterion?: {
      keyword?: {
        text: string
        matchType: string
      }
    }
  }[]
}

interface SearchTermsApiResponse {
  results: {
    searchTermView?: {
      searchTerm: string
      status: string
    }
    metrics?: {
      impressions: string
      clicks: string
      costMicros: string
    }
    segments?: {
      keyword?: {
        info?: {
          text: string
          matchType: string
        }
      }
    }
  }[]
}

export async function POST(req: NextRequest) {
  return handleRequest(req, getSearchTermCoverage)
}

async function getSearchTermCoverage(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
): Promise<SearchTermCoverage> {
  // Build date filter (empty for ALL_TIME)
  const dateFilter = buildDateFilter(timeRange)

  // Build campaign filter if campaign ID is provided
  const campaignFilter = campaignId ? `AND campaign.id = '${campaignId}'` : ''

  // Query for search terms performance
  const searchTermsQuery = `
    SELECT
      search_term_view.search_term,
      search_term_view.status,
      campaign.status,
      ad_group.status,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      segments.keyword.info.text,
      segments.keyword.info.match_type
    FROM search_term_view
    WHERE
      metrics.impressions > 0
      AND metrics.clicks > 0
      AND campaign.status IN ('ENABLED', 'PAUSED')
      AND ad_group.status IN ('ENABLED', 'PAUSED')
      ${campaignFilter}
    ORDER BY metrics.cost_micros DESC
    LIMIT ${getLimit('SEARCH_TERM_COVERAGE')}
  `

  // Query for keywords
  const keywordsQuery = `
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status,
      campaign.status,
      ad_group.status
    FROM keyword_view
    WHERE
      ${dateFilter ? `${dateFilter} AND` : ''}
      ad_group_criterion.type = 'KEYWORD'
      AND ad_group_criterion.keyword.match_type IN ('EXACT', 'PHRASE')
      AND campaign.status IN ('ENABLED', 'PAUSED')
      AND ad_group.status IN ('ENABLED', 'PAUSED')
      AND ad_group_criterion.status IN ('ENABLED', 'PAUSED')
      ${campaignFilter}
    LIMIT ${getLimit('SEARCH_TERM_COVERAGE')}
  `

  try {
    // Execute the Google Ads API queries
    const [searchTermsResponse, keywordsResponse] = await Promise.all([
      googleAdsApiRequest(accessToken, accountId, searchTermsQuery, userId),
      googleAdsApiRequest(accessToken, accountId, keywordsQuery, userId),
    ])

    // Check responses
    if (!searchTermsResponse.ok) {
      const errorText = await searchTermsResponse.text()
      throw new Error(`Search terms query failed: ${errorText}`)
    }

    if (!keywordsResponse.ok) {
      const errorText = await keywordsResponse.text()
      throw new Error(`Keywords query failed: ${errorText}`)
    }

    const searchTermsData =
      (await searchTermsResponse.json()) as SearchTermsApiResponse
    const keywordsData = (await keywordsResponse.json()) as KeywordsApiResponse

    // Process keywords data
    const keywords = new Set<string>(
      keywordsData.results?.map((result) => {
        const text = result.adGroupCriterion?.keyword?.text?.toLowerCase() ?? ''
        const matchType = result.adGroupCriterion?.keyword?.matchType ?? ''
        return `${text}|${matchType}`
      }) ?? [],
    )

    // Process search terms and calculate coverage
    let totalImpressions = 0
    let exactImpressions = 0
    let exactCost = 0
    let phraseImpressions = 0
    let phraseCost = 0
    let broadImpressions = 0
    let broadCost = 0

    const unmatchedTerms: {
      term: string
      cost: number
      impressions: number
      clicks: number
    }[] = []

    searchTermsData.results?.forEach((result) => {
      const searchTerm = result.searchTermView?.searchTerm?.toLowerCase() ?? ''
      const impressions = parseInt(result.metrics?.impressions ?? '0')
      const clicks = parseInt(result.metrics?.clicks ?? '0')
      const cost = parseInt(result.metrics?.costMicros ?? '0') / 1000000 // Convert micros to actual value
      const matchType = result.segments?.keyword?.info?.matchType ?? ''

      totalImpressions += impressions

      // Check if the search term matches any exact/phrase keyword
      const isMatched = Array.from(keywords).some((keyword) => {
        const [keywordText, keywordMatchType] = keyword.split('|')
        if (keywordMatchType === 'EXACT') {
          return searchTerm === keywordText
        } else if (keywordMatchType === 'PHRASE') {
          return searchTerm.includes(keywordText)
        }
        return false
      })

      if (!isMatched) {
        unmatchedTerms.push({
          term: result.searchTermView?.searchTerm ?? '',
          cost,
          impressions,
          clicks,
        })
      }

      // Update coverage metrics based on match type
      if (matchType === 'EXACT') {
        exactImpressions += impressions
        exactCost += cost
      } else if (matchType === 'PHRASE') {
        phraseImpressions += impressions
        phraseCost += cost
      } else {
        broadImpressions += impressions
        broadCost += cost
      }
    })

    // Calculate percentages
    const exactShare =
      totalImpressions > 0
        ? Math.round((exactImpressions / totalImpressions) * 100)
        : 0
    const phraseShare =
      totalImpressions > 0
        ? Math.round((phraseImpressions / totalImpressions) * 100)
        : 0
    const broadShare =
      totalImpressions > 0
        ? Math.round((broadImpressions / totalImpressions) * 100)
        : 0

    // Sort unmatched terms by cost
    const topTerms = unmatchedTerms.sort((a, b) => b.cost - a.cost).slice(0, 5)

    return {
      coverage: {
        exact: {
          impressions: exactImpressions,
          cost: exactCost,
          share: exactShare,
        },
        phrase: {
          impressions: phraseImpressions,
          cost: phraseCost,
          share: phraseShare,
        },
        broad: {
          impressions: broadImpressions,
          cost: broadCost,
          share: broadShare,
        },
      },
      topTerms,
    }
  } catch (error) {
    throw error
  }
}
