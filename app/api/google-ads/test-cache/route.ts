import { NextRequest, NextResponse } from 'next/server'
import {
  getCachedReport,
  setCachedReport,
  clearUserCache,
  cleanupExpiredCache,
} from '@/utils/supabase/reports-cache'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const userId = searchParams.get('userId') ?? 'test-user-123'
  const accountId = searchParams.get('accountId') ?? 'test-account-456'
  const timeRange = searchParams.get('timeRange') ?? 'LAST_QUARTER'
  const campaignId = searchParams.get('campaignId') ?? undefined

  try {
    switch (action) {
      case 'get':
        const cachedReport = await getCachedReport(
          userId,
          accountId,
          timeRange,
          campaignId,
        )
        return NextResponse.json({
          success: true,
          cached: !!cachedReport,
          report: cachedReport ? cachedReport.substring(0, 100) + '...' : null,
        })

      case 'set':
        const testReport = `
# Test Report for ${accountId}
Time Range: ${timeRange}
Campaign ID: ${campaignId ?? 'All campaigns'}
Generated at: ${new Date().toISOString()}

This is a test report to verify caching functionality.
        `.trim()

        const success = await setCachedReport({
          userId,
          accountId,
          timeRange,
          campaignId,
          reportContent: testReport,
        })

        return NextResponse.json({
          success,
          message: success
            ? 'Report cached successfully'
            : 'Failed to cache report',
        })

      case 'clear':
        const cleared = await clearUserCache(userId)
        return NextResponse.json({
          success: cleared,
          message: cleared ? 'User cache cleared' : 'Failed to clear cache',
        })

      case 'cleanup':
        const deletedCount = await cleanupExpiredCache()
        return NextResponse.json({
          success: true,
          deletedCount,
          message: `Cleaned up ${deletedCount} expired entries`,
        })

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action. Use: get, set, clear, or cleanup',
          usage: {
            get: '/api/google-ads/test-cache?action=get&userId=123&accountId=456',
            set: '/api/google-ads/test-cache?action=set&userId=123&accountId=456',
            clear: '/api/google-ads/test-cache?action=clear&userId=123',
            cleanup: '/api/google-ads/test-cache?action=cleanup',
          },
        })
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: String(error),
      },
      { status: 500 },
    )
  }
}
