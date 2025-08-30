import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUser } from '@/components/hooks/useUser'
import { useGoogleAds } from '@/components/hooks/useGoogleAds'
import { signInWithGoogle } from '@/utils/oauth-helpers/google-oauth'

const BigCTA = () => {
  const router = useRouter()
  const { user } = useUser()
  const { selectedAccountId } = useGoogleAds()

  const handleInitiateXRay = async () => {
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
    <section className="py-24 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto text-center">
        {/* Main headline */}
        <motion.h2
          className="text-4xl md:text-6xl lg:text-7xl font-black text-black mb-8 leading-tight"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true }}
        >
          Your Account Is Leaking.
          <br />
          <span className="underline decoration-4 decoration-black">
            Find The Holes
          </span>
          . Now.
        </motion.h2>

        {/* Description */}
        <motion.div
          className="mb-12 max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <p className="text-xl md:text-2xl text-black mb-4 leading-relaxed">
            This is a complete,{' '}
            <span className="font-bold">no-stone-unturned analysis</span>. You
            get a report that shows:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-lg md:text-xl font-semibold">
            <div className="p-4 bg-white border border-black">
              <span className="text-black">Where</span> you&apos;re losing money
            </div>
            <div className="p-4 bg-white border border-black">
              <span className="text-black">Why</span> it&apos;s happening
            </div>
            <div className="p-4 bg-white border border-black">
              The exact steps to <span className="text-black">Fix it</span>
            </div>
          </div>
        </motion.div>

        {/* HUGE BUTTON */}
        <motion.div
          className="mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.5,
          }}
          viewport={{ once: true }}
        >
          <motion.button
            onClick={() => void handleInitiateXRay()}
            className="w-full max-w-2xl px-16 py-8 text-2xl md:text-3xl lg:text-4xl font-black text-white bg-black hover:bg-gray-800 border-4 border-black transition-all duration-300 shadow-2xl hover:shadow-3xl transform"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            style={{
              fontFamily: 'monospace',
              letterSpacing: '2px',
            }}
          >
            [ INITIATE G-ADS X-RAY ]
          </motion.button>
        </motion.div>

        {/* Subtext */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-4 text-lg md:text-xl font-semibold text-black">
            <span className="w-3 h-3 bg-black rounded-full"></span>
            <span>100% Free</span>
            <span className="w-1 h-1 bg-black rounded-full"></span>
            <span>3 Minutes</span>
            <span className="w-1 h-1 bg-black rounded-full"></span>
            <span>No Commitment</span>
            <span className="w-3 h-3 bg-black rounded-full"></span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default BigCTA
