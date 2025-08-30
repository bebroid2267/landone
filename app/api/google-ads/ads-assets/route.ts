import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { buildDateFilter, googleAdsApiRequest } from '../utils'
import { getLimit } from '../limits'

export async function POST(req: NextRequest) {
  return handleRequest(req, getAdsAssetsData)
}

interface Asset {
  id: string
  name: string
  type: string
  status: string
  metrics: {
    impressions: number
    clicks: number
    ctr: number
    conversions: number
    costMicros: number
  }
}

interface AdGroup {
  id: string
  name: string
  status: string
  cpc: number
  metrics: {
    impressions: number
    clicks: number
    ctr: number
    conversions: number
    costMicros: number
  }
}

interface AdsAssetsResponse {
  activeAssets: Asset[]
  adGroups: AdGroup[]
  adMetrics: {
    enabledAds: number
    disapprovedAds: number
    limitedAds: number
    activeAds: number
    totalAds: number
  }
}

// Interface for RSA asset data
interface RsaAssetData {
  assetId: string
  assetText: string
  assetType: string
  pinnedField: string | null
  adId: string
  adGroupId: string
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  conversionsValue: number
  costMicros: number
  date: string
}

// Interface for keyword conversion data
interface KeywordConversionData {
  keywordText: string
  adGroupId: string
  adId: string
  adType: string
  conversionActionName: string
  conversionAction: string
  campaignId: string
  criterionId: string
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  conversionsValue: number
}

interface AssetApiResponse {
  results: {
    asset?: {
      id: string
      type: string
      textAsset?: {
        text: string
      }
    }
    adGroupAd?: {
      ad?: {
        id: string
      }
    }
    adGroup?: {
      id: string
    }
    adGroupAdAssetView?: {
      pinnedField: string | null
    }
    metrics?: {
      impressions: string
      clicks: string
      ctr: string
      conversions: string
      conversionsValue: string
      costMicros: string
    }
    segments?: {
      date: string
    }
  }[]
}

interface KeywordApiResponse {
  results: {
    adGroupCriterion?: {
      keyword?: {
        text: string
      }
      criterionId: string
    }
    adGroup?: {
      id: string
    }
    campaign?: {
      id: string
    }
    segments?: {
      conversionActionName: string
      conversionAction: string
    }
    metrics?: {
      impressions: string
      clicks: string
      ctr: string
      conversions: string
      conversionsValue: string
    }
  }[]
}

interface AdGroupApiResponse {
  results: {
    adGroup?: {
      id: string
      name: string
      status: string
    }
    metrics?: {
      averageCpc: string
      impressions: string
      clicks: string
      ctr: string
      conversions: string
      costMicros: string
    }
  }[]
}

interface AdMetricsApiResponse {
  results: {
    adGroupAd?: {
      status: string
    }
  }[]
}

