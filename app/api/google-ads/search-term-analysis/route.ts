import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { SearchTermAnalysis } from '../types'
import { buildDateFilter, googleAdsApiRequest } from '../utils'
import { getLimit } from '../limits'

export async function POST(req: NextRequest) {
  return handleRequest(req, getSearchTermAnalysis, { skipUsageRecording: true })
}

async function getSearchTermAnalysis(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
): Promise<SearchTermAnalysis> {
  const dateFilter = buildDateFilter(timeRange)
  const campaignFilter = campaignId ? `AND campaign.id = '${campaignId}'` : ''
  
  console.log('Search Term Analysis - Time range info:', {
    originalTimeRange: timeRange,
    generatedDateFilter: dateFilter,
    campaignId,
    accountId
  })

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
    LIMIT ${getLimit('SEARCH_TERM_ANALYSIS')}
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
    LIMIT ${getLimit('SEARCH_TERM_ANALYSIS')}
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

    // Process search terms into three strategic categories
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

          // Check if this search term is already added as a keyword
          const adGroupName = (result.adGroup?.name as string) ?? 'Unknown'
          const searchKey = `${searchTerm.toLowerCase()}|${adGroupName}|${campaignName}`
          const isAddedAsKeyword = existingKeywords.has(searchKey)

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

          return {
            searchTerm,
            campaignName,
            cost: roundedCost,
            conversions,
            conversionValue: roundedConvValue,
            roas: roundedRoas,
            isAddedAsKeyword,
          }
        })
      : []

    // Filter into three strategic categories
    const harvestOpportunities = processedTerms
      .filter(
        (term) =>
          !term.isAddedAsKeyword &&
          term.roas >= 8.0 &&
          term.conversionValue > 0,
      )
      .sort((a, b) => b.conversionValue - a.conversionValue)
      .slice(0, 25)

    const negativeCandidates = processedTerms
      .filter((term) => term.conversions === 0 && term.cost >= 20)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 25)

    const performanceGaps = processedTerms
      .filter((term) => term.roas > 0 && term.roas < 2.0 && term.cost >= 50)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 25)

    const data: SearchTermAnalysis = {
      search_term_analysis: {
        harvest_opportunities: {
          comment:
            'Top 25 non-keyword search terms by Conversion Value (min ROAS of 8.0).',
          headers: ['searchTerm', 'campaign', 'roas', 'convValue'],
          rows: harvestOpportunities.map((term) => [
            term.searchTerm,
            term.campaignName,
            term.roas,
            term.conversionValue,
          ]),
        },
        negative_candidates: {
          comment:
            'Top 25 zero-conversion search terms by Cost (min cost of $20).',
          headers: ['searchTerm', 'campaign', 'cost'],
          rows: negativeCandidates.map((term) => [
            term.searchTerm,
            term.campaignName,
            term.cost,
          ]),
        },
        performance_gaps: {
          comment:
            'Top 25 low-ROAS search terms by Cost (ROAS < 2.0, min cost of $50).',
          headers: ['searchTerm', 'campaign', 'roas', 'cost'],
          rows: performanceGaps.map((term) => [
            term.searchTerm,
            term.campaignName,
            term.roas,
            term.cost,
          ]),
        },
      },
    }

    return data
  } catch (error: unknown) {
    console.error('Error fetching search term analysis data:', error)

    // Return empty data structure if API call fails
    return {
      search_term_analysis: {
        harvest_opportunities: {
          comment: 'No harvest opportunities found.',
          headers: ['searchTerm', 'campaign', 'roas', 'convValue'],
          rows: [],
        },
        negative_candidates: {
          comment: 'No negative candidates found.',
          headers: ['searchTerm', 'campaign', 'cost'],
          rows: [],
        },
        performance_gaps: {
          comment: 'No performance gaps found.',
          headers: ['searchTerm', 'campaign', 'roas', 'cost'],
          rows: [],
        },
      },
    }
  }
}
