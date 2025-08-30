import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'

interface RecordUsageRequest {
  userId: string
  reportType: 'ai_analysis' | 'weekly_analysis'
  accountId?: string
  timeRange?: string
  campaignId?: string
}

// Helper function to get week start date (Monday)
function getWeekStart(date: Date = new Date()): string {
  const dayOfWeek = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
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

    const requestBody = (await req.json()) as RecordUsageRequest
    const { userId, reportType, accountId, timeRange, campaignId } = requestBody

    // Verify user can only record their own usage
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'Can only record your own usage' },
        { status: 403 },
      )
    }

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
      return NextResponse.json(
        { error: 'Failed to record report usage' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      week_start: weekStart,
    })
  } catch (error) {
    console.error('Error in record usage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
