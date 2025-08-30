import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { fetchGoogleAdsAccounts } from '@/utils/supabase/google-ads'

export async function POST() {
  try {
    // Get the authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      // Try to refresh session if it's expired
      if (
        authError.message.includes('expired') ||
        authError.message.includes('invalid')
      ) {
        try {
          const { data: refreshData } = await supabase.auth.refreshSession()
          if (refreshData.session?.user) {
            // Continue with refreshed session
            console.log('Session refreshed in accounts API')
          } else {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
          }
        } catch (refreshError) {
          console.error('Failed to refresh session:', refreshError)
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use the server-side function that handles token refresh automatically
    const accounts = await fetchGoogleAdsAccounts(user.id)

    // Transform to match the expected format
    const formattedAccounts = accounts.map((account) => ({
      accountId: account.account_id,
      accountName: account.account_name ?? `Account ${account.account_id}`,
    }))

    return NextResponse.json(formattedAccounts)
  } catch (error) {
    console.error('Error fetching Google Ads accounts:', error)

    // Check if it's a specific "no accounts found" error
    if (
      error instanceof Error &&
      error.message.includes('Failed to get valid access token')
    ) {
      return NextResponse.json(
        {
          error:
            'No Google Ads accounts were found for this Google user. Please try another account that has access to Google Ads.',
        },
        { status: 401 },
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch Google Ads accounts',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
