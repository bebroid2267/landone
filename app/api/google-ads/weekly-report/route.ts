import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import {
  checkReportLimitServer,
  recordReportUsageServer,
} from '@/utils/supabase/report-usage-server'
import {
  CampaignPacing,
  NewKeywords,
  PerformanceByNetwork,
  SearchTermAnalysis,
  ChangeHistorySummary,
} from '../types'
import {
  getCachedReport,
  setCachedReport,
} from '@/utils/supabase/reports-cache'
import { refreshGoogleAdsAccessToken } from '@/utils/supabase/google-ads'

// Helper function to round numerical data to reasonable decimal places
function roundNumericData(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'number') {
    // Round to 2 decimal places for most metrics
    return Math.round(obj * 100) / 100
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => roundNumericData(item))
  }

  if (typeof obj === 'object') {
    const rounded: any = {}
    for (const [key, value] of Object.entries(obj)) {
      rounded[key] = roundNumericData(value)
    }
    return rounded
  }

  return obj
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

interface RequestBody {
  forceRegenerate?: boolean
  checkOnly?: boolean
}

// Custom request handler for weekly reports that sets correct report type
async function handleWeeklyRequest<T extends { fromCache?: boolean }>(
  req: NextRequest,
  dataFn: (
    accessToken: string,
    accountId: string,
    timeRange?: string,
    campaignId?: string,
    userId?: string,
    request?: NextRequest,
    dataOnly?: boolean,
  ) => Promise<T>,
) {
  try {
    const { accessToken, accountId, timeRange, campaignId, dataOnly } =
      (await req.json()) as {
        accessToken: string
        accountId: string
        timeRange?: string
        campaignId?: string
        dataOnly?: boolean
      }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 },
      )
    }

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account not selected' },
        { status: 400 },
      )
    }

    // Get user ID from Supabase authentication
    let userId: string | undefined
    try {
      const supabase = await createClient()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        console.warn('Could not get user:', error.message)
      } else if (user) {
        userId = user.id
      }
    } catch (authError) {
      console.warn('Error getting user:', authError)
    }

    const data = await dataFn(
      accessToken,
      accountId,
      timeRange,
      campaignId,
      userId,
      req,
      dataOnly,
    )

    /*
     * Record successful report generation only if it was newly generated (not
     * from cache)
     */
    if (userId && !data.fromCache) {
      try {
        console.log('[WeeklyReport] Recording report usage for user:', userId)
        const recordId = await recordReportUsageServer(
          userId,
          'weekly_analysis', // Correct report type for weekly reports
          accountId,
          timeRange,
          campaignId,
        )
        console.log(
          '[WeeklyReport] Successfully recorded report usage:',
          recordId,
        )
      } catch (error) {
        console.error('Error recording report usage:', error)
        // Don't fail the request if recording fails
      }
    } else if (data.fromCache) {
      console.log(
        '[WeeklyReport] Report served from cache, not recording usage',
      )
    } else {
      console.log('[WeeklyReport] No userId found, skipping usage recording')
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const clonedReq = req.clone()
    const requestBody = (await clonedReq
      .json()
      .catch(() => ({}))) as RequestBody
    const forceRegenerate = requestBody.forceRegenerate ?? false
    const checkOnly = requestBody.checkOnly ?? false

    try {
      return await handleWeeklyRequest(
        req,
        (
          accessToken,
          accountId,
          timeRange,
          campaignId,
          userId,
          request,
          dataOnly,
        ) =>
          generateWeeklyReport(
            accessToken,
            accountId,
            timeRange,
            campaignId,
            userId,
            request,
            forceRegenerate,
            dataOnly,
            checkOnly,
          ),
      )
    } catch (handleError) {
      console.error('Error in handleWeeklyRequest:', handleError)

      const cookies = req.cookies

      try {
        const authCookies = Object.entries(cookies.getAll()).filter(
          ([name]) =>
            name.toLowerCase().includes('token') ||
            name.toLowerCase().includes('auth') ||
            name.toLowerCase().includes('session'),
        )
        console.log('Auth-related cookies found:', authCookies.length)
      } catch (cookieError) {
        console.error('Error while processing cookies:', cookieError)
      }

      throw handleError
    }
  } catch (outerError) {
    console.error(
      'Outer error in POST /api/google-ads/weekly-report:',
      outerError,
    )
    throw outerError
  }
}

