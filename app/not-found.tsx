'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function NotFound() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const backgroundY = scrollY * 0.3

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white -mt-20">
      {/* Background pattern with dog images */}
      <div
        className="absolute inset-0 bg-white"
        style={{
          transform: `translateY(${backgroundY}px)`,
          transition: 'transform 0.1s ease-out',
        }}
      >
        {/* Grid of dog images */}
        <div className="absolute inset-0 grid grid-cols-6 gap-8 p-12 opacity-10">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="relative"
              style={{
                backgroundImage: `url('/dog (1).png')`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                transform:
                  i % 3 === 0
                    ? 'rotate(8deg)'
                    : i % 3 === 1
                    ? 'rotate(-8deg)'
                    : 'rotate(0deg)',
                height: '120px',
                opacity: 0.1 + Math.random() * 0.05,
                filter: 'grayscale(100%)',
                mixBlendMode: 'multiply',
              }}
            />
          ))}
        </div>
      </div>

      {/* Subtle line pattern */}
      <div className="absolute inset-0">
        <svg
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-5"
        >
          <pattern
            id="404-line-pattern"
            x="0"
            y="0"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="30"
              x2="60"
              y2="30"
              stroke="black"
              strokeWidth="0.3"
              strokeDasharray="2 8"
            />
            <line
              x1="30"
              y1="0"
              x2="30"
              y2="60"
              stroke="black"
              strokeWidth="0.3"
              strokeDasharray="2 8"
            />
          </pattern>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#404-line-pattern)"
          />
        </svg>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto text-center z-10 px-4">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          {/* 404 number with dog paw */}
          <div className="relative">
            <motion.h1
              className="text-8xl md:text-9xl font-bold text-black mb-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              4
              <span className="relative inline-block mx-2">
                <motion.img
                  src="/dog (1).png"
                  alt="Dog paw"
                  width={80}
                  height={80}
                  className="inline-block opacity-70 grayscale"
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                />
              </span>
              4
            </motion.h1>

            {/* Decorative underline */}
            <motion.div
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-0.5 bg-black"
              initial={{ width: 0 }}
              animate={{ width: '8rem' }}
              transition={{ duration: 0.8, delay: 0.5 }}
            />
          </div>

          {/* Heading */}
          <motion.h2
            className="text-2xl md:text-3xl font-semibold text-black"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Page Not Found
          </motion.h2>

          {/* Description */}
          <motion.p
            className="text-gray-600 max-w-md mx-auto text-lg leading-relaxed"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Looks like this page went chasing squirrels and got lost. Let&apos;s
            get you back on track to optimizing your Google Ads ROI.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Link
              href="/"
              className="group inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg
                className="w-5 h-5 mr-3 transition-transform group-hover:-translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Return to Home
              <motion.div
                className="ml-2"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ●
              </motion.div>
            </Link>
          </motion.div>

          {/* Additional helpful links */}
          <motion.div
            className="pt-8 border-t border-gray-200 mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <p className="text-gray-500 mb-4">
              Looking for something specific?
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/google-ads"
                className="text-black hover:text-gray-600 transition-colors duration-200 border-b border-transparent hover:border-black pb-1"
              >
                Google Ads Analysis
              </Link>
              <Link
                href="/pricing"
                className="text-black hover:text-gray-600 transition-colors duration-200 border-b border-transparent hover:border-black pb-1"
              >
                Pricing
              </Link>
              <Link
                href="/contact"
                className="text-black hover:text-gray-600 transition-colors duration-200 border-b border-transparent hover:border-black pb-1"
              >
                Contact
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating decorative elements */}
      <motion.div
        className="absolute top-1/4 left-8 w-24 h-24 opacity-5"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="black"
            strokeWidth="1"
            strokeDasharray="5 5"
          />
        </svg>
      </motion.div>

      <motion.div
        className="absolute bottom-1/4 right-8 w-20 h-20 opacity-5"
        animate={{
          y: [0, 20, 0],
          rotate: [360, 180, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg viewBox="0 0 100 100">
          <rect
            x="25"
            y="25"
            width="50"
            height="50"
            fill="none"
            stroke="black"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        </svg>
      </motion.div>
    </div>
  )
}
