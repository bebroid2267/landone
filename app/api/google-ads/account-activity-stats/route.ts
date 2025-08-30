import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { refreshGoogleAdsAccessToken } from '@/utils/supabase/google-ads'

interface AccountActivityStats {
  account_activity_last_30d: {
    cost: number
    clicks: number
    campaigns: string[]
    domains: string[]
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get data from Supabase instead of request body
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Get access token from database
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_ads_tokens')
      .select('access_token')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokenData?.access_token) {
      return NextResponse.json(
        { error: 'Google Ads access token not found' },
        { status: 401 }
      )
    }

    // Get account IDs from database
    const { data: accountsData, error: accountsError } = await supabase
      .from('google_ads_accounts')
      .select('account_id')
      .eq('user_id', user.id)

    if (accountsError || !accountsData?.length) {
      return NextResponse.json(
        { error: 'No Google Ads accounts found' },
        { status: 404 }
      )
    }

    const accessToken = tokenData.access_token
    const accountIds = accountsData.map(acc => acc.account_id)

    // Use the userId we already have
    const userId = user.id

    // Try to refresh token if userId present
    let currentAccessToken = accessToken
    if (userId) {
      const refreshed = await refreshGoogleAdsAccessToken(userId)
      if (refreshed) {
        currentAccessToken = refreshed
        console.log('[Account-Activity-Stats] Access token refreshed')
      }
    }

    const host = req.headers.get('host')
    const protocol = req.headers.get('x-forwarded-proto') ?? 'http'
    const baseUrl = host
      ? `${protocol}://${host}`
      : process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    const cookieHeader = req.headers.get('cookie') ?? ''

    // Collect stats for all accounts
    const accountStats: Record<string, AccountActivityStats> = {}

    for (const accountId of accountIds) {
      try {
        console.log(`[Account-Activity-Stats] Processing account: ${accountId}`)

        // Fetch campaigns data which contains cost, impressions, clicks, conversions data
        const campaignResponse = await fetch(`${baseUrl}/api/google-ads/campaigns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
          body: JSON.stringify({
            accessToken: currentAccessToken,
            accountId,
            timeRange: 'LAST_30_DAYS',
            skipLimitCheck: true // Skip audit limits for activity stats
          })
        })

        if (!campaignResponse.ok) {
          console.warn(`Failed to fetch data for account ${accountId}: ${campaignResponse.status}`)
          // Set zero stats for failed accounts
          accountStats[accountId] = {
            account_activity_last_30d: {
              cost: 0,
              clicks: 0,
              campaigns: [],
              domains: []
            }
          }
          continue
        }

        const campaignData = await campaignResponse.json()
        
        // Calculate totals and extract campaigns/domains from campaigns data
        let totalCost = 0
        let totalClicks = 0
        const campaigns: string[] = []
        const domains: string[] = []

        if (Array.isArray(campaignData)) {
          for (const campaign of campaignData) {
            if (campaign.metrics) {
              // Convert cost from micros to currency units
              totalCost += (campaign.metrics.costMicros || 0) / 1000000
              totalClicks += campaign.metrics.clicks || 0
              
              // Add campaign name if it has activity
              if (campaign.name && ((campaign.metrics.costMicros || 0) > 0 || (campaign.metrics.clicks || 0) > 0)) {
                campaigns.push(campaign.name)
              }
            }
          }
        }

        // Now fetch landing pages for domains
        try {
          const landingPageResponse = await fetch(`${baseUrl}/api/google-ads/landing-page-performance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
            body: JSON.stringify({
              accessToken: currentAccessToken,
              accountId,
              timeRange: 'LAST_30_DAYS',
              skipLimitCheck: true // Skip audit limits for activity stats
            })
          })
          
          if (landingPageResponse.ok) {
            const landingPageData = await landingPageResponse.json()
            if (landingPageData.pages && Array.isArray(landingPageData.pages)) {
              // Extract unique domains from final URLs
              const domainsSet = new Set<string>()
              landingPageData.pages.forEach((page: any) => {
                if (page.finalUrl && page.finalUrl !== 'UNKNOWN') {
                  try {
                    const url = new URL(page.finalUrl)
                    domainsSet.add(url.hostname.replace('www.', ''))
                  } catch {
                    // Skip invalid URLs
                  }
                }
              })
              domains.push(...Array.from(domainsSet).slice(0, 3)) // Limit to top 3 domains
            }
          }
        } catch (landingPageError) {
          console.warn(`Failed to fetch landing pages for account ${accountId}:`, landingPageError)
          // Continue without landing page data
        }

        accountStats[accountId] = {
          account_activity_last_30d: {
            cost: Math.round(totalCost * 100) / 100,
            clicks: totalClicks,
            campaigns: campaigns.slice(0, 3), // Limit to top 3 campaigns
            domains: domains
          }
        }

        console.log(`[Account-Activity-Stats] Account ${accountId} stats:`, accountStats[accountId])

      } catch (error) {
        console.error(`Error processing account ${accountId}:`, error)
        // Set zero stats for error accounts
        accountStats[accountId] = {
          account_activity_last_30d: {
            cost: 0,
            clicks: 0,
            campaigns: [],
            domains: []
          }
        }
      }
    }

    return NextResponse.json(accountStats)

  } catch (error) {
    console.error('Error in account activity stats:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}