async function generateWeeklyReport(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
  request?: NextRequest,
  forceRegenerate = false,
  dataOnly = false,
  checkOnly = false,
): Promise<{ report?: string; data?: any; fromCache?: boolean }> {
  /*
   * Check cache before generating report (только если не принудительная
   * регенерация)
   */
  if (userId && !forceRegenerate) {
    console.log('Checking cache for existing weekly report...')
    try {
      const cachedReport = await getCachedReport(
        userId,
        accountId,
        timeRange ?? 'LAST_7_DAYS',
        campaignId,
        'weekly', // Specify weekly report type
        dataOnly, // Pass dataOnly parameter to get correct cache
      )

      if (cachedReport) {
        console.log('Found cached weekly report, returning it')

        if (dataOnly) {
          // For dataOnly requests, parse the cached JSON data
          try {
            const parsedData: unknown = JSON.parse(cachedReport)
            console.log('Returning cached structured block data')
            return { data: parsedData, fromCache: true }
          } catch (parseError) {
            console.warn(
              'Failed to parse cached block data, regenerating...',
              parseError,
            )
          }
        } else {
          // Return as regular report
          return { report: cachedReport, fromCache: true }
        }
      } else {
        console.log('No cached weekly report found')
        if (checkOnly) {
          console.log('checkOnly mode: returning empty result')
          return { report: '', data: null, fromCache: false }
        }
        console.log('Checking limits before generating new report...')

        // Check report limits only when generating new report
        try {
          console.log('[WeeklyReport] Checking report limits for user:', userId)
          const limitData = await checkReportLimitServer(userId)

          if (!limitData.can_generate) {
            console.log(
              '[WeeklyReport] User has exceeded report limit:',
              limitData,
            )
            throw new Error(
              JSON.stringify({
                error:
                  'Weekly report limit exceeded. You have generated the maximum number of reports allowed for this week.',
                limit_info: {
                  current_usage: limitData.current_usage,
                  limit: limitData.limit,
                  resets_at: limitData.resets_at,
                },
              }),
            )
          }

          console.log('[WeeklyReport] Report limit check passed:', limitData)
        } catch (limitError) {
          console.error('Error checking report limits:', limitError)
          throw limitError
        }
      }
    } catch (cacheError) {
      console.warn(
        'Error checking cache, proceeding with generation:',
        cacheError,
      )
    }
  } else if (forceRegenerate) {
    console.log('Force regenerate requested, skipping cache check')
    if (checkOnly) {
      console.log('checkOnly mode with forceRegenerate: returning empty result')
      return { report: '', data: null, fromCache: false }
    }

    // Check limits even for force regenerate
    if (userId) {
      try {
        console.log(
          '[WeeklyReport] Checking report limits for force regenerate:',
          userId,
        )
        const limitData = await checkReportLimitServer(userId)

        if (!limitData.can_generate) {
          console.log(
            '[WeeklyReport] User has exceeded report limit even for force regenerate:',
            limitData,
          )
          throw new Error(
            JSON.stringify({
              error:
                'Weekly report limit exceeded. You have generated the maximum number of reports allowed for this week.',
              limit_info: {
                current_usage: limitData.current_usage,
                limit: limitData.limit,
                resets_at: limitData.resets_at,
              },
            }),
          )
        }

        console.log(
          '[WeeklyReport] Report limit check passed for force regenerate:',
          limitData,
        )
      } catch (limitError) {
        console.error(
          'Error checking report limits for force regenerate:',
          limitError,
        )
        throw limitError
      }
    }
  } else {
    console.log('No userId provided, skipping cache check')
    if (checkOnly) {
      console.log('checkOnly mode without userId: returning empty result')
      return { report: '', data: null, fromCache: false }
    }
  }

  const host = request?.headers?.get('host')
  const protocol = request?.headers?.get('x-forwarded-proto') ?? 'http'
  const baseUrl = host
    ? `${protocol}://${host}`
    : process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const cookieHeader = request?.headers?.get('cookie') ?? ''

  try {
    // Try to refresh token if userId present
    if (userId) {
      const refreshed = await refreshGoogleAdsAccessToken(userId)
      if (refreshed) {
        accessToken = refreshed
        console.log('[Weekly-report] Access token refreshed')
      }
    }

    /*
     * Fetch data needed for weekly analysis
     * Block 1: Budget Pacing & Utilization - need campaign budget data
     * Block 2: Recent Change Log - need change history data
     * Block 3: Core KPI Trend Analysis - need daily trends data
     * Block 4: Tactical Threat & Opportunity Radar - need search terms and new
     * keywords
     */

    const [
      campaignPacingResponse,
      changeHistoryResponse,
      dailyTrendsResponse,
      searchTermsResponse,
      newKeywordsResponse,
    ] = await Promise.all([
      // Campaign pacing data with proper budget tracking
      fetch(`${baseUrl}/api/google-ads/campaign-pacing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify({
          accessToken,
          accountId,
          timeRange: 'CURRENT_MONTH',
          campaignId,
        }),
      }),
      // Change history for last 7 days
      fetch(`${baseUrl}/api/google-ads/weekly-significant-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify({
          accessToken,
          accountId,
          timeRange: 'LAST_7_DAYS',
          campaignId,
        }),
      }),
      /*
       * Daily trends data for the last 400 days to enable L7D, P7D, L30D,
       * YoY comparisons
       */
      fetch(`${baseUrl}/api/google-ads/daily-trends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify({
          accessToken,
          accountId,
          timeRange: 'LAST_400_DAYS',
          campaignId,
        }),
      }),
      // Search terms for threat and opportunity analysis
      fetch(`${baseUrl}/api/google-ads/search-term-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify({
          accessToken,
          accountId,
          timeRange: 'LAST_14_DAYS',
          campaignId,
        }),
      }),
      // New keywords data for Block 4
      fetch(`${baseUrl}/api/google-ads/new-keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify({
          accessToken,
          accountId,
          timeRange: 'LAST_QUARTER',
          campaignId,
        }),
      }),
    ])

    // Log response statuses
    const responseMap: Record<string, Response> = {
      campaignPacing: campaignPacingResponse,
      changeHistory: changeHistoryResponse,
      dailyTrends: dailyTrendsResponse,
      searchTerms: searchTermsResponse,
      newKeywords: newKeywordsResponse,
    }

    Object.entries(responseMap).forEach(([name, res]) => {
      console.log(`[Weekly-report] ${name} status ${res.status}`)
    })

    if (
      !campaignPacingResponse.ok ||
      !changeHistoryResponse.ok ||
      !dailyTrendsResponse.ok ||
      !searchTermsResponse.ok ||
      !newKeywordsResponse.ok
    ) {
      throw new Error(
        'Failed to fetch data from one or more endpoints for weekly analysis',
      )
    }

    const [
      campaignPacingData,
      changeHistoryData,
      dailyTrendsData,
      searchTermsData,
      newKeywordsData,
    ] = await Promise.all([
      campaignPacingResponse.json() as Promise<CampaignPacing>,
      changeHistoryResponse.json() as Promise<ChangeHistorySummary>,
      dailyTrendsResponse.json() as Promise<PerformanceByNetwork>,
      searchTermsResponse.json() as Promise<SearchTermAnalysis>,
      newKeywordsResponse.json() as Promise<NewKeywords>,
    ])

    // Debug the change history data
    console.log('[Weekly-report] Change history data:', {
      hasChanges: !!changeHistoryData?.change_history?.rows,
      changesLength: changeHistoryData?.change_history?.rows?.length ?? 0,
      firstChange: changeHistoryData?.change_history?.rows?.[0] ?? null,
    })

    // Structure the data for weekly analysis and round numerical values
    const weeklyData = {
      accountId,
      timeRange: 'LAST_7_DAYS',
      campaignId,
      data: {
        // Block 1: Budget pacing data
        report_campaign_pacing: roundNumericData(campaignPacingData),

        // Block 2: Change log data - renamed to match AI prompt expectations
        report_significant_changes: roundNumericData(changeHistoryData),

        // Block 3: Daily trends for KPI analysis
        report_account_daily_trends: roundNumericData(dailyTrendsData),

        // Block 4: Search terms for threats and opportunities
        report_weekly_search_terms: roundNumericData(searchTermsData),

        // Block 4: New keywords data
        report_new_keywords: roundNumericData(newKeywordsData),
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        analysisType: 'weekly',
      },
    }

    // If dataOnly is true, return structured block data instead of AI report
    if (dataOnly) {
      const blockData = {
        block1_budget_pacing: {
          title: 'Budget Pacing & Utilization',
          description:
            'This is the first and most critical check. It answers the question: "Are we on track to spend our monthly budget effectively, or are we pacing too fast or too slow?" This helps prevent campaigns from running out of budget prematurely or failing to spend their allocation.',
          data: {
            campaign_pacing: {
              headers: campaignPacingData.campaign_pacing.headers,
              rows: roundNumericData(campaignPacingData.campaign_pacing.rows),
            },
            summary: roundNumericData(campaignPacingData.summary),
          },
          reportType: 'campaign-pacing',
        },
        block2_change_log: {
          title: 'Recent Change Log & Context',
          description:
            'This analysis provides context for recent performance shifts by highlighting the most significant changes made to the account in the last week. It helps connect management actions to the outcomes seen in the KPI trend report, explaining the "why" behind the numbers.',
          data: roundNumericData(changeHistoryData),
          reportType: 'change-history-summary',
        },
        block3_daily_trends: {
          title: 'Core KPI Trend Analysis',
          description:
            "This is the high-level dashboard. It provides a multi-timeframe view of the account's most important metrics, showing short-term momentum, monthly trends, and seasonal performance at a glance.",
          data: roundNumericData(dailyTrendsData),
          reportType: 'daily-trends',
        },
        block4_search_terms: {
          title: 'Tactical Threat & Opportunity Radar',
          description:
            'A weekly tactical scan to find new sources of wasted spend that need immediate attention and to monitor the performance of newly launched keywords. This keeps the account clean and agile.',
          data: {
            searchTerms: roundNumericData(searchTermsData),
            newKeywords: roundNumericData(newKeywordsData),
          },
          reportType: 'search-term-analysis',
        },
      }

      // Cache the structured block data for dataOnly requests
      if (userId) {
        try {
          await setCachedReport({
            userId,
            accountId,
            timeRange: 'LAST_7_DAYS',
            campaignId,
            reportContent: JSON.stringify(blockData),
            reportType: 'weekly', // Use same report type but different content
            dataOnly: true, // Mark as dataOnly cache
          })
          console.log('Weekly block data cached successfully')
        } catch (cacheError) {
          console.warn('Failed to cache weekly block data:', cacheError)
        }
      }

      console.log('Returning structured block data for weekly analysis')
      return { data: blockData }
    }

    console.log('Sending weekly data to AI API...')
    console.log('Weekly data structure:', {
      hasChangeHistory: !!weeklyData.data.report_significant_changes,
      changeHistoryLength:
        weeklyData.data.report_significant_changes?.changes?.length ?? 0,
      hasDailyTrends: !!weeklyData.data.report_account_daily_trends,
      hasSearchTerms: !!weeklyData.data.report_weekly_search_terms,
      hasPacing: !!weeklyData.data.report_campaign_pacing,
      hasNewKeywords: !!weeklyData.data.report_new_keywords,
      newKeywordsLength:
        weeklyData.data.report_new_keywords?.keywords?.length ?? 0,
    })

    // Send data to weekly AI analysis
    const aiResponse = await fetch(`${baseUrl}/api/proxy-openai-weekly`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader,
      },
      body: JSON.stringify({
        userPrompt: `Weekly Analysis Data for Account: ${accountId}

${JSON.stringify(weeklyData, null, 2)}`,
      }),
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      throw new Error(`Weekly AI analysis failed: ${errorText}`)
    }

    const aiData = (await aiResponse.json()) as OpenAIResponse
    const report = aiData.choices[0]?.message?.content

    if (!report) {
      throw new Error('No weekly report content received from AI')
    }

    // Cache the weekly report
    if (userId) {
      try {
        await setCachedReport({
          userId,
          accountId,
          timeRange: 'LAST_7_DAYS',
          campaignId,
          reportContent: report,
          reportType: 'weekly', // Specify weekly report type
          dataOnly: false, // Mark as regular report cache
        })
        console.log('Weekly report cached successfully')
      } catch (cacheError) {
        console.warn('Failed to cache weekly report:', cacheError)
      }
    }

    console.log('Weekly report generated successfully')
    return { report }
  } catch (error) {
    console.error('Error generating weekly report:', error)
    throw error
  }
}
