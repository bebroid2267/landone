import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUser } from '@/components/hooks/useUser'
import { useGoogleAds } from '@/components/hooks/useGoogleAds'
import { signInWithGoogle } from '@/utils/oauth-helpers/google-oauth'

const reportItems = [
  {
    title: 'The Waste Score',
    description:
      "A single number that shows your account's financial efficiency.",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="text-black"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path
          d="M8 12l2 2 4-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'The "Kill List"',
    description: 'Campaigns & keywords to pause immediately.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="text-black"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path
          d="M8 12l2 2 4-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'The Growth Map',
    description: 'Hidden opportunities for profitable scaling.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="text-black"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path
          d="M8 12l2 2 4-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'The "Why"',
    description: 'Plain English explanations for every issue found.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="text-black"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path
          d="M8 12l2 2 4-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
]

const ThePromise = () => {
  const router = useRouter()
  const { user } = useUser()
  const { selectedAccountId } = useGoogleAds()

  const handleGetReport = async () => {
    if (!user) {
      // User is not authenticated, trigger OAuth with Google Ads permissions
      try {
        const redirectUrl = selectedAccountId
          ? `/google-ads/ai-analysis?timeRange=180days&accountId=${selectedAccountId}&auto_start=true`
          : '/google-ads/ai-analysis?timeRange=180days&auto_start=true'

        await signInWithGoogle({
          isRegistration: false,
          includeGoogleAds: true,
          redirectTo: `${window.location.origin}${redirectUrl}`,
          state: 'audit_access',
        })
      } catch (error) {
        console.error('Authentication error:', error)
      }
    } else {
      // User is authenticated, redirect to audit
      const url = selectedAccountId
        ? `/google-ads/ai-analysis?timeRange=180days&accountId=${selectedAccountId}&auto_start=true`
        : '/google-ads/ai-analysis?timeRange=180days&auto_start=true'
      router.push(url)
    }
  }

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2
            className="text-4xl md:text-5xl lg:text-6xl font-black text-black mb-6 leading-tight"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            This Isn&apos;t Another Dashboard.
            <br />
            <span className="underline decoration-4 decoration-black">
              It&apos;s An Answer Sheet
            </span>
            .
          </motion.h2>
        </div>

        {/* "You Get:" Section */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl md:text-3xl font-black text-black mb-8 text-center">
            Your Free X-Ray Report Reveals:
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportItems.map((item, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-4 p-6 bg-white border-2 border-black hover:border-black transition-colors duration-300"
                initial={{ x: index % 2 === 0 ? -30 : 30, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex-shrink-0 mt-1">{item.icon}</div>
                <div>
                  <h4 className="text-xl font-black text-black mb-2">
                    {item.title}:
                  </h4>
                  <p className="text-lg text-black">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Visual representation */}
        <motion.div
          className="text-center mb-12"
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="inline-block p-8 bg-white border-4 border-black">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="h-3 bg-black"></div>
              <div className="h-3 bg-black"></div>
              <div className="h-3 bg-black"></div>
              <div className="h-3 bg-black"></div>
            </div>
            <div className="text-sm font-bold text-black mb-2">
              SAMPLE X-RAY OUTPUT
            </div>
            <div className="text-xs text-black">
              Real data. Real insights. Real results.
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
            delay: 0.8,
          }}
          viewport={{ once: true }}
        >
          <motion.button
            onClick={() => void handleGetReport()}
            className="px-12 py-4 text-xl font-bold text-white bg-black hover:bg-gray-800 border-2 border-black transition-all duration-300 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get My Answer Sheet →
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

export default ThePromise
