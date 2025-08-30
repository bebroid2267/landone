/**
 * Google Ads API Integration
 * This file handles the direct integration with Google Ads API without
 * database storage
 */

/**
 * Fetch Google Ads accounts for a user using a token
 */
export async function fetchGoogleAdsAccounts(accessToken: string) {
  try {
    // Fetch the accounts from Google Ads API
    const response = await fetch(
      'https://googleads.googleapis.com/v15/customers:listAccessibleCustomers',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '',
        },
      },
    )

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Google Ads accounts: ${response.statusText}`,
      )
    }

    const data = (await response.json()) as {
      resourceNames: string[]
    }

    // Process account info
    const accounts = data.resourceNames.map((resourceName: string) => {
      // Extract account ID from resource name (format: customers/1234567890)
      const accountId = resourceName.split('/')[1]
      return {
        accountId,
        accountName: `Account ${accountId}`, // Default name
      }
    })

    return accounts
  } catch (error) {
    console.error('Failed to fetch Google Ads accounts:', error)
    throw error
  }
}

/**
 * Get campaign performance data
 */
export async function fetchCampaignPerformance(
  accessToken: string,
  customerId: string,
) {
  try {
    const endpoint = `https://googleads.googleapis.com/v15/customers/${customerId}/googleAds:search`

    // GAQL query to get campaign performance data
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros
      FROM campaign
      WHERE campaign.status != 'REMOVED'
      ORDER BY campaign.name
    `

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '',
        'Content-Type': 'application/json',
        'login-customer-id': customerId,
      },
      body: JSON.stringify({
        query,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Ads API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        endpoint,
        customerId
      })
      throw new Error(
        `Failed to fetch campaign performance: ${response.status} ${response.statusText}. ${errorText}`,
      )
    }

    const data = (await response.json()) as {
      results: Record<string, any>[]
    }

    // Process campaign data
    return data.results ?? []
  } catch (error) {
    console.error('Failed to fetch campaign performance:', {
      error,
      customerId,
      endpoint: `https://googleads.googleapis.com/v15/customers/${customerId}/googleAds:search`,
      hasAccessToken: !!accessToken,
      hasDeveloperToken: !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    })
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to Google Ads API. Please check your internet connection.')
    }
    
    throw error
  }
}

/**
 * Refresh an access token using a refresh token
 */
export async function refreshGoogleAdsToken(refreshToken: string) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`)
    }

    const data = (await response.json()) as {
      access_token: string
      expires_in: number
    }
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    }
  } catch (error) {
    console.error('Failed to refresh Google Ads token:', error)
    throw error
  }
}
