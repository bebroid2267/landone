import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { ConversionActionInventory } from '../types'
import { buildDateFilter, googleAdsApiRequest } from '../utils'
import { getLimit } from '../limits'

export async function POST(req: NextRequest) {
  return handleRequest(req, getConversionActionInventory)
}

async function getConversionActionInventory(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
): Promise<ConversionActionInventory> {
  // Build date filter (empty for ALL_TIME)
  const dateFilter = buildDateFilter(timeRange)

  // Build campaign filter if campaign ID is provided
  const campaignFilter = campaignId ? `AND campaign.id = '${campaignId}'` : ''

  /*
   * Updated query to fetch conversion actions through campaign resource
   * with segments
   */
  const conversionActionsQuery = `
    SELECT
      campaign.id,
      campaign.name,
      segments.conversion_action,
      segments.conversion_action_name,
      segments.conversion_action_category,
      metrics.all_conversions,
      metrics.conversions_value,
      metrics.conversions
    FROM
      campaign
    WHERE
      ${dateFilter ? `${dateFilter} AND` : ''}
      metrics.all_conversions > 0
      AND campaign.status IN ('ENABLED', 'PAUSED')
      ${campaignFilter}
    ORDER BY metrics.all_conversions DESC
    LIMIT ${getLimit('CONVERSION_ACTION_INVENTORY')}
  `

  try {
    // Execute the Google Ads API query
    const response = await googleAdsApiRequest(
      accessToken,
      accountId,
      conversionActionsQuery,
      userId,
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch conversion actions: ${errorText}`)
    }

    // Parse the API response
    const apiData = (await response.json()) as {
      results?: {
        campaign: {
          id: string
          name: string
        }
        segments: {
          conversionAction: string
          conversionActionName: string
          conversionActionCategory: string
        }
        metrics: {
          allConversions: string
          conversionsValue: string
          conversions: string
        }
      }[]
    }

    // Transform and aggregate the response by conversion action
    const actionMap = new Map<
      string,
      {
        name: string
        status: string
        type: string
        volume: number
      }
    >()

    if (apiData.results && apiData.results.length > 0) {
      // Group by conversion action and aggregate volumes
      apiData.results.forEach((result) => {
        // Skip entries without conversion action data
        if (!result.segments?.conversionAction) {
          return
        }

        const actionId = result.segments.conversionAction
        const existing = actionMap.get(actionId)

        // Use all_conversions if conversions is not available
        const conversionValue = parseInt(
          result.metrics.conversions ?? result.metrics.allConversions ?? '0',
          10,
        )

        if (existing) {
          // Add to existing conversion volume
          existing.volume += conversionValue
        } else {
          // Create new entry
          actionMap.set(actionId, {
            name: result.segments.conversionActionName || 'Unknown Conversion',
            status: 'Active', // Default since we can't get this directly
            type: result.segments.conversionActionCategory || 'Other',
            volume: conversionValue,
          })
        }
      })
    }

    // Convert map to array and sort
    const data: ConversionActionInventory = {
      actions: Array.from(actionMap.values()).sort(
        (a, b) => b.volume - a.volume,
      ),
    }

    return data
  } catch (error) {
    console.error('Error fetching conversion action inventory:', error)

    // Fallback to empty data if API call fails
    return { actions: [] }
  }
}
