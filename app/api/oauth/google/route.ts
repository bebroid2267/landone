import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)

  // Get query parameters
  const redirectUri = url.searchParams.get('redirect_uri')
  const state = url.searchParams.get('state')
  const scope = url.searchParams.get('scope') ?? 'email profile'

  if (!redirectUri) {
    return NextResponse.json(
      { error: 'Redirect URI is required' },
      { status: 400 },
    )
  }

  // Build Google OAuth URL
  const googleOAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  googleOAuthUrl.searchParams.append(
    'client_id',
    process.env.GOOGLE_CLIENT_ID ?? '',
  )
  googleOAuthUrl.searchParams.append('redirect_uri', redirectUri)
  googleOAuthUrl.searchParams.append('response_type', 'code')
  googleOAuthUrl.searchParams.append('scope', scope)

  // Include state if provided
  if (state) {
    googleOAuthUrl.searchParams.append('state', state)
  }

  // Add access type and prompt parameters for better user experience
  googleOAuthUrl.searchParams.append('access_type', 'offline')

  /*
   * Use prompt=consent only for first-time registration,
   * otherwise select_account
   */
  const promptParam = state?.includes('register') ? 'consent' : 'select_account'
  googleOAuthUrl.searchParams.append('prompt', promptParam)

  // Redirect to Google OAuth login page
  return NextResponse.redirect(googleOAuthUrl.toString())
}
