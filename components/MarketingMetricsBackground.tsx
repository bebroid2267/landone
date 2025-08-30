'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface MarketingMetricsBackgroundProps {
  variant?: 'subtle' | 'floating' | 'matrix'
}

const metrics = [
  { label: 'CTR', value: '3.2%', change: '+0.5%' },
  { label: 'CPC', value: '$0.85', change: '-$0.12' },
  { label: 'ROAS', value: '425%', change: '+32%' },
  { label: 'CVR', value: '2.8%', change: '+0.3%' },
  { label: 'CAC', value: '$45', change: '-$8' },
  { label: 'LTV', value: '$320', change: '+$25' },
  { label: 'CPM', value: '$12.5', change: '-$1.2' },
  { label: 'AOV', value: '$125', change: '+$15' },
  { label: 'ROI', value: '287%', change: '+18%' },
  { label: 'CPA', value: '$38', change: '-$5' },
]

export default function MarketingMetricsBackground({ variant = 'subtle' }: MarketingMetricsBackgroundProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
      
      {/* Animated rings with medium visibility */}
      {[1, 2, 3, 4].map((ring) => (
        <motion.div
          key={ring}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: `${ring * 25}%`,
            height: `${ring * 25}%`,
            border: '3px solid',
            borderColor: ring % 2 === 0 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(139, 92, 246, 0.2)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: ring % 2 === 0 ? 360 : -360,
          }}
          transition={{
            duration: 30 + ring * 5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* Metrics floating around rings */}
      {metrics.map((metric, i) => {
        const angle = (i / metrics.length) * Math.PI * 2
        const radius = 250 + (i % 3) * 120
        
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
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 25 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.5,
            }}
          >
            <div className="-translate-x-1/2 -translate-y-1/2 bg-gray-900/10 backdrop-blur-sm rounded-xl p-2 shadow-sm border border-gray-200/50">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-600 font-medium">{metric.label}</span>
                <span className="text-xs font-semibold text-gray-800">{metric.value}</span>
                <span className={`text-[10px] font-medium ${metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.change}
                </span>
              </div>
            </div>
          </motion.div>
        )
      })}

      {/* Subtle floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full"
          style={{
            width: '3px',
            height: '3px',
            backgroundColor: i % 2 === 0 ? 'rgba(59, 130, 246, 0.3)' : 'rgba(139, 92, 246, 0.3)',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 20 + Math.random() * 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3,
          }}
        />
      ))}

      {/* Subtle pulsing center glow */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Matrix-style falling metrics */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`matrix-${i}`}
          className="absolute text-xs font-mono text-gray-400/40"
          style={{
            left: `${i * 6.66}%`,
            top: '-20px',
          }}
          animate={{
            y: [0, window.innerHeight + 40],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 10 + Math.random() * 5,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 1.5,
            repeatDelay: Math.random() * 5,
          }}
        >
          {metrics[i % metrics.length].value}
        </motion.div>
      ))}
    </div>
  )
}