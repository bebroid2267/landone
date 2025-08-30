import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import {
  ConversionActionSetup,
  CampaignStructureOverview,
  KeywordMatchTypeMix,
  AdGroupTheming,
  ZeroConversionKeywords,
  PerformanceByNetwork,
  SearchTermAnalysis,
  ChangeHistorySummary,
  PerformanceMaxDeepDive,
  LandingPagePerformance,
  AdCopyText,
  GeoHotColdPerformance,
} from '../types'
import {
  getCachedReport,
  setCachedReport,
} from '@/utils/supabase/reports-cache'
import { refreshGoogleAdsAccessToken } from '@/utils/supabase/google-ads'

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

export async function POST(req: NextRequest) {
  try {
    const clonedReq = req.clone()
    const requestBody = (await clonedReq
      .json()
      .catch(() => ({}))) as RequestBody
    const forceRegenerate = requestBody.forceRegenerate ?? false
    const checkOnly = requestBody.checkOnly ?? false

    try {
      return await handleRequest(
        req,
        (accessToken, accountId, timeRange, campaignId, userId, request) =>
          generateAIReport(
            accessToken,
            accountId,
            timeRange,
            campaignId,
            userId,
            request,
            forceRegenerate,
            checkOnly,
          ),
        {
          skipUsageRecording: false, // Always record usage when report is actually generated
          forceRegenerate, // Pass forceRegenerate flag
        },
      )
    } catch (handleError) {
      console.error('❌ ПОЛНАЯ ОШИБКА В HANDLE REQUEST:')
      console.error('Error type:', typeof handleError)
      console.error('Error instanceof Error:', handleError instanceof Error)
      console.error('Error object:', handleError)
      console.error('Error stack:', handleError instanceof Error ? handleError.stack : 'No stack trace')
      console.error('Error message:', handleError instanceof Error ? handleError.message : 'No error message')
      console.error('Error toString:', String(handleError))
      console.error('Error JSON:', JSON.stringify(handleError, Object.getOwnPropertyNames(handleError), 2))

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
    console.error('❌ ПОЛНАЯ ВНЕШНЯЯ ОШИБКА В POST AI-REPORT:')
    console.error('Error type:', typeof outerError)
    console.error('Error instanceof Error:', outerError instanceof Error)
    console.error('Error object:', outerError)
    console.error('Error stack:', outerError instanceof Error ? outerError.stack : 'No stack trace')
    console.error('Error message:', outerError instanceof Error ? outerError.message : 'No error message')
    console.error('Error toString:', String(outerError))
    console.error('Error JSON:', JSON.stringify(outerError, Object.getOwnPropertyNames(outerError), 2))
    throw outerError
  }
}

async function generateAIReport(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
  request?: NextRequest,
  forceRegenerate = false,
  checkOnly = false,
): Promise<{ report: string; fromCache?: boolean }> {
  // Early return for checkOnly requests - don't do any processing
  if (checkOnly) {
    console.log('checkOnly mode: only checking cache, no generation')
    if (userId && !forceRegenerate) {
      try {
        const cachedReport = await getCachedReport(
          userId,
          accountId,
          timeRange ?? 'LAST_QUARTER',
          campaignId,
          'regular',
        )
        
        if (cachedReport) {
          console.log('checkOnly: Found cached report')
          return { report: cachedReport, fromCache: true }
        } else {
          console.log('checkOnly: No cached report found')
          return { report: '', fromCache: false }
        }
      } catch (cacheError) {
        console.warn('checkOnly: Error checking cache:', cacheError)
        return { report: '', fromCache: false }
      }
    } else {
      console.log('checkOnly: No userId or forceRegenerate=true, returning empty result')
      return { report: '', fromCache: false }
    }
  }

  /*
   * Regular flow - check cache first unless force regenerate
   */
  if (userId && !forceRegenerate) {
    console.log('Checking cache for existing report...')
    try {
      const cachedReport = await getCachedReport(
        userId,
        accountId,
        timeRange ?? 'LAST_QUARTER',
        campaignId,
        'regular', // Specify regular report type
      )

      if (cachedReport) {
        console.log('Found cached report, returning it')
        return { report: cachedReport, fromCache: true }
      } else {
        console.log('No cached report found, generating new report...')
      }
    } catch (cacheError) {
      console.warn(
        'Error checking cache, proceeding with generation:',
        cacheError,
      )
    }
  } else if (forceRegenerate) {
    console.log('Force regenerate requested, skipping cache check')
  } else {
    console.log('No userId provided, skipping cache check')
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
        console.log('[AI-report] Access token refreshed')
      }
    }

    const [
      conversionActionSetupResponse,
      campaignStructureOverviewResponse,
      keywordMatchTypeMixResponse,
      adGroupThemingResponse,
      zeroConversionKeywordsResponse,
      performanceByNetworkResponse,
      searchTermAnalysisResponse,
      changeHistorySummaryResponse,
      performanceMaxDeepDiveResponse,
      landingPagePerformanceResponse,
      adCopyTextResponse,
      geoHotColdResponse,
    ] = await Promise.all([
      fetch(`${baseUrl}/api/google-ads/conversion-action-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify({ accessToken, accountId, timeRange, campaignId }),
      }),
      fetch(`${baseUrl}/api/google-ads/campaign-structure-overview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify({ accessToken, accountId, timeRange, campaignId }),
      }),
      fetch(`${baseUrl}/api/google-ads/keyword-match-type-mix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify({ accessToken, accountId, timeRange, campaignId }),
      }),
      fetch(`${baseUrl}/api/google-ads/ad-group-theming`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify({ accessToken, accountId, timeRange, campaignId }),
      }),
      fetch(`${baseUrl}/api/google-ads/zero-conversion-keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify({ accessToken, accountId, timeRange, campaignId }),
      }),
      fetch(`${baseUrl}/api/google-ads/performance-by-network`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify({ accessToken, accountId, timeRange, campaignId }),
      }),
      fetch(`${baseUrl}/api/google-ads/search-term-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify({ accessToken, accountId, timeRange, campaignId }),
      }),
      fetch(`${baseUrl}/api/google-ads/change-history-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify({ accessToken, accountId, timeRange, campaignId }),
      }),
      fetch(`${baseUrl}/api/google-ads/performance-max-deep-dive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify({ accessToken, accountId, timeRange, campaignId }),
      }),
      fetch(`${baseUrl}/api/google-ads/landing-page-performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify({ accessToken, accountId, timeRange, campaignId }),
      }),
      fetch(`${baseUrl}/api/google-ads/ad-copy-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify({ accessToken, accountId, timeRange, campaignId }),
      }),
      fetch(`${baseUrl}/api/google-ads/geo-hot-cold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body: JSON.stringify({ accessToken, accountId, timeRange, campaignId }),
      }),
    ])

    // Log each response status BEFORE overall ok-check
    const responseMapEarly: Record<string, Response> = {
      conversionActionSetup: conversionActionSetupResponse,
      campaignStructureOverview: campaignStructureOverviewResponse,
      keywordMatchTypeMix: keywordMatchTypeMixResponse,
      adGroupTheming: adGroupThemingResponse,
      zeroConversionKeywords: zeroConversionKeywordsResponse,
      performanceByNetwork: performanceByNetworkResponse,
      searchTermAnalysis: searchTermAnalysisResponse,
      changeHistorySummary: changeHistorySummaryResponse,
    }

    Object.entries(responseMapEarly).forEach(([name, res]) => {
      console.log(`[AI-report] ${name} status ${res.status}`)
    })

    if (
      !conversionActionSetupResponse.ok ||
      !campaignStructureOverviewResponse.ok ||
      !keywordMatchTypeMixResponse.ok ||
      !adGroupThemingResponse.ok ||
      !zeroConversionKeywordsResponse.ok ||
      !performanceByNetworkResponse.ok ||
      !searchTermAnalysisResponse.ok ||
      !changeHistorySummaryResponse.ok ||
      !performanceMaxDeepDiveResponse.ok ||
      !landingPagePerformanceResponse.ok ||
      !adCopyTextResponse.ok ||
      !geoHotColdResponse.ok
    ) {
      throw new Error('Failed to fetch data from one or more endpoints')
    }

    const [
      conversionActionSetupData,
      campaignStructureOverviewData,
      keywordMatchTypeMixData,
      adGroupThemingData,
      zeroConversionKeywordsData,
      performanceByNetworkData,
      searchTermAnalysisData,
      changeHistorySummaryData,
      performanceMaxDeepDiveData,
      landingPagePerformanceData,
      adCopyTextData,
      geoHotColdData,
    ] = (await Promise.all([
      conversionActionSetupResponse.json(),
      campaignStructureOverviewResponse.json(),
      keywordMatchTypeMixResponse.json(),
      adGroupThemingResponse.json(),
      zeroConversionKeywordsResponse.json(),
      performanceByNetworkResponse.json(),
      searchTermAnalysisResponse.json(),
      changeHistorySummaryResponse.json(),
      performanceMaxDeepDiveResponse.json(),
      landingPagePerformanceResponse.json(),
      adCopyTextResponse.json(),
      geoHotColdResponse.json(),
    ])) as [
      ConversionActionSetup,
      CampaignStructureOverview,
      KeywordMatchTypeMix,
      AdGroupTheming,
      ZeroConversionKeywords,
      PerformanceByNetwork,
      SearchTermAnalysis,
      ChangeHistorySummary,
      PerformanceMaxDeepDive,
      LandingPagePerformance,
      AdCopyText,
      GeoHotColdPerformance,
    ]

    // Helper function to format Block 1 data in compact headers/rows format
    const formatBlock1Data = () => {
      return {
        campaign_overview: campaignStructureOverviewData.campaign_overview,
        match_type_overview: keywordMatchTypeMixData.match_type_overview,
      }
    }

    const formattedData = `
# Google Ads Account Analysis

## Block 1: Campaign Foundation Analysis
${JSON.stringify(formatBlock1Data(), null, 2)}

## Block 2: Ad Group Theming Analysis
${JSON.stringify(
  {
    ad_group_theming: {
      headers: [
        'campaignName',
        'adGroupName',
        'keywordCount',
        'cost',
        'roas',
        'topKeywords',
      ],
      rows:
        adGroupThemingData.campaigns?.flatMap(
          (campaign) =>
            campaign.ad_group_summary?.map((adGroup) => [
              campaign.campaignName,
              adGroup.adGroupName,
              adGroup.keywordCount,
              Math.round(adGroup.cost * 100) / 100,
              Math.round(adGroup.roas * 100) / 100,
              adGroup.top_spending_keywords_sample?.join(', ') || '',
            ]) || [],
        ) || [],
    },
  },
  null,
  2,
)}

## Block 3: Zero Conversion Keywords
${JSON.stringify(zeroConversionKeywordsData, null, 2)}

## Block 4: Performance by Network
${JSON.stringify(
  {
    network_performance: {
      headers: [
        'campaignName',
        'campaignType',
        'adNetworkType',
        'cost',
        'impressions',
        'clicks',
        'conversions',
        'roas',
        'cpa',
      ],
      rows:
        performanceByNetworkData.campaigns?.map((campaign) => [
          campaign.campaignName,
          campaign.campaignType,
          campaign.adNetworkType,
          Math.round(campaign.cost * 100) / 100,
          campaign.impressions,
          campaign.clicks,
          Math.round(campaign.conversions * 100) / 100,
          Math.round(campaign.roas * 100) / 100,
          Math.round(campaign.cpa * 100) / 100,
        ]) || [],
    },
  },
  null,
  2,
)}

## Block 5: Search Term Analysis
${JSON.stringify(searchTermAnalysisData, null, 2)}

## Block 6: Change History Summary
${JSON.stringify(
  {
    change_history: {
      headers: [
        'changeDateTime',
        'userEmail',
        'changeType',
        'itemChanged',
        'campaignChanged',
        'adGroupChanged',
        'oldValue',
        'newValue',
      ],
      rows: changeHistorySummaryData.change_history?.rows || [],
    },
  },
  null,
  2,
)}

## Block 7: Performance Max Deep Dive
${JSON.stringify(
  {
    asset_group_performance: {
      headers: [
        'Campaign Name',
        'Asset Group Name',
        'Status',
        'Cost',
        'Conversions',
        'ROAS',
      ],
      rows:
        performanceMaxDeepDiveData?.assetGroupPerformance?.map((item) => [
          item.campaignName,
          item.assetGroupName,
          item.assetGroupStatus,
          item.cost,
          item.conversions,
          item.roas,
        ]) || [],
    },
    asset_performance: {
      headers: [
        'Campaign Name',
        'Asset Group Name',
        'Asset Text',
        'Asset Type',
        'Performance Label',
      ],
      rows:
        performanceMaxDeepDiveData?.assetPerformance?.map((item) => [
          item.campaignName,
          item.assetGroupName,
          item.assetText,
          item.assetType,
          item.performanceLabel,
        ]) || [],
    },
  },
  null,
  2,
)}

## Block 8: Landing Page Performance
${JSON.stringify(
  {
    pages: {
      headers: [
        'Final URL',
        'Cost',
        'Clicks',
        'Conversions',
        'Conversion Value',
        'ROAS',
      ],
      rows:
        landingPagePerformanceData?.pages?.map((item) => [
          item.finalUrl,
          item.cost,
          item.clicks,
          item.conversions,
          item.conversionValue,
          item.roas,
        ]) || [],
    },
  },
  null,
  2,
)}

## Block 9: Ad Copy Text
${JSON.stringify(
  {
    ads: {
      headers: ['Campaign Name', 'Ad Group Name', 'Headlines'],
      rows:
        adCopyTextData?.ads?.map((item) => [
          item.campaignName,
          item.adGroupName,
          item.headlines?.join(', ') || '',
        ]) || [],
    },
  },
  null,
  2,
)}

## Block 10: Geo Hot Cold
${JSON.stringify(
  {
    locations: {
      headers: [
        'Location Type',
        'Location Name',
        'Country ID',
        'Cost',
        'Clicks',
        'Conversions',
        'Conversion Value',
        'ROAS',
      ],
      rows:
        geoHotColdData?.locations?.map((item) => [
          item.locationType,
          item.locationName,
          item.countryId,
          item.cost,
          item.clicks,
          item.conversions,
          item.conversionValue,
          item.roas,
        ]) || [],
    },
  },
  null,
  2,
)}`

    // Single request to proxy-openai with timeout - let proxy-openai handle retries
    const AI_REQUEST_TIMEOUT = 300000 // 5 минут
    
    console.log(`🤖 AI запрос: отправляем к proxy-openai`)
    
    const openAIResponse = await Promise.race([
      fetch(`${baseUrl}/api/proxy-openai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt: formattedData }),
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('AI request timeout')),
          AI_REQUEST_TIMEOUT,
        ),
      ),
    ])
    
    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text()
      throw new Error(`AI request failed: HTTP ${openAIResponse.status}: ${errorText}`)
    }
    
    console.log(`✅ AI запрос: получен успешный ответ от proxy-openai`)

    // Parse OpenAI response - this could also fail
    let openAIData: OpenAIResponse
    let reportContent: string
    
    try {
      openAIData = (await openAIResponse.json()) as OpenAIResponse
      reportContent = openAIData.choices[0].message.content
      
      if (!reportContent || reportContent.trim() === '') {
        throw new Error('Empty report content received from AI')
      }
      
      console.log('Successfully generated AI report content')
    } catch (parseError) {
      console.error('❌ ERROR PARSING OPENAI RESPONSE:')
      console.error('Parse error:', parseError)
      throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : String(parseError)}`)
    }

    // Only cache if we reach this point (successful generation)
    if (userId) {
      console.log('Saving generated report to cache...')
      try {
        const cacheSuccess = await setCachedReport({
          userId,
          accountId,
          timeRange: timeRange ?? 'LAST_QUARTER',
          campaignId,
          reportContent,
          reportType: 'regular', // Specify regular report type
        })

        if (cacheSuccess) {
          console.log('Report successfully cached')
        } else {
          console.warn('Failed to cache report')
        }
      } catch (cacheError) {
        console.warn('Error saving report to cache:', cacheError)
        // Don't throw here - report was generated successfully, just caching failed
      }
    } else {
      console.log('No userId provided, skipping cache save')
    }

    // Detailed logging for sub-endpoint statuses
    const responseMap: Record<string, Response> = {
      conversionActionSetup: conversionActionSetupResponse,
      campaignStructureOverview: campaignStructureOverviewResponse,
      keywordMatchTypeMix: keywordMatchTypeMixResponse,
      adGroupTheming: adGroupThemingResponse,
      zeroConversionKeywords: zeroConversionKeywordsResponse,
      performanceByNetwork: performanceByNetworkResponse,
      searchTermAnalysis: searchTermAnalysisResponse,
      changeHistorySummary: changeHistorySummaryResponse,
      performanceMaxDeepDive: performanceMaxDeepDiveResponse,
      landingPagePerformance: landingPagePerformanceResponse,
      adCopyText: adCopyTextResponse,
      geoHotCold: geoHotColdResponse,
    }

    Object.entries(responseMap).forEach(([name, res]) => {
      if (!res.ok) {
        console.error(
          `[AI-report] ${name} endpoint failed → ${res.status} ${res.statusText}`,
        )
      } else {
        console.log(`[AI-report] ${name} OK (${res.status})`)
      }
    })

    return {
      report: reportContent,
    }
  } catch (error) {
    console.error('❌ ПОЛНАЯ ОШИБКА В AI-REPORT:')
    console.error('Error type:', typeof error)
    console.error('Error instanceof Error:', error instanceof Error)
    console.error('Error object:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error message:', error instanceof Error ? error.message : 'No error message')
    console.error('Error toString:', String(error))
    console.error('Error JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    throw error
  }
}
