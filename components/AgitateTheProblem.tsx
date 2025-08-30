import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUser } from '@/components/hooks/useUser'
import { useGoogleAds } from '@/components/hooks/useGoogleAds'
import { signInWithGoogle } from '@/utils/oauth-helpers/google-oauth'

// Leaking wallet icon
const LeakingWalletIcon = () => (
  <div className="relative">
    <svg
      width="80"
      height="80"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-black"
    >
      {/* Wallet */}
      <rect
        x="20"
        y="30"
        width="60"
        height="40"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <rect
        x="60"
        y="40"
        width="15"
        height="20"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.2"
      />
      {/* Money drops */}
      <motion.circle
        cx="45"
        cy="75"
        r="3"
        fill="currentColor"
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: 20, opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity, delay: 0 }}
      />
      <motion.circle
        cx="40"
        cy="75"
        r="2"
        fill="currentColor"
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: 25, opacity: 0 }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
      />
      <motion.circle
        cx="50"
        cy="75"
        r="2.5"
        fill="currentColor"
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: 22, opacity: 0 }}
        transition={{ duration: 2.2, repeat: Infinity, delay: 1 }}
      />
    </svg>
  </div>
)

const problems = [
  {
    title: 'Ghost Clicks',
    description: 'eating your daily spend',
  },
  {
    title: 'Zombie Ad Groups',
    description: 'that produce nothing',
  },
  {
    title: 'Wrong Bids',
    description: "on keywords you shouldn't even target",
  },
  {
    title: 'Wasted Spend',
    description: 'your agency or marketer will never report',
  },
]

const AgitateTheProblem = () => {
  const router = useRouter()
  const { user } = useUser()
  const { selectedAccountId } = useGoogleAds()

  const handleGetTruth = async () => {
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
      <div className="max-w-4xl mx-auto text-center">
        {/* Icon */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
          viewport={{ once: true }}
        >
          <LeakingWalletIcon />
        </motion.div>

        {/* Main headline */}
        <motion.h2
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-6 leading-tight"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Your Team Shows You The Good Metrics.
          <br />
          <span className="text-black">We Show You The Truth.</span>
        </motion.h2>

        {/* Problem description */}
        <motion.p
          className="text-xl md:text-2xl text-black mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          Your budget is being silently drained by:
        </motion.p>

        {/* Problems list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-3xl mx-auto">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              className="flex items-start gap-3 text-left"
              initial={{ x: index % 2 === 0 ? -30 : 30, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="w-2 h-2 bg-black rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <span className="font-bold text-lg text-black">
                  {problem.title}
                </span>
                <span className="text-lg text-black">
                  {' '}
                  {problem.description}.
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom text */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          viewport={{ once: true }}
        >
          <p className="text-lg md:text-xl text-black mb-2">
            It&apos;s not their fault. It&apos;s the system&apos;s.
          </p>
          <p className="text-xl md:text-2xl font-bold text-black">
            But it&apos;s{' '}
            <span className="text-black underline">your money</span>.
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
            delay: 1.2,
          }}
          viewport={{ once: true }}
        >
          <motion.button
            onClick={() => void handleGetTruth()}
            className="px-10 py-4 text-xl font-bold text-white bg-black hover:bg-gray-800 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get The Truth About My Account →
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

export default AgitateTheProblem
