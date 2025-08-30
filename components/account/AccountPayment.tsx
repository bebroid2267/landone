'use client'

import ManageSubscriptionButton from '@/components/account/ManageSubscriptionButton'
import { CheckBadgeIcon, CreditCardIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useUser } from '../hooks/useUser'
import { SubscriptionWithProduct } from '@/utils/types'

interface AccountPaymentProps {
  subscription: SubscriptionWithProduct | null
}

const AccountPayment = ({ subscription }: AccountPaymentProps) => {
  const { user: authUser } = useUser()

  const subscriptionPrice =
    subscription &&
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: subscription?.prices?.currency!,
      minimumFractionDigits: 0,
    }).format((subscription?.prices?.unit_amount ?? 0) / 100)

  return (
    <div className="h-full space-y-8">
      <div className="rounded-xl bg-gray-700/20 border border-gray-700 overflow-hidden">
        <div className="relative">
          {subscription ? (
            <div className="absolute top-0 right-0">
              <div className="bg-green-500/10 text-green-400 text-xs font-medium px-3 py-1 rounded-bl-md">
                Active
              </div>
            </div>
          ) : null}
          <div className="p-6">
            <div className="flex items-start">
              {subscription ? (
                <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-green-400/20 to-green-600/20 text-green-500 rounded-full flex items-center justify-center border border-green-500/30">
                  <CheckBadgeIcon className="h-6 w-6" />
                </div>
              ) : (
                <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-indigo-400/20 to-purple-600/20 text-indigo-400 rounded-full flex items-center justify-center border border-indigo-500/30">
                  <CreditCardIcon className="h-6 w-6" />
                </div>
              )}
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-white">
                  {subscription ? 'Active Subscription' : 'No Active Plan'}
                </h3>
                <p className="mt-1 text-base text-gray-400">
                  {subscription
                    ? `You are currently on the ${subscription?.prices?.products?.name} plan.`
                    : 'You are not currently subscribed to any plan.'}
                </p>

                {subscription && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-900/50 text-indigo-300 border border-indigo-700/50">
                      {subscriptionPrice}/{subscription?.prices?.interval}
                    </div>
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-900/50 text-purple-300 border border-purple-700/50">
                      Renews {new Date().toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {subscription && (
          <div className="px-6 pb-6 mt-2">
            <div className="bg-gray-800/80 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                Plan Features
              </h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span className="text-sm text-gray-400">
                    1,000 AI image generations per month
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span className="text-sm text-gray-400">
                    High resolution image output
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span className="text-sm text-gray-400">
                    Advanced customization options
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className={`px-6 pb-6 ${subscription ? '' : 'pt-2'}`}>
          <div className="flex flex-col sm:flex-row gap-3">
            {subscription ? (
              authUser && <ManageSubscriptionButton user={authUser} />
            ) : (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full"
              >
                <Link
                  href="/pricing"
                  className="w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg shadow-indigo-500/20 text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  Choose a Plan
                  <svg
                    className="ml-2 -mr-1 w-5 h-5"
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
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {!subscription && (
        <div className="rounded-xl overflow-hidden">
          <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-0.5">
            <div className="bg-gray-800/90 rounded-[calc(0.75rem-1px)]">
              <div className="p-5">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-indigo-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-indigo-300">
                      Premium Features
                    </h3>
                    <div className="mt-2 text-sm text-gray-400">
                      <ul className="space-y-1 list-disc pl-5">
                        <li>Generate unlimited AI images</li>
                        <li>Create in multiple styles and resolutions</li>
                        <li>Advanced editing and customization tools</li>
                        <li>Export in multiple formats</li>
                        <li>Priority support</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-hidden">
        <div className="bg-indigo-900/30 p-5 border border-indigo-800/50">
          <h3 className="text-lg font-medium text-white mb-3">Need Help?</h3>
          <p className="text-gray-400 mb-4">
            If you have any questions about your subscription or billing, please
            contact our support team.
          </p>
          <a
            href="mailto:support@aigenerator.com"
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 font-medium transition-colors duration-200"
          >
            Contact Support
            <svg
              className="ml-2 w-4 h-4"
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
          </a>
        </div>
      </div>
    </div>
  )
}

export default AccountPayment
