'use client'

import { useState, useEffect, Suspense } from 'react'
import { useUser } from '@/components/hooks/useUser'
import Header from './header/Header'
import Sidebar from './sidebar/Sidebar'
import { usePathname } from 'next/navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
}

// Routes that should show the sidebar
const dashboardRoutes = [
  '/',
  '/dashboard',
  '/google-ads',
  '/data-explorer',
  '/settings',
  '/debug-auth',
  '/debug-google-ads',
  '/test-auth',
  '/test-google-ads-comparison',
  '/test-render-count',
  '/test-tokens',
]

// Routes that should have no header/sidebar at all
const landingPageRoutes = ['/start']

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useUser()
  const pathname = usePathname()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false) // Start open by default
  const [isAiAnalysisLoading, setIsAiAnalysisLoading] = useState(false)
  const [isActiveAccountsSelection, setIsActiveAccountsSelection] = useState(false)

  // Add/remove landing-page class to body for landing pages
  useEffect(() => {
    const isLandingPage = landingPageRoutes.some((route) => pathname.startsWith(route))
    
    if (isLandingPage) {
      document.body.classList.add('landing-page')
      document.body.classList.remove('loading')
    } else {
      document.body.classList.remove('landing-page')
      document.body.classList.add('loading')
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('landing-page')
    }
  }, [pathname])

  // Track sessionStorage changes for AI analysis loading state and active accounts selection
  useEffect(() => {
    const checkLoadingState = () => {
      if (typeof window !== 'undefined') {
        // Clear session flags when on /start page to prevent unwanted sidebar blocking
        if (pathname === '/start') {
          sessionStorage.removeItem('ai_analysis_loading')
          sessionStorage.removeItem('active_accounts_selection')
          setIsAiAnalysisLoading(false)
          setIsActiveAccountsSelection(false)
          return
        }

        const isLoading = sessionStorage.getItem('ai_analysis_loading') === 'true'
        const isAccountsSelection = sessionStorage.getItem('active_accounts_selection') === 'true'
        
        // Only update state if values actually changed
        setIsAiAnalysisLoading(prev => prev !== isLoading ? isLoading : prev)
        setIsActiveAccountsSelection(prev => prev !== isAccountsSelection ? isAccountsSelection : prev)
      }
    }

    // Check initial state
    checkLoadingState()

    // Check on focus/visibility change
    const handleFocus = () => checkLoadingState()
    const handleVisibilityChange = () => checkLoadingState()

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Poll every 500ms for changes (fallback)
    const interval = setInterval(checkLoadingState, 500)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(interval)
    }
  }, [pathname])

  // Check if current route should show sidebar
  const shouldShowSidebar = Boolean(
    user && dashboardRoutes.some((route) => pathname.startsWith(route))
  )

  // Check if this is a landing page that should have no header/sidebar
  const isLandingPage = landingPageRoutes.some((route) => pathname.startsWith(route))

  // Check if we're in focused onboarding mode
  const isOnboardingMode = (
    // Don't block sidebar on /start page - users should have full access
    pathname !== '/start' && (
      // Original Google Ads auto_start flow
      (pathname === '/google-ads' && 
       typeof window !== 'undefined' && 
       window.location.search.includes('auto_start=true')) ||
      // AI Analysis onboarding mode - any loading state on ai-analysis page OR auto_start
      (pathname.startsWith('/google-ads/ai-analysis') && 
       (isAiAnalysisLoading || 
        (typeof window !== 'undefined' && window.location.search.includes('auto_start=true')))) ||
      // Active accounts selection mode - disable sidebar while user is choosing account
      isActiveAccountsSelection
    )
  )

  // Set initial sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      /*
       * Keep sidebar open by default on all screen sizes
       * Users can manually collapse it if needed
       */
      setIsSidebarCollapsed(false)
    }

    // Set initial state
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  // Landing pages get full-screen treatment without header/sidebar
  if (isLandingPage) {
    return (
      <main className="w-full h-screen overflow-x-hidden overflow-y-auto bg-transparent">
        {children}
      </main>
    )
  }

  // Always render both Header and Sidebar to keep hook count consistent
  // Use CSS/visibility to show/hide instead of conditional rendering
  return (
    <main className="flex flex-col h-screen font-prompt overflow-hidden">
      <Suspense fallback={<div className="h-16 bg-white/80 backdrop-blur-sm border-b border-gray-200">Loading...</div>}>
        <Header 
          onToggleSidebar={shouldShowSidebar ? toggleSidebar : undefined} 
          showSidebarToggle={shouldShowSidebar} 
        />
      </Suspense>
      <div className="flex flex-1 overflow-hidden">
        {/* Always render Sidebar but hide it when not needed */}
        <Suspense fallback={<div className="w-20 lg:w-[280px] bg-gray-50/80 backdrop-blur-sm border-r border-gray-200">Loading...</div>}>
          <div className={shouldShowSidebar ? 'block' : 'hidden'}>
            <Sidebar 
              isCollapsed={isSidebarCollapsed} 
              onToggle={toggleSidebar}
              isOnboardingMode={isOnboardingMode}
            />
          </div>
        </Suspense>
        <div
          className={`flex-1 transition-all duration-300 overflow-x-hidden overflow-y-auto ${
            !shouldShowSidebar ? 'ml-0' : isSidebarCollapsed ? 'ml-0 lg:ml-20' : 'ml-0 lg:ml-[280px]'
          }`}
        >
          {children}
        </div>
      </div>
    </main>
  )
}
