import { NextRequest, NextResponse } from 'next/server'
import { saveGoogleAdsTokens } from '@/utils/supabase/google-ads'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)

  // Get authorization code from Google OAuth
  const code = url.searchParams.get('code')

  // Get state parameter (contains user ID and return path)
  const stateParam = url.searchParams.get('state')

  if (!code || !stateParam) {
    console.error('Missing code or state parameter')
    return NextResponse.redirect(
      new URL('/google-ads?error=missing_parameters', req.url),
    )
  }

  try {
    // Parse state to get user info and return path
    const state = JSON.parse(stateParam) as {
      userId: string
      returnTo: string
    }
    let returnTo = state.returnTo ? state.returnTo : '/'

    // После успешной авторизации Google Ads всегда открываем модальное окно
    if (!returnTo.includes('open_google_ads_modal=true')) {
      const separator = returnTo.includes('?') ? '&' : '?'
      returnTo = returnTo + separator + 'open_google_ads_modal=true'
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        redirect_uri: `${url.origin}/api/google-ads/callback`,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      console.error(`Token exchange failed: ${tokenResponse.statusText}`)
      throw new Error(`Token exchange failed: ${tokenResponse.statusText}`)
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string
      refresh_token: string
      expires_in: number
    }

    // Save tokens to database
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000)
    await saveGoogleAdsTokens(
      state.userId,
      tokenData.access_token,
      tokenData.refresh_token,
      expiresAt,
    )

    // Create token data object with the correct structure
    const tokenDataObj = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: expiresAt.getTime(),
    }

    // Create a response that redirects to the return path
    const response = NextResponse.redirect(new URL(returnTo, req.url))

    // Set the token data in a cookie
    response.cookies.set('google_ads_tokens', JSON.stringify(tokenDataObj), {
      httpOnly: false, // Allow JavaScript to access it
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5, // Valid for 5 minutes to ensure it's read by the client
      path: '/',
    })

    return response
  } catch (error) {
    console.error('OAuth callback error:', error)

    // Redirect to Google Ads page on error with error parameter
    return NextResponse.redirect(
      new URL('/google-ads?error=oauth_callback_failed', req.url),
    )
  }
}
