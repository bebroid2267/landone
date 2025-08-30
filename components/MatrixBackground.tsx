'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const MatrixBackground = () => {
  const [columns, setColumns] = useState<Array<{ id: number; x: number }>>([])

  // Marketing data strings for the matrix effect
  const dataStrings = [
    'ROAS', 'CTR', 'CPC', 'CPM', 'CPA', 'ROI', 'QS',
    '3.2%', '4.5x', '$1.20', '156', '45K', '234', '8/10',
    '↑15%', '↓8%', '+320', '-12%', '5.1x', '2.8%', '$23',
    'CONV', 'IMP', 'CLK', 'AVG', 'MAX', 'MIN', 'OPT'
  ]

  useEffect(() => {
    // Calculate number of columns based on screen width
    const columnWidth = 30
    const screenWidth = window.innerWidth
    const numberOfColumns = Math.floor(screenWidth / columnWidth)
    
    const cols = Array.from({ length: numberOfColumns }, (_, i) => ({
      id: i,
      x: i * columnWidth
    }))
    setColumns(cols)

    const handleResize = () => {
      const newNumberOfColumns = Math.floor(window.innerWidth / columnWidth)
      const newCols = Array.from({ length: newNumberOfColumns }, (_, i) => ({
        id: i,
        x: i * columnWidth
      }))
      setColumns(newCols)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-white/95" />
      
      {/* Matrix columns */}
      <div className="absolute inset-0">
        {columns.map((col) => (
          <div
            key={col.id}
            className="absolute top-0 h-full"
            style={{ left: col.x }}
          >
            {/* Multiple falling elements per column */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`${col.id}-${i}`}
                className="absolute flex flex-col"
                initial={{ 
                  y: -100 - (i * 300),
                  opacity: 0
                }}
                animate={{ 
                  y: '100vh',
                  opacity: [0, 0.15, 0.15, 0]
                }}
                transition={{
                  duration: 8 + Math.random() * 4,
                  repeat: Infinity,
                  delay: i * 2 + Math.random() * 2,
                  ease: 'linear',
                  opacity: {
                    times: [0, 0.1, 0.9, 1]
                  }
                }}
              >
                {/* Generate a column of data */}
                {[...Array(8)].map((_, j) => (
                  <div
                    key={j}
                    className="text-[10px] font-mono text-gray-400 leading-5"
                    style={{
                      opacity: 1 - (j * 0.1),
                      color: j === 0 ? '#10b981' : undefined
                    }}
                  >
                    {dataStrings[Math.floor(Math.random() * dataStrings.length)]}
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        ))}
      </div>

      {/* Subtle grid overlay */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-[0.02]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="matrix-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <rect width="30" height="30" fill="none" stroke="black" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#matrix-grid)" />
      </svg>
    </div>
  )
}

export default MatrixBackground