/* eslint-disable @typescript-eslint/no-unsafe-assignment */
'use client'

import { postData } from '@/utils/helpers'
import { User } from '@supabase/supabase-js'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface Props {
  user: User | null
}

export default function ManageSubscriptionButton({ user }: Props) {
  const router = useRouter()
  const redirectToCustomerPortal = async () => {
    try {
      const { url } = await postData({
        url: '/api/create-portal-link',
      })
      router.push(url as string)
    } catch (error) {
      if (error) {
        return alert((error as Error).message)
      }
    }
  }

  return (
    <div className="w-full">
      <p className="text-sm text-gray-400 mb-3">
        Manage your subscription settings on Stripe.
      </p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={!user}
        onClick={() => void redirectToCustomerPortal()}
        className="w-full inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all duration-200 border border-indigo-700 shadow-sm"
      >
        <svg
          className="w-5 h-5 mr-2"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
          <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
        Manage Subscription
      </motion.button>
    </div>
  )
}
