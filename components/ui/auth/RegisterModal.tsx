'use client'

import { useState } from 'react'
import { registerWithGoogle } from '@/utils/oauth-helpers/google-oauth'

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      await registerWithGoogle()
    } catch (error) {
      console.error('Error with Google sign in:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Close when clicking outside the modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-800/90 border border-gray-700 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden backdrop-blur-xl">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 h-1" />
        </div>
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">
              Sign Up to Continue
            </h3>
            <p className="text-gray-400">
              Create an account to generate AI images and unlock all features
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => {
                void handleGoogleSignIn()
              }}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-3 rounded-lg transition-colors duration-200 border border-gray-700"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <div className="flex items-center my-4">
              <div className="flex-grow h-px bg-gray-700"></div>
              <span className="px-3 text-sm text-gray-500">OR</span>
              <div className="flex-grow h-px bg-gray-700"></div>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm">
              By signing up, you agree to our
              <a
                href="/policy"
                className="text-indigo-400 hover:text-indigo-300 ml-1"
              >
                Terms of Service
              </a>{' '}
              and
              <a
                href="/policy"
                className="text-indigo-400 hover:text-indigo-300 ml-1"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-900/50 flex justify-between items-center">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Maybe later
          </button>

          <span className="text-gray-500 text-sm">Free trial available</span>
        </div>
      </div>
    </div>
  )
}
