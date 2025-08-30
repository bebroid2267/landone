'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface ReviewMetricsBackgroundProps {
  variant?: 'subtle' | 'wordcloud' | 'analytics'
}

const analyticsTerms = [
  // Core Metrics
  { word: 'CTR', size: 'text-2xl', weight: 'font-bold' },
  { word: 'CPC', size: 'text-xl', weight: 'font-semibold' },
  { word: 'CPA', size: 'text-lg', weight: 'font-bold' },
  { word: 'CPM', size: 'text-base', weight: 'font-medium' },
  { word: 'ROAS', size: 'text-3xl', weight: 'font-bold' },
  { word: 'ROI', size: 'text-2xl', weight: 'font-bold' },
  
  // Performance Metrics
  { word: 'Quality Score', size: 'text-lg', weight: 'font-semibold' },
  { word: 'Impression Share', size: 'text-sm', weight: 'font-medium' },
  { word: 'CVR', size: 'text-xl', weight: 'font-bold' },
  { word: 'Bounce Rate', size: 'text-base', weight: 'font-medium' },
  
  // Campaign Elements
  { word: 'Keywords', size: 'text-lg', weight: 'font-semibold' },
  { word: 'Ad Groups', size: 'text-base', weight: 'font-medium' },
  { word: 'Campaigns', size: 'text-lg', weight: 'font-semibold' },
  { word: 'Extensions', size: 'text-sm', weight: 'font-medium' },
  
  // Strategy & Optimization
  { word: 'Bidding', size: 'text-base', weight: 'font-medium' },
  { word: 'Targeting', size: 'text-lg', weight: 'font-semibold' },
  { word: 'Optimization', size: 'text-xl', weight: 'font-bold' },
  { word: 'Attribution', size: 'text-sm', weight: 'font-medium' },
  
  // Business Metrics
  { word: 'Revenue', size: 'text-xl', weight: 'font-bold' },
  { word: 'Profit', size: 'text-lg', weight: 'font-semibold' },
  { word: 'LTV', size: 'text-base', weight: 'font-medium' },
  { word: 'Budget', size: 'text-lg', weight: 'font-semibold' },
  
  // Actions & Results
  { word: 'Clicks', size: 'text-base', weight: 'font-medium' },
  { word: 'Conversions', size: 'text-lg', weight: 'font-bold' },
  { word: 'Impressions', size: 'text-sm', weight: 'font-medium' },
  { word: 'Performance', size: 'text-xl', weight: 'font-bold' },
  
  // Analysis Terms
  { word: 'Analytics', size: 'text-lg', weight: 'font-semibold' },
  { word: 'Metrics', size: 'text-base', weight: 'font-medium' },
  { word: 'Insights', size: 'text-lg', weight: 'font-semibold' },
  { word: 'Data', size: 'text-base', weight: 'font-medium' },
  
  // Technical Terms
  { word: 'Search Terms', size: 'text-sm', weight: 'font-medium' },
  { word: 'Negative Keywords', size: 'text-xs', weight: 'font-normal' },
  { word: 'Landing Page', size: 'text-sm', weight: 'font-medium' },
  { word: 'Ad Copy', size: 'text-base', weight: 'font-medium' },
]

export default function ReviewMetricsBackground({ variant = 'subtle' }: ReviewMetricsBackgroundProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
      {/* Subtle analytics gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-blue-50/30" />
      
      {/* Fade Word Cloud */}
      {analyticsTerms.map((term, i) => (
        <motion.div
          key={`word-${i}`}
          className={`absolute font-mono select-none ${term.size} ${term.weight}`}
          style={{
            left: `${5 + Math.random() * 90}%`,
            top: `${5 + Math.random() * 90}%`,
            color: '#6b7280', // gray-500 as base
          }}
          initial={{ opacity: 0.1 }}
          animate={{
            opacity: [0.1, 0.2, 1, 0.8, 0.1],
            color: [
              '#6b7280', // gray-500
              '#9ca3af', // gray-400  
              '#ffffff', // white flash
              '#4b5563', // gray-600
              '#6b7280', // back to gray-500
            ],
            scale: [1, 1.02, 1.05, 1.02, 1],
          }}
          transition={{
            duration: 6 + Math.random() * 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3 + Math.random() * 2,
            repeatDelay: Math.random() * 8 + 3
          }}
        >
          {term.word}
        </motion.div>
      ))}

      {/* Subtle connecting lines between words */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          {[...Array(8)].map((_, i) => (
            <motion.line
              key={`line-${i}`}
              x1={`${Math.random() * 100}%`}
              y1={`${Math.random() * 100}%`}
              x2={`${Math.random() * 100}%`}
              y2={`${Math.random() * 100}%`}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="2 4"
              animate={{
                opacity: [0, 0.3, 0],
                strokeDashoffset: [0, 20, 40],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: "linear",
                delay: i * 1.5
              }}
            />
          ))}
        </svg>
      </div>

      {/* Floating analytics symbols */}
      {['%', '$', '#', '@', '∆', '∑', '→', '↑'].map((symbol, i) => (
        <motion.div
          key={`symbol-${i}`}
          className="absolute text-4xl font-light opacity-5 text-gray-400 select-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0.02, 0.08, 0.02],
            rotate: [0, 180, 360],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 15 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 3
          }}
        >
          {symbol}
        </motion.div>
      ))}

      {/* Data visualization elements - subtle charts */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`chart-${i}`}
          className="absolute opacity-3"
          style={{
            left: `${Math.random() * 80 + 10}%`,
            top: `${Math.random() * 80 + 10}%`,
          }}
          animate={{
            opacity: [0.02, 0.06, 0.02],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: 12 + i * 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 4
          }}
        >
          <svg width="60" height="40" viewBox="0 0 60 40">
            {[...Array(6)].map((_, j) => (
              <motion.rect
                key={j}
                x={j * 10}
                y={40 - (Math.random() * 30 + 5)}
                width="8"
                height={Math.random() * 30 + 5}
                fill="#e5e7eb"
                animate={{
                  height: [
                    Math.random() * 30 + 5,
                    Math.random() * 35 + 5,
                    Math.random() * 30 + 5
                  ]
                }}
                transition={{
                  duration: 4 + j,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: j * 0.5
                }}
              />
            ))}
          </svg>
        </motion.div>
      ))}
    </div>
  )
}