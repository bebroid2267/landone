import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { RoasByDeviceGeography } from '../types'
import { googleAdsApiRequest } from '../utils'
import { getLimit } from '../limits'

interface CombinedApiResponse {
  results: {
    segments?: {
      device: string
    }
    geographicView?: {
      countryCriterionId: string
    }
    metrics?: {
      conversions: string
      conversionsValue: string
      costMicros: string
    }
  }[]
}

interface CountryNamesApiResponse {
  results: {
    geoTargetConstant?: {
      id: string
      name: string
    }
  }[]
}

export async function POST(req: NextRequest) {
  return handleRequest(req, getRoasByDeviceGeography)
}

async function getRoasByDeviceGeography(
  accessToken: string,
  accountId: string,
  userId?: string,
): Promise<RoasByDeviceGeography> {
  // Format the time range for GAQL

  // Query for combined device and country performance
  const combinedPerformanceQuery = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      segments.device,
      geographic_view.country_criterion_id,
      metrics.conversions,
      metrics.conversions_value,
      metrics.cost_micros
    FROM geographic_view
    WHERE
      metrics.impressions > 0
      AND metrics.conversions > 0
      AND campaign.status IN ('ENABLED', 'PAUSED')
    ORDER BY metrics.cost_micros DESC
    LIMIT ${getLimit('ROAS_BY_DEVICE_GEOGRAPHY')}
  `

  try {
    // Execute the single Google Ads API query
    const combinedResponse = await googleAdsApiRequest(
      accessToken,
      accountId,
      combinedPerformanceQuery,
      userId,
    )

    if (!combinedResponse.ok) {
      const errorText = await combinedResponse.text()
      console.error('Combined performance query failed:', {
        status: combinedResponse.status,
        statusText: combinedResponse.statusText,
        error: errorText,
      })
      throw new Error(`Combined performance query failed: ${errorText}`)
    }

    const combinedData = (await combinedResponse.json()) as CombinedApiResponse

    // Collect unique country IDs
    const countryIds = new Set<string>()
    combinedData.results?.forEach((result) => {
      const countryCriterionId = result.geographicView?.countryCriterionId
      if (countryCriterionId) {
        countryIds.add(countryCriterionId)
      }
    })

    // Fetch country names
    const countryNamesQuery = `
      SELECT 
        geo_target_constant.id,
        geo_target_constant.name
      FROM geo_target_constant
    `

    const countryNamesResponse = await googleAdsApiRequest(
      accessToken,
      accountId,
      countryNamesQuery,
      userId,
    )
    if (!countryNamesResponse.ok) {
      throw new Error('Failed to fetch country names')
    }

    const countryNamesData =
      (await countryNamesResponse.json()) as CountryNamesApiResponse
    const countryNameMap = new Map<string, string>()
    countryNamesData.results?.forEach((result) => {
      if (result.geoTargetConstant?.id && result.geoTargetConstant?.name) {
        countryNameMap.set(
          result.geoTargetConstant.id,
          result.geoTargetConstant.name,
        )
      }
    })

    // Process combined data
    const performanceData = new Map<
      string,
      Map<
        string,
        {
          conversions: number
          conversionValue: number
          cost: number
        }
      >
    >()

    combinedData.results?.forEach((result) => {
      const device = result.segments?.device ?? 'UNKNOWN'
      const countryCriterionId = result.geographicView?.countryCriterionId
      const countryName = countryCriterionId
        ? countryNameMap.get(countryCriterionId) ??
          `Country_${countryCriterionId}`
        : 'UNKNOWN'

      if (!performanceData.has(device)) {
        performanceData.set(device, new Map())
      }

      const deviceCountryData = performanceData.get(device)!
      const current = deviceCountryData.get(countryName) ?? {
        conversions: 0,
        conversionValue: 0,
        cost: 0,
      }

      current.conversions += parseFloat(result.metrics?.conversions ?? '0')
      current.conversionValue += parseFloat(
        result.metrics?.conversionsValue ?? '0',
      )
      current.cost += parseInt(result.metrics?.costMicros ?? '0') / 1000000

      deviceCountryData.set(countryName, current)
    })

    // Calculate ROAS/CPA and format the response
    const formattedData = Array.from(performanceData.entries()).map(
      ([device, countryMap]) => {
        const countries: Record<
          string,
          {
            roas: number
            cpa: number
            cost: number
            conversions: number
            roasVariance: number
            cpaVariance: number
          }
        > = {}

        countryMap.forEach((metrics, country) => {
          const roas =
            metrics.cost > 0 ? metrics.conversionValue / metrics.cost : 0
          const cpa =
            metrics.conversions > 0 ? metrics.cost / metrics.conversions : 0

          countries[country] = {
            roas: parseFloat(roas.toFixed(2)),
            cpa: parseFloat(cpa.toFixed(2)),
            cost: parseFloat(metrics.cost.toFixed(2)),
            conversions: Math.round(metrics.conversions),
            roasVariance: 0, // Will be calculated after we have all ROAS values
            cpaVariance: 0, // Will be calculated after we have all CPA values
          }
        })

        return {
          device,
          countries,
        }
      },
    )

    // Calculate account-wide medians and variances
    const allRoasValues: number[] = []
    const allCpaValues: number[] = []

    // Collect all ROAS and CPA values
    formattedData.forEach((deviceData) => {
      Object.values(deviceData.countries).forEach((countryData) => {
        if (countryData.roas > 0) {
          allRoasValues.push(countryData.roas)
        }
        if (countryData.cpa > 0) {
          allCpaValues.push(countryData.cpa)
        }
      })
    })

    const accountMedianRoas = calculateMedian(allRoasValues)
    const accountMedianCpa = calculateMedian(allCpaValues)

    // Calculate variances from median
    formattedData.forEach((deviceData) => {
      Object.values(deviceData.countries).forEach((countryData) => {
        if (countryData.roas > 0) {
          countryData.roasVariance = parseFloat(
            (
              ((countryData.roas - accountMedianRoas) / accountMedianRoas) *
              100
            ).toFixed(2),
          )
        }
        if (countryData.cpa > 0) {
          countryData.cpaVariance = parseFloat(
            (
              ((countryData.cpa - accountMedianCpa) / accountMedianCpa) *
              100
            ).toFixed(2),
          )
        }
      })
    })

    return {
      data: formattedData,
      accountMetrics: {
        medianRoas: parseFloat(accountMedianRoas.toFixed(2)),
        medianCpa: parseFloat(accountMedianCpa.toFixed(2)),
      },
    }
  } catch (error) {
    console.error('Error fetching ROAS by device and geography:', error)
    throw error
  }
}

// Helper function to calculate median
function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) {
    return 0
  }

  const sorted = [...numbers].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }

  return sorted[middle]
}
