import { useState, useEffect, useCallback } from 'react'
import { useGoogleAds } from './useGoogleAds'

interface CampaignStats {
  activeCampaigns: number
  averageRoas: number
  totalSpend: number
  totalConversions: number
}

interface Campaign {
  status?: string
  campaignStatus?: string
  cost?: string | number
  costMicros?: string | number
  conversions?: string | number
  conversionValue?: string | number
  conversionValueMicros?: string | number
}

interface CampaignResult {
  campaigns?: Campaign[]
  accountId: string
  accountName: string
}

export function useCampaignStats(timeRange = '180days') {
  const { tokens, accounts, isConnected, refreshTokens } = useGoogleAds()
  const [data, setData] = useState<CampaignStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCampaignStats = useCallback(async () => {
    // 1) Try to load cached dashboard stats first
    try {
      const cacheRes = await fetch(
        `/api/dashboard/cache?timeRange=${encodeURIComponent(timeRange)}`,
        { method: 'GET' },
      )

      if (cacheRes.ok) {
        const cacheJson = (await cacheRes.json()) as {
          activeCampaigns: number
          averageRoas: number
        }

        setData({
          activeCampaigns: cacheJson.activeCampaigns ?? 0,
          averageRoas: cacheJson.averageRoas ?? 0,
          totalSpend: 0,
          totalConversions: 0,
        })
        setIsLoading(false)
        return
      }
    } catch (cacheErr) {
      console.warn('Failed to fetch dashboard cache, will compute:', cacheErr)
    }

    // Don't fetch if not connected to Google Ads
    if (!isConnected || !tokens?.accessToken || !accounts.length) {
      setData({
        activeCampaigns: 0,
        averageRoas: 0,
        totalSpend: 0,
        totalConversions: 0,
      })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let totalCampaigns = 0
      let totalSpend = 0
      let totalConversions = 0
      let totalRevenue = 0

      // Process accounts in batches to avoid overwhelming the API
      const batchSize = 3
      for (let i = 0; i < accounts.length; i += batchSize) {
        const batch = accounts.slice(i, i + batchSize)

        const batchPromises = batch.map(async (account) => {
          try {
            const response = await fetch(
              '/api/google-ads/campaign-structure-overview',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  accessToken: tokens.accessToken,
                  accountId: account.accountId,
                  timeRange,
                }),
              },
            )

            if (response.status === 401) {
              // Token expired, try to refresh
              console.log(
                'Google Ads API returned 401, attempting to refresh token...',
              )
              const refreshed = await refreshTokens()
              if (refreshed) {
                // Retry with new token
                const retryResponse = await fetch(
                  '/api/google-ads/campaign-structure-overview',
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      accessToken: tokens.accessToken,
                      accountId: account.accountId,
                      timeRange,
                    }),
                  },
                )

                if (retryResponse.ok) {
                  const result = (await retryResponse.json()) as {
                    campaigns?: Campaign[]
                  }
                  return {
                    campaigns: result.campaigns ?? [],
                    accountId: account.accountId,
                    accountName: account.accountName,
                  } as CampaignResult
                }
              }
              console.warn(
                `Failed to refresh token for account ${account.accountId}`,
              )
              return {
                campaigns: [],
                accountId: account.accountId,
                accountName: account.accountName,
              }
            } else if (response.ok) {
              const result = (await response.json()) as {
                campaigns?: Campaign[]
              }
              return {
                campaigns: result.campaigns ?? [],
                accountId: account.accountId,
                accountName: account.accountName,
              } as CampaignResult
            } else {
              console.warn(
                `Failed to fetch campaign stats for account ${account.accountId}: ${response.status}`,
              )
              return {
                campaigns: [],
                accountId: account.accountId,
                accountName: account.accountName,
              }
            }
          } catch (error) {
            console.warn(
              `Failed to fetch campaign stats for account ${account.accountId}:`,
              error,
            )
            return {
              campaigns: [],
              accountId: account.accountId,
              accountName: account.accountName,
            } as CampaignResult
          }
        })

        const batchResults = await Promise.all(batchPromises)

        batchResults.forEach((result: CampaignResult) => {
          if (result.campaigns && Array.isArray(result.campaigns)) {
            // Count active campaigns
            const activeCampaigns = result.campaigns.filter(
              (campaign: Campaign) =>
                campaign.status === 'ENABLED' ||
                campaign.campaignStatus === 'ENABLED',
            )
            totalCampaigns += activeCampaigns.length

            // Sum up performance metrics
            result.campaigns.forEach((campaign: Campaign) => {
              const costRaw = campaign.cost ?? campaign.costMicros ?? '0'
              const cost = parseFloat(String(costRaw)) / 1000000 // Convert from micros
              const conversionsRaw = campaign.conversions ?? '0'
              const conversions = parseFloat(String(conversionsRaw))
              const revenueRaw =
                campaign.conversionValue ??
                campaign.conversionValueMicros ??
                '0'
              const revenue = parseFloat(String(revenueRaw)) / 1000000

              totalSpend += cost
              totalConversions += conversions
              totalRevenue += revenue
            })
          }
        })

        // Small delay between batches
        if (i + batchSize < accounts.length) {
          await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), 100)
          })
        }
      }

      // Calculate average ROAS
      const averageRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0

      setData({
        activeCampaigns: totalCampaigns,
        averageRoas: Math.round(averageRoas * 10) / 10, // Round to 1 decimal
        totalSpend: Math.round(totalSpend),
        totalConversions: Math.round(totalConversions),
      })

      // 3) Persist in cache for next time
      try {
        void fetch('/api/dashboard/cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activeCampaigns: totalCampaigns,
            averageRoas: Math.round(averageRoas * 10) / 10,
            timeRange,
          }),
        })
      } catch (cacheSaveErr) {
        console.warn('Failed to save dashboard cache:', cacheSaveErr)
      }
    } catch (e) {
      console.error('Error fetching campaign stats:', e)
      setError(
        e instanceof Error ? e.message : 'Failed to fetch campaign stats',
      )
      setData({
        activeCampaigns: 0,
        averageRoas: 0,
        totalSpend: 0,
        totalConversions: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, tokens, accounts, timeRange, refreshTokens])

  useEffect(() => {
    // Add a small delay to ensure Google Ads state is fully initialized
    const timeoutId = setTimeout(() => {
      void fetchCampaignStats()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [fetchCampaignStats])

  return {
    data,
    isLoading,
    error,
    refetch: fetchCampaignStats,
  }
}
