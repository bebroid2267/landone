'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Provider } from '@supabase/supabase-js'
import AuthButtons from './AuthButtons'
import { signInWithGoogle } from '@/utils/oauth-helpers/google-oauth'

interface SignModalProps {
  register?: boolean
  options: {
    state?: string
    scope: string
    redirectUri?: string
    user_request?: string
  }
}

const SignModal = ({
  register = false,
  options: { scope, state = 'default_state', redirectUri },
}: SignModalProps) => {
  const pathName = usePathname()

  const [termsOfService, setTermsOfService] = useState(true)
  const [consented, setConsented] = useState(true)
  const [includeGoogleAds, setIncludeGoogleAds] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState('')

  useEffect(() => {
    // Determine the scope based on Google Ads inclusion
    let effectiveScope = scope
    if (includeGoogleAds && scope === 'origin') {
      effectiveScope = 'email profile https://www.googleapis.com/auth/adwords'
    }

    const queryParams = new URLSearchParams({
      scope: effectiveScope,
      register: `${register}`,
      consented: `${consented}`,
      redirect_uri: redirectUri ?? `${window.location.origin}/`,
      state: state,
      google_ads_enabled: `${includeGoogleAds}`,
    })

    const url = `${
      window.location.origin
    }/api/oauth/callback?${queryParams.toString()}`
    console.log('Generated redirectUrl with params:', url)
    console.log('State parameter is:', state)
    console.log('Google Ads enabled:', includeGoogleAds)

    setRedirectUrl(url)
  }, [
    scope,
    register,
    consented,
    pathName,
    state,
    redirectUri,
    includeGoogleAds,
  ])

  const singInWithProvider = (provider: Provider) => {
    console.log('singInWithProvider called with redirectUrl:', redirectUrl)
    console.log(
      'State parameter in redirectUrl:',
      new URL(redirectUrl).searchParams.get('state'),
    )

    const handleGoogleSignIn = async () => {
      try {
        await signInWithGoogle({
          isRegistration: register,
          includeGoogleAds,
          redirectTo: redirectUri ?? `${window.location.origin}/`,
          state,
          callbackParams: {
            consented: `${consented}`,
          },
        })
        console.log('Successful login initiated')
      } catch (error) {
        console.error('Auth error', error)
      }
    }

    if (termsOfService) {
      switch (provider) {
        case 'google':
          handleGoogleSignIn().catch(() => console.error)
          break
      }
    }
  }

  return (
    <div className="flex flex-col justify-center items-stretch gap-5 p-6">
      <div className="flex flex-col gap-5">
        <h1 className="text-white text-center text-xl">
          {register ? 'Sign Up' : 'Sign In'} to{' '}
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-fuchsia-500 to-cyan-400">
            ROAS.dog
          </span>
        </h1>

        {/* Google Ads Integration Option */}
        {scope === 'origin' && (
          <div className="flex flex-col gap-3 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <div className="flex items-start gap-3">
              <input
                className="flex-shrink-0 size-4 cursor-pointer accent-indigo-500 mt-0.5"
                type="checkbox"
                checked={includeGoogleAds}
                onChange={(e) => setIncludeGoogleAds(e.target.checked)}
              />
              <div className="flex flex-col gap-1">
                <span className="text-white text-sm font-medium">
                  Include Google Ads Integration
                </span>
                <span className="text-gray-400 text-xs">
                  Connect your Google Ads account to access campaign analytics
                  and AI insights. You can add this later in your account
                  settings.
                </span>
              </div>
            </div>
          </div>
        )}

        <AuthButtons
          register={register}
          termsOfService={termsOfService}
          singInWithProvider={singInWithProvider}
          googleAdsEnabled={includeGoogleAds}
        />
      </div>
      {register && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <input
              className="flex-shrink-0 size-4 cursor-pointer accent-indigo-500"
              type="checkbox"
              onClick={() => setTermsOfService((prev) => !prev)}
              checked={termsOfService}
              readOnly
            />
            <span className="text-gray-400 text-sm text-start">
              Yes, I agree to the{' '}
              <Link
                className="text-indigo-400 hover:text-indigo-300"
                href="/policy"
              >
                Terms of Service
              </Link>
              .
            </span>
          </div>
          <div className="flex items-start gap-3">
            <input
              className="flex-shrink-0 size-4 cursor-pointer accent-indigo-500"
              type="checkbox"
              onClick={() => setConsented((prev) => !prev)}
              checked={consented}
              readOnly
            />
            <span className="text-gray-400 text-sm text-start">
              Yes, I agree to receive emails about my account, campaigns, and
              our occasional product updates. We respect your inbox. Unsubscribe
              at any time.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default SignModal
