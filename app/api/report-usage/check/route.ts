import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'

interface CheckLimitRequest {
  userId: string
  limit?: number
}

interface ReportUsageLimit {
  can_generate: boolean
  current_usage: number
  limit: number
  remaining: number
  week_start: string
  resets_at: string
}

// Helper function to get week start date (Monday)
function getWeekStart(date: Date = new Date()): string {
  const dayOfWeek = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

// Check if user has premium subscription
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

// Get effective limit based on user's subscription
async function getEffectiveLimit(userId: string): Promise<number> {
  const hasPremium = await hasPremiumAccess(userId)
  // Premium users get unlimited reports (or higher limit)
  return hasPremium ? 1000 : 100 // DEFAULT_WEEKLY_LIMIT
}

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      )
    }

    const requestBody = (await req.json()) as CheckLimitRequest
    const { userId, limit: requestedLimit } = requestBody

    // Verify user can only check their own limits
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'Can only check your own usage limits' },
        { status: 403 },
      )
    }

    // Get effective limit for user
    const effectiveLimit = requestedLimit ?? (await getEffectiveLimit(userId))
    const weekStart = getWeekStart()

    // Check current usage using admin client
    const { data, error } = await supabaseAdmin
      .from('report_usage')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start', weekStart)

    if (error) {
      console.error('Error checking report limit:', error)
      return NextResponse.json(
        { error: 'Failed to check report limit' },
        { status: 500 },
      )
    }

    const currentUsage = data?.length ?? 0
    const remaining = Math.max(0, effectiveLimit - currentUsage)
    const canGenerate = currentUsage < effectiveLimit

    const nextMonday = new Date(weekStart + 'T00:00:00.000Z')
    nextMonday.setDate(nextMonday.getDate() + 7)

    const result: ReportUsageLimit = {
      can_generate: canGenerate,
      current_usage: currentUsage,
      limit: effectiveLimit,
      remaining,
      week_start: weekStart,
      resets_at: nextMonday.toISOString(),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in report usage check:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
