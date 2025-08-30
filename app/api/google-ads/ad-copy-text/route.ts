import { NextRequest } from 'next/server'
import { handleRequest } from '../requestHandler'
import { AdCopyText } from '../types'
import { buildCampaignFilter, googleAdsApiRequest } from '../utils'
import { getLimit } from '../limits'

interface GoogleAdsResponse {
  results: {
    campaign: { name: string }
    adGroup: { name: string }
    adGroupAd: {
      ad: {
        responsiveSearchAd: {
          headlines: { text: string }[]
          descriptions: { text: string }[]
        }
      }
    }
  }[]
}

export async function POST(req: NextRequest) {
  return handleRequest(req, getAdCopyText, {
    skipUsageRecording: true,
  })
}

async function getAdCopyText(
  accessToken: string,
  accountId: string,
  _timeRange?: string, // not used but kept for signature compatibility
  campaignId?: string,
  userId?: string,
): Promise<AdCopyText> {
  const campaignFilter = buildCampaignFilter(campaignId)

  const query = `
    SELECT
      campaign.name,
      ad_group.name,
      ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.ad.responsive_search_ad.descriptions
    FROM ad_group_ad
    WHERE ad_group_ad.status = 'ENABLED'
      AND campaign.status = 'ENABLED'
      ${campaignFilter}
    LIMIT ${getLimit('AD_COPY_TEXT')}
  `

  try {
    const response = await googleAdsApiRequest(
      accessToken,
      accountId,
      query,
      userId,
    )

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Google Ads API error: ${errText}`)
    }

    const json = (await response.json()) as GoogleAdsResponse

    const ads: AdCopyText['ads'] = (json.results ?? []).map((r) => {
      // Extract headlines/descriptions text from AdTextAsset array
      const headlines: string[] = (
        r.adGroupAd.ad.responsiveSearchAd.headlines ?? []
      ).map((h) => h.text ?? '')
      const descriptions: string[] = (
        r.adGroupAd.ad.responsiveSearchAd.descriptions ?? []
      ).map((d) => d.text ?? '')

      return {
        campaignName: r.campaign.name,
        adGroupName: r.adGroup.name,
        headlines,
        descriptions,
      }
    })

    return { ads }
  } catch (error) {
    console.error('Error fetching ad copy text:', error)

    // Mock fallback
    return {
      ads: [
        {
          campaignName: 'Search - Brand',
          adGroupName: 'Generic Terms',
          headlines: ['Save 20% Today', 'Free Shipping Worldwide'],
          descriptions: [
            'Limited time offer – shop now and save on all items.',
            'Join 10,000+ happy customers enjoying our products.',
          ],
        },
      ],
    }
  }
}
