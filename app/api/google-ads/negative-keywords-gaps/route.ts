import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { NegativeKeywordsGaps } from '../types'
import { googleAdsApiRequest } from '../utils'
import { buildDateFilter } from '../utils'
import { getLimit } from '../limits'

interface SearchTermApiResponse {
  results: {
    searchTermView?: {
      searchTerm: string
    }
  }[]
}

interface PlacementApiResponse {
  results: {
    groupPlacementView?: {
      placement: string
    }
    metrics?: {
      costMicros: string
      ctr: string
    }
  }[]
}

export async function POST(req: NextRequest) {
  return handleRequest(req, getNegativeKeywordsGaps)
}

async function getNegativeKeywordsGaps(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
): Promise<NegativeKeywordsGaps> {
  // Build date filter (empty for ALL_TIME)
  const dateFilter = buildDateFilter(timeRange)

  // Build campaign filter if campaign ID is provided
  const campaignFilter = campaignId ? `AND campaign.id = '${campaignId}'` : ''

  // Query for current period search terms
  const currentSearchTermsQuery = `
    SELECT
      search_term_view.search_term,
      campaign.status,
      ad_group.status,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM search_term_view
    WHERE
      metrics.conversions = 0
      AND metrics.impressions > 0
      AND metrics.clicks > 0
      AND campaign.status IN ('ENABLED', 'PAUSED')
      AND ad_group.status IN ('ENABLED', 'PAUSED')
      ${campaignFilter}
    ORDER BY metrics.cost_micros DESC
    LIMIT ${getLimit('NEGATIVE_KEYWORDS_GAPS')}
  `

  // Query for previous period search terms
  const previousSearchTermsQuery = `
    SELECT
      search_term_view.search_term,
      campaign.status,
      ad_group.status
    FROM search_term_view
    WHERE
      ${dateFilter ? `${dateFilter} AND` : ''}
      metrics.impressions > 0
      AND metrics.clicks > 0
      AND campaign.status IN ('ENABLED', 'PAUSED')
      AND ad_group.status IN ('ENABLED', 'PAUSED')
      ${campaignFilter}
    LIMIT ${getLimit('NEGATIVE_KEYWORDS_GAPS')}
  `

  // Query for low engagement placements
  const lowEngagementPlacementsQuery = `
    SELECT
      group_placement_view.placement,
      campaign.status,
      ad_group.status,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM group_placement_view
    WHERE
      ${dateFilter ? `${dateFilter} AND` : ''}
      metrics.impressions > 100
      AND metrics.clicks = 0
      AND metrics.cost_micros > 1000000  -- > 1 USD
      AND campaign.status IN ('ENABLED', 'PAUSED')
      AND ad_group.status IN ('ENABLED', 'PAUSED')
      ${campaignFilter}
    ORDER BY metrics.cost_micros DESC
    LIMIT ${getLimit('NEGATIVE_KEYWORDS_GAPS')}
  `

  try {
    // Execute the Google Ads API queries
    const [currentTermsResponse, previousTermsResponse, placementsResponse] =
      await Promise.all([
        googleAdsApiRequest(
          accessToken,
          accountId,
          currentSearchTermsQuery,
          userId,
        ),
        googleAdsApiRequest(
          accessToken,
          accountId,
          previousSearchTermsQuery,
          userId,
        ),
        googleAdsApiRequest(
          accessToken,
          accountId,
          lowEngagementPlacementsQuery,
          userId,
        ),
      ])

    // Check each response individually and log errors
    if (!currentTermsResponse.ok) {
      const errorText = await currentTermsResponse.text()
      console.error('Current terms query failed:', {
        status: currentTermsResponse.status,
        statusText: currentTermsResponse.statusText,
        error: errorText,
      })
      throw new Error(`Current terms query failed: ${errorText}`)
    }

    if (!previousTermsResponse.ok) {
      const errorText = await previousTermsResponse.text()
      console.error('Previous terms query failed:', {
        status: previousTermsResponse.status,
        statusText: previousTermsResponse.statusText,
        error: errorText,
      })
      throw new Error(`Previous terms query failed: ${errorText}`)
    }

    if (!placementsResponse.ok) {
      const errorText = await placementsResponse.text()
      console.error('Placements query failed:', {
        status: placementsResponse.status,
        statusText: placementsResponse.statusText,
        error: errorText,
      })
      throw new Error(`Placements query failed: ${errorText}`)
    }

    const currentTermsData =
      (await currentTermsResponse.json()) as SearchTermApiResponse
    const previousTermsData =
      (await previousTermsResponse.json()) as SearchTermApiResponse
    const placementsData =
      (await placementsResponse.json()) as PlacementApiResponse

    // Process search terms data
    const currentTerms = new Set(
      currentTermsData.results?.map(
        (result) => result.searchTermView?.searchTerm ?? '',
      ) ?? [],
    )
    const previousTerms = new Set(
      previousTermsData.results?.map(
        (result) => result.searchTermView?.searchTerm ?? '',
      ) ?? [],
    )

    // Find new terms that weren't in the previous period
    const newTerms = Array.from(currentTerms).filter(
      (term) => !previousTerms.has(term),
    )
    const totalTerms = currentTerms.size
    const newTermsPercentage =
      totalTerms > 0 ? Math.round((newTerms.length / totalTerms) * 100) : 0

    // Process placements data
    const highSpendPlacements = (placementsData.results ?? []).map(
      (result) => ({
        placement: result.groupPlacementView?.placement ?? '',
        cost: parseInt(result.metrics?.costMicros ?? '0') / 1000000, // Convert micros to actual value
        ctr: parseFloat(result.metrics?.ctr ?? '0'),
      }),
    )

    // Get the date from the time range for the sinceDate field
    let sinceDate = new Date().toISOString().split('T')[0] // Today's date as fallback
    const timeRangeParts = timeRange?.split(',')
    if (timeRangeParts && timeRangeParts.length > 0) {
      const startDate = timeRangeParts[0].trim()
      if (startDate) {
        // Convert GAQL date format to YYYY-MM-DD
        const date = new Date(startDate)
        if (!isNaN(date.getTime())) {
          sinceDate = date.toISOString().split('T')[0]
        }
      }
    }

    return {
      newIrrelevantTerms: {
        count: newTerms.length,
        sinceDate,
        percentage: newTermsPercentage,
      },
      highSpendPlacements,
    }
  } catch (error) {
    console.error('Error fetching negative keywords gaps:', error)
    throw error
  }
}
