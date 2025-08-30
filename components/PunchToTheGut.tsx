import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/components/hooks/useUser'
import { useGoogleAds } from '@/components/hooks/useGoogleAds'
import { signInWithGoogle } from '@/utils/oauth-helpers/google-oauth'

const PunchToTheGut = () => {
  const [scrollY, setScrollY] = useState(0)
  const [dogOpacities, setDogOpacities] = useState<number[]>([])
  const router = useRouter()
  const { user } = useUser()
  const { selectedAccountId } = useGoogleAds()

  // Generate stable opacity values only on client side
  useEffect(() => {
    const opacities = Array.from(
      { length: 20 },
      () => 0.2 + Math.random() * 0.1,
    )
    setDogOpacities(opacities)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    // Prevent horizontal overflow during parallax
    document.body.style.overflowX = 'hidden'

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      // Reset body overflow when component unmounts
      document.body.style.overflowX = 'auto'
    }
  }, [])

  const handleGetAudit = async () => {
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

  // Calculate parallax positions with limits to prevent overflow
  const maxParallax = 50 // Limit parallax movement
  const backgroundY = Math.min(
    Math.max(scrollY * 0.3, -maxParallax),
    maxParallax,
  )
  const midgroundY = Math.min(
    Math.max(scrollY * 0.2, -maxParallax),
    maxParallax,
  )
  const contentY = Math.min(Math.max(scrollY * -0.1, -maxParallax), maxParallax)

  return (
    <section
      className="relative min-h-screen flex items-center justify-center bg-white"
      style={{
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Parallax container with dog pattern */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main background with dog images pattern */}
        <div
          className="absolute inset-0 bg-white will-change-transform"
          style={{
            transform: `translate3d(0, ${backgroundY}px, 0)`,
            width: '100%',
            height: '100%',
          }}
        >
          {/* Grid of dog images */}
          <div className="absolute inset-0 grid grid-cols-5 gap-4 p-8 opacity-15">
            {dogOpacities.length > 0 &&
              Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="relative"
                  style={{
                    backgroundImage: `url('/dog (1).png')`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    transform: i % 2 === 0 ? 'rotate(5deg)' : 'rotate(-5deg)',
                    height: '150px',
                    opacity: dogOpacities[i],
                    filter: 'grayscale(100%)',
                    mixBlendMode: 'multiply',
                  }}
                />
              ))}
          </div>
        </div>

        {/* Subtle line art pattern - midground parallax */}
        <div
          className="absolute inset-0 will-change-transform"
          style={{
            transform: `translate3d(0, ${midgroundY}px, 0)`,
          }}
        >
          <svg
            width="100%"
            height="100%"
            xmlns="http://www.w3.org/2000/svg"
            className="opacity-10"
          >
            <pattern
              id="line-pattern"
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
              fill="url(#line-pattern)"
            />
          </svg>
        </div>

        {/* Decorative elements with controlled parallax */}
        <div
          className="absolute top-1/4 left-1/4 w-32 h-32 will-change-transform"
          style={{
            transform: `translate3d(0, ${backgroundY * 0.5}px, 0)`,
          }}
        >
          <svg viewBox="0 0 100 100" className="opacity-5">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="black"
              strokeWidth="0.5"
            />
          </svg>
        </div>

        <div
          className="absolute bottom-1/4 right-1/4 w-40 h-40 will-change-transform"
          style={{
            transform: `translate3d(0, ${midgroundY * 0.5}px, 0)`,
          }}
        >
          <svg viewBox="0 0 100 100" className="opacity-5">
            <rect
              x="20"
              y="20"
              width="60"
              height="60"
              fill="none"
              stroke="black"
              strokeWidth="0.5"
            />
          </svg>
        </div>
      </div>

      {/* Content with subtle upward movement */}
      <div
        className="max-w-5xl mx-auto text-center px-4 z-10 relative will-change-transform"
        style={{
          transform: `translate3d(0, ${contentY}px, 0)`,
        }}
      >
        <motion.h1
          className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 text-black leading-[0.9]"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <span className="text-black">92%</span> of Google Ads Accounts
          <br />
          Are{' '}
          <span className="underline decoration-black decoration-4">
            Bleeding Money
          </span>
          .
        </motion.h1>

        <motion.p
          className="text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-12 leading-tight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Let&apos;s See How Badly Yours Is.
        </motion.p>

        <motion.div
          className="flex justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
            delay: 0.8,
          }}
        >
          <motion.button
            onClick={() => void handleGetAudit()}
            className="px-12 py-4 text-xl font-bold text-white bg-black hover:bg-gray-800 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Show Me The Damage →
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

export default PunchToTheGut
