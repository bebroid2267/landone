import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { buildDateFilter, googleAdsApiRequest } from '../utils'
import { getLimit } from '../limits'

interface DailyTrendsData {
  daily_trends: {
    comment: string
    headers: string[]
    rows: (string | number)[][]
  }
  summary: {
    totalCost: number
    totalConversions: number
    totalConversionValue: number
    averageRoas: number
    totalClicks: number
    totalImpressions: number
    averageCtr: number
  }
  metadata: {
    totalRecords: number
    dateRange: string
    hasActiveData: boolean
    dataSource: string
    dateFilterUsed: string
    explanation: string
  }
}

interface GoogleAdsResult {
  segments: {
    date: string
  }
  metrics: {
    costMicros: string
    clicks: string
    impressions: string
    conversions: string
    conversionsValue: string
  }
}

interface GoogleAdsResponse {
  results: GoogleAdsResult[]
}

interface CampaignCheckResult {
  campaign: {
    id: string
    name: string
    status: string
  }
}

interface CampaignCheckResponse {
  results: CampaignCheckResult[]
}

export async function POST(req: NextRequest) {
  return handleRequest(req, getDailyTrendsData, { skipUsageRecording: true })
}

async function getDailyTrendsData(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
): Promise<DailyTrendsData> {
  /*
   * For weekly analysis, we use last quarter to reduce data volume sent to AI
   * This provides sufficient recent data for meaningful analysis
   */
  const actualTimeRange = timeRange ?? 'LAST_QUARTER'

  // Create date filter using standard buildDateFilter function
  const dateFilter = buildDateFilter(actualTimeRange)

  const campaignFilter = campaignId ? `AND campaign.id = '${campaignId}'` : ''

  const gaql = `
    SELECT
      segments.date,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.clicks,
      metrics.impressions,
      metrics.ctr
    FROM campaign
    WHERE
      metrics.impressions > 0
      AND campaign.status IN ('ENABLED', 'PAUSED')
      ${dateFilter ? `AND ${dateFilter}` : ''}
      ${campaignFilter}
    ORDER BY segments.date DESC
    LIMIT ${getLimit('DAILY_TRENDS')}
  `

  const response = await googleAdsApiRequest(
    accessToken,
    accountId,
    gaql,
    userId,
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google Ads API request failed: ${errorText}`)
  }

  const json = (await response.json()) as GoogleAdsResponse
  const results = json.results ?? []

  console.log(
    `[Daily-trends] Retrieved ${results.length} results from Google Ads API for timeRange: ${actualTimeRange}`,
  )
  console.log(`[Daily-trends] Date filter used: ${dateFilter}`)

  /*
   * If no results with impressions > 0,
   * try a fallback query without the impressions filter
   */
  if (results.length === 0) {
    console.log(
      '[Daily-trends] No results with impressions > 0, trying fallback query without impressions filter',
    )

    const fallbackGaql = `
      SELECT
        segments.date,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.clicks,
        metrics.impressions,
        metrics.ctr
      FROM campaign
      WHERE
        campaign.status IN ('ENABLED', 'PAUSED')
        ${dateFilter ? `AND ${dateFilter}` : ''}
        ${campaignFilter}
      ORDER BY segments.date ASC
    LIMIT ${getLimit('DAILY_TRENDS')}
    `

    const fallbackResponse = await googleAdsApiRequest(
      accessToken,
      accountId,
      fallbackGaql,
      userId,
    )

    if (fallbackResponse.ok) {
      const fallbackData = (await fallbackResponse.json()) as GoogleAdsResponse
      const fallbackResults = fallbackData.results ?? []
      console.log(
        `[Daily-trends] Fallback query returned ${fallbackResults.length} results`,
      )

      // Use fallback results if available
      if (fallbackResults.length > 0) {
        results.push(...fallbackResults)
      }
    }

    // If still no results, try checking for campaigns without date filter
    if (results.length === 0) {
      console.log(
        '[Daily-trends] Still no results, checking if account has any campaigns at all',
      )

      const campaignCheckGaql = `
        SELECT
          campaign.id,
          campaign.name,
          campaign.status
        FROM campaign
        WHERE
          campaign.status IN ('ENABLED', 'PAUSED', 'REMOVED')
        LIMIT ${getLimit('DAILY_TRENDS_CAMPAIGNS')}
      `

      const campaignCheckResponse = await googleAdsApiRequest(
        accessToken,
        accountId,
        campaignCheckGaql,
        userId,
      )

      if (campaignCheckResponse.ok) {
        const campaignCheckData =
          (await campaignCheckResponse.json()) as CampaignCheckResponse
        const campaigns = campaignCheckData.results ?? []
        console.log(
          `[Daily-trends] Account has ${campaigns.length} campaigns total`,
        )

        if (campaigns.length === 0) {
          console.log(
            '[Daily-trends] Account has no campaigns - this explains the empty data',
          )
        }
      }
    }
  }

  // Process and aggregate data by date
  const dailyMetricsMap = new Map<
    string,
    {
      date: string
      cost: number
      conversions: number
      conversionValue: number
      clicks: number
      impressions: number
    }
  >()

  results.forEach((result: GoogleAdsResult) => {
    const date = result.segments?.date
    const costMicros = parseInt(result.metrics?.costMicros ?? '0')
    const conversions = parseFloat(result.metrics?.conversions ?? '0')
    const conversionValue = parseFloat(result.metrics?.conversionsValue ?? '0')
    const clicks = parseInt(result.metrics?.clicks ?? '0')
    const impressions = parseInt(result.metrics?.impressions ?? '0')

    if (date) {
      const existing = dailyMetricsMap.get(date) ?? {
        date,
        cost: 0,
        conversions: 0,
        conversionValue: 0,
        clicks: 0,
        impressions: 0,
      }

      dailyMetricsMap.set(date, {
        date,
        cost: existing.cost + costMicros / 1000000, // Convert from micros
        conversions: existing.conversions + conversions,
        conversionValue: existing.conversionValue + conversionValue,
        clicks: existing.clicks + clicks,
        impressions: existing.impressions + impressions,
      })
    }
  })

  // Convert to array and calculate CTR
  const dailyMetrics = Array.from(dailyMetricsMap.values())
    .map((day) => ({
      ...day,
      ctr: day.impressions > 0 ? (day.clicks / day.impressions) * 100 : 0,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Calculate summary statistics
  const summary = {
    totalCost: dailyMetrics.reduce((sum, day) => sum + (day.cost ?? 0), 0),
    totalConversions: dailyMetrics.reduce(
      (sum, day) => sum + (day.conversions ?? 0),
      0,
    ),
    totalConversionValue: dailyMetrics.reduce(
      (sum, day) => sum + day.conversionValue,
      0,
    ),
    totalClicks: dailyMetrics.reduce((sum, day) => sum + day.clicks, 0),
    totalImpressions: dailyMetrics.reduce(
      (sum, day) => sum + day.impressions,
      0,
    ),
    averageRoas: 0,
    averageCtr: 0,
  }

  summary.averageRoas =
    summary.totalCost > 0 ? summary.totalConversionValue / summary.totalCost : 0
  summary.averageCtr =
    summary.totalImpressions > 0
      ? (summary.totalClicks / summary.totalImpressions) * 100
      : 0

  // Convert dailyMetrics to headers/rows format
  const headers = ['Date', 'Cost', 'Conversions', 'Conversion Value', 'Clicks', 'Impressions', 'CTR (%)']
  const rows = dailyMetrics.map(day => [
    day.date,
    Math.round(day.cost * 100) / 100, // Round to 2 decimal places
    day.conversions,
    Math.round(day.conversionValue * 100) / 100,
    day.clicks,
    day.impressions,
    Math.round(day.ctr * 100) / 100
  ])

  return {
    daily_trends: {
      comment: `Daily performance trends for ${actualTimeRange.toLowerCase().replace('_', ' ')} showing ${dailyMetrics.length} days of data`,
      headers,
      rows
    },
    summary,
    metadata: {
      totalRecords: results.length,
      dateRange: actualTimeRange,
      hasActiveData: dailyMetrics.length > 0 && summary.totalImpressions > 0,
      dataSource: results.length === 0 ? 'fallback_attempted' : 'primary_query',
      dateFilterUsed: dateFilter,
      explanation:
        results.length === 0
          ? 'No campaign data found - account may have no active campaigns or no historical activity in the requested timeframe'
          : dailyMetrics.length === 0
          ? 'Campaign data exists but shows zero activity across all metrics'
          : 'Valid campaign data retrieved successfully',
    },
  }
}
