'use client'

import Link from 'next/link'

interface TrialModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TrialModal({ isOpen, onClose }: TrialModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800/90 border border-gray-700 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden backdrop-blur-sm">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 h-1" />
        </div>
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">
              Unlock Premium Features
            </h3>
            <p className="text-gray-400">
              Get full access to all features for just $1 for the first month
            </p>
          </div>

          <div className="space-y-4">
            <Link href="/pricing" className="block">
              <button className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium px-4 py-3 rounded-lg transition-colors duration-200">
                Get Started for $1
              </button>
            </Link>
          </div>

          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm">
              By subscribing, you agree to our
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

          <span className="text-gray-500 text-sm">
            Regular price $9.99/mo after first week
          </span>
        </div>
      </div>
    </div>
  )
}
