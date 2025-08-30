'use client'

import { motion } from 'framer-motion'
import { useCampaignStats } from '@/components/hooks/useCampaignStats'
import { useReportsGenerated } from '@/components/hooks/useReportsGenerated'
import { DEFAULT_WEEKLY_LIMIT } from '@/utils/supabase/report-usage'

interface DashboardStatsProps {
  timeRange?: string
}

export default function DashboardStats({
  timeRange = '180days',
}: DashboardStatsProps) {
  const { data: campaignStats, isLoading: isLoadingCampaigns } =
    useCampaignStats(timeRange)
  const { data: reportsData, isLoading: isLoadingReports } =
    useReportsGenerated()

  const stats = [
    {
      title: 'Active Campaigns',
      value: isLoadingCampaigns ? null : campaignStats?.activeCampaigns ?? 0,
      icon: '▲',
      gradient: 'from-purple-500 to-pink-500',
      iconBg: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Average ROAS',
      value: isLoadingCampaigns
        ? null
        : campaignStats?.averageRoas
        ? `${campaignStats.averageRoas}x`
        : '0x',
      icon: '$',
      gradient: 'from-yellow-500 to-orange-500',
      iconBg: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
  ]

  return (
    <div className="mb-8">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-black">
                  {stat.value ?? (
                    <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />
                  )}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-full ${stat.iconBg} flex items-center justify-center text-xl`}
              >
                {stat.icon}
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                <div
                  className={`h-2 w-2 rounded-full bg-gradient-to-r ${stat.gradient} mr-2`}
                ></div>
                <span className={`text-xs font-medium ${stat.textColor}`}>
                  Last 30 days
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Report Usage Block - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-xl mr-4">
              ■
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black">Report Usage</h3>
              <p className="text-sm text-gray-600">
                Generated AI analysis reports
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-black">
              {isLoadingReports ? (
                <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />
              ) : (
                reportsData?.totalReports ?? 0
              )}
            </p>
            <p className="text-sm text-gray-600">Total Reports</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-black mb-1">
              {isLoadingReports ? (
                <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />
              ) : (
                reportsData?.totalReports ?? 0
              )}
            </div>
            <div className="text-sm text-gray-600">Reports Generated</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-black mb-1">
              {isLoadingReports ? (
                <span className="inline-block h-6 w-20 bg-gray-200 rounded animate-pulse" />
              ) : reportsData ? (
                `${reportsData.weeklyReports} / ${reportsData.weeklyLimit}`
              ) : (
                `0 / ${DEFAULT_WEEKLY_LIMIT}`
              )}
            </div>
            <div className="text-sm text-gray-600">Weekly Reports</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-black mb-1">
              {isLoadingReports ? (
                <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />
              ) : (
                reportsData?.regularReports ?? 0
              )}
            </div>
            <div className="text-sm text-gray-600">Regular Audits</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 mr-2"></div>
            <span className="text-xs font-medium text-green-600">
              Based on your AI analysis history
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
