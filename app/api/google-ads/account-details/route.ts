import { NextRequest, NextResponse } from 'next/server'
import { getLimit } from '../limits'

const developerToken: string = process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? ''

interface GoogleAdsAccountDetails {
  id: string
  descriptiveName: string
  currencyCode: string
  timeZone: string
  campaigns?: CampaignInfo[]
  error?: string
}

interface RequestBody {
  accessToken: string
  accountIds: string[]
}

interface GoogleAdsResponse {
  results: {
    customer: {
      id: string
      descriptiveName: string
      currencyCode: string
      timeZone: string
    }
  }[]
}

interface CampaignResult {
  campaign: {
    id: string
    name: string
    status: string
    advertisingChannelType: string
    servingStatus: string
  }
  metrics: {
    clicks: string
    impressions: string
    costMicros: string
  }
}

interface CampaignsResponse {
  results: CampaignResult[]
}

interface CampaignInfo {
  id: string
  name: string
  status: string
  channelType: string
  servingStatus: string
  metrics: {
    clicks: number
    impressions: number
    cost: number
  }
}

export async function POST(req: NextRequest) {
  try {
    const { accessToken, accountIds } = (await req.json()) as RequestBody

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 },
      )
    }

    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json(
        { error: 'Account IDs array is required' },
        { status: 400 },
      )
    }

    const accountDetails: GoogleAdsAccountDetails[] = []

    for (const accountId of accountIds) {
      try {
        // 1. Запрос основной информации об аккаунте
        const accountQuery = `
          SELECT
            customer.id,
            customer.descriptive_name,
            customer.currency_code,
            customer.time_zone
          FROM
            customer
          LIMIT ${getLimit('ACCOUNT_DETAILS_CUSTOMER')}
        `

        const accountResponse = await fetch(
          `https://googleads.googleapis.com/v19/customers/${accountId}/googleAds:search`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'developer-token': developerToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: accountQuery }),
          },
        )

        if (!accountResponse.ok) {
          const errorText = await accountResponse.text()
          console.error(
            `Failed to fetch details for account ${accountId}:`,
            errorText,
          )
          accountDetails.push({
            id: accountId,
            descriptiveName: `Account ${accountId}`,
            currencyCode: 'Unknown',
            timeZone: 'Unknown',
            error: `Failed to fetch details: ${accountResponse.statusText}`,
          })
          continue
        }

        const accountData = (await accountResponse.json()) as GoogleAdsResponse

        if (!accountData.results || accountData.results.length === 0) {
          accountDetails.push({
            id: accountId,
            descriptiveName: `Account ${accountId}`,
            currencyCode: 'Unknown',
            timeZone: 'Unknown',
            error: 'No account data returned from API',
          })
          continue
        }

        const customer = accountData.results[0].customer

        // 2. Запрос информации о кампаниях аккаунта
        const campaignsQuery = `
          SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            campaign.advertising_channel_type,
            campaign.serving_status,
            metrics.clicks,
            metrics.impressions,
            metrics.cost_micros
          FROM
            campaign
          WHERE
            campaign.status IN ('ENABLED', 'PAUSED')
          ORDER BY 
            metrics.cost_micros DESC
          LIMIT ${getLimit('ACCOUNT_DETAILS_CAMPAIGNS')}
        `

        const campaignsResponse = await fetch(
          `https://googleads.googleapis.com/v19/customers/${accountId}/googleAds:search`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'developer-token': developerToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: campaignsQuery }),
          },
        )

        let campaigns: CampaignResult[] = []

        if (campaignsResponse.ok) {
          const campaignsData =
            (await campaignsResponse.json()) as CampaignsResponse
          campaigns = campaignsData.results ?? []
        } else {
          console.error(
            `Failed to fetch campaigns for account ${accountId}:`,
            await campaignsResponse.text(),
          )
        }

        // Сохраняем полученные данные
        accountDetails.push({
          id: accountId,
          descriptiveName: customer.descriptiveName ?? `Account ${accountId}`,
          currencyCode: customer.currencyCode ?? 'Unknown',
          timeZone: customer.timeZone ?? 'Unknown',
          campaigns: campaigns.map((result: CampaignResult) => ({
            id: result.campaign.id,
            name: result.campaign.name,
            status: result.campaign.status,
            channelType: result.campaign.advertisingChannelType,
            servingStatus: result.campaign.servingStatus,
            metrics: {
              clicks: parseInt(result.metrics.clicks, 10) ?? 0,
              impressions: parseInt(result.metrics.impressions, 10) ?? 0,
              cost: parseInt(result.metrics.costMicros, 10) / 1000000 || 0,
            },
          })),
        })
      } catch (error) {
        console.error(`Error processing account ${accountId}:`, error)
        accountDetails.push({
          id: accountId,
          descriptiveName: `Account ${accountId}`,
          currencyCode: 'Unknown',
          timeZone: 'Unknown',
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return NextResponse.json(accountDetails)
  } catch (error) {
    console.error('Failed to fetch Google Ads account details:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
