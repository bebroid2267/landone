'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface FlashMetricsBackgroundProps {
  variant?: 'subtle' | 'glitch' | 'debug'
}

export default function FlashMetricsBackground({ variant = 'subtle' }: FlashMetricsBackgroundProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
      {/* Debug monitoring gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-gray-100/90" />
      
      {/* Glitch Lines Effect */}
      <div className="absolute inset-0">
        {/* Primary glitch lines */}
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={`glitch-line-${i}`}
            className="absolute w-full opacity-30"
            style={{
              height: '1px',
              top: `${(i * 4) % 100}%`,
              background: 'linear-gradient(90deg, transparent, #374151, transparent)',
              mixBlendMode: 'difference',
            }}
            animate={{
              x: [0, 2, -1, 3, 0, -2, 1, 0],
              opacity: [0.2, 0.4, 0.3, 0.5, 0.2, 0.4, 0.3, 0.2],
            }}
            transition={{
              duration: 2 + (i % 3) * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1,
              repeatDelay: Math.random() * 2,
            }}
          />
        ))}

        {/* Secondary thicker glitch lines */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`thick-glitch-${i}`}
            className="absolute w-full opacity-20"
            style={{
              height: '2px',
              top: `${(i * 12.5) % 100}%`,
              background: 'linear-gradient(90deg, transparent, #1f2937, #374151, #1f2937, transparent)',
              mixBlendMode: 'difference',
            }}
            animate={{
              x: [0, -3, 4, -2, 5, -1, 2, 0],
              scaleY: [1, 1.5, 0.8, 1.2, 1],
              opacity: [0.15, 0.3, 0.25, 0.4, 0.15],
            }}
            transition={{
              duration: 3 + i * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
              repeatDelay: 1 + Math.random() * 3,
            }}
          />
        ))}

        {/* Scanning debug lines */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`scan-line-${i}`}
            className="absolute w-full opacity-15"
            style={{
              height: '3px',
              background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)',
              mixBlendMode: 'overlay',
            }}
            animate={{
              y: [-10, typeof window !== 'undefined' ? window.innerHeight + 10 : 800],
              x: [0, 1, -1, 2, 0],
            }}
            transition={{
              y: {
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: "linear",
                delay: i * 3,
                repeatDelay: 5,
              },
              x: {
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
              }
            }}
          />
        ))}
      </div>

      {/* Data corruption squares */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`corruption-${i}`}
          className="absolute opacity-10"
          style={{
            width: `${4 + Math.random() * 8}px`,
            height: `${2 + Math.random() * 4}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: '#1f2937',
            mixBlendMode: 'difference',
          }}
          animate={{
            x: [0, Math.random() * 6 - 3, Math.random() * 4 - 2, 0],
            opacity: [0.05, 0.15, 0.08, 0.12, 0.05],
            scale: [1, 1.2, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 1.5 + Math.random() * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2,
            repeatDelay: Math.random() * 4,
          }}
        />
      ))}

      {/* Terminal-style grid overlay */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="debug-grid"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <motion.rect 
                width="20" 
                height="20" 
                fill="none" 
                stroke="#374151" 
                strokeWidth="0.5"
                animate={{
                  strokeDasharray: ["1 3", "2 2", "3 1", "1 3"],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              <circle cx="10" cy="10" r="0.5" fill="#6b7280" opacity="0.3"/>
            </pattern>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#debug-grid)"
          />
        </svg>
      </div>

      {/* Debug console indicators */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`debug-indicator-${i}`}
          className="absolute text-xs font-mono opacity-15 text-gray-600"
          style={{
            left: `${5 + i * 15}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          animate={{
            opacity: [0.1, 0.25, 0.15, 0.3, 0.1],
            x: [0, Math.random() * 3 - 1.5, 0],
          }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8,
          }}
        >
          {i % 3 === 0 ? '[OK]' : i % 3 === 1 ? '[LOG]' : '[DBG]'}
        </motion.div>
      ))}

      {/* Monitoring pulse lines */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`pulse-${i}`}
          className="absolute opacity-8"
          style={{
            left: `${20 + i * 20}%`,
            top: `${30 + Math.random() * 40}%`,
            width: '60px',
            height: '2px',
          }}
        >
          <motion.div
            className="w-full h-full bg-green-500/40"
            animate={{
              scaleX: [0, 1, 0.3, 1, 0],
              opacity: [0.3, 0.8, 0.5, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 1.2,
            }}
            style={{
              transformOrigin: 'left center',
            }}
          />
        </motion.div>
      ))}

      {/* System status blinks */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`status-blink-${i}`}
          className="absolute w-1 h-1 rounded-full opacity-20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#f59e0b' : '#3b82f6',
          }}
          animate={{
            opacity: [0.1, 0.6, 0.1],
            scale: [0.8, 1.4, 0.8],
          }}
          transition={{
            duration: 1.5 + Math.random(),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
            repeatDelay: Math.random() * 3,
          }}
        />
      ))}

      {/* Subtle data stream overlay */}
      <div className="absolute inset-0 opacity-5">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={`data-stream-${i}`}
            className="absolute text-xs font-mono text-gray-500"
            style={{
              left: `${i * 10}%`,
              top: '-20px',
            }}
            animate={{
              y: [0, typeof window !== 'undefined' ? window.innerHeight + 40 : 800],
              x: [0, Math.random() * 4 - 2, 0],
              opacity: [0, 0.15, 0.15, 0],
            }}
            transition={{
              duration: 15 + Math.random() * 5,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 2,
              repeatDelay: Math.random() * 8,
            }}
          >
            {i % 4 === 0 ? '01' : i % 4 === 1 ? '10' : i % 4 === 2 ? '11' : '00'}
          </motion.div>
        ))}
      </div>
    </div>
  )
}