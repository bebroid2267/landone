import { createClient } from '@/utils/supabase/client'

interface GoogleOAuthOptions {
  /**
   * Whether this is a registration flow (uses prompt: 'consent')
   * If false, uses prompt: 'select_account'
   */
  isRegistration?: boolean

  /**
   * Whether to include Google Ads scope
   */
  includeGoogleAds?: boolean

  /**
   * Custom redirect URL after OAuth completion
   * Defaults to current page
   */
  redirectTo?: string

  /**
   * Additional callback parameters to include in the redirect URL
   */
  callbackParams?: Record<string, string>

  /**
   * Custom scope override (if you need something specific)
   */
  customScope?: string

  /**
   * Custom state parameter
   */
  state?: string
}

interface CallbackUrlParams {
  scope: string
  register: string
  consented: string
  redirect_uri: string
  state?: string
  google_ads_enabled?: string
  [key: string]: string | undefined
}

/**
 * Universal Google OAuth function that handles all OAuth scenarios:
 * - Regular login/signup
 * - Google Ads integration
 * - Registration vs login (prompt parameter)
 * - Custom redirect URLs and callback parameters
 */
export async function signInWithGoogle(options: GoogleOAuthOptions = {}) {
  const {
    isRegistration = false,
    includeGoogleAds = false,
    redirectTo,
    callbackParams = {},
    customScope,
    state = 'default_state',
  } = options

  const supabase = createClient()

  // Determine OAuth scope
  let oauthScope = 'email profile'
  if (includeGoogleAds) {
    oauthScope = 'email profile https://www.googleapis.com/auth/adwords'
  }
  if (customScope) {
    oauthScope = customScope
  }

  // Determine callback scope parameter
  let callbackScope = oauthScope
  if (includeGoogleAds && oauthScope === 'email profile') {
    // Handle case where we want Google Ads in callback but not in OAuth scope
    callbackScope = 'email profile https://www.googleapis.com/auth/adwords'
  }

  // Build callback URL parameters
  const callbackUrlParams: CallbackUrlParams = {
    scope: callbackScope,
    register: isRegistration ? 'true' : 'false',
    consented: 'true',
    redirect_uri: redirectTo ?? `${window.location.origin}/`,
    ...callbackParams,
  }

  // Add state if provided
  if (state !== 'default_state') {
    callbackUrlParams.state = state
  }

  // Add Google Ads flag if needed
  if (includeGoogleAds) {
    callbackUrlParams.google_ads_enabled = 'true'
  }

  // Build full callback URL
  const callbackUrl = `${
    window.location.origin
  }/api/oauth/callback?${new URLSearchParams(
    callbackUrlParams as Record<string, string>,
  ).toString()}`

  /*
   * Determine prompt parameter
   * For Google Ads integration, always use 'consent' to get refresh token
   */
  const promptParam =
    isRegistration || includeGoogleAds ? 'consent' : 'select_account'

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        scopes: oauthScope,
        queryParams: {
          access_type: 'offline',
          prompt: promptParam,
        },
      },
    })

    if (error) {
      console.error('Google OAuth error:', error)
      throw error
    }

    console.log('Google OAuth initiated successfully:', {
      scope: oauthScope,
      prompt: promptParam,
      isRegistration,
      includeGoogleAds,
    })
  } catch (error) {
    console.error('Failed to initiate Google OAuth:', error)
    throw error
  }
}

/**
 * Convenience function for regular login
 */
export async function signInWithGoogleSimple() {
  return signInWithGoogle({
    isRegistration: false,
    includeGoogleAds: false,
  })
}

/**
 * Convenience function for registration
 */
export async function registerWithGoogle() {
  return signInWithGoogle({
    isRegistration: true,
    includeGoogleAds: false,
  })
}

/**
 * Convenience function for Google Ads integration (login)
 */
export async function signInWithGoogleAds(redirectTo?: string) {
  return signInWithGoogle({
    isRegistration: false,
    includeGoogleAds: true,
    redirectTo,
    state: 'google_ads_integration',
  })
}

/**
 * Convenience function for Google Ads integration (registration)
 */
export async function registerWithGoogleAds(redirectTo?: string) {
  return signInWithGoogle({
    isRegistration: true,
    includeGoogleAds: true,
    redirectTo,
    state: 'google_ads_integration',
  })
}
