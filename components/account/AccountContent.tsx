import AccountInfo from './accountInfo'
import AccountPayment from './AccountPayment'
import UsageStats from './UsageStats'
import { createClient } from '@/utils/supabase/client'
import { getSubscriptionByUserId } from '@/utils/supabase/supabase-server'
import { useEffect, useMemo, useState } from 'react'
import { SubscriptionWithProduct } from '@/utils/types'
import { useUser } from '@/components/hooks/useUser'
import LoadingDots from '../ui/LoadingDots'

interface AccountInfoProps {
  user: {
    avatar_url: string | null
    full_name: string | null
    id: string
    utm_source?: string | null | undefined
  } | null
}

export default function AccountContent({ user }: AccountInfoProps) {
  const supabase = createClient()
  const { user: authUser } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [subscription, setSubscription] =
    useState<SubscriptionWithProduct | null>(null)

  const userId = useMemo(() => authUser?.id, [authUser?.id])

  useEffect(() => {
    let isMounted = true

    const getMainInfo = async () => {
      if (userId && isMounted) {
        setIsLoading(true)
        const subscriptionSupabase = await getSubscriptionByUserId(
          supabase,
          userId,
        )
        if (isMounted) {
          setSubscription(subscriptionSupabase)
          setIsLoading(false)
        }
      }
    }

    void getMainInfo()

    return () => {
      isMounted = false
    }
  }, [userId, supabase])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4">
        <div className="w-16 h-16 bg-indigo-900/30 rounded-full flex items-center justify-center">
          <LoadingDots />
        </div>
        <p className="text-gray-400">Loading account details...</p>
      </div>
    )
  }

  return (
    <section className="bg-gray-900 relative min-h-screen overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-gray-900 to-gray-900"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full filter blur-3xl"></div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="flex flex-col space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Account{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                Dashboard
              </span>
            </h1>
          </div>
          <p className="text-gray-400 max-w-2xl">
            Manage your account settings, view subscription details, and
            customize your AI image generation experience.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Account Info Card */}
            <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-1">
                <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full"></div>
              </div>
              <div className="p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-white flex items-center mb-6">
                  <svg
                    className="w-5 h-5 mr-2 text-indigo-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Profile Information
                </h2>
                <AccountInfo user={user} />
              </div>
            </div>

            {/* Usage Stats */}
            {subscription && <UsageStats subscription={subscription} />}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Subscription Card */}
            <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden shadow-xl h-auto sticky top-6">
              <div className="p-1">
                <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 rounded-full"></div>
              </div>
              <div className="p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-white flex items-center mb-6">
                  <svg
                    className="w-5 h-5 mr-2 text-purple-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="1"
                      y="4"
                      width="22"
                      height="16"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                  Subscription Details
                </h2>
                <AccountPayment subscription={subscription} />
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-white mb-6">
                  Quick Actions
                </h2>
                <div className="space-y-3">
                  <a
                    href="/generate"
                    className="flex items-center px-4 py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all duration-200"
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Generate New Image
                  </a>
                  <a
                    href="/gallery"
                    className="flex items-center px-4 py-3 text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-all duration-200"
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    View My Gallery
                  </a>
                  <a
                    href="/pricing"
                    className="flex items-center px-4 py-3 text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-all duration-200"
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                      <rect
                        x="8"
                        y="2"
                        width="8"
                        height="4"
                        rx="1"
                        ry="1"
                      ></rect>
                    </svg>
                    Upgrade Plan
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
