import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import fetch from 'node-fetch'
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

interface BlockData {
  block1: {
    conversionActionSetup: ConversionActionSetup
    campaignStructureOverview: CampaignStructureOverview
    keywordMatchTypeMix: KeywordMatchTypeMix
  }
  block2: {
    adGroupTheming: AdGroupTheming
  }
  block3: {
    zeroConversionKeywords: ZeroConversionKeywords
  }
  block4: {
    performanceByNetwork: PerformanceByNetwork
  }
  block5: {
    searchTermAnalysis: SearchTermAnalysis
  }
  block6: {
    changeHistorySummary: ChangeHistorySummary
  }
  block9: {
    performanceMaxDeepDive: PerformanceMaxDeepDive
  }
  block10: {
    landingPagePerformance: LandingPagePerformance
  }
  block11: {
    adCopyText: AdCopyText
  }
  block12: {
    geoHotColdPerformance: GeoHotColdPerformance
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handleRequest(req, getAnalysisData)
  } catch (error) {
    console.error('Error in POST /api/google-ads/ai-analysis:', error)
    throw error
  }
}

async function getAnalysisData(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
  request?: NextRequest,
): Promise<BlockData> {
  const host = request?.headers?.get('host')
  const protocol = request?.headers?.get('x-forwarded-proto') ?? 'http'
  const baseUrl = host
    ? `${protocol}://${host}`
    : process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const cookieHeader = request?.headers?.get('cookie') ?? ''

  try {
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
      geoHotColdPerformanceData,
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

    return {
      block1: {
        conversionActionSetup: conversionActionSetupData,
        campaignStructureOverview: campaignStructureOverviewData,
        keywordMatchTypeMix: keywordMatchTypeMixData,
      },
      block2: {
        adGroupTheming: adGroupThemingData,
      },
      block3: {
        zeroConversionKeywords: zeroConversionKeywordsData,
      },
      block4: {
        performanceByNetwork: performanceByNetworkData,
      },
      block5: {
        searchTermAnalysis: searchTermAnalysisData,
      },
      block6: {
        changeHistorySummary: changeHistorySummaryData,
      },
      block9: {
        performanceMaxDeepDive: performanceMaxDeepDiveData,
      },
      block10: {
        landingPagePerformance: landingPagePerformanceData,
      },
      block11: {
        adCopyText: adCopyTextData,
      },
      block12: {
        geoHotColdPerformance: geoHotColdPerformanceData,
      },
    }
  } catch (error) {
    console.error('Error getting analysis data:', error)
    throw error
  }
}
