import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { ConversionActionSetup } from '../types'
import { googleAdsApiRequest } from '../utils'
import { getLimit } from '../limits'

export async function POST(req: NextRequest) {
  return handleRequest(req, getConversionActionSetup, {
    skipUsageRecording: true,
  })
}

async function getConversionActionSetup(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
): Promise<ConversionActionSetup> {
  // Query for conversion actions with detailed setup information
  const conversionActionsQuery = `
    SELECT
      conversion_action.name,
      conversion_action.status,
      conversion_action.category,
      conversion_action.primary_for_goal,
      conversion_action.include_in_conversions_metric,
      conversion_action.value_settings.default_value,
      conversion_action.counting_type,
      metrics.all_conversions
    FROM
      conversion_action
    WHERE
      conversion_action.status = 'ENABLED'
    ORDER BY metrics.all_conversions DESC
    LIMIT ${getLimit('CONVERSION_ACTION_SETUP')}
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
      throw new Error(`Failed to fetch conversion action setup: ${errorText}`)
    }

    // Parse the API response
    const apiData = (await response.json()) as {
      results?: {
        conversionAction: {
          name: string
          status: string
          category: string
          primaryForGoal: boolean
          includeInConversionsMetric: boolean
          valueSettings: {
            defaultValue: string
          }
          countingType: string
        }
        metrics: {
          allConversions: string
        }
      }[]
    }

    // Transform the response data
    const data: ConversionActionSetup = {
      conversionActions: [],
    }

    if (apiData.results && apiData.results.length > 0) {
      data.conversionActions = apiData.results.map((result) => {
        const conversionAction = result.conversionAction
        const metrics = result.metrics
        const last90DayVolume = parseFloat(metrics.allConversions || '0')
        const defaultValue = parseFloat(
          conversionAction.valueSettings.defaultValue || '0',
        )

        // Calculate basic ROAS (simplified calculation)
        const roas =
          last90DayVolume > 0 && defaultValue > 0
            ? defaultValue / (last90DayVolume * 100)
            : 0

        return {
          conversionActionName: conversionAction.name,
          status: conversionAction.status,
          category: conversionAction.category,
          isPrimary: conversionAction.primaryForGoal || false,
          hasValueMetric: conversionAction.includeInConversionsMetric || false,
          valueModelType: 'UNKNOWN', // Field not available in API
          last90DayVolume,
          roas: parseFloat(roas.toFixed(2)),
        }
      })
    }

    return data
  } catch (error) {
    console.error('Error fetching conversion action setup:', error)

    // Return empty data if API call fails
    return { conversionActions: [] }
  }
}
