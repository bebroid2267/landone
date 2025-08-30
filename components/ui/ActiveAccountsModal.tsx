'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ActiveAccount {
  accountId: string
  accountName: string
  activity: {
    cost: number
    clicks: number
    campaigns: string[]
    domains: string[]
  }
}

interface ActiveAccountsModalProps {
  isOpen: boolean
  onClose: () => void
  onAccountSelect: (accountId: string) => void
  activeAccounts: ActiveAccount[]
  isLoading?: boolean
  hasActiveAccounts?: boolean // New prop to indicate if accounts are actually active
}

export const ActiveAccountsModal = ({
  isOpen,
  onClose,
  onAccountSelect,
  activeAccounts,
  isLoading = false,
  hasActiveAccounts = true
}: ActiveAccountsModalProps) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedAccountId(null)
    }
  }, [isOpen])

  const handleAccountSelect = (accountId: string) => {
    setSelectedAccountId(accountId)
    // Small delay for visual feedback
    setTimeout(() => {
      onAccountSelect(accountId)
      onClose()
    }, 300)
  }

  const formatMetric = (value: number, type: 'currency' | 'number') => {
    if (type === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value)
    }
    return new Intl.NumberFormat('en-US').format(value)
  }

  const formatArrayData = (arr: string[], type: 'campaigns' | 'domains') => {
    if (arr.length === 0) {
      return type === 'campaigns' ? 'No campaigns' : 'No domains'
    }
    if (arr.length <= 2) {
      return arr.join(', ')
    }
    return `${arr.slice(0, 2).join(', ')}, +${arr.length - 2} more`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <div className="min-h-screen px-4 text-center">
          <div className="inline-block h-screen align-middle" aria-hidden="true">
            &#8203;
          </div>

          <motion.div
            className="inline-block w-full max-w-4xl p-6 my-8 text-left align-middle bg-white shadow-xl rounded-2xl relative"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {hasActiveAccounts ? 'Select Active Account' : 'Select Account'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {hasActiveAccounts 
                    ? `We found ${activeAccounts.length} active Google Ads account${activeAccounts.length === 1 ? '' : 's'} based on recent activity. Choose which account you'd like to audit.`
                    : `No accounts showed significant activity in the last 30 days. Please choose an account from your available ${activeAccounts.length} account${activeAccounts.length === 1 ? '' : 's'}.`
                  }
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Loading state */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                  <span className="text-gray-600">Analyzing accounts...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Accounts list */}
                <div className="space-y-3 max-h-96 overflow-y-auto overflow-x-hidden">
                  {activeAccounts.map((account) => (
                    <motion.button
                      key={account.accountId}
                      onClick={() => handleAccountSelect(account.accountId)}
                      className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        selectedAccountId === account.accountId
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 hover:shadow-md'
                      }`}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`font-medium text-lg ${
                            selectedAccountId === account.accountId ? 'text-white' : 'text-gray-900'
                          }`}>
                            {account.accountName}
                          </h3>
                          <p className={`text-sm mt-1 ${
                            selectedAccountId === account.accountId ? 'text-gray-200' : 'text-gray-500'
                          }`}>
                            Account ID: {account.accountId}
                          </p>
                        </div>
                        
                        {/* Activity metrics */}
                        <div className="grid grid-cols-2 gap-4 text-right ml-4">
                          <div>
                            <p className={`text-xs ${
                              selectedAccountId === account.accountId ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              Spend (30d)
                            </p>
                            <p className={`font-semibold ${
                              selectedAccountId === account.accountId ? 'text-white' : 'text-gray-900'
                            }`}>
                              {formatMetric(account.activity.cost, 'currency')}
                            </p>
                          </div>
                          <div>
                            <p className={`text-xs ${
                              selectedAccountId === account.accountId ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              Campaigns
                            </p>
                            <p className={`font-semibold text-xs ${
                              selectedAccountId === account.accountId ? 'text-white' : 'text-gray-900'
                            }`}>
                              {formatArrayData(account.activity.campaigns, 'campaigns')}
                            </p>
                          </div>
                          <div>
                            <p className={`text-xs ${
                              selectedAccountId === account.accountId ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              Domains
                            </p>
                            <p className={`font-semibold text-xs ${
                              selectedAccountId === account.accountId ? 'text-white' : 'text-gray-900'
                            }`}>
                              {formatArrayData(account.activity.domains, 'domains')}
                            </p>
                          </div>
                          <div>
                            <p className={`text-xs ${
                              selectedAccountId === account.accountId ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              Clicks
                            </p>
                            <p className={`font-semibold ${
                              selectedAccountId === account.accountId ? 'text-white' : 'text-gray-900'
                            }`}>
                              {formatMetric(account.activity.clicks, 'number')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Selection indicator */}
                      {selectedAccountId === account.accountId && (
                        <motion.div
                          className="flex items-center justify-center mt-3 pt-3 border-t border-gray-600"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <svg className="w-5 h-5 text-white mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium">Selected - Click again to proceed</span>
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Empty state */}
                {activeAccounts.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <p className="text-gray-500 text-lg">No active accounts found</p>
                    <p className="text-gray-400 text-sm mt-1">
                      We couldn't find any accounts with recent activity in the last 30 days.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Footer note */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                {hasActiveAccounts 
                  ? 'Active accounts are determined by recent spending, clicks, active campaigns, or domains in the last 30 days.'
                  : 'All accounts showed minimal activity in the last 30 days. You can still run an audit on any account.'
                }
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}