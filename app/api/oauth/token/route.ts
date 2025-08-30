import { decrypt } from '@/utils/encrypt'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

type GrantType = 'authorization_code' | 'refresh_token'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await req.text()

    const params = new URLSearchParams(rawBody)

    const grantType = params.get('grant_type') as GrantType | null
    const clientId = params.get('client_id')
    const clientSecret = params.get('client_secret')

    if (
      !(
        clientId &&
        clientSecret &&
        clientId === process.env.CLIENT_ID &&
        clientSecret === process.env.CLIENT_SECRET
      )
    ) {
      return NextResponse.json(
        {
          error: 'Environment variables client_id or client_secret are missing',
        },
        { status: 400 },
      )
    }

    if (grantType) {
      switch (grantType) {
        case 'authorization_code': {
          const redirectUri = params.get('redirect_uri')
          const code = params.get('code')

          if (!code || !redirectUri) {
            return NextResponse.json(
              { error: 'Authorization code and redirect_uri are required' },
              { status: 400 },
            )
          }

          const exchangeSession = await supabaseAdmin
            .from('one_time_token_gpt')
            .select('*')
            .eq('code', code)
            .single()

          if (exchangeSession.error) {
            return NextResponse.json(
              {
                error:
                  exchangeSession.error.message ??
                  'Failed to exchange authorization code',
              },
              { status: exchangeSession.status },
            )
          } else {
            await supabaseAdmin
              .from('one_time_token_gpt')
              .delete()
              .eq('id', exchangeSession.data.id)
          }

          const {
            access_token,
            refresh_token,
            token_type,
            expires_in,
            created_at,
          } = exchangeSession.data

          if (Date.now() - new Date(created_at).getTime() > 8 * 60 * 1000) {
            return NextResponse.json(
              { error: 'Token Time Exceeded' },
              { status: 408 },
            )
          }

          const decrypted_access_token = decrypt(access_token)
          const decrypted_refresh_token = decrypt(refresh_token)

          const answer = {
            access_token: decrypted_access_token,
            refresh_token: decrypted_refresh_token,
            token_type,
            expires_in,
          }

          return NextResponse.json(answer)
        }
        case 'refresh_token': {
          const supabase = await createClient()
          const { data, error } = await supabase.auth.refreshSession({
            refresh_token: params.get('refresh_token')!,
          })

          if (error) {
            return NextResponse.json(
              { error: error.message },
              { status: error.status },
            )
          }

          if (data.session) {
            const { token_type, access_token, refresh_token, expires_in } =
              data.session
            const answer = {
              access_token,
              refresh_token,
              token_type,
              expires_in,
            }
            return NextResponse.json(answer)
          }

          return NextResponse.json(
            { error: 'Unhandled Error' },
            { status: 400 },
          )
        }
        default:
          return NextResponse.json(
            { error: 'The server cannot handle the current grand_type' },
            { status: 500 },
          )
      }
    } else {
      return NextResponse.json(
        { error: 'grand_type is missing' },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    )
  }
}
