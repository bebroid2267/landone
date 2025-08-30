'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Consent from './Consent'
import { Provider } from '@supabase/supabase-js'
import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'

function OAuthContent() {
  const router = useRouter()
  const pathName = usePathname()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const [redirectUrl, setRedirectUrl] = useState('')

  const state = searchParams.get('state')!
  const redirectUri = searchParams.get('redirect_uri')!
  const scope = 'email profile https://www.googleapis.com/auth/adwords'
  const client_id = searchParams.get('client_id')!
  const redirect_uri = searchParams.get('redirect_uri')
  const consent = searchParams.get('consent')
  const code = searchParams.get('code')
  const accessToken = searchParams.get('accessToken')
  const refreshToken = searchParams.get('refreshToken')

  useEffect(() => {
    const queryParams = new URLSearchParams({
      scope,
      register: 'true',
      consented: 'true',
      redirect_uri: `${window.location.origin}${pathName}`,
    })

    if (state && redirectUri) {
      queryParams.append('state', state)
      queryParams.set('redirect_uri', redirectUri)
    }

    setRedirectUrl(
      `${window.location.origin}/api/oauth/callback?${queryParams.toString()}`,
    )
    setIsLoading(false)
  }, [state, redirectUri, scope, pathName])

  if (
    !(
      state &&
      (client_id || accessToken) &&
      redirectUri?.startsWith('https://chat.openai.com/aip')
    )
  ) {
    router.push('/')
    return null
  }

  if (
    state &&
    redirect_uri &&
    scope &&
    consent &&
    code &&
    accessToken &&
    refreshToken
  ) {
    return (
      <Consent
        state={state}
        redirect_uri={redirect_uri}
        scope={scope}
        code={code}
        accessToken={accessToken}
        refreshToken={refreshToken}
      />
    )
  }

  const singInWithProvider = (provider: Provider): void => {
    const signInWithGoogle = async () => {
      setIsLoading(true)
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            scopes: 'email profile https://www.googleapis.com/auth/adwords',
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account',
            },
          },
        })
        if (error) {
          console.error('Auth error', error)
          router.push('/')
        } else {
          console.log('Successful login')
        }
      } catch (error) {
        console.error('Unexpected error during auth:', error)
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }

    switch (provider) {
      case 'google':
        void signInWithGoogle()
        break
    }
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (redirectUrl) {
      singInWithProvider('google')
    }
  }, [redirectUrl])

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return null
}

export default function OAuthHandler() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <OAuthContent />
    </Suspense>
  )
}
