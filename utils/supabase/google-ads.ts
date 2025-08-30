/* eslint-disable @typescript-eslint/no-unused-vars */

import { supabaseAdmin } from './supabase-admin'

interface GoogleAdsToken {
  id: string
  user_id: string
  access_token: string
  refresh_token: string
  expires_at: string
  created_at: string
  updated_at: string
}

interface GoogleAdsAccount {
  account_id: string
  account_name?: string | null
}

interface GoogleAdsApiResponse {
  resourceNames: string[]
}

interface TokenRefreshResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
}

interface RPCResponse<T> {
  data: T | null
  error: Error | null
}

type RPCFunction<TParams, TReturns> = (
  params: TParams,
) => Promise<RPCResponse<TReturns>>

interface SupabaseRPC {
  rpc: {
    get_google_ads_tokens: RPCFunction<{ p_user_id: string }, GoogleAdsToken[]>
    update_google_ads_tokens: RPCFunction<
      {
        p_user_id: string
        p_access_token: string
        p_refresh_token: string
        p_expires_at: string
      },
      void
    >
    insert_google_ads_tokens: RPCFunction<
      {
        p_user_id: string
        p_access_token: string
        p_refresh_token: string
        p_expires_at: string
      },
      void
    >
    delete_google_ads_accounts: RPCFunction<{ p_user_id: string }, void>
    insert_google_ads_account: RPCFunction<
      {
        p_user_id: string
        p_account_id: string
        p_account_name: string | null
      },
      void
    >
  }
}

/**
 * Save Google Ads tokens for a user
 */
export async function saveGoogleAdsTokens(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date,
) {
  try {
    /*
     * Use raw SQL to avoid type issues with new tables not yet in the Database
     * type
     */
    const { data: tokenData, error: tokenError } = (await supabaseAdmin.rpc(
      'get_google_ads_tokens',
      {
        p_user_id: userId,
      },
    )) as { data: GoogleAdsToken[] | null; error: Error | null }

    if (tokenError) {
      console.error('Error checking for existing tokens:', tokenError)
      throw tokenError
    }

    const existingTokens = tokenData

    if (existingTokens && existingTokens.length > 0) {
      // Update existing tokens
      const { error: updateError } = await supabaseAdmin.rpc(
        'update_google_ads_tokens',
        {
          p_user_id: userId,
          p_access_token: accessToken,
          p_refresh_token: refreshToken,
          p_expires_at: expiresAt.toISOString(),
        },
      )

      if (updateError) {
        console.error('Error updating Google Ads tokens:', updateError)
        throw updateError
      }
    } else {
      // Insert new tokens
      const { error: insertError } = await supabaseAdmin.rpc(
        'insert_google_ads_tokens',
        {
          p_user_id: userId,
          p_access_token: accessToken,
          p_refresh_token: refreshToken,
          p_expires_at: expiresAt.toISOString(),
        },
      )

      if (insertError) {
        console.error('Error inserting Google Ads tokens:', insertError)
        throw insertError
      }
    }

    return true
  } catch (error) {
    console.error('Failed to save Google Ads tokens:', error)
    throw error
  }
}

/**
 * Get Google Ads tokens for a user
 */
export async function getGoogleAdsTokens(
  userId: string,
): Promise<GoogleAdsToken | null> {
  try {
    const { data: tokenData, error: tokenError } = (await supabaseAdmin.rpc(
      'get_google_ads_tokens',
      {
        p_user_id: userId,
      },
    )) as { data: GoogleAdsToken[] | null; error: Error | null }

    if (tokenError) {
      console.error('Error getting Google Ads tokens:', tokenError)
      return null
    }

    return tokenData && tokenData.length > 0 ? tokenData[0] : null
  } catch (error) {
    console.error('Failed to get Google Ads tokens:', error)
    return null
  }
}

/**
 * Refresh Google Ads token
 */
async function refreshGoogleAdsToken(userId: string): Promise<string | null> {
  try {
    const tokens = await getGoogleAdsTokens(userId)
    if (!tokens) {
      return null
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`)
    }

    const refreshedToken = (await response.json()) as TokenRefreshResponse

    // Save the new token
    await saveGoogleAdsTokens(
      userId,
      refreshedToken.access_token,
      tokens.refresh_token,
      new Date(Date.now() + refreshedToken.expires_in * 1000),
    )

    return refreshedToken.access_token
  } catch (error) {
    console.error('Failed to refresh Google Ads token:', error)
    return null
  }
}

/**
 * Get Google Ads accounts for a user
 */
export async function refreshGoogleAdsAccessToken(userId: string) {
  return await refreshGoogleAdsToken(userId)
}

export async function fetchGoogleAdsAccounts(userId: string) {
  try {
    // Get existing tokens
    const tokens = await getGoogleAdsTokens(userId)
    if (!tokens) {
      throw new Error('No Google Ads tokens found for user')
    }

    let accessToken = tokens.access_token

    // Check if token is expired (with 5 minute buffer)
    const now = new Date()
    const expiresAt = new Date(tokens.expires_at)
    const bufferTime = 5 * 60 * 1000 // 5 minutes in milliseconds

    if (now.getTime() >= expiresAt.getTime() - bufferTime) {
      console.log('Token is expired or expiring soon, refreshing...')
      // Token is expired or expiring soon, refresh it
      const refreshedAccessToken = await refreshGoogleAdsToken(userId)
      if (!refreshedAccessToken) {
        throw new Error('Failed to refresh expired access token')
      }
      accessToken = refreshedAccessToken
    } else {
      console.log('Using existing valid access token')
    }

    // Fetch the accounts from Google Ads API
    const response = await fetch(
      'https://googleads.googleapis.com/v19/customers:listAccessibleCustomers',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Google Ads accounts: ${response.statusText}`,
      )
    }

    const data = (await response.json()) as GoogleAdsApiResponse

    // Check if no accounts exist
    if (!data.resourceNames || data.resourceNames.length === 0) {
      return []
    }

    // Process and store account info
    const accounts = data.resourceNames.map((resourceName: string) => {
      // Extract account ID from resource name (format: customers/1234567890)
      const accountId = resourceName.split('/')[1]
      return {
        account_id: accountId,
        account_name: `Account ${accountId}`,
      } as GoogleAdsAccount
    })

    // Store accounts in database (clear existing ones first)
    if (accounts.length > 0) {
      const { error: delError } = (await supabaseAdmin.rpc(
        'delete_google_ads_accounts',
        {
          p_user_id: userId,
        },
      )) as { data: null; error: Error | null }

      if (delError) {
        throw delError
      }

      // Insert new accounts
      for (const account of accounts) {
        const { error: insError } = (await supabaseAdmin.rpc(
          'insert_google_ads_account',
          {
            p_user_id: userId,
            p_account_id: account.account_id,
            p_account_name: account.account_name ?? null,
          },
        )) as { data: null; error: Error | null }

        if (insError) {
          throw insError
        }
      }
    }

    return accounts
  } catch (error) {
    console.error('Failed to fetch Google Ads accounts:', error)
    throw error
  }
}

/**
 * Check if a user has Google Ads integration
 */
export async function hasGoogleAdsIntegration(userId: string) {
  try {
    const tokens = await getGoogleAdsTokens(userId)
    return !!tokens
  } catch (error) {
    console.error('Error checking Google Ads integration:', error)
    return false
  }
}
