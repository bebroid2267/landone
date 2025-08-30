import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import {
  checkReportLimitServer,
  recordReportUsageServer,
} from '@/utils/supabase/report-usage-server'

/**
 * Common request handler for Google Ads API routes
 * Validates access token and account ID, and handles errors consistently
 */
export async function handleRequest<T>(
  req: NextRequest,
  dataFn: (
    accessToken: string,
    accountId: string,
    timeRange?: string,
    campaignId?: string,
    userId?: string,
    request?: NextRequest,
  ) => Promise<T & { fromCache?: boolean }>,
  options?: {
    skipUsageRecording?: boolean // Add option to skip usage recording for sub-endpoints
    forceRegenerate?: boolean // Add option to indicate force regeneration
  },
) {
  try {
    const { accessToken, accountId, timeRange, campaignId } =
      (await req.json()) as {
        accessToken: string
        accountId: string
        timeRange?: string
        campaignId?: string
      }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 },
      )
    }

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account not selected' },
        { status: 400 },
      )
    }

    // Get user ID from Supabase authentication
    let userId: string | undefined
    try {
      const supabase = await createClient()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      console.log('[RequestHandler] Supabase auth result:', {
        hasUser: !!user,
        userId: user?.id,
        hasError: !!error,
        errorMessage: error?.message
      })

      if (error) {
        console.warn('[RequestHandler] Could not get user:', error.message)
      } else if (user) {
        userId = user.id
        console.log('[RequestHandler] Successfully retrieved userId:', userId)
      } else {
        console.warn('[RequestHandler] No user found in Supabase auth')
      }
    } catch (authError) {
      console.warn('[RequestHandler] Error getting user:', authError)
    }

    // Only check limits for main report endpoints, not sub-endpoints
    if (userId && !options?.skipUsageRecording) {
      try {
        console.log('[RequestHandler] Checking report limits for user:', userId)
        const limitData = await checkReportLimitServer(userId)

        if (!limitData.can_generate) {
          console.log(
            '[RequestHandler] User has exceeded report limit:',
            limitData,
          )
          return NextResponse.json(
            {
              error:
                'Weekly report limit exceeded. You have generated the maximum number of reports allowed for this week.',
              current_usage: limitData.current_usage,
              limit: limitData.limit,
              resets_at: limitData.resets_at,
            },
            { status: 429 },
          )
        }

        console.log('[RequestHandler] Report limit check passed:', limitData)
      } catch (error) {
        console.error('Error checking report limits:', error)
        // Continue without blocking - log error but don't fail the request
      }
    } else {
      console.log(
        '[RequestHandler] Skipping limit check (no userId or skipUsageRecording=true)',
      )
    }

    const data = await dataFn(
      accessToken,
      accountId,
      timeRange,
      campaignId,
      userId,
      req,
    )

    /*
     * Only record usage for main report endpoints, not sub-endpoints,
     * and only when report is actually generated (not from cache)
     */
    const shouldRecordUsage =
      userId &&
      !options?.skipUsageRecording &&
      !(data as { fromCache?: boolean })?.fromCache
    if (shouldRecordUsage) {
      try {
        console.log('[RequestHandler] Recording report usage for user:', userId)
        const recordId = await recordReportUsageServer(
          userId!,
          'ai_analysis', // Default - can be overridden in specific endpoints
          accountId,
          timeRange,
          campaignId,
        )
        console.log(
          '[RequestHandler] Successfully recorded report usage:',
          recordId,
        )
      } catch (error) {
        console.error('Error recording report usage:', error)
        // Don't fail the request if recording fails
      }
    } else {
      const reason = !userId
        ? 'no userId'
        : options?.skipUsageRecording
        ? 'skipUsageRecording=true'
        : (data as { fromCache?: boolean })?.fromCache
        ? 'report from cache'
        : 'unknown'
      console.log(`[RequestHandler] Skipping usage recording (${reason})`)
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
