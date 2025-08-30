import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { ChangeHistorySummary } from '../types'
import { formatTimeRangeForGAQL, googleAdsApiRequest } from '../utils'
import { getLimit } from '../limits'

export async function POST(req: NextRequest) {
  return handleRequest(req, getWeeklySignificantChanges, {
    skipUsageRecording: true,
  })
}

async function getWeeklySignificantChanges(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
): Promise<ChangeHistorySummary> {
  /*
   * Special handling for change_event: Google Ads API has strict limitations
   * - ALL_TIME is not supported
   * - LAST_30_DAYS, LAST_QUARTER, and 180days often fail with
   * "START_DATE_TOO_OLD" error - Safe range is LAST_14_DAYS or shorter
   */
  let effectiveTimeRange = timeRange
  if (
    timeRange === 'ALL_TIME' ||
    timeRange === 'alltime' ||
    timeRange === 'LAST_7_DAYS' ||
    timeRange === 'LAST_30_DAYS' ||
    timeRange === 'LAST_QUARTER' ||
    timeRange === '180days'
  ) {
    effectiveTimeRange = 'LAST_14_DAYS'
    console.log(
      `[WeeklySignificantChanges] ${timeRange} not supported for change_event, using LAST_14_DAYS instead`,
    )
  }

  // Use the same time range formatting as other endpoints
  const formattedTimeRange = formatTimeRangeForGAQL(effectiveTimeRange)

  console.log(`[WeeklySignificantChanges] Original timeRange: ${timeRange}`)
  console.log(`[WeeklySignificantChanges] Effective timeRange: ${effectiveTimeRange}`)
  console.log(`[WeeklySignificantChanges] Formatted timeRange: ${formattedTimeRange}`)

  // Build WHERE clause - for change_event, we ALWAYS need a date filter
  const whereClause = formattedTimeRange
    ? `change_event.change_date_time DURING ${formattedTimeRange} AND`
    : `change_event.change_date_time DURING LAST_14_DAYS AND`

  /*
   * Conservative GAQL query for change history with proven resource types
   */
  const changeHistoryQuery = `
    SELECT
      change_event.change_date_time,
      change_event.user_email,
      change_event.change_resource_type,
      change_event.resource_change_operation,
      change_event.campaign,
      change_event.ad_group
    FROM change_event
    WHERE
      ${whereClause}
      change_event.change_resource_type IN (
        'CAMPAIGN',
        'AD_GROUP', 
        'AD_GROUP_AD',
        'AD_GROUP_CRITERION',
        'CAMPAIGN_BUDGET'
      )
    ORDER BY change_event.change_date_time DESC
    LIMIT ${getLimit('CHANGE_HISTORY_SUMMARY')}
  `

  try {
    const response = await googleAdsApiRequest(
      accessToken,
      accountId,
      changeHistoryQuery,
      userId,
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `[WeeklySignificantChanges] API request failed: ${response.status} - ${errorText}`,
      )

      /*
       * Always return empty results instead of throwing to prevent breaking
       * weekly reports
       */
      console.log(`[WeeklySignificantChanges] Returning empty results due to API error`)
      return {
        change_history: {
          comment: 'No weekly significant changes data available due to API error',
          headers: [
            'Date/Time',
            'User',
            'Change Type',
            'Item Changed',
            'Campaign',
            'Ad Group',
            'Operation',
          ],
          rows: [],
        },
        summary: {
          totalChanges: 0,
          dateRange: effectiveTimeRange ?? 'LAST_14_DAYS',
          mostActiveUser: 'N/A',
          mostChangedCampaign: 'N/A',
        },
      }
    }

    const data = await response.json()
    const results = data.results || []

    if (!results || results.length === 0) {
      console.log(`[WeeklySignificantChanges] No results found`)
      return {
        change_history: {
          comment: `No weekly significant changes found for ${(effectiveTimeRange ?? 'LAST_14_DAYS')
            .toLowerCase()
            .replace('_', ' ')}`,
          headers: [
            'Date/Time',
            'User',
            'Change Type',
            'Item Changed',
            'Campaign',
            'Ad Group',
            'Operation',
          ],
          rows: [],
        },
        summary: {
          totalChanges: 0,
          dateRange: effectiveTimeRange ?? 'LAST_14_DAYS',
          mostActiveUser: 'N/A',
          mostChangedCampaign: 'N/A',
        },
      }
    }

    // Process results
    const rows: string[][] = []
    const userCounts: Record<string, number> = {}
    const campaignCounts: Record<string, number> = {}

    results.forEach((result: any) => {
      const changeDateTime = result.changeEvent?.changeDateTime || 'N/A'
      const userEmail = result.changeEvent?.userEmail || 'N/A'
      const changeResourceType = result.changeEvent?.changeResourceType || 'N/A'
      const resourceChangeOperation = result.changeEvent?.resourceChangeOperation || 'N/A'
      const campaign = result.changeEvent?.campaign || 'N/A'
      const adGroup = result.changeEvent?.adGroup || 'N/A'

      // Count users and campaigns for summary
      if (userEmail !== 'N/A') {
        userCounts[userEmail] = (userCounts[userEmail] || 0) + 1
      }
      if (campaign !== 'N/A') {
        campaignCounts[campaign] = (campaignCounts[campaign] || 0) + 1
      }

      rows.push([
        changeDateTime,
        userEmail,
        changeResourceType,
        `${changeResourceType} ${resourceChangeOperation}`,
        campaign,
        adGroup,
        resourceChangeOperation,
      ])
    })

    // Find most active user and most changed campaign
    const mostActiveUser = Object.keys(userCounts).length > 0
      ? Object.keys(userCounts).reduce((a, b) => userCounts[a] > userCounts[b] ? a : b)
      : 'N/A'
    const mostChangedCampaign = Object.keys(campaignCounts).length > 0
      ? Object.keys(campaignCounts).reduce((a, b) => campaignCounts[a] > campaignCounts[b] ? a : b)
      : 'N/A'

    return {
      change_history: {
        comment: `Weekly significant changes for ${(effectiveTimeRange ?? 'LAST_14_DAYS')
          .toLowerCase()
          .replace('_', ' ')} showing ${rows.length} changes`,
        headers: [
          'Date/Time',
          'User',
          'Change Type',
          'Item Changed',
          'Campaign',
          'Ad Group',
          'Operation',
        ],
        rows,
      },
      summary: {
        totalChanges: rows.length,
        dateRange: effectiveTimeRange ?? 'LAST_14_DAYS',
        mostActiveUser,
        mostChangedCampaign,
      },
    }
  } catch (error: unknown) {
    console.error('[WeeklySignificantChanges] Error fetching weekly significant changes:', error)

    // Always return empty results to prevent breaking weekly reports
    console.log(`[WeeklySignificantChanges] Returning empty results due to error`)
    return {
      change_history: {
        comment: 'No weekly significant changes data available due to API error',
        headers: [
          'Date/Time',
          'User',
          'Change Type',
          'Item Changed',
          'Campaign',
          'Ad Group',
          'Operation',
        ],
        rows: [],
      },
      summary: {
        totalChanges: 0,
        dateRange: effectiveTimeRange ?? 'LAST_14_DAYS',
        mostActiveUser: 'N/A',
        mostChangedCampaign: 'N/A',
      },
    }
  }
} 