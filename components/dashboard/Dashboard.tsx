'use client'

import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@/components/hooks/useUser'
import DashboardStats from './DashboardStats'
import PerformanceCharts from './PerformanceCharts'
import AnalysisSelector from './AnalysisSelector'
import RecentActivity from './RecentActivity'
import AccountSelector from './AccountSelector'

export default function Dashboard() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const timeRange = searchParams.get('timeRange') ?? 'LAST_7_DAYS'

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">
            Welcome back, {user?.email?.split('@')[0] ?? 'User'}! 🐕
          </h1>
          <p className="text-gray-600">
            Here&apos;s what&apos;s happening with your Google Ads campaigns
          </p>
        </div>
      </motion.div>

      {/* Account Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <AccountSelector />
      </motion.div>

      {/* Analysis Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <AnalysisSelector />
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <DashboardStats timeRange={timeRange} />
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 w-full max-w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-full max-w-full overflow-hidden"
        >
          <PerformanceCharts timeRange={timeRange} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="w-full max-w-full overflow-hidden"
        >
          <RecentActivity timeRange={timeRange} />
        </motion.div>
      </div>
    </div>
  )
}
