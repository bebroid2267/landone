import { motion } from 'framer-motion'
import { useState } from 'react'
import { Modal } from '@/components/hooks/UI/Modal'
import IntegratedGoogleAds from '@/components/google-ads/IntegratedGoogleAds'

const PricingSnapshot = () => {
  const [isGoogleAdsModalOpen, setGoogleAdsModalOpen] = useState(false)

  const features = [
    'AI‑powered Google Ads audit',
    '24‑hour turnaround',
    'Actionable PDF report',
    'No ongoing commitment',
  ]

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-black">
            Flat $250 Audit
          </h2>
        </div>

        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0.95, rotateX: 5 }}
            whileInView={{ scale: 1, rotateX: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white rounded-xl shadow-lg p-8 md:p-10 max-w-md w-full transform perspective-1000"
          >
            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
                  viewport={{ once: true }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{
                      delay: index * 0.1 + 0.3,
                      duration: 0.3,
                      type: 'spring',
                    }}
                    viewport={{ once: true }}
                    className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </motion.div>
                  <span className="text-gray-800 text-lg">{feature}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="mt-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              viewport={{ once: true }}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.2 },
              }}
            >
              <motion.div whileHover={{}} transition={{ duration: 0.3 }}>
                <button
                  onClick={() => setGoogleAdsModalOpen(true)}
                  className="block w-full px-6 py-3 text-center text-lg font-medium text-white bg-black hover:bg-gray-800 rounded-md transition-colors duration-300"
                >
                  <span className="inline-flex items-center justify-center">
                    <span className="mr-2">🐾</span>
                    Fetch My Audit Now
                  </span>
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <Modal
        id="google-ads-modal-pricing"
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

export default PricingSnapshot
