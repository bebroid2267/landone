'use client'
import { useMemo, useState } from 'react'

import { createClient } from '@/utils/supabase/client'
import { updateUserName } from '@/utils/supabase/supabase-client'
import { EnvelopeIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { useUser } from '../hooks/useUser'
import LoadingDots from '../ui/LoadingDots'
import LogoutWrap from './LogoutWrap'

// Define a type for expected error responses from the API
interface ErrorResponse {
  error?: string
  message?: string // Include message as sometimes APIs use that
}

const formatEmail = (email: string | undefined) => {
  if (email && email.length > 27) {
    return `${email.substring(0, 27)}...`
  }
  return email
}

interface AccountInfoProps {
  user: {
    avatar_url: string | null
    full_name: string | null
    id: string
    utm_source?: string | null | undefined
  } | null
}

const AccountInfo = ({ user }: AccountInfoProps) => {
  const { user: userAuth, signOut } = useUser()
  const supabase = createClient()

  const [userName, setUserName] = useState(
    user?.full_name ? user?.full_name : '',
  )
  const [startName, setStartName] = useState(
    user?.full_name ? user?.full_name : '',
  )
  const [isLoadName, setIsLoadName] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isNameChange = useMemo(() => {
    return startName !== userName
  }, [startName, userName])

  const changeName = async () => {
    setIsLoadName(true)
    if (user) {
      await updateUserName(supabase, user.id, userName)
      setStartName(userName)
    }
    setIsLoadName(false)
  }

  const handleDeleteAccount = async () => {
    if (
      confirm(
        'Are you sure you want to delete your account? This action is irreversible and will remove all your data.',
      )
    ) {
      setIsDeleting(true)
      try {
        const response = await fetch('/api/account/delete', {
          method: 'DELETE',
        })

        if (response.ok) {
          alert('Account deleted successfully.')
          // Sign out and redirect
          await signOut()
          window.location.href = '/' // Redirect to homepage
        } else {
          /*
           * Try to parse the error response safely
           * Using explicit type assertion as response.json() returns
           * Promise<any>
           */
          const errorData = (await response.json().catch(() => ({
            error: 'Failed to parse error response',
          }))) as ErrorResponse
          console.error('Delete account error response:', errorData)
          // Use ?? for safer coalescing
          alert(
            `Failed to delete account: ${
              errorData?.error ?? errorData?.message ?? response.statusText
            }`,
          )
        }
      } catch (error) {
        console.error('Error deleting account:', error)
        alert('An error occurred while trying to delete the account.')
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center">
        {user?.avatar_url ? (
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-75"></div>
            <img
              src={user?.avatar_url}
              alt="Profile"
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-gray-700"
            />
          </div>
        ) : (
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-75"></div>
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <UserCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
          </div>
        )}
        <div className="ml-4">
          <h2 className="text-xl font-semibold text-white">
            {user?.full_name ?? 'User Account'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {formatEmail(userAuth?.email)}
          </p>
          <div className="flex items-center mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-900 text-indigo-300 border border-indigo-700">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-1.5"></span>
              Active
            </span>
          </div>
        </div>
      </div>

      {user?.full_name !== undefined && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-white flex items-center">
            <svg
              className="w-4 h-4 mr-2 text-indigo-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            User Name
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <input
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-600 bg-gray-700/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            {isNameChange && !isLoadName && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg shadow-md shadow-indigo-600/20 transition-all duration-200 font-medium"
                onClick={() => void changeName()}
              >
                Save Changes
              </motion.button>
            )}
            {isLoadName && (
              <div className="px-5 py-2.5 bg-indigo-900/50 rounded-lg flex items-center justify-center border border-indigo-700/50">
                <LoadingDots />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-8 divide-y divide-gray-700/50">
        <div className="space-y-3 pt-4">
          <h3 className="text-lg font-medium text-white flex items-center">
            <svg
              className="w-4 h-4 mr-2 text-indigo-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            Your Email
          </h3>
          <div className="flex items-center p-3.5 bg-gray-700/30 rounded-lg border border-gray-700">
            <EnvelopeIcon className="w-5 h-5 text-indigo-400 mr-3" />
            <span className="text-gray-300">
              {formatEmail(userAuth?.email)}
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-6">
          <h3 className="text-lg font-medium text-white flex items-center">
            <svg
              className="w-4 h-4 mr-2 text-indigo-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            Contact Email
          </h3>
          <div className="flex items-center p-3.5 bg-gray-700/30 rounded-lg border border-gray-700">
            <EnvelopeIcon className="w-5 h-5 text-indigo-400 mr-3" />
            <span className="text-gray-300">gptprosite@gmail.com</span>
          </div>
        </div>

        <div className="pt-6 flex flex-col space-y-4">
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-indigo-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Account Created
            </h3>
            <p className="text-gray-400">
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-indigo-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              Privacy Policy
            </h3>
            <a
              href="/policy"
              className="inline-flex items-center text-indigo-400 hover:text-indigo-300 font-medium transition-colors duration-200"
            >
              View Privacy Policy
              <svg
                className="w-4 h-4 ml-1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>

          <div className="pt-4">
            <LogoutWrap />
          </div>

          <div className="pt-6 border-t border-red-900/50">
            <h3 className="text-lg font-medium text-red-400 flex items-center mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1.75-5.75a.75.75 0 00-1.5 0v4.5c0 .414.336.75.75.75h1.5a.75.75 0 000-1.5H9.25V7.25z"
                  clipRule="evenodd"
                />
              </svg>
              Danger Zone
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Deleting your account is permanent and cannot be undone. All your
              data, including images and subscription information, will be
              removed according to our policy.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`w-full px-5 py-2.5 rounded-lg shadow-md transition-all duration-200 font-medium flex items-center justify-center ${
                isDeleting
                  ? 'bg-red-900/50 border border-red-700/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-600/30'
              }`}
              onClick={() => void handleDeleteAccount()}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <LoadingDots />
                  <span className="ml-2">Deleting...</span>
                </>
              ) : (
                'Delete My Account'
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountInfo
