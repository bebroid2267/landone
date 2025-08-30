/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/supabase-admin'
import { setCachedReport } from '@/utils/supabase/reports-cache'

/*
 * Account id "dashboard_summary" is used to store aggregated dashboard metrics
 * across all linked Google Ads accounts for a user.
 */
const DASHBOARD_ACCOUNT_ID = 'dashboard_summary'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const timeRange =
      req.nextUrl.searchParams.get('timeRange') ?? '180days'

    const { data, error } = (await (supabaseAdmin as any)
      .from('google_ads_reports_cache')
      .select(
        'active_campaigns, average_roas, recent_activity, performance_charts, expires_at',
      )
      .eq('user_id', user.id)
      .eq('account_id', DASHBOARD_ACCOUNT_ID)
      .eq('time_range', timeRange)
      .limit(1)
      .maybeSingle()) as {
      data: {
        active_campaigns?: number
        average_roas?: number
        recent_activity?: unknown
        performance_charts?: unknown
        expires_at?: string
      } | null
      error: unknown
    }

    if (error) {
      console.warn('Dashboard cache GET error:', error)
    }

    if (data?.expires_at && new Date(data.expires_at) > new Date()) {
      return NextResponse.json({
        activeCampaigns: data.active_campaigns ?? 0,
        averageRoas: data.average_roas ?? 0,
        recentActivity: data.recent_activity ?? null,
        performanceCharts: data.performance_charts ?? null,
      })
    }

    return NextResponse.json({ message: 'No cache' }, { status: 404 })
  } catch (err) {
    console.error('Dashboard cache GET exception:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      activeCampaigns,
      averageRoas,
      recentActivity,
      performanceCharts,
      timeRange = '180days',
    } = (await req.json()) as {
      activeCampaigns: number
      averageRoas: number
      recentActivity?: unknown
      performanceCharts?: unknown
      timeRange?: string
    }

    // We can store empty string as reportContent placeholder
    await setCachedReport({
      userId: user.id,
      accountId: DASHBOARD_ACCOUNT_ID,
      timeRange,
      reportContent: '',
      reportType: 'regular',
      activeCampaigns,
      averageRoas,
      recentActivity,
      performanceCharts,
    })

    return NextResponse.json({ status: 'cached' })
  } catch (err) {
    console.error('Dashboard cache POST exception:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
