'use client'

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  useContext,
  PropsWithChildren,
  useMemo,
} from 'react'
import { useUser } from './useUser'
import { createClient } from '@/utils/supabase/client'

interface GoogleAdsAccountActivity {
  cost: number
  clicks: number
  campaigns: string[]
  domains: string[]
}

interface GoogleAdsAccount {
  accountId: string
  accountName: string
  currencyCode?: string
  timeZone?: string
  activity?: GoogleAdsAccountActivity
}

interface GoogleAdsToken {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

interface GoogleAdsContextType {
  isConnected: boolean
  isLoading: boolean
  accounts: GoogleAdsAccount[]
  selectedAccountId: string | null
  tokens: GoogleAdsToken | null
  error: string | null
  connectGoogleAds: () => Promise<void>
  disconnectGoogleAds: () => Promise<void>
  refreshAccounts: () => Promise<void>
  setSelectedAccount: (accountId: string) => void
  refreshTokens: () => Promise<boolean>
  loadAccountsActivity: () => Promise<void>
}

const GoogleAdsContext = createContext<GoogleAdsContextType | null>(null)

export const GoogleAdsProvider = ({ children }: PropsWithChildren) => {
  const { user } = useUser()
  const supabase = useMemo(() => createClient(), [])
  const checkIntegrationRef = useRef<() => Promise<void>>()
  const refreshTokensRef = useRef<() => Promise<boolean>>()

  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [accounts, setAccounts] = useState<GoogleAdsAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  )
  const [tokens, setTokens] = useState<GoogleAdsToken | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Storage keys
  const getTokenStorageKey = () =>
    `google_ads_tokens_${user?.id ?? 'anonymous'}`
  const getSelectedAccountStorageKey = () =>
    `google_ads_selected_account_${user?.id ?? 'anonymous'}`

