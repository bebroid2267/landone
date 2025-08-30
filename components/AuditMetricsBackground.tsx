'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface AuditMetricsBackgroundProps {
  variant?: 'subtle' | 'floating' | 'matrix'
}

const auditMetrics = [
  { label: 'Issues', value: '12', status: 'warning' },
  { label: 'Savings', value: '$1.2K', status: 'positive' },
  { label: 'Quality Score', value: '6.8/10', status: 'warning' },
  { label: 'Wasted Spend', value: '18%', status: 'negative' },
  { label: 'Keywords', value: '247', status: 'neutral' },
  { label: 'Ad Groups', value: '45', status: 'neutral' },
  { label: 'Campaigns', value: '8', status: 'neutral' },
  { label: 'Potential ROAS', value: '+35%', status: 'positive' },
  { label: 'Optimization Score', value: '72%', status: 'warning' },
  { label: 'Recommendations', value: '23', status: 'positive' },
]

export default function AuditMetricsBackground({ variant = 'subtle' }: AuditMetricsBackgroundProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-blue-50/30" />
      
      {/* Floating audit documents */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`doc-${i}`}
          className="absolute"
          style={{
            left: `${15 + (i * 15)}%`,
            top: `${20 + Math.random() * 60}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 2, -2, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1.2
          }}
        >
          <div className="w-12 h-16 bg-white/20 border border-gray-300/30 rounded-sm shadow-sm">
            <div className="p-1">
              <div className="w-full h-1 bg-gray-400/40 rounded mb-1"></div>
              <div className="w-3/4 h-1 bg-gray-400/30 rounded mb-1"></div>
              <div className="w-full h-1 bg-gray-400/30 rounded mb-1"></div>
              <div className="w-1/2 h-1 bg-gray-400/20 rounded"></div>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Scanning beam effect */}
      <motion.div
        className="absolute inset-0"
      >
        <motion.div
          className="absolute top-0 w-1 h-full bg-gradient-to-b from-transparent via-blue-400/30 to-transparent"
          animate={{
            x: ["-10%", "110%"]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 3
          }}
        />
      </motion.div>

      {/* Audit metrics floating around */}
      {auditMetrics.map((metric, i) => {
        const angle = (i / auditMetrics.length) * Math.PI * 2
        const radius = 200 + (i % 3) * 100
        
        return (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2"
            animate={{
              x: [
                Math.cos(angle) * radius,
                Math.cos(angle + Math.PI) * radius,
                Math.cos(angle) * radius
              ],
              y: [
                Math.sin(angle) * radius,
                Math.sin(angle + Math.PI) * radius,
                Math.sin(angle) * radius
              ],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 20 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.5,
            }}
          >
            <div className="-translate-x-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm rounded-xl p-2 shadow-sm border border-gray-200/30">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-600 font-medium">{metric.label}</span>
                <span className="text-xs font-semibold text-gray-800">{metric.value}</span>
                <div className={`w-2 h-2 rounded-full ${
                  metric.status === 'positive' ? 'bg-green-400/60' :
                  metric.status === 'negative' ? 'bg-red-400/60' :
                  metric.status === 'warning' ? 'bg-yellow-400/60' :
                  'bg-gray-400/60'
                }`} />
              </div>
            </div>
          </motion.div>
        )
      })}

      {/* Floating checkmarks */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`check-${i}`}
          className="absolute text-green-500/20 text-xl"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -15, 0],
            scale: [0.8, 1.2, 0.8],
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: 6 + Math.random() * 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1.5
          }}
        >
          ✓
        </motion.div>
      ))}

      {/* Analysis grid overlay - very subtle */}
      <div className="absolute inset-0 opacity-3">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern
            id="analysis-grid"
            x="0"
            y="0"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <rect width="60" height="60" fill="none" stroke="black" strokeWidth="0.5" strokeDasharray="2 4"/>
            <circle cx="30" cy="30" r="1" fill="black" opacity="0.3"/>
          </pattern>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#analysis-grid)"
          />
        </svg>
      </div>

      {/* Audit data streams */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={`stream-${i}`}
          className="absolute text-xs font-mono text-gray-400/30"
          style={{
            left: `${i * 10}%`,
            top: '-20px',
          }}
          animate={{
            y: [0, typeof window !== 'undefined' ? window.innerHeight + 40 : 800],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 1.2,
            repeatDelay: Math.random() * 3,
          }}
        >
          {auditMetrics[i % auditMetrics.length].value}
        </motion.div>
      ))}
    </div>
  )
}