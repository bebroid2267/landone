import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { ConversionTimingData } from '../types'
import { buildDateFilter, getRandomInt, googleAdsApiRequest } from '../utils'
import { getLimit } from '../limits'

const getDayOfWeekQuery = (timeRange?: string, campaignId?: string) => {
  const dateFilter = buildDateFilter(timeRange)
  const campaignFilter = campaignId ? `AND campaign.id = '${campaignId}'` : ''
  return `
    SELECT
      segments.day_of_week,
      metrics.conversions,
      metrics.all_conversions
    FROM campaign
    WHERE
      ${dateFilter ? `${dateFilter} AND` : ''}
      campaign.status IN ('ENABLED', 'PAUSED')
      ${campaignFilter}
    ORDER BY metrics.conversions DESC
    LIMIT ${getLimit('CONVERSION_TIMING')}
  `
}

const getHourOfDayQuery = (timeRange?: string, campaignId?: string) => {
  const dateFilter = buildDateFilter(timeRange)
  const campaignFilter = campaignId ? `AND campaign.id = '${campaignId}'` : ''
  return `
    SELECT
      segments.hour,
      metrics.conversions,
      metrics.all_conversions
    FROM campaign
    WHERE
      ${dateFilter ? `${dateFilter} AND` : ''}
      campaign.status IN ('ENABLED', 'PAUSED')
      ${campaignFilter}
    ORDER BY metrics.conversions DESC
    LIMIT ${getLimit('CONVERSION_TIMING')}
  `
}

const getCampaignShareQuery = (timeRange?: string, campaignId?: string) => {
  const dateFilter = buildDateFilter(timeRange)
  const campaignFilter = campaignId ? `AND campaign.id = '${campaignId}'` : ''
  return `
    SELECT
      campaign.name,
      metrics.conversions,
      metrics.all_conversions
    FROM campaign
    WHERE
      ${dateFilter ? `${dateFilter} AND` : ''}
      campaign.status IN ('ENABLED', 'PAUSED')
      ${campaignFilter}
    ORDER BY metrics.conversions DESC
    LIMIT ${getLimit('CONVERSION_TIMING')}
  `
}

export async function POST(req: NextRequest) {
  return handleRequest(req, getConversionTimingData)
}

async function getConversionTimingData(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
): Promise<ConversionTimingData> {
  try {
    // Execute Google Ads API queries
    const [dayOfWeekResponse, hourOfDayResponse, campaignShareResponse] =
      await Promise.all([
        googleAdsApiRequest(
          accessToken,
          accountId,
          getDayOfWeekQuery(timeRange, userId),
        ),
        googleAdsApiRequest(
          accessToken,
          accountId,
          getHourOfDayQuery(timeRange, userId),
        ),
        googleAdsApiRequest(
          accessToken,
          accountId,
          getCampaignShareQuery(timeRange, userId),
        ),
      ])

    // Check for successful responses
    if (
      !dayOfWeekResponse.ok ||
      !hourOfDayResponse.ok ||
      !campaignShareResponse.ok
    ) {
      // If any query fails, throw error
      const errorTexts = await Promise.all(
        [dayOfWeekResponse, hourOfDayResponse, campaignShareResponse]
          .filter((resp) => !resp.ok)
          .map((resp) => resp.text()),
      )
      throw new Error(
        `Failed to fetch conversion timing data: ${errorTexts.join(', ')}`,
      )
    }

    // Parse JSON responses
    const dayOfWeekData = (await dayOfWeekResponse.json()) as {
      results: {
        segments: {
          dayOfWeek: string
        }
        metrics: {
          conversions: string
          all_conversions: string
        }
      }[]
    }
    const hourOfDayData = (await hourOfDayResponse.json()) as {
      results: {
        segments: {
          hour: string
        }
        metrics: {
          conversions: string
          all_conversions: string
        }
      }[]
    }
    const campaignShareData = (await campaignShareResponse.json()) as {
      results: {
        campaign: {
          name: string
        }
        metrics: {
          conversions: string
          all_conversions: string
        }
      }[]
    }

    // Prepare data structure for response
    const data: ConversionTimingData = {
      dayOfWeek: {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0,
      },
      hourOfDay: {},
      campaignShare: {},
    }

    // Process day of week data
    if (dayOfWeekData.results && dayOfWeekData.results.length > 0) {
      const dayMap: Record<string, keyof typeof data.dayOfWeek> = {
        MONDAY: 'monday',
        TUESDAY: 'tuesday',
        WEDNESDAY: 'wednesday',
        THURSDAY: 'thursday',
        FRIDAY: 'friday',
        SATURDAY: 'saturday',
        SUNDAY: 'sunday',
      }

      // Fill with conversion data by day of week
      dayOfWeekData.results.forEach((result) => {
        const day = dayMap[result.segments.dayOfWeek]
        if (day) {
          data.dayOfWeek[day] =
            parseFloat(result.metrics.conversions ?? '0') || 0
        }
      })
    }

    // Process hour of day data
    if (hourOfDayData.results && hourOfDayData.results.length > 0) {
      // Fill with conversion data by hour
      hourOfDayData.results.forEach((result) => {
        const hour = result.segments.hour
        data.hourOfDay[hour] =
          parseFloat(result.metrics.conversions ?? '0') || 0
      })
    }

    // Process campaign share data
    if (campaignShareData.results && campaignShareData.results.length > 0) {
      let totalConversions = 0

      // First calculate total conversions
      campaignShareData.results.forEach((result) => {
        totalConversions += parseFloat(result.metrics.conversions ?? '0') || 0
      })

      // Fill with conversion data by campaign
      campaignShareData.results.forEach((result) => {
        const name = result.campaign.name
        const conversions = parseFloat(result.metrics.conversions ?? '0') || 0
        const share =
          totalConversions > 0
            ? parseFloat(((conversions / totalConversions) * 100).toFixed(1))
            : 0

        data.campaignShare[name] = { name, conversions, share }
      })
    }

    return data
  } catch (error) {
    console.error('Error fetching conversion timing data:', error)

    // Return mock data in case of error
    const data: ConversionTimingData = {
      dayOfWeek: {
        monday: 60,
        tuesday: 75,
        wednesday: 60,
        thursday: 72,
        friday: 78,
        saturday: 40,
        sunday: 35,
      },
      hourOfDay: {},
      campaignShare: {},
    }

    // Generate hourly data
    for (let i = 0; i < 24; i++) {
      data.hourOfDay[i.toString()] = getRandomInt(10, 100)
    }

    // Generate campaign share data
    const campaignNames = [
      'Brand Campaign',
      'Product Awareness',
      'Retargeting',
      'Shopping',
    ]
    let totalConversions = 0

    campaignNames.forEach((name) => {
      const conversions = getRandomInt(50, 300)
      totalConversions += conversions
      data.campaignShare[name] = {
        name,
        conversions,
        share: 0,
      }
    })

    // Calculate shares
    Object.keys(data.campaignShare).forEach((key) => {
      data.campaignShare[key].share = parseFloat(
        (
          (data.campaignShare[key].conversions / totalConversions) *
          100
        ).toFixed(1),
      )
    })

    return data
  }
}