  // Check for existing Google Ads integration
  const checkIntegration = useCallback(async () => {
    const callId = Math.random().toString(36).substr(2, 9)
    console.log(
      `[GoogleAds] 🚀 checkIntegration called [${callId}], user:`,
      !!user,
    )
    console.log(`[GoogleAds] 📊 Current state at start [${callId}]:`, {
      isConnected,
      isLoading,
      hasTokens: !!tokens,
      tokensPreview: tokens?.accessToken?.substring(0, 20) + '...',
    })

    if (!user) {
      console.log(
        `[GoogleAds] ❌ No user, skipping integration check [${callId}]`,
      )
      setIsLoading(false)
      return
    }

    try {
      console.log(
        `[GoogleAds] ✅ Starting integration check for user: ${user.id} [${callId}]`,
      )
      setError(null)
      setIsLoading(true)

      // Check if we have tokens in database
      const { data: dbTokens, error: dbError } = await supabase
        .from('google_ads_tokens')
        .select('access_token, refresh_token, expires_at')
        .eq('user_id', user.id)
        .single()

      console.log('[GoogleAds] Database query result:', {
        dbTokens: !!dbTokens,
        dbError,
      })

      if (dbError && dbError.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw dbError
      }

      if (dbTokens) {
        console.log('[GoogleAds] Found tokens in database, processing...')
        const tokenData: GoogleAdsToken = {
          accessToken: dbTokens.access_token,
          refreshToken: dbTokens.refresh_token,
          expiresAt: new Date(dbTokens.expires_at).getTime(),
        }

        console.log('[GoogleAds] Token data:', {
          hasAccessToken: !!tokenData.accessToken,
          hasRefreshToken: !!tokenData.refreshToken,
          expiresAt: new Date(tokenData.expiresAt).toISOString(),
          isExpired: Date.now() >= tokenData.expiresAt,
        })

        // Check if token is expired or expiring soon (within 5 minutes)
        const fiveMinutes = 5 * 60 * 1000
        if (Date.now() >= tokenData.expiresAt - fiveMinutes) {
          console.log(
            'Google Ads token expired or expiring soon during initialization, refreshing...',
          )

          // Try to refresh the token
          const response = await fetch('/api/google-ads/refresh-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              refreshToken: tokenData.refreshToken,
            }),
          })

          if (response.ok) {
            const { accessToken, expiresIn } = (await response.json()) as {
              accessToken: string
              expiresIn: number
            }

            const refreshedTokenData: GoogleAdsToken = {
              accessToken,
              refreshToken: tokenData.refreshToken,
              expiresAt: Date.now() + expiresIn * 1000,
            }

            setTokens(refreshedTokenData)
            localStorage.setItem(
              getTokenStorageKey(),
              JSON.stringify(refreshedTokenData),
            )

            // Update in database
            await supabase
              .from('google_ads_tokens')
              .update({
                access_token: accessToken,
                expires_at: new Date(
                  refreshedTokenData.expiresAt,
                ).toISOString(),
              })
              .eq('user_id', user.id)

            console.log(
              'Google Ads token refreshed successfully during initialization',
            )
            await loadAccounts(refreshedTokenData)
          } else {
            console.error('Failed to refresh token during initialization')
            // Use existing token and let loadAccounts handle the refresh
            setTokens(tokenData)
            localStorage.setItem(
              getTokenStorageKey(),
              JSON.stringify(tokenData),
            )
            await loadAccounts(tokenData)
          }
        } else {
          console.log('[GoogleAds] Using existing valid tokens')
          setTokens(tokenData)
          localStorage.setItem(getTokenStorageKey(), JSON.stringify(tokenData))
          await loadAccounts(tokenData)
        }

        console.log('[GoogleAds] Setting connected to true')
        setIsConnected(true)
      } else {
        console.log(
          '[GoogleAds] No tokens found in database, checking cookies and localStorage',
        )
        // Check for tokens in cookies (from OAuth callback)
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`
          const parts = value.split(`; ${name}=`)
          if (parts.length === 2) {
            return parts.pop()?.split(';').shift()
          }
          return null
        }

        const cookieTokens = getCookie('google_ads_tokens')
        if (cookieTokens) {
          try {
            const tokenData = JSON.parse(cookieTokens) as GoogleAdsToken
            setTokens(tokenData)
            setIsConnected(true)

            // Store in localStorage for future access
            localStorage.setItem(
              getTokenStorageKey(),
              JSON.stringify(tokenData),
            )

            // Clear the cookie since we've processed it
            document.cookie =
              'google_ads_tokens=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

            // Load accounts with the tokens from cookie
            await loadAccounts(tokenData)
            return
          } catch (e) {
            console.error('Error parsing tokens from cookie:', e)
            // Clear invalid cookie
            document.cookie =
              'google_ads_tokens=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          }
        }

        // Check localStorage for temporary tokens (fallback)
        const localTokens = localStorage.getItem(getTokenStorageKey())
        if (localTokens) {
          try {
            const tokenData = JSON.parse(localTokens) as GoogleAdsToken
            setTokens(tokenData)
            setIsConnected(true)
            await loadAccounts(tokenData)
          } catch (e) {
            localStorage.removeItem(getTokenStorageKey())
          }
        }
      }
    } catch (err) {
      console.error(
        `[GoogleAds] ❌ Error checking Google Ads integration [${callId}]:`,
        err,
      )
      setError(
        err instanceof Error ? err.message : 'Failed to check integration',
      )
      setIsConnected(false)
    } finally {
      console.log(
        `[GoogleAds] 🏁 checkIntegration finished [${callId}], final state:`,
        {
          isConnected,
          hasTokens: !!tokens,
          isLoading: false,
        },
      )
      setIsLoading(false)
    }
  }, [user])

  // Load Google Ads accounts
  const loadAccounts = async (tokenData: GoogleAdsToken) => {
    try {
      // Check if token is expired
      if (Date.now() >= tokenData.expiresAt) {
        const refreshed = refreshTokensRef.current
          ? await refreshTokensRef.current()
          : false
        if (!refreshed) {
          /*
           * If refreshing the token failed (e.g.
           * the refresh token was revoked or expired),
           * gracefully disconnect the integration and prompt the user to
           * reconnect instead of surfacing an internal error message in the
           * UI.
           */

          console.log(
            'Google Ads refresh token is invalid or expired, disconnecting integration',
          )

          // Clean up local state
          setIsConnected(false)
          setTokens(null)
          setAccounts([])
          setSelectedAccountId(null)

          // Remove any persisted data
          localStorage.removeItem(getTokenStorageKey())
          localStorage.removeItem(getSelectedAccountStorageKey())

          // Clean up database
          if (user) {
            try {
              await supabase
                .from('google_ads_tokens')
                .delete()
                .eq('user_id', user.id)
              await supabase
                .from('google_ads_accounts')
                .delete()
                .eq('user_id', user.id)
            } catch (cleanupError) {
              console.error(
                'Error cleaning up expired tokens from database:',
                cleanupError,
              )
            }
          }

          /*
           * Inform the user that they need to reconnect their Google Ads
           * account with a more detailed message
           */
          setError(
            'Your Google Ads authorization has expired or been revoked. Please reconnect your Google Ads account to continue accessing your data.',
          )

          return // Stop further processing
        }
        return // refreshTokens will call loadAccounts again
      }

      const response = await fetch('/api/google-ads/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 401) {
        // Check if this is a session expiry issue
        const errorText = await response.text()
        if (
          errorText.includes('session') ||
          errorText.includes('expired') ||
          errorText.includes('unauthorized')
        ) {
          // Session expired, try to refresh Supabase session
          console.log(
            'Google Ads accounts request failed due to expired session, attempting to refresh Supabase session',
          )

          const { refreshSessionIfNeeded } = await import(
            '@/utils/supabase/session-refresh'
          )
          const sessionRefreshed = await refreshSessionIfNeeded()

          if (sessionRefreshed) {
            // Retry the accounts request after session refresh
            const retryResponse = await fetch('/api/google-ads/accounts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            })

            if (retryResponse.ok) {
              const accountsData =
                (await retryResponse.json()) as GoogleAdsAccount[]
              setAccounts(accountsData)

              // Restore selected account from localStorage or auto-select first account
              const savedAccountId = localStorage.getItem(getSelectedAccountStorageKey())
              if (savedAccountId && accountsData.some(acc => acc.accountId === savedAccountId)) {
                // Restore saved account if it exists in the current accounts list
                setSelectedAccountId(savedAccountId)
              } else if (accountsData.length > 0) {
                // Auto-select first account if no valid saved account
                const firstAccountId = accountsData[0].accountId
                setSelectedAccountId(firstAccountId)
                localStorage.setItem(
                  getSelectedAccountStorageKey(),
                  firstAccountId,
                )
              }
              return
            } else if (retryResponse.status === 401) {
              // Still 401 after session refresh - no Google Ads accounts
              setAccounts([])
              setIsConnected(false)
              setError(
                'No Google Ads accounts were found for this Google user. Please try another account that has access to Google Ads.',
              )
              return
            }
          } else {
            // Session refresh failed
            setError('Session has expired. Please log in again.')
            return
          }
        } else {
          // No accessible Google Ads accounts for this user
          setAccounts([])
          setIsConnected(false)
          setError(
            'No Google Ads accounts were found for this Google user. Please try another account that has access to Google Ads.',
          )
          return
        }
      }

      if (!response.ok) {
        throw new Error(`Failed to load accounts: ${response.statusText}`)
      }

      const accountsData = (await response.json()) as GoogleAdsAccount[]
      setAccounts(accountsData)

      // Restore selected account from localStorage or auto-select first account
      const savedAccountId = localStorage.getItem(getSelectedAccountStorageKey())
      if (savedAccountId && accountsData.some(acc => acc.accountId === savedAccountId)) {
        // Restore saved account if it exists in the current accounts list
        setSelectedAccountId(savedAccountId)
      } else if (accountsData.length > 0) {
        // Auto-select first account if no valid saved account
        const firstAccountId = accountsData[0].accountId
        setSelectedAccountId(firstAccountId)
        localStorage.setItem(getSelectedAccountStorageKey(), firstAccountId)
      }
    } catch (err) {
      console.error('Error loading accounts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load accounts')
    }
  }

  // Refresh tokens
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    if (!tokens || !user) {
      return false
    }

    try {
      const response = await fetch('/api/google-ads/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: tokens.refreshToken,
        }),
      })

      if (response.status === 401) {
        // Session expired, try to refresh Supabase session
        console.log(
          'Google Ads refresh failed due to expired session, attempting to refresh Supabase session',
        )

        // Import handleAuth dynamically to avoid circular dependency
        const { refreshSessionIfNeeded } = await import(
          '@/utils/supabase/session-refresh'
        )
        const sessionRefreshed = await refreshSessionIfNeeded()

        if (sessionRefreshed) {
          // Retry the Google Ads token refresh after session refresh
          const retryResponse = await fetch('/api/google-ads/refresh-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              refreshToken: tokens.refreshToken,
            }),
          })

          if (!retryResponse.ok) {
            throw new Error('Failed to refresh token after session refresh')
          }

          const { accessToken, expiresIn } = (await retryResponse.json()) as {
            accessToken: string
            expiresIn: number
          }
          const newTokens: GoogleAdsToken = {
            accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: Date.now() + expiresIn * 1000,
          }

          setTokens(newTokens)
          localStorage.setItem(getTokenStorageKey(), JSON.stringify(newTokens))

          // Update in database
          await supabase
            .from('google_ads_tokens')
            .update({
              access_token: accessToken,
              expires_at: new Date(newTokens.expiresAt).toISOString(),
            })
            .eq('user_id', user.id)

          // Reload accounts with new token
          await loadAccounts(newTokens)

          return true
        } else {
          // Session refresh failed, user needs to log in again
          setError('Session has expired. Please log in again.')
          return false
        }
      }

      if (!response.ok) {
        throw new Error('Failed to refresh token')
      }

      const { accessToken, expiresIn } = (await response.json()) as {
        accessToken: string
        expiresIn: number
      }
      const newTokens: GoogleAdsToken = {
        accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: Date.now() + expiresIn * 1000,
      }

      setTokens(newTokens)
      localStorage.setItem(getTokenStorageKey(), JSON.stringify(newTokens))

      // Update in database
      await supabase
        .from('google_ads_tokens')
        .update({
          access_token: accessToken,
          expires_at: new Date(newTokens.expiresAt).toISOString(),
        })
        .eq('user_id', user.id)

      // Reload accounts with new token
      await loadAccounts(newTokens)

      return true
    } catch (err) {
      console.error('Error refreshing tokens:', err)
      setError('Failed to refresh authentication')
      return false
    }
  }, [tokens, user])

  // Connect Google Ads
  const connectGoogleAds = async () => {
    const baseUrl = window.location.origin
    const redirectUri = `${baseUrl}/api/google-ads/callback`

    const sessionId = user?.id ?? 'anonymous'
    const state = JSON.stringify({
      userId: sessionId,
      returnTo: window.location.pathname,
    })

    const queryParams = new URLSearchParams({
      scope: 'email profile https://www.googleapis.com/auth/adwords openid',
      redirect_uri: redirectUri,
      state,
    })

    window.location.href = `/api/oauth/google?${queryParams.toString()}`
  }

  // Disconnect Google Ads
  const disconnectGoogleAds = async () => {
    if (!user) {
      return
    }

    try {
      // Remove from database
      await supabase.from('google_ads_tokens').delete().eq('user_id', user.id)

      await supabase.from('google_ads_accounts').delete().eq('user_id', user.id)

      // Clear local state
      setIsConnected(false)
      setTokens(null)
      setAccounts([])
      setSelectedAccountId(null)
      setError(null)

      // Clear localStorage
      localStorage.removeItem(getTokenStorageKey())
      localStorage.removeItem(getSelectedAccountStorageKey())
    } catch (err) {
      console.error('Error disconnecting Google Ads:', err)
      setError('Failed to disconnect Google Ads')
    }
  }

  // Refresh accounts
  const refreshAccounts = async () => {
    if (!tokens) {
      return
    }
    await loadAccounts(tokens)
  }

  // Cache management functions
  const getCacheKey = (userId: string) => `google_ads_activity_${userId}`
  const CACHE_EXPIRY_TIME = 5 * 60 * 1000 // 5 minutes

  const getCachedActivityData = (userId: string) => {
    try {
      const cached = localStorage.getItem(getCacheKey(userId))
      if (cached) {
        const parsedCache = JSON.parse(cached)
        const now = Date.now()
        if (parsedCache.timestamp && (now - parsedCache.timestamp < CACHE_EXPIRY_TIME)) {
          return parsedCache.data
        }
      }
    } catch (error) {
      console.error('Error reading cached activity data:', error)
    }
    return null
  }

  const setCachedActivityData = (userId: string, data: any) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      }
      localStorage.setItem(getCacheKey(userId), JSON.stringify(cacheData))
    } catch (error) {
      console.error('Error saving activity data to cache:', error)
    }
  }

  // Load accounts activity data
  const loadAccountsActivity = async () => {
    console.log('🔵 [useGoogleAds] loadAccountsActivity called')
    if (!tokens?.accessToken || !accounts.length || !user?.id) {
      console.log('🔵 [useGoogleAds] No tokens, accounts, or user available for loading activity data')
      return
    }

    try {
      // First, try to load from cache
      const cachedData = getCachedActivityData(user.id)
      if (cachedData) {
        console.log('Loading accounts activity data from cache')
        setAccounts(prevAccounts => 
          prevAccounts.map(account => {
            const activityInfo = cachedData[account.accountId]
            if (activityInfo?.account_activity_last_30d) {
              return {
                ...account,
                activity: {
                  cost: activityInfo.account_activity_last_30d.cost || 0,
                  clicks: activityInfo.account_activity_last_30d.clicks || 0,
                  campaigns: activityInfo.account_activity_last_30d.campaigns || [],
                  domains: activityInfo.account_activity_last_30d.domains || []
                }
              }
            }
            return account
          })
        )
      }

      // Always fetch fresh data in background
      console.log('Fetching fresh accounts activity data...')
      const response = await fetch('/api/google-ads/account-activity-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error('Failed to load accounts activity:', response.statusText)
        return
      }

      const activityData = await response.json()
      console.log('Fresh activity data received:', activityData)

      // Cache the fresh data
      setCachedActivityData(user.id, activityData)

      // Update accounts with fresh activity data
      console.log('🔵 [useGoogleAds] Updating accounts with fresh activity data')
      setAccounts(prevAccounts => {
        const updatedAccounts = prevAccounts.map(account => {
          const activityInfo = activityData[account.accountId]
          if (activityInfo?.account_activity_last_30d) {
            console.log(`🔵 [useGoogleAds] Adding activity to account ${account.accountId}:`, {
              campaigns: activityInfo.account_activity_last_30d.campaigns?.length || 0,
              domains: activityInfo.account_activity_last_30d.domains?.length || 0,
              cost: activityInfo.account_activity_last_30d.cost || 0
            })
            return {
              ...account,
              activity: {
                cost: activityInfo.account_activity_last_30d.cost || 0,
                clicks: activityInfo.account_activity_last_30d.clicks || 0,
                campaigns: activityInfo.account_activity_last_30d.campaigns || [],
                domains: activityInfo.account_activity_last_30d.domains || []
              }
            }
          }
          console.log(`🔵 [useGoogleAds] No activity data for account ${account.accountId}`)
          return account
        })
        console.log('🔵 [useGoogleAds] Final accounts update:', updatedAccounts.map(acc => ({
          id: acc.accountId,
          hasActivity: !!acc.activity,
          campaigns: acc.activity?.campaigns?.length || 0,
          domains: acc.activity?.domains?.length || 0
        })))
        return updatedAccounts
      })
    } catch (error) {
      console.error('Error loading accounts activity:', error)
    }
  }

  // Set selected account
  const setSelectedAccount = (accountId: string) => {
    // Prevent setting empty account ID
    if (!accountId && accounts.length > 0) {
      // Auto-select first account if trying to set empty
      const firstAccountId = accounts[0].accountId
      setSelectedAccountId(firstAccountId)
      localStorage.setItem(getSelectedAccountStorageKey(), firstAccountId)
      return
    }
    setSelectedAccountId(accountId)
    localStorage.setItem(getSelectedAccountStorageKey(), accountId)
  }

  // Update refs with current functions
  checkIntegrationRef.current = checkIntegration
  refreshTokensRef.current = refreshTokens

  // Initialize on user change
  useEffect(() => {
    console.log(
      '[GoogleAds] useEffect triggered, user:',
      !!user,
      'user.id:',
      user?.id,
    )
    console.log('[GoogleAds] Current state before checkIntegration:', {
      isConnected,
      isLoading,
      hasTokens: !!tokens,
      tokensPreview: tokens?.accessToken?.substring(0, 20) + '...',
    })
    if (checkIntegrationRef.current) {
      void checkIntegrationRef.current()
    }
  }, [user?.id])

  // Proactive Google Ads token checking
  useEffect(() => {
    if (!tokens || !user) {
      return
    }

    const checkGoogleAdsTokens = async () => {
      try {
        // Check if token expires in the next 5 minutes
        const fiveMinutes = 5 * 60 * 1000
        if (Date.now() >= tokens.expiresAt - fiveMinutes) {
          console.log('Google Ads token expiring soon, refreshing...')
          if (refreshTokensRef.current) {
            const refreshed = await refreshTokensRef.current()
            if (!refreshed) {
              console.log('Failed to refresh Google Ads token')
            }
          }
        }
      } catch (error) {
        console.error('Error in proactive token check:', error)
      }
    }

    // Initial check
    void checkGoogleAdsTokens()

    // Set up periodic checks every 10 minutes
    const tokenCheckInterval = setInterval(
      () => {
        void checkGoogleAdsTokens()
      },
      10 * 60 * 1000,
    )

    return () => clearInterval(tokenCheckInterval)
  }, [tokens, user?.id])

  // Handle URL parameters for successful OAuth flow
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const googleAdsConnected = urlParams.get('google_ads_connected') === 'true'
    const hasCode = urlParams.get('code')

    if (googleAdsConnected || hasCode) {
      // Remove the parameters from URL
      if (googleAdsConnected) {
        urlParams.delete('google_ads_connected')
      }
      if (hasCode) {
        urlParams.delete('code')
      }

      const newUrl = `${window.location.pathname}${
        urlParams.toString() ? '?' + urlParams.toString() : ''
      }`
      window.history.replaceState({}, '', newUrl)

      // Trigger modal opening with custom event
      if (googleAdsConnected) {
        setTimeout(() => {
          console.log('Dispatching openGoogleAdsModal event')
          window.dispatchEvent(new CustomEvent('openGoogleAdsModal'))
        }, 1000) // Delay to ensure components are ready
      }

      // Refresh integration status after a short delay
      const timeoutId = setTimeout(() => {
        if (checkIntegrationRef.current) {
          void checkIntegrationRef.current()
        }
      }, 1500) // Increased delay to ensure tokens are saved

      return () => clearTimeout(timeoutId)
    }
  }, [])

  const value: GoogleAdsContextType = {
    isConnected,
    isLoading,
    accounts,
    selectedAccountId,
    tokens,
    error,
    connectGoogleAds,
    disconnectGoogleAds,
    refreshAccounts,
    setSelectedAccount,
    refreshTokens,
    loadAccountsActivity,
  }

  return (
    <GoogleAdsContext.Provider value={value}>
      {children}
    </GoogleAdsContext.Provider>
  )
}

export const useGoogleAds = () => {
  const context = useContext(GoogleAdsContext)
  if (!context) {
    throw new Error('useGoogleAds must be used within a GoogleAdsProvider')
  }
  return context
}