async function getAdsAssetsData(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
): Promise<AdsAssetsResponse> {
  // Build date filter (empty for ALL_TIME)
  const dateFilter = buildDateFilter(timeRange)
  // Calculate 180 days timeframe
  const today = new Date()
  const startDate = new Date()
  startDate.setDate(today.getDate() - 180)
  const endDate = today.toISOString().split('T')[0]
  const startDateStr = startDate.toISOString().split('T')[0]

  // Build campaign filter if campaign ID is provided
  const campaignFilter = campaignId ? `AND campaign.id = '${campaignId}'` : ''

  const rsaAssetQuery = `
    SELECT
      ad_group.id,
      ad_group.status,
      ad_group_ad.ad.id,
      ad_group_ad.ad.resource_name,
      ad_group_ad.status,
      campaign.status,
      asset.id,
      asset.resource_name,
      asset.type,
      asset.text_asset.text,
      ad_group_ad_asset_view.pinned_field,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.conversions,
      metrics.conversions_value,
      metrics.cost_micros,
      segments.date
    FROM
      ad_group_ad_asset_view
    WHERE
      metrics.impressions > 0
      AND metrics.clicks > 0
      AND campaign.status IN ('ENABLED', 'PAUSED')
      AND ad_group.status IN ('ENABLED', 'PAUSED')
      AND ad_group_ad.status IN ('ENABLED', 'PAUSED')
      AND segments.date >= '${startDateStr}' AND segments.date <= '${endDate}'
    ORDER BY metrics.cost_micros DESC
    LIMIT ${getLimit('ADS_ASSETS')}
  `

  /*
   * Split into two queries to avoid
   * PROHIBITED_SEGMENT_WITH_METRIC_IN_SELECT_OR_WHERE_CLAUSE error
   */
  // Query 2a: Keyword performance metrics (without conversion segments)
  const keywordPerformanceQuery = `
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.status,
      ad_group.id,
      ad_group.status,
      ad_group_criterion.criterion_id,
      campaign.id,
      campaign.status,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.cost_micros
    FROM
      keyword_view
    WHERE
      metrics.impressions > 0
      AND metrics.clicks > 0
      AND campaign.status IN ('ENABLED', 'PAUSED')
      AND ad_group.status IN ('ENABLED', 'PAUSED')
      AND ad_group_criterion.status IN ('ENABLED', 'PAUSED')
      AND segments.date >= '${startDateStr}' AND segments.date <= '${endDate}'
    ORDER BY
      metrics.clicks DESC
    LIMIT ${getLimit('ADS_ASSETS')}
  `

  // Query 2b: Keyword conversion data (without performance metrics)
  const keywordConversionQuery = `
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.status,
      ad_group.id,
      ad_group.status,
      ad_group_criterion.criterion_id,
      campaign.id,
      campaign.status,
      segments.conversion_action,
      segments.conversion_action_name,
      metrics.conversions,
      metrics.conversions_value
    FROM
      keyword_view
    WHERE
      metrics.conversions > 0
      AND campaign.status IN ('ENABLED', 'PAUSED')
      AND ad_group.status IN ('ENABLED', 'PAUSED')
      AND ad_group_criterion.status IN ('ENABLED', 'PAUSED')
      AND segments.date >= '${startDateStr}' AND segments.date <= '${endDate}'

    ORDER BY
      metrics.conversions DESC
    LIMIT ${getLimit('ADS_ASSETS')}
  `

  // Query 3: Get ad group stats
  const adGroupsQuery = `
    SELECT
      ad_group.id,
      ad_group.name,
      ad_group.status,
      campaign.status,
      metrics.average_cpc,
      metrics.impressions,
      metrics.clicks, 
      metrics.ctr,
      metrics.conversions,
      metrics.cost_micros
    FROM
      ad_group
    WHERE
      campaign.status IN ('ENABLED', 'PAUSED')
      AND ad_group.status IN ('ENABLED', 'PAUSED')
      AND metrics.impressions > 0
      AND metrics.clicks > 0
      AND segments.date >= '${startDateStr}' AND segments.date <= '${endDate}'
    ORDER BY
      metrics.cost_micros DESC
    LIMIT ${getLimit('ADS_ASSETS')}
  `

  // Query 4: Get ad metrics summary
  const adMetricsQuery = `
    SELECT
      ad_group_ad.ad.type,
      ad_group_ad.status,
      ad_group_ad.ad.id,
      campaign.status,
      ad_group.status
    FROM
      ad_group_ad
    WHERE 
      campaign.status IN ('ENABLED', 'PAUSED')
      AND ad_group.status IN ('ENABLED', 'PAUSED')
      AND segments.date >= '${startDateStr}' AND segments.date <= '${endDate}'
    LIMIT ${getLimit('ADS_ASSETS')}
  `

  try {
    // Execute the Google Ads API queries
    dateFilter
    campaignFilter
    const [
      assetResponse,
      keywordConvResponse,
      keywordPerfResponse,
      adGroupResponse,
      adMetricsResponse,
    ] = await Promise.all([
      googleAdsApiRequest(accessToken, accountId, rsaAssetQuery, userId),
      googleAdsApiRequest(
        accessToken,
        accountId,
        keywordConversionQuery,
        userId,
      ),
      googleAdsApiRequest(
        accessToken,
        accountId,
        keywordPerformanceQuery,
        userId,
      ),
      googleAdsApiRequest(accessToken, accountId, adGroupsQuery, userId),
      googleAdsApiRequest(accessToken, accountId, adMetricsQuery, userId),
    ])

    // Check if responses are ok
    const failedResponses = [
      { name: 'RSA assets', response: assetResponse },
      { name: 'Keyword conversions', response: keywordConvResponse },
      { name: 'Keyword performance', response: keywordPerfResponse },
      { name: 'Ad groups', response: adGroupResponse },
      { name: 'Ad metrics', response: adMetricsResponse },
    ].filter((item) => !item.response.ok)

    if (failedResponses.length > 0) {
      const errorMessages = await Promise.all(
        failedResponses.map(async (item) => {
          const errorText = await item.response.text()
          return `${item.name} query failed: ${errorText}`
        }),
      )

      throw new Error(
        `Google Ads API request failed: ${errorMessages.join(', ')}`,
      )
    }

    // Parse the responses
    const assetData = (await assetResponse.json()) as AssetApiResponse
    const keywordConvData =
      (await keywordConvResponse.json()) as KeywordApiResponse
    const keywordPerfData =
      (await keywordPerfResponse.json()) as KeywordApiResponse
    const adGroupData = (await adGroupResponse.json()) as AdGroupApiResponse
    const adMetricsData =
      (await adMetricsResponse.json()) as AdMetricsApiResponse

    // Process asset performance data
    console.log('🔍 [AdsAssets] Raw asset data results:', assetData.results?.length ?? 0)
    const rsaAssets: RsaAssetData[] = (assetData.results ?? []).map(
      (result) => ({
        assetId: result.asset?.id ?? '',
        assetText: result.asset?.textAsset?.text ?? '',
        assetType: result.asset?.type ?? '',
        pinnedField: result.adGroupAdAssetView?.pinnedField ?? null,
        adId: result.adGroupAd?.ad?.id ?? '',
        adGroupId: result.adGroup?.id ?? '',
        impressions: parseInt(result.metrics?.impressions ?? '0'),
        clicks: parseInt(result.metrics?.clicks ?? '0'),
        ctr: parseFloat(result.metrics?.ctr ?? '0'),
        conversions: parseFloat(result.metrics?.conversions ?? '0'),
        conversionsValue: parseFloat(result.metrics?.conversionsValue ?? '0'),
        costMicros: parseInt(result.metrics?.costMicros ?? '0'),
        date: result.segments?.date ?? '',
      }),
    )
    console.log('📊 [AdsAssets] Processed RSA assets:', rsaAssets.length)

    // Process and merge keyword data from both queries
    const keywordMap = new Map<string, KeywordConversionData>()

    // First process conversion data
    if (keywordConvData.results) {
      keywordConvData.results.forEach((result) => {
        const keywordText = result.adGroupCriterion?.keyword?.text ?? ''
        const adGroupId = result.adGroup?.id ?? ''
        const criterionId = result.adGroupCriterion?.criterionId ?? ''
        // Create a unique key for each keyword
        const key = `${keywordText}|${adGroupId}|${criterionId}`

        keywordMap.set(key, {
          keywordText,
          adGroupId,
          adId: '', // We don't have this in the new query
          adType: '', // We don't have this in the new query
          conversionActionName: result.segments?.conversionActionName ?? '',
          conversionAction: result.segments?.conversionAction ?? '',
          campaignId: result.campaign?.id ?? '',
          criterionId,
          impressions: 0, // Will be filled from performance data
          clicks: 0, // Will be filled from performance data
          ctr: 0, // Will be filled from performance data
          conversions: parseFloat(result.metrics?.conversions ?? '0'),
          conversionsValue: parseFloat(result.metrics?.conversionsValue ?? '0'),
        })
      })
    }

    // Then add performance metrics to existing keywords or create new entries
    if (keywordPerfData.results) {
      keywordPerfData.results.forEach((result) => {
        const keywordText = result.adGroupCriterion?.keyword?.text ?? ''
        const adGroupId = result.adGroup?.id ?? ''
        const criterionId = result.adGroupCriterion?.criterionId ?? ''
        const key = `${keywordText}|${adGroupId}|${criterionId}`

        if (keywordMap.has(key)) {
          // Update existing keyword with performance metrics
          const keyword = keywordMap.get(key)!
          keyword.impressions = parseInt(result.metrics?.impressions ?? '0')
          keyword.clicks = parseInt(result.metrics?.clicks ?? '0')
          keyword.ctr = parseFloat(result.metrics?.ctr ?? '0')
        } else {
          // Create a new entry for keywords without conversions
          keywordMap.set(key, {
            keywordText,
            adGroupId,
            adId: '',
            adType: '',
            conversionActionName: '',
            conversionAction: '',
            campaignId: result.campaign?.id ?? '',
            criterionId,
            impressions: parseInt(result.metrics?.impressions ?? '0'),
            clicks: parseInt(result.metrics?.clicks ?? '0'),
            ctr: parseFloat(result.metrics?.ctr ?? '0'),
            conversions: 0,
            conversionsValue: 0,
          })
        }
      })
    }

    // Create the response object
    const response: AdsAssetsResponse = {
      activeAssets: [],
      adGroups: [],
      adMetrics: {
        enabledAds: 0,
        disapprovedAds: 0,
        limitedAds: 0,
        activeAds: 0,
        totalAds: 0,
      },
    }

    // Process ad groups data
    response.adGroups = (adGroupData.results ?? []).map((result) => ({
      id: result.adGroup?.id ?? '',
      name: result.adGroup?.name ?? '',
      status: result.adGroup?.status ?? 'UNKNOWN',
      cpc: parseFloat(result.metrics?.averageCpc ?? '0') / 1000000, // Convert micros to actual value
      metrics: {
        impressions: parseInt(result.metrics?.impressions ?? '0'),
        clicks: parseInt(result.metrics?.clicks ?? '0'),
        ctr: parseFloat(result.metrics?.ctr ?? '0'),
        conversions: parseFloat(result.metrics?.conversions ?? '0'),
        costMicros: parseInt(result.metrics?.costMicros ?? '0'),
      },
    }))

    // Process ad metrics data to get counts
    const adStatuses = new Map<string, number>()
    let totalAds = 0

    if (adMetricsData.results) {
      totalAds = adMetricsData.results.length

      adMetricsData.results.forEach((result) => {
        const status = result.adGroupAd?.status ?? 'UNKNOWN'
        adStatuses.set(status, (adStatuses.get(status) ?? 0) + 1)
      })
    }

    // Set ad metrics in response
    response.adMetrics = {
      enabledAds: adStatuses.get('ENABLED') ?? 0,
      activeAds: adStatuses.get('ENABLED') ?? 0, // Assuming ENABLED means active
      disapprovedAds: adStatuses.get('DISAPPROVED') ?? 0,
      limitedAds: adStatuses.get('LIMITED') ?? 0,
      totalAds: totalAds,
    }

    // Process asset data for the response
    const assetMap = new Map<string, Asset>()

    // Group assets by ID and aggregate metrics
    rsaAssets.forEach((asset) => {
      if (!assetMap.has(asset.assetId)) {
        assetMap.set(asset.assetId, {
          id: asset.assetId,
          name: asset.assetText,
          type: asset.assetType,
          status: 'ENABLED', // Assume assets in use are enabled
          metrics: {
            impressions: 0,
            clicks: 0,
            ctr: 0,
            conversions: 0,
            costMicros: 0,
          },
        })
      }

      const existingAsset = assetMap.get(asset.assetId)!

      // Aggregate metrics
      existingAsset.metrics.impressions += asset.impressions
      existingAsset.metrics.clicks += asset.clicks
      existingAsset.metrics.conversions += asset.conversions
      existingAsset.metrics.costMicros += asset.costMicros
    })

    // Calculate CTR for each asset
    assetMap.forEach((asset) => {
      if (asset.metrics.impressions > 0) {
        asset.metrics.ctr = asset.metrics.clicks / asset.metrics.impressions
      }
    })

    // Convert to array and sort by impressions
    response.activeAssets = Array.from(assetMap.values()).sort(
      (a, b) => b.metrics.impressions - a.metrics.impressions,
    )
    
    console.log('✅ [AdsAssets] Final response:', {
      activeAssetsCount: response.activeAssets.length,
      adGroupsCount: response.adGroups.length,
      adMetrics: response.adMetrics
    })

    return response
  } catch (error) {
    console.error('Error fetching ads and assets data:', error)
    throw error
  }
}
