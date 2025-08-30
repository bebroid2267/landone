import { NextResponse, NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: req,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request: req,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Get current session (for middleware, session check is more lenient)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  let authenticatedUser = session?.user ?? null

  // If no session or session is expired, try to refresh
  if (
    !session ||
    (session.expires_at && new Date(session.expires_at * 1000) <= new Date())
  ) {
    try {
      const { data: refreshData, error: refreshError } =
        await supabase.auth.refreshSession()
      if (!refreshError && refreshData.session) {
        console.log('Session refreshed in middleware')
        authenticatedUser = refreshData.session.user
        // Update the response with new session cookies
        supabaseResponse = NextResponse.next({
          request: req,
        })
      } else {
        console.log(
          'Failed to refresh session in middleware:',
          refreshError?.message,
        )
        authenticatedUser = null
      }
    } catch (refreshError) {
      console.error('Error refreshing session in middleware:', refreshError)
      authenticatedUser = null
    }
  }

  const originalPath = req.nextUrl.pathname

  // Protected routes that require authentication
  const protectedRoutes = [
    '/api/uploadTextFile',
    '/api/add-user-domain',
    '/api/removeFile',
    '/api/uploadSvgFile',
  ]

  // Google Ads routes that require authentication (but not tokens)
  const googleAdsRoutes = [
    '/api/google-ads/accounts',
    '/api/google-ads/account-details',
    '/api/google-ads/campaigns',
    '/api/google-ads/data',
    '/api/google-ads/ai-analysis',
    '/api/google-ads/ai-report',
    '/api/google-ads/ad-asset-performance',
    '/api/google-ads/ad-group-distribution',
    '/api/google-ads/ad-group-theming',
    '/api/google-ads/ads-assets',
    '/api/google-ads/assisted-conversions',
    '/api/google-ads/campaign-structure-overview',
    '/api/google-ads/change-history-summary',
    '/api/google-ads/conversion-action-inventory',
    '/api/google-ads/conversion-action-setup',
    '/api/google-ads/conversion-timing',
    '/api/google-ads/impression-share-lost',
    '/api/google-ads/keyword-match-type-mix',
    '/api/google-ads/negative-keywords-gaps',
    '/api/google-ads/network-performance',
    '/api/google-ads/performance-by-network',
    '/api/google-ads/roas-by-device-geography',
    '/api/google-ads/search-term-analysis',
    '/api/google-ads/search-term-coverage',
    '/api/google-ads/zero-conversion-adgroups',
    '/api/google-ads/zero-conversion-keywords',
  ]

  // Excluded routes that don't require authentication
  const excludedRoutes = [
    '/api/google-ads/refresh-token',
    '/api/google-ads/callback',
    '/api/google-ads/verification-status',
    '/api/oauth',
    '/api/login',
  ]

  // Check if current path requires authentication
  const requiresAuth = protectedRoutes.some((route) =>
    originalPath.startsWith(route),
  )
  const isGoogleAdsRoute = googleAdsRoutes.some((route) =>
    originalPath.startsWith(route),
  )
  const isExcluded = excludedRoutes.some((route) =>
    originalPath.startsWith(route),
  )

  if ((requiresAuth || isGoogleAdsRoute) && !isExcluded) {
    if (!authenticatedUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
    }
  }

  return supabaseResponse
}
