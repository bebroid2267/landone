'use client'

import { signInWithGoogleSimple } from '@/utils/oauth-helpers/google-oauth'

const GoogleButton = ({
  className = 'shiny-button hover:from-main-color-hover hover:to-second-color-hover from-main-color to-second-color font-bold text-sm text-main-bg bg-gradient-to-r py-2 px-4 rounded-sm',
}: {
  className?: string
}) => {
  const handleSignIn = async () => {
    try {
      await signInWithGoogleSimple()
    } catch (error) {
      console.error('Auth error', error)
    }
  }

  return (
    <button onClick={() => void handleSignIn()} className={className}>
      Sign in with Google
    </button>
  )
}

export default GoogleButton
