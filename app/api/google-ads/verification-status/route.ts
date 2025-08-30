import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // Get Google OAuth configuration
    const clientId = process.env.GOOGLE_CLIENT_ID ?? ''
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? ''
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? ''

    return NextResponse.json({
      status: 'ok',
      config: {
        client_id_configured: !!clientId,
        client_secret_configured: !!clientSecret,
        developer_token_configured: !!developerToken,
        redirect_uri: `${req.nextUrl.origin}/api/google-ads/callback`,
      },
    })
  } catch (error) {
    console.error('Error checking Google verification status:', error)
    return NextResponse.json(
      { error: 'Failed to check verification status' },
      { status: 500 },
    )
  }
}
