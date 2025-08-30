// Utility functions for fetching Google Ads analytics data

/**
 * Fetches specific Google Ads analytics data type for the specified account
 * @param accessToken Google Ads API access token
 * @param accountId Google Ads account ID
 * @param dataType Type of analytics data to fetch
 * @param timeRange Optional time range for the data (e.g., '180days', '90days')
 * @param campaignId Optional campaign ID to filter data for a specific campaign
 * @param refreshTokens Optional function to refresh tokens on 401 errors
 * @returns The requested analytics data
 */
export async function fetchGoogleAdsAnalytics(
  accessToken: string,
  accountId: string,
  dataType: string,
  timeRange = '180days',
  campaignId?: string,
  refreshTokens?: () => Promise<boolean>,
) {
  const makeRequest = async (token: string) => {
    return fetch('/api/google-ads/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken: token,
        accountId,
        dataType,
        timeRange,
        campaignId,
      }),
    })
  }

  try {
    let response = await makeRequest(accessToken)

    // Handle 401 authentication errors with token refresh
    if (response.status === 401 && refreshTokens) {
      console.log(
        'Google Ads API returned 401, attempting to refresh token...',
      )
      const refreshed = await refreshTokens()
      if (refreshed) {
        // Wait a bit for tokens to be updated in state
        await new Promise((resolve) => setTimeout(resolve, 100))
        
        // Retry with the same token (it should be updated in the calling component)
        response = await makeRequest(accessToken)
      }
    }

    if (!response.ok) {
      // Handle authentication errors specifically
      if (response.status === 401) {
        throw new Error(
          'Authentication required. Please log in to access Google Ads data.',
        )
      }

      let errorMessage = `Failed to fetch ${dataType} data`
      try {
        const errorData = (await response.json()) as {
          error: string
        }
        errorMessage = errorData.error ?? errorMessage
      } catch {
        // If JSON parsing fails, use status text or default message
        errorMessage = response.statusText || errorMessage
      }
      throw new Error(errorMessage)
    }

    return (await response.json()) as {
      data: Record<string, any>
    }
  } catch (error) {
    console.error(`Error fetching Google Ads ${dataType} data:`, error)
    throw error
  }
}

/**
 * Fetches available campaigns for the specified account
 */
export async function fetchAvailableCampaigns(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  refreshTokens?: () => Promise<boolean>,
) {
  return fetchGoogleAdsAnalytics(
    accessToken,
    accountId,
    'availableCampaigns',
    timeRange,
    undefined,
    refreshTokens,
  )
}

/**
 * Fetches conversion timing distribution data
 */
export async function fetchConversionTiming(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  refreshTokens?: () => Promise<boolean>,
) {
  return fetchGoogleAdsAnalytics(
    accessToken,
    accountId,
    'conversionTiming',
    timeRange,
    campaignId,
    refreshTokens,
  )
}

/**
 * Fetches top-spend, zero-conversion keywords
 */
export async function fetchZeroConversionKeywords(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  refreshTokens?: () => Promise<boolean>,
) {
  return fetchGoogleAdsAnalytics(
    accessToken,
    accountId,
    'zeroConversionKeywords',
    timeRange,
    campaignId,
    refreshTokens,
  )
}

/**
 * Fetches ad group spend distribution
 */
export async function fetchAdGroupDistribution(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  refreshTokens?: () => Promise<boolean>,
) {
  return fetchGoogleAdsAnalytics(
    accessToken,
    accountId,
    'adGroupDistribution',
    timeRange,
    campaignId,
    refreshTokens,
  )
}

/**
 * Fetches network performance data
 */
export async function fetchNetworkPerformance(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  refreshTokens?: () => Promise<boolean>,
) {
  return fetchGoogleAdsAnalytics(
    accessToken,
    accountId,
    'networkPerformance',
    timeRange,
    campaignId,
    refreshTokens,
  )
}

/**
 * Fetches search term coverage data
 */
export async function fetchSearchTermCoverage(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  refreshTokens?: () => Promise<boolean>,
) {
  return fetchGoogleAdsAnalytics(
    accessToken,
    accountId,
    'searchTermCoverage',
    timeRange,
    campaignId,
    refreshTokens,
  )
}

/**
 * Fetches ROAS by device and geography
 */
export async function fetchRoasByDeviceGeography(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  refreshTokens?: () => Promise<boolean>,
) {
  return fetchGoogleAdsAnalytics(
    accessToken,
    accountId,
    'roasByDeviceGeography',
    timeRange,
    campaignId,
    refreshTokens,
  )
}

/**
 * Fetches ad asset performance data
 */
export async function fetchAdAssetPerformance(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  refreshTokens?: () => Promise<boolean>,
) {
  return fetchGoogleAdsAnalytics(
    accessToken,
    accountId,
    'adAssetPerformance',
    timeRange,
    campaignId,
    refreshTokens,
  )
}

/**
 * Fetches ads and assets data
 */
export async function fetchAdsAssets(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  refreshTokens?: () => Promise<boolean>,
) {
  return fetchGoogleAdsAnalytics(
    accessToken,
    accountId,
    'adsAssets',
    timeRange,
    campaignId,
    refreshTokens,
  )
}

/**
 * Fetches conversion action inventory
 */
export async function fetchConversionActionInventory(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  refreshTokens?: () => Promise<boolean>,
) {
  return fetchGoogleAdsAnalytics(
    accessToken,
    accountId,
    'conversionActionInventory',
    timeRange,
    campaignId,
    refreshTokens,
  )
}

/**
 * Fetches impression share lost data
 */
export async function fetchImpressionShareLost(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  refreshTokens?: () => Promise<boolean>,
) {
  return fetchGoogleAdsAnalytics(
    accessToken,
    accountId,
    'impressionShareLost',
    timeRange,
    campaignId,
    refreshTokens,
  )
}

/**
 * Fetches negative keywords and placement gaps
 */
export async function fetchNegativeKeywordsGaps(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  refreshTokens?: () => Promise<boolean>,
) {
  return fetchGoogleAdsAnalytics(
    accessToken,
    accountId,
    'negativeKeywordsGaps',
    timeRange,
    campaignId,
    refreshTokens,
  )
}

/**
 * Fetches search term analysis data for keyword mining
 */
export async function fetchSearchTermAnalysis(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  refreshTokens?: () => Promise<boolean>,
) {
  return fetchGoogleAdsAnalytics(
    accessToken,
    accountId,
    'searchTermAnalysis',
    timeRange,
    campaignId,
    refreshTokens,
  )
}
