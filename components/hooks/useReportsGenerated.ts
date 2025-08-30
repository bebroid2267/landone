/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-floating-promises */
'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import {
  getEffectiveLimit,
  DEFAULT_WEEKLY_LIMIT,
} from '@/utils/supabase/report-usage'

interface ReportsGeneratedData {
  totalReports: number
  weeklyReports: number
  regularReports: number
  weeklyLimit: number
}

export function useReportsGenerated() {
  const [data, setData] = useState<ReportsGeneratedData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function fetchReportsGenerated() {
      try {
        setIsLoading(true)
        setError(null)

        // Get current user
        const userData = await supabase.auth.getUser()
        let { user } = userData.data
        const { error: userError } = userData

        if (userError) {
          console.error('❌ useReportsGenerated - User error:', userError)
          throw new Error(`User authentication error: ${userError.message}`)
        }

        if (!user) {
          console.log('❌ useReportsGenerated - No user found')
          // Try to refresh session before throwing error
          const { data: refreshData, error: refreshError } =
            await supabase.auth.refreshSession()
          if (refreshError) {
            console.error(
              '❌ useReportsGenerated - Session refresh failed:',
              refreshError,
            )
            throw new Error('User not authenticated')
          }
          if (!refreshData.session?.user) {
            console.error(
              '❌ useReportsGenerated - No user in refreshed session',
            )
            throw new Error('User not authenticated')
          }
          console.log(
            '✅ useReportsGenerated - Session refreshed, retrying with new user',
          )
          // Use the refreshed user
          const refreshedUser = refreshData.session.user
          if (!refreshedUser) {
            throw new Error('User not authenticated')
          }
          user = refreshedUser
        }

        /*
         * Get reports from report_usage table
         * Group by week_start, account_id, time_range to count unique reports
         */
        try {
          const { data: reportUsage, error: usageError } = await (
            supabase as any
          )
            .from('report_usage')
            .select(
              'report_type, week_start, account_id, time_range, created_at',
            )
            .eq('user_id', user.id)

          if (usageError) {
            console.warn(
              'Could not access report_usage table:',
              usageError.message,
            )
            throw usageError
          }

          if (!Array.isArray(reportUsage)) {
            throw new Error('Invalid report usage data')
          }

          // Group reports by unique combinations to avoid counting sub-requests
          const uniqueReports = new Map<string, any>()

          reportUsage.forEach((record: any) => {
            /*
             * Create unique key based on time window + account + type
             * This groups all API calls from the same report generation
             */
            const timestamp = new Date(record.created_at).getTime()
            const timeWindow = Math.floor(timestamp / (5 * 60 * 1000)) // 5-minute windows
            const uniqueKey = `${record.week_start}_${record.account_id}_${record.time_range}_${record.report_type}_${timeWindow}`

            if (!uniqueReports.has(uniqueKey)) {
              uniqueReports.set(uniqueKey, record)
            }
          })

          const uniqueReportsArray = Array.from(uniqueReports.values())
          const totalReports = uniqueReportsArray.length

          // Count by report type
          const weeklyReports = uniqueReportsArray.filter(
            (report: any) =>
              report.report_type === 'weekly_analysis' ||
              report.time_range === 'LAST_7_DAYS',
          ).length

          const regularReports = totalReports - weeklyReports

          /*
           * Fetch the user’s effective weekly limit (falls back to default on
           * error)
           */
          let weeklyLimit = DEFAULT_WEEKLY_LIMIT
          try {
            weeklyLimit = await getEffectiveLimit(user.id)
          } catch (limitErr) {
            console.warn(
              'Could not fetch weekly limit, using default:',
              limitErr,
            )
          }

          setData({
            totalReports,
            weeklyReports,
            regularReports,
            weeklyLimit,
          })
        } catch (usageError) {
          console.warn(
            'Could not access report_usage table, falling back to cache table',
          )

          // Fallback: use google_ads_reports_cache
          const { count: totalCount, error: countError } = await (
            supabase as any
          )
            .from('google_ads_reports_cache')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

          if (countError) {
            throw countError
          }

          const totalReports = totalCount ?? 0

          // Even in fallback mode, provide a sensible limit value
          let weeklyLimit = DEFAULT_WEEKLY_LIMIT
          try {
            weeklyLimit = await getEffectiveLimit(user.id)
          } catch {}

          setData({
            totalReports,
            weeklyReports: Math.floor(totalReports * 0.2),
            regularReports: Math.floor(totalReports * 0.8),
            weeklyLimit,
          })
        }
      } catch (err) {
        console.error('Error fetching reports generated:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setData({
          totalReports: 0,
          weeklyReports: 0,
          regularReports: 0,
          weeklyLimit: DEFAULT_WEEKLY_LIMIT,
        })
      } finally {
        setIsLoading(false)
      }
    }

    // Initial fetch
    void fetchReportsGenerated()

    // Subscribe to realtime changes in report_usage for current user
    let channel: RealtimeChannel | null = null

    ;(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          channel = supabase
            .channel('report_usage_changes')
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'report_usage',
                filter: `user_id=eq.${user.id}`,
              },
              () => {
                void fetchReportsGenerated()
              },
            )
            .subscribe()
        }
      } catch {}
    })()

    // Cleanup
    return () => {
      if (channel) {
        void supabase.removeChannel(channel)
      }
    }
  }, [supabase])

  return { data, isLoading, error }
}
