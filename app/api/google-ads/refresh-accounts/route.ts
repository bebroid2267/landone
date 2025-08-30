import { createClient } from '@/utils/supabase/server'
import { fetchGoogleAdsAccounts } from '@/utils/supabase/google-ads'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch accounts from Google Ads API
    const accounts = await fetchGoogleAdsAccounts(user.id)

    // Return the accounts
    return NextResponse.json({
      accounts,
      message: 'Google Ads accounts refreshed successfully',
    })
  } catch (error) {
    console.error('Error refreshing Google Ads accounts:', error)
    return NextResponse.json(
      { error: 'Failed to refresh Google Ads accounts' },
      { status: 500 },
    )
  }
}
