import { motion } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { Modal } from '@/components/hooks/UI/Modal'
import IntegratedGoogleAds from '@/components/google-ads/IntegratedGoogleAds'

// Pawprint underline component
const PawUnderline = () => (
  <motion.div
    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gray-200 overflow-hidden"
    initial={{ width: 0 }}
    animate={{ width: '100%' }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex justify-between w-full">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="8"
          height="4"
          viewBox="0 0 8 4"
          fill="black"
          className="opacity-60"
          style={{ transform: `translateX(${i * 2}px)` }}
        >
          <circle cx="4" cy="2" r="2" />
        </svg>
      ))}
    </div>
  </motion.div>
)

interface HeroRoiProps {
  autoOpenModal?: boolean
}

const HeroRoi: React.FC<HeroRoiProps> = ({ autoOpenModal = false }) => {
  const ref = useRef(null)
  const [scrollY, setScrollY] = useState(0)
  const [isLinkHovered, setIsLinkHovered] = useState(false)
  const [isGoogleAdsModalOpen, setGoogleAdsModalOpen] = useState(false)
  const [dogOpacities, setDogOpacities] = useState<number[]>([])

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

    // Initial call to set accurate initial position
    handleScroll()

    // Add event listener for scroll with immediate update
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll)
      // Reset body overflow when component unmounts
      document.body.style.overflowX = 'auto'
    }
  }, [])

  // Auto-open modal when autoOpenModal is true
  useEffect(() => {
    if (autoOpenModal) {
      setGoogleAdsModalOpen(true)
    }
  }, [autoOpenModal])

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
      ref={ref}
      className="relative min-h-screen flex items-center justify-center bg-white py-20 px-4"
      style={{
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Parallax container with strict boundaries */}
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
        className="max-w-4xl mx-auto text-center z-10 relative will-change-transform"
        style={{
          transform: `translate3d(0, ${contentY}px, 0)`,
        }}
      >
        <motion.h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-black"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          Unleash Your Google Ads ROI in 24 Hours
        </motion.h1>

        <motion.p
          className="text-xl text-gray-700 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Let roas.dog dig out wasted spend so you can focus on growth.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 10,
            delay: 0.5,
          }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => setGoogleAdsModalOpen(true)}
              className="w-full sm:w-auto px-8 py-3 text-lg font-medium text-white bg-black hover:bg-gray-800 rounded-md transition-colors duration-300 text-center"
            >
              <span className="inline-flex items-center justify-center">
                <span className="mr-2">🐾</span>
                Fetch My Audit Now
              </span>
            </button>
          </motion.div>

          <motion.div
            className="relative"
            onHoverStart={() => setIsLinkHovered(true)}
            onHoverEnd={() => setIsLinkHovered(false)}
          >
            <button
              onClick={() => setGoogleAdsModalOpen(true)}
              className="w-full sm:w-auto px-8 py-3 text-lg font-medium text-black border border-black hover:bg-gray-100 rounded-md transition-colors duration-300 text-center"
            >
              Let roas.dog Unleash My ROI
            </button>
            {isLinkHovered && <PawUnderline />}
          </motion.div>
        </motion.div>
      </div>

      <Modal
        id="google-ads-modal-hero"
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

export default HeroRoi
