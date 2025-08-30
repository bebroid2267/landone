import { createClient } from '@/utils/supabase/client'

export interface ReportUsageLimit {
  can_generate: boolean
  current_usage: number
  limit: number
  remaining: number
  week_start: string
  resets_at: string
}

export interface WeeklyStats {
  week_start: string
  reports_count: number
  report_types: number
  types_used: string[]
}

interface ApiErrorResponse {
  error: string
}

interface RecordUsageResponse {
  success: boolean
  id: string
  week_start: string
}

// Default weekly limit for reports
export const DEFAULT_WEEKLY_LIMIT = 100

// Helper function to get week start date (Monday)
function getWeekStart(date: Date = new Date()): string {
  const dayOfWeek = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

// Check if user can generate a report (uses API endpoint)
export async function checkReportLimit(
  userId: string,
  limit?: number,
): Promise<ReportUsageLimit> {
  try {
    const response = await fetch('/api/report-usage/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, limit }),
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({
        error: 'Unknown error',
      }))) as ApiErrorResponse
      throw new Error(errorData.error)
    }

    return (await response.json()) as ReportUsageLimit
  } catch (error) {
    console.error('Error checking report limit:', error)
    throw new Error('Failed to check report limit')
  }
}

// Record report generation (uses API endpoint)
export async function recordReportUsage(
  userId: string,
  reportType: 'ai_analysis' | 'weekly_analysis' = 'ai_analysis',
  accountId?: string,
  timeRange?: string,
  campaignId?: string,
): Promise<string> {
  try {
    const response = await fetch('/api/report-usage/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        reportType,
        accountId,
        timeRange,
        campaignId,
      }),
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({
        error: 'Unknown error',
      }))) as ApiErrorResponse
      throw new Error(errorData.error)
    }

    const result = (await response.json()) as RecordUsageResponse
    return result.id
  } catch (error) {
    console.error('Error recording report usage:', error)
    throw new Error('Failed to record report usage')
  }
}

// Get user's weekly statistics (direct client call - read-only)
export async function getUserWeeklyStats(
  userId: string,
  weeksBack = 4,
): Promise<WeeklyStats[]> {
  const supabase = createClient()

  const today = new Date()
  const currentWeekStart = getWeekStart(today)
  const cutoffDate = new Date(currentWeekStart + 'T00:00:00.000Z')
  cutoffDate.setDate(cutoffDate.getDate() - weeksBack * 7)

  const { data, error } = await supabase
    .from('report_usage')
    .select('week_start, report_type')
    .eq('user_id', userId)
    .gte('week_start', cutoffDate.toISOString().split('T')[0])
    .order('week_start', { ascending: false })

  if (error) {
    console.error('Error getting weekly stats:', error)
    throw new Error('Failed to get weekly statistics')
  }

  // Group by week_start
  const weeklyMap = new Map<string, { types: Set<string>; count: number }>()

  data?.forEach((record) => {
    const weekStart = record.week_start
    if (!weeklyMap.has(weekStart)) {
      weeklyMap.set(weekStart, { types: new Set(), count: 0 })
    }
    const week = weeklyMap.get(weekStart)!
    week.types.add(record.report_type)
    week.count++
  })

  // Convert to result format
  const result: WeeklyStats[] = Array.from(weeklyMap.entries()).map(
    ([weekStart, data]) => ({
      week_start: weekStart,
      reports_count: data.count,
      report_types: data.types.size,
      types_used: Array.from(data.types),
    }),
  )

  return result
}

// Get user's current usage for the week
export async function getCurrentWeekUsage(userId: string): Promise<number> {
  const limit = await checkReportLimit(userId)
  return limit.current_usage
}

// Helper function to format limit information for UI
export function formatLimitInfo(limit: ReportUsageLimit): string {
  if (limit.can_generate) {
    return `${limit.remaining} reports remaining this week`
  } else {
    const resetDate = new Date(limit.resets_at)
    const now = new Date()
    const daysUntilReset = Math.ceil(
      (resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    )

    return `Weekly limit reached. Resets in ${daysUntilReset} day${
      daysUntilReset !== 1 ? 's' : ''
    }`
  }
}

/*
 * Helper function to check if user has premium subscription (direct client
 * call)
 */
export async function hasPremiumAccess(userId: string): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (error) {
    return false
  }

  if (!data) {
    return false
  }

  return data.status === 'active'
}

/*
 * Get effective limit based on user's subscription (uses API for server-side
 * check)
 */
export async function getEffectiveLimit(userId: string): Promise<number> {
  try {
    const limit = await checkReportLimit(userId)
    return limit.limit
  } catch {
    // Fallback to default limit if API call fails
    return DEFAULT_WEEKLY_LIMIT
  }
}
