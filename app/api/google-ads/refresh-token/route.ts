import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface RefreshTokenRequest {
  refreshToken: string
}

interface GoogleOAuthResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
}

export async function POST(req: NextRequest) {
  try {
    // Check user authentication first
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              /*
               * The `setAll` method was called from a Server Component.
               * This can be ignored if you have middleware refreshing
               * user sessions.
               */
            }
          },
        },
      },
    )

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError ?? !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in again.' },
        { status: 401 },
      )
    }

    const { refreshToken } = (await req.json()) as RefreshTokenRequest

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 },
      )
    }

    // Exchange refresh token for a new access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to refresh token: ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = (await response.json()) as GoogleOAuthResponse

    return NextResponse.json({
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    })
  } catch (error) {
    console.error('Failed to refresh Google Ads token:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
