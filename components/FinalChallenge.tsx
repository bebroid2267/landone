import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUser } from '@/components/hooks/useUser'
import { useGoogleAds } from '@/components/hooks/useGoogleAds'
import { signInWithGoogle } from '@/utils/oauth-helpers/google-oauth'

const FinalChallenge = () => {
  const router = useRouter()
  const { user } = useUser()
  const { selectedAccountId } = useGoogleAds()

  const handleGetStarted = async () => {
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
    <section className="py-24 px-4 bg-white border-t-4 border-black">
      <div className="max-w-4xl mx-auto text-center">
        {/* Main headline */}
        <motion.h2
          className="text-5xl md:text-6xl lg:text-7xl font-black text-black mb-12 leading-tight"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true }}
        >
          The Truth, Delivered.
        </motion.h2>

        {/* Content blocks */}
        <div className="space-y-8 mb-12">
          <motion.div
            className="p-8 bg-white border-2 border-black"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <p className="text-2xl md:text-3xl font-bold text-black mb-4">
              Your report is your new roadmap.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-lg">
              <div className="p-4 bg-white border border-black">
                <span className="font-bold">Follow it yourself.</span>
              </div>
              <div className="p-4 bg-white border border-black">
                <span className="font-bold">Give it to your team.</span>
              </div>
              <div className="p-4 bg-white border border-black">
                <span className="font-bold">Or let us fix it.</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="p-8 bg-black text-white"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <p className="text-xl md:text-2xl mb-4">
              Or, if you want it{' '}
              <span className="underline">fixed by the experts</span> who built
              the scanner...
            </p>
            <p className="text-2xl md:text-3xl font-bold">we can talk.</p>
          </motion.div>

          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="text-xl md:text-2xl text-black mb-2">
              The data is <span className="font-black">absolute</span>.
            </p>
            <p className="text-xl md:text-2xl text-black">
              What you do with it is{' '}
              <span className="underline font-bold">up to you</span>.
            </p>
          </motion.div>
        </div>

        {/* Final CTA */}
        <motion.div
          className="space-y-6"
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.8,
          }}
          viewport={{ once: true }}
        >
          {/* Primary button */}
          <motion.button
            onClick={() => void handleGetStarted()}
            className="w-full max-w-lg px-12 py-6 text-xl md:text-2xl font-black text-white bg-black hover:bg-gray-800 border-4 border-black transition-all duration-300 shadow-2xl hover:shadow-3xl"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            GET THE TRUTH NOW
          </motion.button>

          {/* Subtle confidence statement */}
          <p className="text-lg text-black font-semibold italic">
            No fluff. No excuses. Just facts.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

export default FinalChallenge
