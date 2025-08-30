import { motion } from 'framer-motion'
import { useState } from 'react'
import { Modal } from '@/components/hooks/UI/Modal'
import IntegratedGoogleAds from '@/components/google-ads/IntegratedGoogleAds'

const QuickWinBanner = () => {
  const [isGoogleAdsModalOpen, setGoogleAdsModalOpen] = useState(false)

  return (
    <section className="py-10 px-4 bg-gray-900 relative overflow-hidden">
      {/* Background pattern with bone outlines */}
      <div className="absolute inset-0 opacity-10">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <pattern
            id="bone-pattern"
            x="0"
            y="0"
            width="20"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M2,3 C1,2 1,1 2,0.5 C3,0 4,0.5 5,1.5 C6,2.5 7,3 8,2.5 C9,2 9,1 8,0 L12,0 C11,1 11,2 12,2.5 C13,3 14,2.5 15,1.5 C16,0.5 17,0 18,0.5 C19,1 19,2 18,3 C19,4 19,5 18,5.5 C17,6 16,5.5 15,4.5 C14,3.5 13,3 12,3.5 C11,4 11,5 12,6 L8,6 C9,5 9,4 8,3.5 C7,3 6,3.5 5,4.5 C4,5.5 3,6 2,5.5 C1,5 1,4 2,3 Z"
              fill="white"
            />
          </pattern>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#bone-pattern)"
          />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between relative z-10">
        <div className="mb-6 md:mb-0 text-center md:text-left">
          <h3 className="text-xl md:text-2xl font-medium text-white">
            See your first recommendations in under an hour—no commitment.
          </h3>
        </div>

        <motion.div
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
          }}
          whileHover={{
            scale: 1.1,
          }}
        >
          <button
            onClick={() => setGoogleAdsModalOpen(true)}
            className="px-6 py-3 text-lg font-medium text-black bg-white hover:bg-gray-100 rounded-md transition-colors duration-300 whitespace-nowrap inline-flex items-center"
          >
            <span className="mr-2">🐾</span>
            Fetch My Audit Now
          </button>
        </motion.div>
      </div>

      <Modal
        id="google-ads-modal-quickwin"
        isOpen={isGoogleAdsModalOpen}
        onClose={() => setGoogleAdsModalOpen(false)}
        className="z-[9999999]"
      >
        <div className="p-4 bg-white rounded-xl max-w-5xl w-full">
          <IntegratedGoogleAds onClose={() => setGoogleAdsModalOpen(false)} />
        </div>
      </Modal>
    </section>
  )
}

export default QuickWinBanner
