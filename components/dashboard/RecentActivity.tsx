'use client'

import { motion } from 'framer-motion'
import { useChangeHistory } from '@/components/hooks/useChangeHistory'
import { useGoogleAds } from '@/components/hooks/useGoogleAds'

interface ActivityItem {
  id: string
  type: 'campaign' | 'ad_group' | 'keyword' | 'budget'
  title: string
  description: string
  timestamp: string
  icon: string
  color: string
  userEmail?: string
  accountName?: string
}

function getActivityTypeFromChange(changeType: string) {
  const type = changeType.toLowerCase()

  if (type.includes('campaign')) {
    return {
      type: 'campaign' as const,
      icon: '▲',
      color: 'bg-blue-50 text-blue-600',
    }
  }

  if (type.includes('ad_group')) {
    return {
      type: 'ad_group' as const,
      icon: '■',
      color: 'bg-green-50 text-green-600',
    }
  }

  if (type.includes('keyword') || type.includes('criterion')) {
    return {
      type: 'keyword' as const,
      icon: '#',
      color: 'bg-purple-50 text-purple-600',
    }
  }

  if (type.includes('budget')) {
    return {
      type: 'budget' as const,
      icon: '$',
      color: 'bg-yellow-50 text-yellow-600',
    }
  }

  return {
    type: 'campaign' as const,
    icon: '*',
    color: 'bg-gray-50 text-gray-600',
  }
}

function formatTimestamp(dateTime: string): string {
  try {
    const date = new Date(dateTime)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`
    } else if (diffDays === 1) {
      return 'yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else if (diffDays < 30) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  } catch {
    return 'unknown'
  }
}

interface RecentActivityProps {
  timeRange?: string
}

export default function RecentActivity({
  timeRange = 'LAST_14_DAYS',
}: RecentActivityProps) {
  const { isConnected } = useGoogleAds()
  const { data, isLoading, error } = useChangeHistory(timeRange)

  // Convert Google Ads changes to activity items
  const activities: ActivityItem[] =
    data?.changes?.slice(0, 8).map((change, index) => {
      const activityMeta = getActivityTypeFromChange(change.changeType)

      return {
        id: `${index}`,
        ...activityMeta,
        title: `${change.changeType.replace(/_/g, ' ')} Updated`,
        description: change.campaignChanged
          ? `Campaign: ${change.campaignChanged}${
              change.adGroupChanged
                ? ` | Ad Group: ${change.adGroupChanged}`
                : ''
            }`
          : change.newValue || change.itemChanged,
        timestamp: formatTimestamp(change.changeDateTime),
        userEmail: change.userEmail,
        accountName: change.accountName,
      }
    }) ?? []

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-black">Recent Activity ◉</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
          View All
        </button>
      </div>

      {!isConnected ? (
        <div className="text-center py-8">
          <div className="mb-4">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <p className="text-gray-600 text-sm mb-2">
            Connect Google Ads to see recent activity
          </p>
          <p className="text-gray-500 text-xs">
            Go to Google Ads integration to connect your account
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-gray-600 text-sm">
            Unable to load recent activity
          </p>
          <p className="text-gray-500 text-xs mt-1">{error}</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="mb-4">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-600 text-sm">No activity found</p>
          <p className="text-gray-500 text-xs mt-1">
            No changes detected in the last 2 weeks. Activity will appear here
            when you modify campaigns, ad groups, or keywords.
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100 w-full max-w-full overflow-hidden"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${activity.color} flex-shrink-0`}
              >
                {activity.icon}
              </div>

              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-black truncate flex-1 mr-2">
                    {activity.title}
                  </p>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {activity.timestamp}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1 break-words overflow-hidden">
                  {activity.description}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-1">
                  {activity.accountName && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full truncate max-w-full">
                      {activity.accountName}
                    </span>
                  )}
                  {activity.userEmail && (
                    <span className="text-xs text-gray-500 truncate">
                      by {activity.userEmail}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-2xl font-bold text-blue-600">
              {data?.changes?.length ?? 0}
            </p>
            <p className="text-xs text-blue-600">Last 2 Weeks</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-100">
            <p className="text-2xl font-bold text-green-600">
              {activities.filter((a) => a.type === 'campaign').length}
            </p>
            <p className="text-xs text-green-600">Campaign Updates</p>
          </div>
        </div>
      </div>
    </div>
  )
}
