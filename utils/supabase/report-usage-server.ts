import { supabaseAdmin } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'

export interface ReportUsageLimit {
  can_generate: boolean
  current_usage: number
  limit: number
  remaining: number
  week_start: string
  resets_at: string
  days_until_reset: number
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

// Check if user has premium subscription (SERVER-SIDE)
async function hasPremiumAccess(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
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

// Get effective limit based on user's subscription (SERVER-SIDE)
async function getEffectiveLimit(userId: string): Promise<number> {
  const hasPremium = await hasPremiumAccess(userId)
  // Premium users get unlimited reports (or higher limit)
  return hasPremium ? 1000 : DEFAULT_WEEKLY_LIMIT
}

// SERVER-SIDE: Check if user can generate a report
export async function checkReportLimitServer(
  userId: string,
  limit?: number,
): Promise<ReportUsageLimit> {
  try {
    // Get effective limit for user
    const effectiveLimit = limit ?? (await getEffectiveLimit(userId))
    const weekStart = getWeekStart()

    // Check current usage using admin client
    const { data, error } = await supabaseAdmin
      .from('report_usage')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start', weekStart)

    if (error) {
      console.error('Error checking report limit:', error)
      throw new Error('Failed to check report limit')
    }

    const currentUsage = data?.length ?? 0
    const remaining = Math.max(0, effectiveLimit - currentUsage)
    const canGenerate = currentUsage < effectiveLimit

    const nextMonday = new Date(weekStart + 'T00:00:00.000Z')
    nextMonday.setDate(nextMonday.getDate() + 7)

    const now = new Date()
    const daysUntilReset = Math.ceil(
      (nextMonday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    )

    return {
      can_generate: canGenerate,
      current_usage: currentUsage,
      limit: effectiveLimit,
      remaining,
      week_start: weekStart,
      resets_at: nextMonday.toISOString(),
      days_until_reset: daysUntilReset,
    }
  } catch (error) {
    console.error('Error checking report limits:', error)
    throw error
  }
}

// SERVER-SIDE: Record report generation
export async function recordReportUsageServer(
  userId: string,
  reportType: 'ai_analysis' | 'weekly_analysis' = 'ai_analysis',
  accountId?: string,
  timeRange?: string,
  campaignId?: string,
): Promise<string> {
  try {
    const weekStart = getWeekStart()

    // Record usage using admin client
    const { data, error } = await supabaseAdmin
      .from('report_usage')
      .insert({
        user_id: userId,
        report_type: reportType,
        account_id: accountId ?? null,
        time_range: timeRange ?? null,
        campaign_id: campaignId ?? null,
        week_start: weekStart,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error recording report usage:', error)
      throw new Error('Failed to record report usage')
    }

    return data.id
  } catch (error) {
    console.error('Error recording report usage:', error)
    throw error
  }
}

// SERVER-SIDE: Verify user authentication and return user ID
export async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.warn('Could not get user:', error.message)
      return null
    }

    return user?.id ?? null
  } catch (authError) {
    console.warn('Error getting user:', authError)
    return null
  }
}
