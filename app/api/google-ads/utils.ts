// Helper functions for the Google Ads API routes

/**
 * Generate random integers for mock data
 */
export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generate random floats for mock data
 */
export function getRandomFloat(min: number, max: number, decimals = 2): number {
  const value = Math.random() * (max - min) + min
  return parseFloat(value.toFixed(decimals))
}

/**
 * Formats timeRange parameter into valid GAQL date range format
 * @param timeRange Raw timeRange parameter
 * @returns Properly formatted GAQL date range or null for ALL_TIME
 */
export function formatTimeRangeForGAQL(timeRange?: string): string | null {
  // Predefined valid GAQL date ranges
  const validPredefinedRanges = [
    'TODAY',
    'YESTERDAY',
    'LAST_7_DAYS',
    'LAST_14_DAYS',
    'LAST_30_DAYS',
    'THIS_WEEK_SUN_TODAY',
    'THIS_WEEK_MON_TODAY',
    'THIS_MONTH',
    'LAST_MONTH',
    'THIS_QUARTER',
    'LAST_QUARTER',
    'THIS_YEAR',
    'LAST_YEAR',
  ]

  // Handle null/undefined case - default to 180 days
  if (!timeRange) {
    // Calculate 180 days ago from today
    const today = new Date()
    const startDate = new Date()
    startDate.setDate(today.getDate() - 180)

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0]
    }

    return `${formatDate(startDate)},${formatDate(today)}`
  }

  // Special case: ALL_TIME should not use DURING operator
  if (timeRange === 'alltime' || timeRange === 'ALL_TIME') {
    return null
  }

  // If it's already a valid predefined range, use it as is
  if (validPredefinedRanges.includes(timeRange)) {
    return timeRange
  }

  // Convert our frontend timeRange values to GAQL predefined ranges
  switch (timeRange) {
    case '7days':
      return 'LAST_7_DAYS'
    case '30days':
      return 'LAST_30_DAYS'
    case '180days':
      // Calculate 180 days ago from today
      const today = new Date()
      const startDate = new Date()
      startDate.setDate(today.getDate() - 180)

      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0]
      }

      return `${formatDate(startDate)},${formatDate(today)}`
    case 'yesterday':
      return 'YESTERDAY'
    case 'today':
      return 'TODAY'
  }

  // Check if it's a custom date range in YYYY-MM-DD,YYYY-MM-DD format
  const dateRangePattern = /^\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}$/
  if (dateRangePattern.test(timeRange)) {
    // For custom date ranges, return as is (without quotes)
    return timeRange
  }

  // Default to 180 days if the format isn't recognized
  console.warn(
    `Invalid timeRange format: "${timeRange}". Using 180 days instead.`,
  )
  const today = new Date()
  const startDate = new Date()
  startDate.setDate(today.getDate() - 180)

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  return `${formatDate(startDate)},${formatDate(today)}`
}

/**
 * Builds a date filter string for GAQL queries
 * @param timeRange Raw timeRange parameter
 * @returns Date filter string or empty string for ALL_TIME
 */
export function buildDateFilter(timeRange?: string): string {
  const formattedTimeRange = formatTimeRangeForGAQL(timeRange)

  /*
   * If formatTimeRangeForGAQL returns null (ALL_TIME case),
   * don't add date filter
   */
  if (formattedTimeRange === null) {
    return ''
  }

  // Check if it's a custom date range (contains comma)
  if (formattedTimeRange.includes(',')) {
    const [startDate, endDate] = formattedTimeRange.split(',')
    return `segments.date BETWEEN '${startDate}' AND '${endDate}'`
  }

  // For predefined ranges, use DURING
  return `segments.date DURING ${formattedTimeRange}`
}

/**
 * Builds a campaign filter string for GAQL queries
 */
export function buildCampaignFilter(campaignId?: string): string {
  return campaignId ? `AND campaign.id = '${campaignId}'` : ''
}

/**
 * Helper for making Google Ads API requests with automatic token refresh on
 * 401 errors
 */
export async function googleAdsApiRequest(
  accessToken: string,
  accountId: string,
  query: string,
  userId?: string,
) {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? ''

  console.log('[GoogleAdsAPI] Making request with:', {
    accountId,
    hasAccessToken: !!accessToken,
    accessTokenPrefix: accessToken
      ? accessToken.substring(0, 10) + '...'
      : 'none',
    userId,
    hasDeveloperToken: !!developerToken,
  })

  const makeRequest = async (token: string) => {
    return fetch(
      `https://googleads.googleapis.com/v19/customers/${accountId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'developer-token': developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      },
    )
  }

  // First attempt with the provided access token
  let response = await makeRequest(accessToken)
  console.log(
    '[GoogleAdsAPI] Initial request response status:',
    response.status,
  )

  // If we get a 401 error, try to refresh the token and retry
  if (response.status === 401) {
    console.log(
      '[GoogleAdsAPI] Got 401 error, attempting token refresh. UserId:',
      userId,
    )

    if (!userId) {
      console.log('[GoogleAdsAPI] No userId provided, cannot refresh token')
      return response
    }

    try {
      // Import the refresh function dynamically to avoid circular dependencies
      const { refreshGoogleAdsAccessToken } = await import(
        '@/utils/supabase/google-ads'
      )

      // Attempt to refresh the token using userId
      console.log(
        '[GoogleAdsAPI] Attempting to refresh token for userId:',
        userId,
      )
      const newToken = await refreshGoogleAdsAccessToken(userId)

      if (newToken) {
        console.log('[GoogleAdsAPI] Token refresh successful, retrying request')
        // Retry the request with the new token
        response = await makeRequest(newToken)
        console.log(
          '[GoogleAdsAPI] Retry request response status:',
          response.status,
        )
      } else {
        console.log(
          '[GoogleAdsAPI] Token refresh failed - no new token returned',
        )
      }
    } catch (refreshError) {
      console.error(
        '[GoogleAdsAPI] Failed to refresh Google Ads token:',
        refreshError,
      )
      // Return the original 401 response if refresh fails
    }
  }

  return response
}
