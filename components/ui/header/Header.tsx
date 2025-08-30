'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Logo from '../Logo'
import { useUser } from '@/components/hooks/useUser'
import { useGoogleAds } from '@/components/hooks/useGoogleAds'
import { createClient } from '@/utils/supabase/client'
import { Modal } from '@/components/hooks/UI/Modal'
import IntegratedGoogleAds from '@/components/google-ads/IntegratedGoogleAds'
import { NoGoogleAdsAccountsModal } from '@/components/ui/NoGoogleAdsAccountsModal'
import { signInWithGoogleAds } from '@/utils/oauth-helpers/google-oauth'

// Public navigation links for non-authenticated users
export const publicLinks = [
  {
    name: 'How It Works',
    url: '/faq#how-it-works',
  },
  {
    name: 'Benefits',
    url: '/benefits',
  },
  {
    name: 'FAQ',
    url: '/faq',
  },
  {
    name: 'Contact',
    url: '/contact',
  },
]

interface AccountWithActivity {
  accountId: string
  accountName: string
  activity?: {
    campaigns: string[]
    domains: string[]
  }
}

const GoogleAdsAccountSelector = ({
  onAccountChange,
  isWaveAnimating,
}: {
  onAccountChange?: () => void
  isWaveAnimating?: boolean
}) => {
  const {
    accounts,
    selectedAccountId,
    setSelectedAccount,
    isConnected,
    isLoading,
  } = useGoogleAds()
  const { user } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [accountsWithActivity, setAccountsWithActivity] = useState<AccountWithActivity[]>([])
  const [isLoadingActivity, setIsLoadingActivity] = useState(false)

  // Cache management functions
  const getCacheKey = (userId: string) => `google_ads_activity_${userId}`
  const CACHE_EXPIRY_TIME = 5 * 60 * 1000 // 5 minutes

  const getCachedActivityData = (userId: string) => {
    try {
      const cached = localStorage.getItem(getCacheKey(userId))
      if (cached) {
        const parsedCache = JSON.parse(cached)
        const now = Date.now()
        const isExpired = (now - parsedCache.timestamp) >= CACHE_EXPIRY_TIME
        
        if (parsedCache.timestamp && !isExpired) {
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

  // Load account activity data when accounts change
  useEffect(() => {
    const loadAccountActivity = async () => {
      if (!accounts.length || !isConnected || !user?.id) return

      // First, try to load from cache
      const cachedData = getCachedActivityData(user.id)
      
      if (cachedData) {
        console.log('✅ Using cached activity data')
        const accountsWithCachedData: AccountWithActivity[] = accounts.map(account => {
          const activity = cachedData[account.accountId]?.account_activity_last_30d
          
          return {
            accountId: account.accountId,
            accountName: account.accountName,
            activity: activity ? {
              campaigns: activity.campaigns || [],
              domains: activity.domains || []
            } : undefined
          }
        })
        
        setAccountsWithActivity(accountsWithCachedData)
        
        // Fetch fresh data in background after a short delay
        setTimeout(() => {
          setIsLoadingActivity(true)
          fetchFreshData()
        }, 1000) // 1 second delay before background refresh
        
        return // Exit early, fresh data will be fetched in background
      } else {
        // If no cache, set basic account data while loading
        setAccountsWithActivity(accounts.map(account => ({
          accountId: account.accountId,
          accountName: account.accountName
        })))
      }

      // Fetch fresh data immediately if no cache
      setIsLoadingActivity(true)
      fetchFreshData()
    }

    const fetchFreshData = async () => {
      try {
        const response = await fetch('/api/google-ads/account-activity-stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        
        if (response.ok) {
          const activityData = await response.json()
          
          // Cache the fresh data
          if (user?.id) {
            setCachedActivityData(user.id, activityData)
          }
          
          const accountsWithActivityData: AccountWithActivity[] = accounts.map(account => {
            const activity = activityData[account.accountId]?.account_activity_last_30d
            
            return {
              accountId: account.accountId,
              accountName: account.accountName,
              activity: activity ? {
                campaigns: activity.campaigns || [],
                domains: activity.domains || []
              } : undefined
            }
          })
          
          setAccountsWithActivity(accountsWithActivityData)
        }
      } catch (error) {
        console.error('Error loading account activity:', error)
      } finally {
        setIsLoadingActivity(false)
      }
    }

    loadAccountActivity()
  }, [accounts, isConnected, user?.id])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.google-ads-selector')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  if (!isConnected) {
    return (
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm text-gray-500">Google Ads not connected</p>
      </div>
    )
  }

  const selectedAccount = accountsWithActivity.find(
    (acc) => acc.accountId === selectedAccountId,
  )

  const handleAccountSelect = (accountId: string) => {
    setSelectedAccount(accountId)
    setIsOpen(false)
    onAccountChange?.()
  }

  // Helper function to format activity data for display
  const formatActivityInfo = (activity?: { campaigns: string[], domains: string[] }) => {
    // If we have activity data (even empty), always use it - don't show loading
    if (activity) {
      // If no campaigns and domains, account is not active
      if (activity.campaigns.length === 0 && activity.domains.length === 0) {
        return 'Account is not active'
      }
      // Otherwise format the activity data (will be handled below)
    } else if (isLoadingActivity) {
      // Only show loading if we have NO activity data at all AND we're loading
      return 'Loading account data...'
    } else {
      // No activity data and not loading = inactive
      return 'Account is not active'
    }
    
    // If we get here, we have non-empty activity data
    if (!activity) {
      return 'Account is not active'
    }
    
    const { campaigns, domains } = activity
    const items = []
    
    // Show campaigns count
    if (campaigns.length > 0) {
      const campaignText = campaigns.length === 1 ? '1 campaign' : `${Math.min(campaigns.length, 3)} campaigns`
      items.push(campaignText)
    }
    
    // Show domains
    if (domains.length > 0) {
      if (domains.length <= 2) {
        items.push(domains.join(', '))
      } else {
        items.push(`${domains.slice(0, 2).join(', ')}, +${domains.length - 2} more`)
      }
    }
    
    return items.length > 0 ? items.join(' • ') : 'Account is not active'
  }

  return (
    <div className="google-ads-selector w-full max-w-[140px] sm:max-w-[160px] md:max-w-[180px]">
      <div className="relative">
        <button
          type="button"
          disabled={isLoading}
          className={`w-full max-w-full px-3 py-2 text-sm border rounded-md text-left flex items-center justify-between transition-all duration-200 ${
            isWaveAnimating ? 'animate-wave' : ''
          } ${
            isLoading
              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
              : isOpen
              ? 'border-black ring-2 ring-black ring-opacity-20 bg-white'
              : 'border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-20 focus:border-black bg-white'
          }`}
          onClick={() => !isLoading && setIsOpen(!isOpen)}
        >
          <div className="block max-w-full min-w-0 flex-1 overflow-hidden">
            {selectedAccount ? (
              <div className="text-gray-900 font-medium truncate text-center">
                Account {selectedAccount.accountId}
              </div>
            ) : accountsWithActivity.length > 0 ? (
              <span className="text-gray-500 text-xs">Select account</span>
            ) : (
              <span className="text-gray-500 text-xs">No accounts</span>
            )}
          </div>
          <svg
            className={`ml-2 w-4 h-4 transition-transform duration-200 flex-shrink-0 ${
              isOpen ? 'rotate-180' : ''
            } ${isLoading ? 'text-gray-300' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && !isLoading && (
          <div className="absolute z-50 mt-1 w-80 max-h-60 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg">
            {accountsWithActivity.map((account) => (
              <button
                key={account.accountId}
                type="button"
                className={`w-full text-left px-3 py-3 text-sm transition-all duration-150 first:rounded-t-md last:rounded-b-md min-h-[3rem] ${
                  account.accountId === selectedAccountId
                    ? 'bg-black text-white font-medium'
                    : 'text-gray-900 hover:bg-gray-50 focus:bg-gray-50'
                } focus:outline-none`}
                onClick={() => handleAccountSelect(account.accountId)}
              >
                <div className="overflow-hidden">
                  <div className={`font-medium truncate ${
                    account.accountId === selectedAccountId ? 'text-white' : 'text-gray-900'
                  }`}>
                    {account.accountName}
                  </div>
                  <div className={`text-xs truncate mt-1 ${
                    account.accountId === selectedAccountId ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {formatActivityInfo(account.activity)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface HeaderProps {
  onToggleSidebar?: () => void
  showSidebarToggle?: boolean
}

const Header = ({
  onToggleSidebar,
  showSidebarToggle = false,
}: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const { user, signOut } = useUser()
  const [isWaveAnimating, setIsWaveAnimating] = useState(false)
  const [showNoAccountsModal, setShowNoAccountsModal] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const { accounts, isConnected } = useGoogleAds()

  // Отслеживаем анимацию волны и сбрасываем её
  useEffect(() => {
    if (isWaveAnimating) {
      const timer = setTimeout(() => setIsWaveAnimating(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isWaveAnimating])

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Check initially
    checkIfMobile()

    // Add event listener for resize
    window.addEventListener('resize', checkIfMobile)

    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll)

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const toggleHeader = () => {
    // Only toggle if we're on mobile
    if (isMobile) {
      setIsMenuOpen(!isMenuOpen)
    }
  }

  const handleLinkClick = () => {
    // Close the menu when a link is clicked
    if (isMenuOpen) {
      toggleHeader()
    }
  }

  const handleSignOut = async () => {
    try {
      console.log('Starting logout process...')
      await signOut()
      // Wait for 1.5 seconds then redirect to the Google login flow
      setTimeout(() => {
        // Use the same flow as the "Proceed to Google" button
        if (!user) {
          // User not logged in - sign in with Google Ads integration
          try {
            void signInWithGoogleAds(`${window.location.origin}/`)
          } catch (error) {
            console.error('Auth error', error)
            // Fallback to home page if there's an error
            window.location.href = '/'
          }
        } else {
          window.location.href = '/'
        }
      }, 1500)
    } catch (error) {
      console.error('Logout error:', error)
      // Wait for 1.5 seconds then redirect to Google login flow even if there's an error
      setTimeout(() => {
        try {
          void signInWithGoogleAds(`${window.location.origin}/`)
        } catch (authError) {
          console.error('Auth error after logout failure:', authError)
          // Final fallback to home page
          window.location.href = '/'
        }
      }, 1500)
    }
  }

  const toggleAccountDropdown = () => {
    setIsAccountDropdownOpen(!isAccountDropdownOpen)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.account-dropdown')) {
        setIsAccountDropdownOpen(false)
      }
    }

    if (isAccountDropdownOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isAccountDropdownOpen])


  return (
    <>
      <style jsx>{`
        @keyframes wave {
          0% {
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(0, 0, 0, 0.15) 50%,
              transparent 100%
            );
            background-size: 200% 100%;
            background-position: -100% 0;
          }
          100% {
            background-position: 100% 0;
          }
        }
        .animate-wave {
          animation: wave 2s ease-in-out;
        }
      `}</style>
      <header
        className={`fixed top-0 left-0 right-0 z-[98] bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200 h-16 transition-all duration-300 ${
          isWaveAnimating ? 'animate-wave' : ''
        }`}
      >
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Left Section: Sidebar Toggle + Logo */}
          <div className="flex items-center space-x-3">
            {/* Mobile Sidebar Toggle */}
            {showSidebarToggle && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )}
            <Logo />
          </div>

          {/* Center Section: Google Ads Account Info */}
          <div className="flex-1 flex items-center justify-center px-2 md:px-4">
            {user && !(isConnected && accounts.length === 0) && (
              <GoogleAdsAccountSelector
                onAccountChange={() => {
                  setIsWaveAnimating(true)

                  // Автоматическое обновление отчета при смене аккаунта
                  if (pathname === '/google-ads/ai-analysis') {
                    const currentParams = new URLSearchParams(
                      searchParams.toString(),
                    )
                    const timeRange =
                      currentParams.get('timeRange') ?? '180days'
                    const campaignId = currentParams.get('campaignId')

                    /*
                     * Получаем новый accountId из localStorage с правильным
                     * ключом
                     */
                    setTimeout(() => {
                      const storageKey = `google_ads_selected_account_${
                        user?.id ?? 'anonymous'
                      }`
                      const newAccountId = localStorage.getItem(storageKey)
                      if (newAccountId) {
                        const newUrl = `/google-ads/ai-analysis?accountId=${newAccountId}&timeRange=${timeRange}${
                          campaignId ? `&campaignId=${campaignId}` : ''
                        }`
                        router.push(newUrl)
                      }
                    }, 100) // Небольшая задержка чтобы selectedAccountId успел обновиться
                  } else if (pathname === '/google-ads/weekly-analysis') {
                    const currentParams = new URLSearchParams(
                      searchParams.toString(),
                    )
                    const campaignId = currentParams.get('campaignId')

                    setTimeout(() => {
                      const storageKey = `google_ads_selected_account_${
                        user?.id ?? 'anonymous'
                      }`
                      const newAccountId = localStorage.getItem(storageKey)
                      if (newAccountId) {
                        const newUrl = `/google-ads/weekly-analysis?accountId=${newAccountId}&timeRange=LAST_7_DAYS${
                          campaignId ? `&campaignId=${campaignId}` : ''
                        }`
                        router.push(newUrl)
                      }
                    }, 100)
                  } else if (pathname === '/google-ads/analytics') {
                    const currentParams = new URLSearchParams(
                      searchParams.toString(),
                    )
                    const timeRange =
                      currentParams.get('timeRange') ?? 'LAST_7_DAYS'
                    const campaignId = currentParams.get('campaignId')
                    const reportType = currentParams.get('reportType')

                    setTimeout(() => {
                      const storageKey = `google_ads_selected_account_${
                        user?.id ?? 'anonymous'
                      }`
                      const newAccountId = localStorage.getItem(storageKey)
                      if (newAccountId) {
                        const newUrl = `/google-ads/analytics?accountId=${newAccountId}&timeRange=${timeRange}${
                          campaignId ? `&campaignId=${campaignId}` : ''
                        }${reportType ? `&reportType=${reportType}` : ''}`
                        router.push(newUrl)
                      }
                    }, 100)
                  }
                }}
                isWaveAnimating={isWaveAnimating}
              />
            )}
          </div>

          {/* Right Section: Account Info & Navigation */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Warning icon for no Google Ads accounts */}
                {isConnected && accounts.length === 0 && (
                  <button
                    onClick={() => setShowNoAccountsModal(true)}
                    className="relative p-2 rounded-lg bg-yellow-400/20 hover:bg-yellow-400/30 transition-all duration-300 animate-pulse border border-yellow-400/40 shadow-lg"
                    title="No Google Ads accounts found"
                  >
                    <svg className="w-6 h-6 text-yellow-300 drop-shadow-lg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    {/* Pulsing glow effect */}
                    <div className="absolute inset-0 rounded-lg bg-yellow-400/30 animate-ping"></div>
                  </button>
                )}

                {/* User Info */}
                <div className="hidden md:flex items-center text-sm text-gray-600">
                  <span>Welcome, {user.email?.split('@')[0] ?? 'User'}</span>
                </div>

                {/* Account Dropdown */}
                <div className="relative account-dropdown">
                  <button
                    onClick={toggleAccountDropdown}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user.email?.charAt(0).toUpperCase() ?? 'U'}
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                        isAccountDropdownOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isAccountDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          Account Settings
                        </p>
                      </div>

                      <div className="py-2">
                        <Link
                          href="/dashboard"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsAccountDropdownOpen(false)}
                        >
                          <svg
                            className="w-4 h-4 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                            />
                          </svg>
                          Dashboard
                        </Link>

                        <Link
                          href="/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsAccountDropdownOpen(false)}
                        >
                          <svg
                            className="w-4 h-4 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          Settings
                        </Link>

                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              // Immediately close dropdown to prevent conflicts
                              setIsAccountDropdownOpen(false)
                              // Add small delay to ensure dropdown is closed
                              setTimeout(() => {
                                void handleSignOut()
                              }, 50)
                            }}
                            className="sign-out-btn flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <svg
                              className="w-4 h-4 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Mobile menu button for public pages */}
                <button
                  onClick={toggleHeader}
                  className="md:hidden relative z-50 w-10 h-10 flex items-center justify-center text-black"
                >
                  <svg
                    className={`w-6 h-6 transition-transform duration-300 ${
                      isMenuOpen ? 'rotate-90' : ''
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {isMenuOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    )}
                  </svg>
                </button>

                {/* Public Navigation */}
                <div
                  className={`md:flex items-center ${
                    isMobile
                      ? `absolute top-full left-0 w-full bg-white transition-all duration-300 overflow-hidden border-b border-gray-200 ${
                          isMenuOpen ? 'max-h-screen py-4' : 'max-h-0'
                        }`
                      : 'flex'
                  }`}
                >
                  <nav className="flex flex-col md:flex-row md:items-center md:mr-6">
                    <ul className="flex flex-col md:flex-row items-center gap-1 md:gap-4">
                      {publicLinks.map((link, index) => (
                        <li
                          key={`headerLink-${index}`}
                          className="w-full md:w-auto text-center relative group whitespace-nowrap"
                        >
                          <Link
                            onClick={handleLinkClick}
                            href={link.url}
                            className="inline-block px-3 py-3 md:py-2 text-black hover:text-gray-700 transition-colors text-sm relative"
                          >
                            {link.name}
                            <span className="absolute left-0 bottom-0 h-0.5 w-0 bg-black opacity-0 group-hover:w-full group-hover:opacity-100 transition-all duration-300 ease-in-out origin-left">
                              <svg
                                width="100%"
                                height="100%"
                                viewBox="0 0 100 2"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="absolute bottom-0 left-0 right-0"
                              >
                                <path
                                  d="M0 1H100"
                                  stroke="black"
                                  strokeWidth="2"
                                  strokeDasharray="6 4"
                                />
                              </svg>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>

                  {/* CTA Button: Login */}
                  <div className="flex items-center mt-4 md:mt-0 px-4 md:px-0">
                    <button
                      onClick={() => setIsLoginModalOpen(true)}
                      className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md transition-colors duration-300 text-center whitespace-nowrap"
                    >
                      Login
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Login Modal */}
        <Modal
          id="header-login-modal"
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          className="z-[9999999]"
        >
          <div className="p-4 bg-white rounded-xl max-w-5xl w-full">
            <IntegratedGoogleAds onClose={() => setIsLoginModalOpen(false)} />
          </div>
        </Modal>

        {/* No Google Ads Accounts Modal */}
        <NoGoogleAdsAccountsModal
          isOpen={showNoAccountsModal}
          onClose={() => setShowNoAccountsModal(false)}
        />
      </header>
    </>
  )
}

export default Header
