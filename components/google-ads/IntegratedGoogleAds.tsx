'use client'

import { useEffect } from 'react'
import { useUser } from '@/components/hooks/useUser'
import { useGoogleAds } from '@/components/hooks/useGoogleAds'
import { useRouter } from 'next/navigation'
import { signInWithGoogleAds } from '@/utils/oauth-helpers/google-oauth'

interface IntegratedGoogleAdsProps {
  onClose?: () => void
}

export default function IntegratedGoogleAds({
  onClose,
}: IntegratedGoogleAdsProps) {
  const { user } = useUser()
  const { isConnected, isLoading, error, connectGoogleAds, selectedAccountId } =
    useGoogleAds()
  const router = useRouter()

  // Handle redirect to Google Ads page when connected
  useEffect(() => {
    if (isConnected) {
      onClose?.()
      
      // Set sessionStorage flag to enable sidebar blocking for onboarding mode
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('active_accounts_selection', 'true')
      }
      
      // Redirect to Google Ads page with auto_start parameter
      router.push('/google-ads?auto_start=true')
    }
  }, [isConnected, onClose, router])

  const handleConnect = async () => {
    if (!user) {
      // User not logged in - sign in with Google Ads integration
      try {
        await signInWithGoogleAds(`${window.location.origin}/`)
      } catch (error) {
        console.error('Auth error', error)
      }
      return
    }

    // User is already logged in – proceed to Google Ads connect flow
    try {
      await connectGoogleAds()
      // Redirect to Google Ads page will happen in useEffect above
    } catch (error) {
      console.error('Failed to connect Google Ads:', error)
    }
  }

  // If user is not logged in, show only connect button
  if (!user) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 max-w-md mx-auto">
        {/* Warning/Security Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg 
              className="w-6 h-6 text-blue-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
        </div>

        {/* Main Title */}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
          Great move! You're in safe hands.
        </h1>

        {/* Subtitle */}
        <p className="text-gray-600 text-center mb-4 text-sm">
          Getting an audit is the smartest first step to improving your ROAS. Let's securely connect your account.
        </p>

        {/* Google Account Instructions */}
        <p className="text-gray-600 text-center mb-5 text-xs">
          Please use the Google account that has access to the Ads account you want to audit.
        </p>

        {/* Security Features */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Built for Read-Only Analysis</h3>
              <p className="text-gray-600 text-xs">
                Our application is designed <strong>only</strong> to run analytical queries. We <strong>cannot</strong> and <strong>will not</strong> make changes to your campaigns.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Secure Google API</h3>
              <p className="text-gray-600 text-xs">
                We use Google's official, secure API. We <strong>never</strong> see or store your password.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Temporary Connection</h3>
              <p className="text-gray-600 text-xs">
                Authorization is <strong>only</strong> active for your session. Revoke access <strong>anytime</strong> from Google settings.
              </p>
            </div>
          </div>
        </div>

        {/* Connect Button */}
        <button
          onClick={() => void handleConnect()}
          className="w-full px-4 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Proceed to Google
        </button>

        {/* Footer */}
        <p className="text-gray-500 text-center text-xs mt-4">
          You are in control. Always.
        </p>
      </div>
    )
  }

  // If user is logged in but not connected to Google Ads
  if (!isConnected) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 max-w-md mx-auto">
        {/* Warning/Security Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg 
              className="w-6 h-6 text-blue-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
        </div>

        {/* Main Title */}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
          Great move! You're in safe hands.
        </h1>

        {/* Subtitle */}
        <p className="text-gray-600 text-center mb-4 text-sm">
          Getting an audit is the smartest first step to improving your ROAS. Let's securely connect your account.
        </p>

        {/* Google Account Instructions */}
        <p className="text-gray-600 text-center mb-5 text-xs">
          Please use the Google account that has access to the Ads account you want to audit.
        </p>

        {/* Security Features */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Built for Read-Only Analysis</h3>
              <p className="text-gray-600 text-xs">
                Our application is designed <strong>only</strong> to run analytical queries. We <strong>cannot</strong> and <strong>will not</strong> make changes to your campaigns.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Secure Google API</h3>
              <p className="text-gray-600 text-xs">
                We use Google's official, secure API. We <strong>never</strong> see or store your password.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Temporary Connection</h3>
              <p className="text-gray-600 text-xs">
                Authorization is <strong>only</strong> active for your session. Revoke access <strong>anytime</strong> from Google settings.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
            <p className="text-red-800 font-medium text-sm mb-1">Error:</p>
            <p className="text-red-700 text-xs">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent"></div>
            <span className="ml-2 text-gray-600 text-sm">Loading...</span>
          </div>
        ) : (
          <button
            onClick={() => void handleConnect()}
            className="w-full px-4 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Proceed to Google
          </button>
        )}

        {/* Footer */}
        <p className="text-gray-500 text-center text-xs mt-4">
          You are in control. Always.
        </p>
      </div>
    )
  }

  return null
}
