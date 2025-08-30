import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { ChangeHistorySummary } from '../types'
import { formatTimeRangeForGAQL, googleAdsApiRequest } from '../utils'
import { getLimit } from '../limits'

export async function POST(req: NextRequest) {
  return handleRequest(req, getChangeHistorySummary, {
    skipUsageRecording: true,
  })
}

async function getChangeHistorySummary(
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
      `[ChangeHistory] ${timeRange} not supported for change_event, using LAST_14_DAYS instead`,
    )
  }

  // Use the same time range formatting as other endpoints
  const formattedTimeRange = formatTimeRangeForGAQL(effectiveTimeRange)

  console.log(`[ChangeHistory] Original timeRange: ${timeRange}`)
  console.log(`[ChangeHistory] Effective timeRange: ${effectiveTimeRange}`)
  console.log(`[ChangeHistory] Formatted timeRange: ${formattedTimeRange}`)

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
        `[ChangeHistory] API request failed: ${response.status} - ${errorText}`,
      )

      /*
       * Always return empty results instead of throwing to prevent breaking
       * weekly reports
       */
      console.log(`[ChangeHistory] Returning empty results due to API error`)
      return {
        change_history: {
          comment: 'No change history data available due to API error',
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

    const apiData = (await response.json()) as {
      results?: {
        changeEvent: {
          changeDateTime: string
          userEmail: string
          changeResourceType: string
          resourceChangeOperation: string
          campaign?: { name: string }
          adGroup?: { name: string }
        }
      }[]
    }

    console.log(
      `[ChangeHistory] API response results count: ${
        apiData.results?.length ?? 0
      }`,
    )

    const headers = [
      'Date/Time',
      'User',
      'Change Type',
      'Item Changed',
      'Campaign',
      'Ad Group',
      'Operation',
    ]
    const rows: (string | number)[][] = []
    let mostActiveUser = 'N/A'
    let mostChangedCampaign = 'N/A'
    const userCounts: Record<string, number> = {}
    const campaignCounts: Record<string, number> = {}

    if (apiData.results && apiData.results.length > 0) {
      apiData.results.forEach((result) => {
        const changeEvent = result.changeEvent

        // Create a descriptive change description based on available data
        const operation = changeEvent.resourceChangeOperation ?? ''
        const resourceType = changeEvent.changeResourceType ?? ''
        const campaignName = changeEvent.campaign?.name ?? ''
        const adGroupName = changeEvent.adGroup?.name ?? ''
        const userEmail = changeEvent.userEmail ?? 'Unknown'
        const changeDateTime = changeEvent.changeDateTime ?? ''

        // Count users and campaigns for summary
        userCounts[userEmail] = (userCounts[userEmail] || 0) + 1
        if (campaignName) {
          campaignCounts[campaignName] = (campaignCounts[campaignName] || 0) + 1
        }

        rows.push([
          changeDateTime,
          userEmail,
          resourceType,
          `${resourceType} (${operation})`,
          campaignName,
          adGroupName,
          operation,
        ])
      })

      // Find most active user and most changed campaign
      if (Object.keys(userCounts).length > 0) {
        mostActiveUser = Object.entries(userCounts).reduce((a, b) =>
          userCounts[a[0]] > userCounts[b[0]] ? a : b,
        )[0]
      }
      if (Object.keys(campaignCounts).length > 0) {
        mostChangedCampaign = Object.entries(campaignCounts).reduce((a, b) =>
          campaignCounts[a[0]] > campaignCounts[b[0]] ? a : b,
        )[0]
      }

      console.log(
        `[ChangeHistory] Successfully processed ${rows.length} changes`,
      )
    } else {
      console.log(
        `[ChangeHistory] No changes found for timeRange: ${effectiveTimeRange}`,
      )
    }

    return {
      change_history: {
        comment: `Change history for ${(effectiveTimeRange ?? 'LAST_14_DAYS')
          .toLowerCase()
          .replace('_', ' ')} showing ${rows.length} changes`,
        headers,
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
    console.error('[ChangeHistory] Error fetching change history:', error)

    // Always return empty results to prevent breaking weekly reports
    console.log(`[ChangeHistory] Returning empty results due to error`)
    return {
      change_history: {
        comment: 'No change history data available due to API error',
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
