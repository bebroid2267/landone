import { ERROR_AUTH_NAME } from '@/utils/constants'
import { encrypt } from '@/utils/encrypt'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/supabase-admin'
import { updateUserConsentStatus } from '@/utils/supabase/supabase-client'
//import { updateUserFirstData } from '@/utils/supabase/supabase-client'
import { NextRequest, NextResponse } from 'next/server'
import { saveGoogleAdsTokens } from '@/utils/supabase/google-ads'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)

  console.log('url', url)

  const code = url.searchParams.get('code')
  const register = url.searchParams.get('register')
  const redirect_uri = url.searchParams.get('redirect_uri')
  const google_ads_enabled =
    url.searchParams.get('google_ads_enabled') === 'true'

  /*
   * auth scope "email profile" from gpt oauth
   * auth scope "origin" from app
   * auth scope "email profile https://www.googleapis.com/auth/adwords" for Google Ads
   * auth scope with google_ads_enabled for integrated flow
   */
  const scope = url.searchParams.get('scope')

  if (code && register && redirect_uri) {
    const supabase = await createClient()
    const exachangedSession = await supabase.auth.exchangeCodeForSession(code)

    // Handle Google Ads scope OR integrated flow
    const hasGoogleAdsScope =
      scope?.includes('https://www.googleapis.com/auth/adwords') ?? false
    if (hasGoogleAdsScope || google_ads_enabled) {
      console.log('Google Ads integration detected (scope or integrated flow)')
      const validUrl = redirect_uri
        ? redirect_uri
        : process.env.NEXT_PUBLIC_SITE_URL!

      const response = NextResponse.redirect(validUrl)

      if (exachangedSession.error) {
        response.cookies.set(ERROR_AUTH_NAME, 'Error exchange code')
        return response
      }

      const session = exachangedSession.data.session
      if (session) {
        try {
          /*
           * Store the Google Ads tokens - use provider tokens,
           * not session tokens. Provider tokens are from Google OAuth,
           * while session tokens are from Supabase auth.
           */
          const providerToken = session.provider_token
          const providerRefreshToken = session.provider_refresh_token

          if (!providerToken) {
            console.error('Missing provider access token in session:', {
              hasProviderToken: !!providerToken,
              hasProviderRefreshToken: !!providerRefreshToken,
              hasRefreshToken: !!session.refresh_token,
              sessionKeys: Object.keys(session),
            })
            throw new Error(
              'Provider access token is missing from OAuth session',
            )
          }

          if (!providerRefreshToken) {
            console.error('Missing provider refresh token in session:', {
              hasProviderToken: !!providerToken,
              hasProviderRefreshToken: !!providerRefreshToken,
              hasRefreshToken: !!session.refresh_token,
              sessionKeys: Object.keys(session),
            })
            throw new Error(
              'Provider refresh token is missing from OAuth session. This usually means the user needs to re-authorize with "prompt=consent" parameter.',
            )
          }

          console.log('Using Google provider tokens:', {
            hasProviderToken: !!providerToken,
            hasProviderRefreshToken: !!providerRefreshToken,
          })

          await saveGoogleAdsTokens(
            session.user.id,
            providerToken,
            providerRefreshToken,
            new Date(Date.now() + session.expires_in * 1000),
          )

          console.log('Google Ads tokens saved successfully')

          // Set session cookie
          response.cookies.set('sb-refresh-token', session.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 90, // 90 days
          })

          /*
           * After successful Google Ads integration,
           * redirect to Google Ads page with auto_start parameter
           */
          const finalRedirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/google-ads?auto_start=true`

          console.log(
            '✅ [OAuth Callback] Google Ads tokens saved, redirecting:',
            {
              finalRedirectUrl,
              originalRedirectUri: redirect_uri,
              usedFallback: !redirect_uri,
              timestamp: new Date().toISOString(),
            },
          )

          return NextResponse.redirect(finalRedirectUrl)
        } catch (error) {
          console.error('Error saving Google Ads tokens:', error)
          response.cookies.set(
            ERROR_AUTH_NAME,
            'Error saving Google Ads tokens',
          )
          return response
        }
      }
      response.cookies.set(ERROR_AUTH_NAME, 'Exchanged session is null')
      return response
    }

    switch (scope) {
      case 'origin': {
        console.log('origin auth flow')
        const validUrl = redirect_uri
          ? redirect_uri
          : process.env.NEXT_PUBLIC_SITE_URL!

        const response = NextResponse.redirect(validUrl)

        if (exachangedSession.error) {
          response.cookies.set(ERROR_AUTH_NAME, 'Error exchange code')
          return response
        }

        const session = exachangedSession.data.session
        if (session) {
          try {
            const user = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)

            if (user.error) {
              response.cookies.set(
                ERROR_AUTH_NAME,
                'Error while check user consent',
              )
              return response
            }

            if (user.data.length) {
              const { id: user_id, consent_status } = user.data[0]

              if (register === 'true') {
                if (consent_status === 'not_specified') {
                  await updateUserConsentStatus(supabase, user_id, 'consented')
                } else {
                  response.cookies.set(
                    ERROR_AUTH_NAME,
                    'User is already registered',
                  )
                  return response
                }
              } else {
                if (consent_status === 'not_specified') {
                  response.cookies.set(
                    ERROR_AUTH_NAME,
                    'User is not registered yet',
                  )
                  return response
                }
              }
            } else {
              response.cookies.set(ERROR_AUTH_NAME, 'User details is null')
              return response
            }
          } catch (error) {
            response.cookies.set(ERROR_AUTH_NAME, 'Error while check user auth')
            return response
          }
          const { refresh_token } = session

          response.cookies.set('sb-refresh-token', refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 90, // 90 days
          })

          return response
        }
        response.cookies.set(ERROR_AUTH_NAME, 'Exchanged session is null')
        return response
      }
      case 'email profile': {
        const state = url.searchParams.get('state')
        if (!state) {
          return NextResponse.json(
            { error: 'state is missing' },
            { status: 400 },
          )
        }

        const queryParams = new URLSearchParams({
          state,
          redirect_uri,
          code,
          scope,
        })

        const response = NextResponse.redirect(
          `${url.origin}/oauth?${queryParams.toString()}`,
        )

        const authorizationUrl = `${redirect_uri}?${queryParams.toString()}`

        if (exachangedSession.error) {
          response.cookies.set(ERROR_AUTH_NAME, exachangedSession.error.message)
          return response
        }

        const session = exachangedSession.data.session
        if (session) {
          try {
            const user = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)

            if (user.error) {
              response.cookies.set(
                ERROR_AUTH_NAME,
                'Error while check user consent',
              )
              return response
            }

            const { token_type, access_token, refresh_token, expires_in } =
              session

            const encrypted_access_token = encrypt(access_token)
            const encrypted_refresh_token = encrypt(refresh_token)
            const { error } = await supabaseAdmin
              .from('one_time_token_gpt')
              .insert({
                code,
                token_type,
                access_token: encrypted_access_token,
                refresh_token: encrypted_refresh_token,
                expires_in,
              })
              .select()

            if (error) {
              response.cookies.set(
                ERROR_AUTH_NAME,
                'Error while save token in base',
              )
              return response
            }
            if (user.data.length) {
              const { consent_status } = user.data[0]

              if (consent_status !== 'consented') {
                queryParams.append('consent', 'not_specified')
                queryParams.append('accessToken', access_token)
                queryParams.append('refreshToken', refresh_token)
                console.log('---------------------- переход на oauth')
                const response = NextResponse.redirect(
                  `${url.origin}/oauth?${queryParams.toString()}`,
                )
                return response
              }
            } else {
              response.cookies.set(ERROR_AUTH_NAME, 'Error while check user')
              return response
            }

            return NextResponse.redirect(authorizationUrl)
          } catch (error) {
            response.cookies.set(ERROR_AUTH_NAME, 'Error while check user auth')
            return response
          }
        }
        response.cookies.set(ERROR_AUTH_NAME, 'Failed to exchange code')
        return response
      }
      default: {
        return NextResponse.json({ error: 'Invalid scope' }, { status: 500 })
      }
    }
  }
  if (scope === 'origin') {
    const validUrl = redirect_uri
      ? redirect_uri
      : process.env.NEXT_PUBLIC_SITE_URL!
    const response = NextResponse.redirect(validUrl)
    response.cookies.set(ERROR_AUTH_NAME, 'Auth params are missing')
    return response
  }
  return NextResponse.json(
    { error: 'Auth params are missing' },
    { status: 500 },
  )
}
