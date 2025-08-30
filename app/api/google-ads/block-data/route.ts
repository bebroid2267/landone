import { NextRequest, NextResponse } from 'next/server'
import fetch from 'node-fetch'

interface RequestBody {
  accessToken: string
  accountId: string
  timeRange?: string
  campaignId?: string
  blockId: string
}

type BlockDataResponse = Record<string, unknown>

export async function POST(req: NextRequest) {
  try {
    // Custom handler for block-data since we need blockId
    const { accessToken, accountId, timeRange, campaignId, blockId } =
      (await req.json()) as RequestBody

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

    if (!blockId) {
      return NextResponse.json(
        { error: 'Block ID is required' },
        { status: 400 },
      )
    }

    const data: BlockDataResponse = await getBlockData(
      accessToken,
      accountId,
      blockId,
      timeRange,
      campaignId,
      req,
    )

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in POST /api/google-ads/block-data:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

async function getBlockData(
  accessToken: string,
  accountId: string,
  blockId: string,
  timeRange?: string,
  campaignId?: string,
  request?: NextRequest,
): Promise<BlockDataResponse> {
  const host = request?.headers?.get('host')
  const protocol = request?.headers?.get('x-forwarded-proto') ?? 'http'
  const baseUrl = host
    ? `${protocol}://${host}`
    : process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const cookieHeader = request?.headers?.get('cookie') ?? ''

  // Map block IDs to their corresponding API endpoints
  const blockEndpoints: Record<string, string> = {
    // Numbered block IDs
    block1: '/api/google-ads/conversion-action-setup',
    block2: '/api/google-ads/ad-group-theming',
    block3: '/api/google-ads/zero-conversion-keywords',
    block4: '/api/google-ads/performance-by-network',
    block5: '/api/google-ads/search-term-analysis',
    block6: '/api/google-ads/change-history-summary',
    block7: '/api/google-ads/keyword-match-type-mix',
    block8: '/api/google-ads/campaign-structure-overview',
    block9: '/api/google-ads/performance-max-deep-dive',
    block10: '/api/google-ads/landing-page-performance',
    block11: '/api/google-ads/ad-copy-text',
    block12: '/api/google-ads/geo-hot-cold',
    block13: '/api/google-ads/network-performance',
    block14: '/api/google-ads/ad-asset-performance',
    block15: '/api/google-ads/search-term-coverage',
    block16: '/api/google-ads/negative-keywords-gaps',
    block17: '/api/google-ads/assisted-conversions',
    block18: '/api/google-ads/conversion-timing',
    block19: '/api/google-ads/impression-share-lost',
    block20: '/api/google-ads/roas-by-device-geography',

    // Named block IDs
    conversionActionSetup: '/api/google-ads/conversion-action-setup',
    campaignStructureOverview: '/api/google-ads/campaign-structure-overview',
    keywordMatchTypeMix: '/api/google-ads/keyword-match-type-mix',
    adGroupTheming: '/api/google-ads/ad-group-theming',
    zeroConversionKeywords: '/api/google-ads/zero-conversion-keywords',
    performanceByNetwork: '/api/google-ads/performance-by-network',
    searchTermAnalysis: '/api/google-ads/search-term-analysis',
    changeHistorySummary: '/api/google-ads/change-history-summary',
    performanceMaxDeepDive: '/api/google-ads/performance-max-deep-dive',
    landingPagePerformance: '/api/google-ads/landing-page-performance',
    adCopyText: '/api/google-ads/ad-copy-text',
    geoHotColdPerformance: '/api/google-ads/geo-hot-cold',
    networkPerformance: '/api/google-ads/network-performance',
    adAssetPerformance: '/api/google-ads/ad-asset-performance',
    searchTermCoverage: '/api/google-ads/search-term-coverage',
    negativeKeywordsGaps: '/api/google-ads/negative-keywords-gaps',
    assistedConversions: '/api/google-ads/assisted-conversions',
    conversionTiming: '/api/google-ads/conversion-timing',
    impressionShareLost: '/api/google-ads/impression-share-lost',
    roasByDeviceGeography: '/api/google-ads/roas-by-device-geography',
    dailyTrends: '/api/google-ads/daily-trends',
    newKeywords: '/api/google-ads/new-keywords',
    zeroConversionAdgroups: '/api/google-ads/zero-conversion-adgroups',
    adGroupDistribution: '/api/google-ads/ad-group-distribution',
    conversionActionInventory: '/api/google-ads/conversion-action-inventory',

    // Weekly analysis blocks
    block1_budget_pacing: '/api/google-ads/campaign-structure-overview',
    block2_change_log: '/api/google-ads/change-history-summary',
    block3_daily_trends: '/api/google-ads/daily-trends',
    block4_search_terms: '/api/google-ads/search-term-analysis',
  }

  const endpoint = blockEndpoints[blockId]
  if (!endpoint) {
    throw new Error(`Unknown block ID: ${blockId}`)
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
      body: JSON.stringify({ accessToken, accountId, timeRange, campaignId }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Failed to fetch data from ${endpoint}: ${response.status} ${errorText}`,
      )
    }

    const data: BlockDataResponse = (await response.json()) as BlockDataResponse
    return data
  } catch (error) {
    console.error(`Error fetching block data for ${blockId}:`, error)
    throw error
  }
}
