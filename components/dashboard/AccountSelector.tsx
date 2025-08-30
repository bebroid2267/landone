'use client'

import { useEffect } from 'react'
import { useGoogleAds } from '@/components/hooks/useGoogleAds'
import { useUser } from '@/components/hooks/useUser'
import Select from '@/components/ui/form/Select'

export default function AccountSelector() {
  const { accounts, selectedAccountId, setSelectedAccount, isLoading, loadAccountsActivity } =
    useGoogleAds()
  const { user } = useUser()
  
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
  
  // Load activity data when component mounts or accounts change
  useEffect(() => {
    if (accounts.length > 0 && user?.id) {
      // Check if we already have activity data or try to get from cache
      const hasActivityData = accounts.some(account => account.activity)
      const cachedData = getCachedActivityData(user.id)
      
      if (!hasActivityData && !cachedData) {
        console.log('Loading activity data for AccountSelector')
        loadAccountsActivity()
      } else if (cachedData && !hasActivityData) {
        console.log('Found cached activity data for AccountSelector')
      }
    }
  }, [accounts.length, user?.id, loadAccountsActivity])

  const formatActivityInfo = (account: any) => {
    if (!account.activity) return 'Account is not active'
    
    const { cost, campaigns, domains } = account.activity
    
    // If no campaigns and domains, account is not active
    if (campaigns.length === 0 && domains.length === 0) {
      return 'Account is not active'
    }
    
    const parts = []
    
    if (cost > 0) {
      parts.push(`$${cost}`)
    }
    
    if (campaigns.length > 0) {
      parts.push(campaigns.length === 1 ? '1 campaign' : `${Math.min(campaigns.length, 3)} campaigns`)
    }
    
    if (domains.length > 0) {
      const domainsText = domains.slice(0, 2).join(', ')
      if (domains.length > 2) {
        parts.push(`${domainsText}, +${domains.length - 2} more`)
      } else {
        parts.push(domainsText)
      }
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'Account is not active'
  }

  const accountOptions = accounts.map((account) => ({
    value: account.accountId,
    label: `${account.accountName} (${account.accountId})`,
    subtitle: formatActivityInfo(account)
  }))

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 mb-8">
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xl font-bold text-black mb-2">
            Google Ads Account
          </label>
          <Select
            options={accountOptions}
            value={selectedAccountId ?? ''}
            onChange={setSelectedAccount}
            placeholder="Select account..."
            disabled={isLoading}
            size="lg"
            className="w-full"
          />
          <p className="mt-2 text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>
    </div>
  )
}
