import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { buildDateFilter, googleAdsApiRequest } from '../utils'
import { getLimit } from '../limits'

export async function POST(req: NextRequest) {
  return handleRequest(req, getAudienceData)
}

interface AudienceList {
  id: string
  name: string
  description: string
  type: string
  size: number
  searchSize: number
  membershipStatus: string
  membershipLifeSpan: number
  closingReason?: string
  accessReason?: string
}

interface DemographicData {
  ageRange: string
  impressions: number
  clicks: number
  conversions: number
  cost: number
  ctr: number
  conversionRate: number
  campaignCount: number
}

interface AudienceDataResponse {
  audienceLists: AudienceList[]
  demographics: DemographicData[]
  summary: {
    totalLists: number
    totalAudienceSize: number
    activeAgeRanges: number
  }
}

interface UserListApiResponse {
  results: {
    userList?: {
      id: string
      name: string
      description: string
      membershipStatus: string
      membershipLifeSpan: string
      sizeForDisplay: string
      sizeForSearch: string
      type: string
      closingReason?: string
      accessReason?: string
    }
  }[]
}

interface DemographicApiResponse {
  results: {
    campaign?: {
      id: string
      name: string
    }
    adGroup?: {
      id: string
      name: string
    }
    ageRangeView?: {
      type: string
    }
    metrics?: {
      impressions: string
      clicks: string
      conversions: string
      costMicros: string
    }
  }[]
}

