import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUser } from '@/components/hooks/useUser'
import { useGoogleAds } from '@/components/hooks/useGoogleAds'
import { signInWithGoogle } from '@/utils/oauth-helpers/google-oauth'

// X-Ray scanner icon
const XRayIcon = () => (
  <div className="relative">
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-black"
    >
      {/* Scanner frame */}
      <rect
        x="20"
        y="20"
        width="80"
        height="80"
        rx="8"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />

      {/* Inner scanning grid */}
      <motion.g
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <line
          x1="30"
          y1="30"
          x2="90"
          y2="30"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="30"
          y1="45"
          x2="90"
          y2="45"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="30"
          y1="60"
          x2="90"
          y2="60"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="30"
          y1="75"
          x2="90"
          y2="75"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="30"
          y1="90"
          x2="90"
          y2="90"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />

        <line
          x1="30"
          y1="30"
          x2="30"
          y2="90"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="45"
          y1="30"
          x2="45"
          y2="90"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="60"
          y1="30"
          x2="60"
          y2="90"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="75"
          y1="30"
          x2="75"
          y2="90"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="90"
          y1="30"
          x2="90"
          y2="90"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
      </motion.g>

      {/* Scanning beam */}
      <motion.line
        x1="20"
        y1="60"
        x2="100"
        y2="60"
        stroke="currentColor"
        strokeWidth="3"
        initial={{ x1: 20, x2: 20 }}
        animate={{ x1: 20, x2: 100 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Corner indicators */}
      <rect x="15" y="15" width="10" height="10" fill="currentColor" />
      <rect x="95" y="15" width="10" height="10" fill="currentColor" />
      <rect x="15" y="95" width="10" height="10" fill="currentColor" />
      <rect x="95" y="95" width="10" height="10" fill="currentColor" />
    </svg>
  </div>
)

const InstantSolution = () => {
  const router = useRouter()
  const { user } = useUser()
  const { selectedAccountId } = useGoogleAds()

  const handleGetXRay = async () => {
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
    <section className="py-20 px-4 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        {/* Icon */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
          viewport={{ once: true }}
        >
          <XRayIcon />
        </motion.div>

        {/* Main headline */}
        <motion.h2
          className="text-4xl md:text-5xl lg:text-6xl font-black text-black mb-8 leading-tight"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Stop Guessing. Start Seeing.
        </motion.h2>

        {/* Description */}
        <motion.p
          className="text-xl md:text-2xl text-black mb-6 leading-relaxed max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          We built an AI that performs a{' '}
          <span className="font-bold">surgical-level audit</span> of your entire
          Google Ads setup. It bypasses the vanity metrics and finds the{' '}
          <span className="underline">financial leaks</span>.
        </motion.p>

        {/* G-Ads X-Ray branding */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="text-lg md:text-xl text-black mb-2">We call it the</p>
          <div className="inline-block p-6 border-2 border-black bg-white">
            <h3 className="text-3xl md:text-4xl font-black text-black tracking-wider">
              G-ADS X-RAY
            </h3>
          </div>
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
            delay: 0.8,
          }}
          viewport={{ once: true }}
        >
          <motion.button
            onClick={() => void handleGetXRay()}
            className="px-10 py-4 text-xl font-bold text-white bg-black hover:bg-gray-800 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-black"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start X-Ray Scan →
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

export default InstantSolution
