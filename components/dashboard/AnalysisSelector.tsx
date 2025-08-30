'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useGoogleAds } from '@/components/hooks/useGoogleAds'

export default function AnalysisSelector() {
  const { isConnected, selectedAccountId } = useGoogleAds()
  const router = useRouter()

  const handleStartAudit = () => {
    if (!isConnected || !selectedAccountId) {
      alert('Please connect your Google Ads account first')
      return
    }

    // Always use 180days for audit reports
  const formattedTimeRange = '180days'

    // Navigate to AI analysis page
    router.push(
      `/google-ads/ai-analysis?timeRange=${formattedTimeRange}&accountId=${selectedAccountId}`,
    )
  }

  const handleStartWeekly = () => {
    if (!isConnected || !selectedAccountId) {
      alert('Please connect your Google Ads account first')
      return
    }

    // Navigate to weekly analysis page
    router.push(
      `/google-ads/weekly-analysis?timeRange=LAST_7_DAYS&accountId=${selectedAccountId}`,
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-black mb-6">
        Choose Your Analysis Type ▲
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Account Audit */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.02 }}
          className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
        >
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-t-lg border-b border-gray-200">
            <div className="flex items-center">
              <span className="text-2xl mr-3">●</span>
              <h3 className="font-semibold text-lg text-black">
                Full Account Audit
              </h3>
            </div>
          </div>

          <div className="p-4">
            <p className="text-gray-600 text-sm mb-4">
              Comprehensive analysis of your entire Google Ads account
            </p>

            {/* Fixed Analysis Period */}
            <div className="mb-4">
              <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
                ■ Last 30 Days Analysis
              </div>
            </div>

            <button
              onClick={handleStartAudit}
              disabled={!isConnected || !selectedAccountId}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                !isConnected || !selectedAccountId
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {!isConnected ? 'Connect Google Ads First' : 'Start Full Audit'}
            </button>
          </div>
        </motion.div>

        {/* Weekly Analysis */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
        >
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-t-lg border-b border-gray-200">
            <div className="flex items-center">
              <span className="text-2xl mr-3">□</span>
              <h3 className="font-semibold text-lg text-black">
                Weekly Analysis
              </h3>
            </div>
          </div>

          <div className="p-4">
            <p className="text-gray-600 text-sm mb-4">
              Quick weekly performance review and optimization tips
            </p>

            <div className="mb-4">
              <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
                ■ Last 7 Days Analysis
              </div>
            </div>

            <button
              onClick={handleStartWeekly}
              disabled={!isConnected || !selectedAccountId}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                !isConnected || !selectedAccountId
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {!isConnected
                ? 'Connect Google Ads First'
                : 'Start Weekly Analysis'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <span className="text-xl mr-3">○</span>
            <div>
              <h4 className="font-medium text-blue-800 mb-1">
                Connect Your Google Ads Account
              </h4>
              <p className="text-sm text-blue-600">
                To use AI analysis, please connect your Google Ads account
                through the header menu.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pro Tip */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start">
          <span className="text-xl mr-3">!</span>
          <div>
            <h4 className="font-medium text-black mb-1">Pro Tip</h4>
            <p className="text-sm text-gray-600">
              Start with a Full Account Audit to get comprehensive insights,
              then use Weekly Analysis for ongoing optimization.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
