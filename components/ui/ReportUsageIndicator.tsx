import React, { useEffect, useState } from 'react'
import { useUser } from '@/components/hooks/useUser'
import {
  checkReportLimit,
  formatLimitInfo,
  type ReportUsageLimit,
} from '@/utils/supabase/report-usage'

interface ReportUsageIndicatorProps {
  className?: string
  showDetails?: boolean
}

const ReportUsageIndicator: React.FC<ReportUsageIndicatorProps> = ({
  className = '',
  showDetails = true,
}) => {
  const { user } = useUser()
  const [limitInfo, setLimitInfo] = useState<ReportUsageLimit | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      void loadLimitInfo()
    }
  }, [user?.id])

  const loadLimitInfo = async () => {
    if (!user?.id) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const limit = await checkReportLimit(user.id)
      setLimitInfo(limit)
    } catch (err) {
      console.error('Error loading report limit:', err)
      setError('Failed to load usage information')
    } finally {
      setLoading(false)
    }
  }

  const getUsageColor = () => {
    if (!limitInfo) {
      return 'text-gray-500'
    }

    const usagePercentage = (limitInfo.current_usage / limitInfo.limit) * 100

    if (usagePercentage >= 90) {
      return 'text-red-500'
    }
    if (usagePercentage >= 70) {
      return 'text-yellow-500'
    }
    return 'text-green-500'
  }

  const getProgressBarColor = () => {
    if (!limitInfo) {
      return 'bg-gray-200'
    }

    const usagePercentage = (limitInfo.current_usage / limitInfo.limit) * 100

    if (usagePercentage >= 90) {
      return 'bg-red-500'
    }
    if (usagePercentage >= 70) {
      return 'bg-yellow-500'
    }
    return 'bg-green-500'
  }

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        <span className="text-sm text-gray-500">Loading usage...</span>
      </div>
    )
  }

  if (error) {
    return <div className={`text-sm text-red-500 ${className}`}>{error}</div>
  }

  if (!limitInfo) {
    return null
  }

  const usagePercentage = (limitInfo.current_usage / limitInfo.limit) * 100

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Usage summary */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Weekly Reports
        </span>
        <span className={`text-sm font-semibold ${getUsageColor()}`}>
          {limitInfo.current_usage} / {limitInfo.limit}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
        ></div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="text-xs text-gray-500">
          {formatLimitInfo(limitInfo)}
        </div>
      )}

      {/* Warning for high usage */}
      {usagePercentage >= 90 && limitInfo.can_generate && (
        <div className="flex items-center space-x-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>Almost at your weekly limit</span>
        </div>
      )}

      {/* Limit reached message */}
      {!limitInfo.can_generate && (
        <div className="flex items-center space-x-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>Weekly limit reached</span>
        </div>
      )}
    </div>
  )
}

export default ReportUsageIndicator
