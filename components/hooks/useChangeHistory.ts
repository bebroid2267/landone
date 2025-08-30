import { useState, useEffect, useCallback } from 'react'
import { useGoogleAds } from './useGoogleAds'

interface ChangeHistoryItem {
  changeDateTime: string
  userEmail: string
  changeType: string
  itemChanged: string
  campaignChanged: string
  adGroupChanged: string
  oldValue: string
  newValue: string
  accountId?: string
  accountName?: string
}

interface ChangeHistorySummary {
  change_history: {
    comment: string
    headers: string[]
    rows: (string | number)[][]
  }
  summary: {
    totalChanges: number
    dateRange: string
    mostActiveUser: string
    mostChangedCampaign: string
  }
}

// Legacy interface for backward compatibility
interface LegacyChangeHistorySummary {
  changes: ChangeHistoryItem[]
}

// Helper function to convert new format to legacy format
function convertToLegacyFormat(newData: ChangeHistorySummary, accountId: string, accountName: string): ChangeHistoryItem[] {
  const headers = newData.change_history.headers
  const rows = newData.change_history.rows
  
  // Map headers to expected indices
  const dateTimeIndex = headers.indexOf('Change Date')
  const userIndex = headers.indexOf('User Email')
  const changeTypeIndex = headers.indexOf('Change Type')
  const itemIndex = headers.indexOf('Item Changed')
  const campaignIndex = headers.indexOf('Campaign')
  const adGroupIndex = headers.indexOf('Ad Group')
  const oldValueIndex = headers.indexOf('Old Value')
  const newValueIndex = headers.indexOf('New Value')
  
  return rows.map(row => ({
    changeDateTime: String(row[dateTimeIndex] || ''),
    userEmail: String(row[userIndex] || ''),
    changeType: String(row[changeTypeIndex] || ''),
    itemChanged: String(row[itemIndex] || ''),
    campaignChanged: String(row[campaignIndex] || ''),
    adGroupChanged: String(row[adGroupIndex] || ''),
    oldValue: String(row[oldValueIndex] || ''),
    newValue: String(row[newValueIndex] || ''),
    accountId,
    accountName
  }))
}

export function useChangeHistory(timeRange = 'LAST_14_DAYS') {
  const { tokens, accounts, isConnected, refreshTokens } = useGoogleAds()
  const [data, setData] = useState<LegacyChangeHistorySummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAllAccountsChangeHistory = useCallback(async () => {
    // Don't fetch if not connected to Google Ads
    if (!isConnected || !tokens?.accessToken || !accounts.length) {
      setData({ changes: [] })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch change history for all accounts
      const allChanges: ChangeHistoryItem[] = []

      // Process accounts in batches to avoid overwhelming the API
      const batchSize = 3
      for (let i = 0; i < accounts.length; i += batchSize) {
        const batch = accounts.slice(i, i + batchSize)

        const batchPromises = batch.map(async (account) => {
          try {
            const response = await fetch(
              '/api/google-ads/change-history-summary',
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
                  '/api/google-ads/change-history-summary',
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
                  const result = (await retryResponse.json()) as ChangeHistorySummary
                  return convertToLegacyFormat(result, account.accountId, account.accountName)
                }
              }
              console.warn(
                `Failed to refresh token for account ${account.accountId}`,
              )
              return []
            } else if (response.ok) {
              const result = (await response.json()) as ChangeHistorySummary
              return convertToLegacyFormat(result, account.accountId, account.accountName)
            } else {
              console.warn(
                `Failed to fetch changes for account ${account.accountId}: ${response.status}`,
              )
              return []
            }
          } catch (error) {
            console.warn(
              `Failed to fetch changes for account ${account.accountId}:`,
              error,
            )
            return []
          }
        })

        const batchResults = await Promise.all(batchPromises)
        batchResults.forEach((changes: ChangeHistoryItem[]) => {
          allChanges.push(...changes)
        })

        // Small delay between batches
        if (i + batchSize < accounts.length) {
          await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), 100)
          })
        }
      }

      // Sort changes by date (newest first)
      allChanges.sort(
        (a, b) =>
          new Date(b.changeDateTime).getTime() -
          new Date(a.changeDateTime).getTime(),
      )

      setData({ changes: allChanges })
    } catch (e) {
      console.error('Error fetching change history:', e)
      setError(
        e instanceof Error ? e.message : 'Failed to fetch change history',
      )
      setData({ changes: [] })
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, tokens, accounts, timeRange, refreshTokens])

  useEffect(() => {
    // Add a small delay to ensure Google Ads state is fully initialized
    const timeoutId = setTimeout(() => {
      void fetchAllAccountsChangeHistory()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [fetchAllAccountsChangeHistory])

  return {
    data,
    isLoading,
    error,
    refetch: fetchAllAccountsChangeHistory,
  }
}
