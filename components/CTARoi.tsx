import { motion } from 'framer-motion'
import { useState } from 'react'
import { Modal } from '@/components/hooks/UI/Modal'
import IntegratedGoogleAds from '@/components/google-ads/IntegratedGoogleAds'

const CTARoi = () => {
  const [isGoogleAdsModalOpen, setGoogleAdsModalOpen] = useState(false)

  return (
    <section className="py-20 px-4 bg-white relative overflow-hidden">
      {/* Decorative elements - subtle line pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern
            id="line-pattern-cta"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="20"
              x2="40"
              y2="20"
              stroke="black"
              strokeWidth="0.5"
              strokeDasharray="1 5"
            />
            <line
              x1="20"
              y1="0"
              x2="20"
              y2="40"
              stroke="black"
              strokeWidth="0.5"
              strokeDasharray="1 5"
            />
          </pattern>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#line-pattern-cta)"
          />
        </svg>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
            Ready to Stop Wasting Money on Google Ads?
          </h2>
          <p className="text-xl text-gray-700 mb-10 max-w-2xl mx-auto">
            Get your free audit today and see how much more ROI you could be
            getting from your existing ad spend.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setGoogleAdsModalOpen(true)}
              className="px-8 py-3 text-lg font-medium text-white bg-black hover:bg-gray-800 rounded-md transition-colors duration-300"
            >
              Fetch My Audit Now
            </button>
            <button
              onClick={() => setGoogleAdsModalOpen(true)}
              className="px-8 py-3 text-lg font-medium text-black border border-black hover:bg-gray-100 rounded-md transition-colors duration-300"
            >
              Let roas.dog Unleash My ROI
            </button>
          </div>
        </motion.div>
      </div>

      <Modal
        id="google-ads-modal-cta"
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

export default CTARoi
