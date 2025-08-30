'use client'

import { Database } from '@/types_db'
import { postData } from '@/utils/helpers'
import { getStripe } from '@/utils/supabase/stripe-client'
import { SubscriptionWithProduct } from '@/utils/types'
import { CheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { User } from '@supabase/supabase-js'
import { motion } from 'framer-motion'

type Product = Database['public']['Tables']['products']['Row']
type Price = Database['public']['Tables']['prices']['Row']
interface ProductWithPrices extends Product {
  prices: Price[]
}

interface Props {
  user: User | null | undefined
  products: ProductWithPrices[]
  subscription: SubscriptionWithProduct | null
}

interface PlanPoint {
  name: string
  type: 'included' | 'nonIncluded'
}

interface StripeCheckoutResponse {
  sessionId: string
}

const planFeatures: PlanPoint[] = [
  {
    name: '1000 tokens per month',
    type: 'included',
  },
  {
    name: 'Unlimited music generation',
    type: 'included',
  },
  {
    name: 'High quality audio output',
    type: 'included',
  },
  {
    name: 'Advanced generation settings',
    type: 'included',
  },
  {
    name: 'Multiple musical styles',
    type: 'included',
  },
  {
    name: 'Custom parameters support',
    type: 'included',
  },
  {
    name: 'Music history and library',
    type: 'included',
  },
  {
    name: 'Download and share tracks',
    type: 'included',
  },
]

export default function Pricing({ user, products, subscription }: Props) {
  const handleCheckout = async (
    price: Price,
    isManage: boolean,
    isMonthly: boolean,
  ) => {
    if (isManage) {
      window.location.replace('/account')
    } else {
      try {
        const response = (await postData({
          url: '/api/create-checkout-session',
          data: {
            price,
            isMonthly,
          },
        })) as StripeCheckoutResponse

        const stripe = await getStripe()
        void stripe?.redirectToCheckout({ sessionId: response.sessionId })
      } catch (error) {
        return alert((error as Error)?.message)
      }
    }
  }

  const monthlyProduct = products.find((p) => p.name === 'Pyxl PRO')
  const yearlyProduct = products.find((p) => p.name === 'Pyxl PRO YEAR')

  return (
    <section className="relative" id="pricing">
      {/* Remove background gradient */}
      {/* <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900 opacity-40 pointer-events-none" /> */}

      <div className="relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="pb-8 font-extrabold text-center text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300"
        >
          Choose Your Plan
        </motion.h2>

        {/* Gradient glow effects */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-yellow-400 via-fuchsia-500 to-cyan-400 rounded-full blur-[100px] opacity-20" />
        <div className="absolute top-1/2 right-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-yellow-400 via-fuchsia-500 to-cyan-400 rounded-full blur-[100px] opacity-10" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto relative px-4 sm:px-6 lg:px-8">
          {/* Monthly Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative mx-auto w-full max-w-[320px] md:max-w-none"
          >
            <div className="relative rounded-3xl overflow-hidden">
              {/* Top section with gradient */}
              <div className="relative h-36 sm:h-48 bg-gradient-to-r from-yellow-400 via-fuchsia-500 to-cyan-400 p-4 sm:p-8">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      Monthly
                    </h2>
                    <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium">
                      Popular
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 sm:gap-2">
                    <span className="text-4xl sm:text-5xl font-bold text-white">
                      $1
                    </span>
                    <span className="text-sm sm:text-base text-white/80">
                      first month
                    </span>
                  </div>
                  <div className="mt-1 sm:mt-2 text-sm sm:text-base text-white/80">
                    then $9.99/month
                  </div>
                </div>
              </div>

              {/* Content section */}
              <div className="p-4 sm:p-8 backdrop-blur-sm bg-white/5">
                {/* Features */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold tracking-wide uppercase text-gray-200 mb-6">
                    What&apos;s included
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {planFeatures.map((point) => (
                      <div
                        key={point.name}
                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center">
                          <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                        </div>
                        <span className="text-sm sm:text-base text-gray-300">
                          {point.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                {monthlyProduct?.prices[0] && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      void handleCheckout(
                        monthlyProduct.prices[0],
                        monthlyProduct.name ===
                          subscription?.prices?.products?.name,
                        true,
                      )
                    }
                    className={`w-full py-4 px-4 rounded-xl text-lg font-medium text-white 
                      ${
                        user
                          ? 'bg-gradient-to-r from-yellow-400 via-fuchsia-500 to-cyan-400 hover:opacity-90 shadow-lg shadow-yellow-400/20'
                          : 'bg-gray-700 cursor-not-allowed'
                      } transition-all duration-200 flex items-center justify-center gap-2`}
                    disabled={!user}
                  >
                    {!user
                      ? 'Please sign in to subscribe'
                      : monthlyProduct.name ===
                        subscription?.prices?.products?.name
                      ? 'Manage Subscription'
                      : 'Start Free Trial'}
                    <ArrowRightIcon className="h-5 w-5" />
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Yearly Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative mx-auto w-full max-w-[320px] md:max-w-none"
          >
            <div className="relative rounded-3xl overflow-hidden">
              {/* Top section with gradient */}
              <div className="relative h-36 sm:h-48 bg-gradient-to-r from-yellow-400 via-fuchsia-500 to-cyan-400 p-4 sm:p-8">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      Yearly
                    </h2>
                    <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium">
                      Best Value
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 sm:gap-2">
                    <span className="text-4xl sm:text-5xl font-bold text-white">
                      $99.99
                    </span>
                    <span className="text-sm sm:text-base text-white/80">
                      per year
                    </span>
                  </div>
                  <div className="mt-1 sm:mt-2 text-sm sm:text-base text-white/80">
                    only $8.33/month
                  </div>
                </div>
              </div>

              {/* Content section */}
              <div className="p-4 sm:p-8 backdrop-blur-sm bg-white/5">
                {/* Features */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold tracking-wide uppercase text-gray-200 mb-6">
                    What&apos;s included
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {planFeatures.map((point) => (
                      <div
                        key={point.name}
                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center">
                          <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
                        </div>
                        <span className="text-sm sm:text-base text-gray-300">
                          {point.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                {yearlyProduct?.prices[0] && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      void handleCheckout(
                        yearlyProduct.prices[0],
                        yearlyProduct.name ===
                          subscription?.prices?.products?.name,
                        false,
                      )
                    }
                    className={`w-full py-4 px-4 rounded-xl text-lg font-medium text-white 
                      ${
                        user
                          ? 'bg-gradient-to-r from-yellow-400 via-fuchsia-500 to-cyan-400 hover:opacity-90 shadow-lg shadow-cyan-400/20'
                          : 'bg-gray-700 cursor-not-allowed'
                      } transition-all duration-200 flex items-center justify-center gap-2`}
                    disabled={!user}
                  >
                    {!user
                      ? 'Please sign in to subscribe'
                      : yearlyProduct.name ===
                        subscription?.prices?.products?.name
                      ? 'Manage Subscription'
                      : 'Get Yearly Plan'}
                    <ArrowRightIcon className="h-5 w-5" />
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-gray-400">
            Subscription can be canceled anytime.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
