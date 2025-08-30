'use client'

import { useEffect } from 'react'

interface NoGoogleAdsAccountsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NoGoogleAdsAccountsModal({ isOpen, onClose }: NoGoogleAdsAccountsModalProps) {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.no-ads-tooltip')) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed top-16 right-4 z-[9999999] no-ads-tooltip">
      <div className="bg-gray-600 rounded-lg border border-gray-500 shadow-xl p-4 max-w-xs">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-yellow-500/30 border border-yellow-500">
            <svg
              className="h-4 w-4 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white mb-1">
              No Google Ads Accounts
            </h4>
            <p className="text-xs text-gray-200 leading-relaxed">
              Your Google account doesn't have Google Ads accounts. Please select a different account.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-white transition-colors"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      {/* Arrow pointing to warning icon */}
      <div className="absolute top-2 right-6 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-600 transform -translate-y-full"></div>
    </div>
  )
}