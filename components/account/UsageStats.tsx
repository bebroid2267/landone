import { useTokens } from '@/components/hooks/useTokens'
import { useUser } from '@/components/hooks/useUser'
import { SubscriptionWithProduct } from '@/utils/types'

interface UsageStatsProps {
  subscription: SubscriptionWithProduct | null
}

export default function UsageStats({ subscription }: UsageStatsProps) {
  const { user: authUser } = useUser()
  const { tokens } = useTokens(authUser?.id)

  // Don't show stats for non-subscribed users
  if (!subscription) {
    return null
  }

  return (
    <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
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
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          AI Usage Statistics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-700/50 rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-white mb-1">
              {tokens?.tokens_remaining ?? 0}
            </div>
            <div className="text-sm text-gray-400">Credits Remaining</div>
          </div>
          <div className="bg-gray-700/50 rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-white mb-1">
              {subscription.prices?.products?.name ?? 'Unknown'}
            </div>
            <div className="text-sm text-gray-400">Current Tier</div>
          </div>
          <div className="bg-gray-700/50 rounded-xl p-5 text-center relative overflow-hidden">
            <div className="text-3xl font-bold text-white mb-1">Active</div>
            <div className="text-sm text-gray-400">Subscription Status</div>
            <div className="absolute -bottom-3 -right-3 w-16 h-16 bg-indigo-500/20 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
