import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { ImpressionShareLost } from '../types'
import { getRandomFloat, getRandomInt } from '../utils'

export async function POST(req: NextRequest) {
  return handleRequest(req, getImpressionShareLost)
}

async function getImpressionShareLost(): Promise<ImpressionShareLost> {
  /*
   * accessToken: string,
   * accountId: string,
   * timeRange?: string,
   * campaignId?: string,
   */
  /*
   * Basic implementation returning mock data
   * In a real implementation, you would query the Google Ads API
   * and process the data accordingly.
   */

  // Generate campaign data with intelligent rounding
  const campaignNames = [
    'Brand Awareness',
    'Product Solutions',
    'Competitor Campaign',
    'Display Remarketing',
    'Shopping Campaign',
    'Dynamic Search Ads',
    'Performance Max',
    'Smart Shopping',
    'Discovery Ads',
  ]

  const campaignsData = campaignNames.map((name) => {
    const lostBudget = Math.round(getRandomFloat(0, 45) * 10) / 10
    const lostRank = Math.round(getRandomFloat(0, 35) * 10) / 10
    const totalLost = Math.round((lostBudget + lostRank) * 10) / 10
    const impressions = getRandomInt(10000, 100000)

    return {
      name,
      lostBudget,
      lostRank,
      totalLost,
      impressions,
    }
  })

  // Sort by total lost (highest first) and take top performers
  campaignsData.sort((a, b) => b.totalLost - a.totalLost)
  const topCampaigns = campaignsData.slice(0, 8) // Focus on top 8 worst performers

  const avgLostBudget =
    Math.round(
      (topCampaigns.reduce((sum, c) => sum + c.lostBudget, 0) /
        topCampaigns.length) *
        10,
    ) / 10
  const avgLostRank =
    Math.round(
      (topCampaigns.reduce((sum, c) => sum + c.lostRank, 0) /
        topCampaigns.length) *
        10,
    ) / 10
  const highRiskCampaigns = topCampaigns.filter((c) => c.totalLost > 25).length

  const data: ImpressionShareLost = {
    impression_share_lost: {
      headers: [
        'campaignName',
        'lostBudget',
        'lostRank',
        'totalLost',
        'impressions',
      ],
      rows: topCampaigns.map((campaign) => [
        campaign.name,
        campaign.lostBudget,
        campaign.lostRank,
        campaign.totalLost,
        campaign.impressions,
      ]),
    },
    summary: {
      avgLostBudget,
      avgLostRank,
      highRiskCampaigns,
    },
  }

  return data
}
