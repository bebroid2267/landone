import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { AdGroupDistribution } from '../types'

export async function POST(req: NextRequest) {
  return handleRequest(req, getAdGroupDistribution)
}

async function getAdGroupDistribution(): Promise<AdGroupDistribution> {
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

  const data: AdGroupDistribution = {
    tiers: {
      lowSpend: { count: 47, spend: 1250.65 },
      mediumSpend: { count: 28, spend: 4875.3 },
      highSpend: { count: 15, spend: 12580.45 },
    },
    lowSpendAdGroups: [
      {
        name: 'Brand Terms - Low Priority',
        campaign: 'Brand Awareness',
        spend: 24.45,
        clicks: 8,
      },
      {
        name: 'Generic Solutions',
        campaign: 'Product Solutions',
        spend: 36.78,
        clicks: 12,
      },
      {
        name: 'Enterprise Features',
        campaign: 'Enterprise',
        spend: 42.19,
        clicks: 9,
      },
      {
        name: 'Competitor Terms',
        campaign: 'Competitive',
        spend: 18.22,
        clicks: 5,
      },
      {
        name: 'Long-Tail Keywords',
        campaign: 'Broad Coverage',
        spend: 15.87,
        clicks: 4,
      },
    ],
  }

  return data
}
