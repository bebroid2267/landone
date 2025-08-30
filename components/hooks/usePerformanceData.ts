import { useState, useEffect, useCallback } from 'react'
import { useGoogleAds } from './useGoogleAds'

interface DailyPerformance {
  date: string
  cost: number
  conversions: number
  roas: number
  clicks: number
  impressions: number
  conversionValue: number // Add this for proper ROAS calculation
}

interface GoogleAdsMetric {
  date?: string
  segments?: { date?: string }
  cost?: string | number
  costMicros?: string | number
  conversions?: string | number
  conversionValue?: string | number
  conversionValueMicros?: string | number
  clicks?: string | number
  impressions?: string | number
}

export function usePerformanceData(timeRange: string) {
  const { tokens, accounts, isConnected, refreshTokens } = useGoogleAds()
  const [data, setData] = useState<DailyPerformance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Convert timeRange to Google Ads API format
  const getApiTimeRange = (range: string): string => {
    switch (range) {
      case '7d':
        return 'LAST_7_DAYS'
      case '30d':
        return '180days'
      case '90d':
        return 'LAST_90_DAYS'
      case '180d':
        return 'LAST_QUARTER'
      default:
        return 'LAST_QUARTER'
    }
  }

  const fetchPerformanceData = useCallback(async () => {
    // Don't fetch if not connected to Google Ads
    if (!isConnected || !tokens?.accessToken || !accounts.length) {
      setData([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const apiTimeRange = getApiTimeRange(timeRange)
      const allDailyData: Record<string, DailyPerformance> = {}

      // Process accounts in batches to avoid overwhelming the API
      const batchSize = 3
      for (let i = 0; i < accounts.length; i += batchSize) {
        const batch = accounts.slice(i, i + batchSize)

        const batchPromises = batch.map(async (account) => {
          try {
            const response = await fetch('/api/google-ads/daily-trends', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                accessToken: tokens.accessToken,
                accountId: account.accountId,
                timeRange: apiTimeRange,
              }),
            })

            if (response.status === 401) {
              // Token expired, try to refresh
              console.log(
                'Google Ads API returned 401, attempting to refresh token...',
              )
              const refreshed = await refreshTokens()
              if (refreshed) {
                // Wait a bit for tokens to be updated in state
                await new Promise((resolve) => setTimeout(resolve, 100))

                // Retry with potentially updated token
                const retryResponse = await fetch(
                  '/api/google-ads/daily-trends',
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      accessToken: tokens.accessToken,
                      accountId: account.accountId,
                      timeRange: apiTimeRange,
                    }),
                  },
                )

                if (retryResponse.ok) {
                  const result = (await retryResponse.json()) as {
                    dailyMetrics?: GoogleAdsMetric[]
                  }
                  return result.dailyMetrics ?? []
                }
              }
              console.warn(
                `Failed to refresh token for account ${account.accountId}`,
              )
              return []
            } else if (response.ok) {
              const result = (await response.json()) as {
                dailyMetrics?: GoogleAdsMetric[]
              }
              return result.dailyMetrics ?? []
            } else {
              console.warn(
                `Failed to fetch performance data for account ${account.accountId}: ${response.status}`,
              )
              return []
            }
          } catch (error) {
            console.warn(
              `Failed to fetch performance data for account ${account.accountId}:`,
              error,
            )
            return []
          }
        })

        const batchResults = await Promise.all(batchPromises)

        // Aggregate data by date across all accounts
        batchResults.forEach((accountData: GoogleAdsMetric[]) => {
          if (Array.isArray(accountData)) {
            accountData.forEach((dayData: GoogleAdsMetric) => {
              const dateValue = dayData.date ?? dayData.segments?.date ?? ''
              const date = String(dateValue)
              if (!date) {
                return
              }

              const costRaw = dayData.cost ?? dayData.costMicros ?? '0'
              const cost = parseFloat(String(costRaw)) / 1000000
              const conversionsRaw = dayData.conversions ?? '0'
              const conversions = parseFloat(String(conversionsRaw))
              const conversionValueRaw =
                dayData.conversionValue ?? dayData.conversionValueMicros ?? '0'
              const conversionValue =
                parseFloat(String(conversionValueRaw)) / 1000000
              const clicksRaw = dayData.clicks ?? '0'
              const clicks = parseInt(String(clicksRaw))
              const impressionsRaw = dayData.impressions ?? '0'
              const impressions = parseInt(String(impressionsRaw))

              if (!allDailyData[date]) {
                allDailyData[date] = {
                  date: date, // Keep original date for sorting
                  cost: 0,
                  conversions: 0,
                  conversionValue: 0,
                  roas: 0,
                  clicks: 0,
                  impressions: 0,
                }
              }

              // Aggregate raw values
              allDailyData[date].cost += cost
              allDailyData[date].conversions += conversions
              allDailyData[date].conversionValue += conversionValue
              allDailyData[date].clicks += clicks
              allDailyData[date].impressions += impressions
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

      // Calculate ROAS for each day after aggregation and format for charts
      const sortedData = Object.values(allDailyData)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((day) => ({
          ...day,
          date: formatDateForChart(day.date), // Format for display
          cost: Math.round(day.cost),
          conversions: Math.round(day.conversions * 10) / 10,
          roas:
            day.cost > 0
              ? Math.round((day.conversionValue / day.cost) * 10) / 10
              : 0,
        }))

      setData(sortedData)
    } catch (e) {
      console.error('Error fetching performance data:', e)
      setError(
        e instanceof Error ? e.message : 'Failed to fetch performance data',
      )
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, tokens, accounts, timeRange, refreshTokens])

  // Format date for chart display
  const formatDateForChart = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  useEffect(() => {
    // Add a small delay to ensure Google Ads state is fully initialized
    const timeoutId = setTimeout(() => {
      void fetchPerformanceData()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [fetchPerformanceData])

  return {
    data,
    isLoading,
    error,
    refetch: fetchPerformanceData,
  }
}