async function getAudienceData(
  accessToken: string,
  accountId: string,
  timeRange?: string,
  campaignId?: string,
  userId?: string,
): Promise<AudienceDataResponse> {
  // Build date filter
  const dateFilter = buildDateFilter(timeRange)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const endDate = yesterday.toISOString().split('T')[0]
  
  // Calculate start date based on time range - default to 180 days
  const startDate = new Date()
  const daysBack = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 180
  startDate.setDate(startDate.getDate() - daysBack)
  const startDateStr = startDate.toISOString().split('T')[0]

  // Build campaign filter if campaign ID is provided
  const campaignFilter = campaignId ? `AND campaign.id = '${campaignId}'` : ''

  // Query for user lists (remarketing lists)
  const userListQuery = `
    SELECT
      user_list.id,
      user_list.name,
      user_list.description,
      user_list.membership_status,
      user_list.membership_life_span,
      user_list.size_for_display,
      user_list.size_for_search,
      user_list.type,
      user_list.closing_reason,
      user_list.access_reason
    FROM user_list
    WHERE user_list.type != 'UNKNOWN'
    ORDER BY user_list.size_for_display DESC
    LIMIT ${getLimit('AUDIENCE_DATA')}
  `

  // Query for demographic data
  const demographicQuery = `
    SELECT
      campaign.id,
      campaign.name,
      ad_group.id,
      ad_group.name,
      age_range_view.type,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.cost_micros,
      segments.date
    FROM age_range_view
    WHERE
      metrics.impressions > 0
      AND campaign.status = 'ENABLED'
      AND ad_group.status = 'ENABLED'
      AND segments.date >= '${startDateStr}' AND segments.date <= '${endDate}'
      ${campaignFilter}
    ORDER BY metrics.impressions DESC
    LIMIT ${getLimit('AUDIENCE_DATA')}
  `

  try {
    // Execute the Google Ads API queries
    const [userListResponse, demographicResponse] = await Promise.all([
      googleAdsApiRequest(accessToken, accountId, userListQuery, userId),
      googleAdsApiRequest(accessToken, accountId, demographicQuery, userId),
    ])

    // Handle API errors gracefully - log but don't throw
    if (!userListResponse.ok) {
      console.error(`User list API request failed with status: ${userListResponse.status}`)
    }
    if (!demographicResponse.ok) {
      console.error(`Demographic API request failed with status: ${demographicResponse.status}`)
    }

    // Parse responses only if they were successful
    let userListData: UserListApiResponse = { results: [] }
    let demographicData: DemographicApiResponse = { results: [] }
    
    if (userListResponse.ok) {
      try {
        userListData = await userListResponse.json()
      } catch (error) {
        console.error('Error parsing user list response:', error)
      }
    }
    
    if (demographicResponse.ok) {
      try {
        demographicData = await demographicResponse.json()
      } catch (error) {
        console.error('Error parsing demographic response:', error)
      }
    }

    // Process user lists
    const audienceLists: AudienceList[] = userListData.results
      .filter((result) => result.userList)
      .map((result) => {
        const userList = result.userList!
        return {
          id: userList.id,
          name: userList.name || 'Unnamed List',
          description: userList.description || '',
          type: userList.type,
          size: parseInt(userList.sizeForDisplay) || 0,
          searchSize: parseInt(userList.sizeForSearch) || 0,
          membershipStatus: userList.membershipStatus,
          membershipLifeSpan: parseInt(userList.membershipLifeSpan) || 0,
          closingReason: userList.closingReason,
          accessReason: userList.accessReason,
        }
      })

    // Process demographic data
    const rawDemographicData = demographicData.results
      .filter((result) => result.campaign && result.adGroup && result.ageRangeView && result.metrics)
      .map((result) => {
        const campaign = result.campaign!
        const adGroup = result.adGroup!
        const ageRange = result.ageRangeView!
        const metrics = result.metrics!
        
        return {
          campaignId: campaign.id,
          campaignName: campaign.name,
          adGroupId: adGroup.id,
          adGroupName: adGroup.name,
          ageRange: ageRange.type,
          impressions: parseInt(metrics.impressions),
          clicks: parseInt(metrics.clicks),
          conversions: parseFloat(metrics.conversions),
          costMicros: parseInt(metrics.costMicros),
        }
      })

    // Aggregate demographic data by age range
    const ageRangeStats = rawDemographicData.reduce((acc: any, item: any) => {
      const ageRange = item.ageRange
      if (!acc[ageRange]) {
        acc[ageRange] = {
          ageRange,
          totalImpressions: 0,
          totalClicks: 0,
          totalConversions: 0,
          totalCostMicros: 0,
          campaigns: new Set(),
        }
      }
      acc[ageRange].totalImpressions += item.impressions
      acc[ageRange].totalClicks += item.clicks
      acc[ageRange].totalConversions += item.conversions
      acc[ageRange].totalCostMicros += item.costMicros
      acc[ageRange].campaigns.add(item.campaignName)
      return acc
    }, {})

    // Convert to array and calculate metrics
    const processedDemographics: DemographicData[] = Object.values(ageRangeStats).map(
      (stats: any) => ({
        ageRange: stats.ageRange,
        impressions: stats.totalImpressions,
        clicks: stats.totalClicks,
        conversions: stats.totalConversions,
        cost: stats.totalCostMicros / 1000000, // Convert from micros
        ctr:
          stats.totalImpressions > 0
            ? (stats.totalClicks / stats.totalImpressions) * 100
            : 0,
        conversionRate:
          stats.totalClicks > 0
            ? (stats.totalConversions / stats.totalClicks) * 100
            : 0,
        campaignCount: stats.campaigns.size,
      })
    )

    return {
      audienceLists,
      demographics: processedDemographics,
      summary: {
        totalLists: audienceLists.length,
        totalAudienceSize: audienceLists.reduce(
          (sum: number, list: AudienceList) => sum + list.size,
          0
        ),
        activeAgeRanges: processedDemographics.length,
      },
    }
  } catch (error) {
    console.error('Error fetching audience data:', error)
    // Return empty data instead of throwing error, like asset-performance-matrix does
    return {
      audienceLists: [],
      demographics: [],
      summary: {
        totalLists: 0,
        totalAudienceSize: 0,
        activeAgeRanges: 0,
      },
    }
  }
}