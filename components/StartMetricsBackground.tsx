'use client'

import React, { useEffect, useRef } from 'react'

interface StartMetricsBackgroundProps {
  variant?: 'subtle' | 'comet' | 'dynamic'
}

export default function StartMetricsBackground({ variant = 'subtle' }: StartMetricsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()

    // Matrix characters (numbers)
    const characters = '0123456789'
    const fontSize = 14
    const columns = Math.floor(canvas.width / fontSize)

    // Array to store the y position of each column
    const drops: number[] = []
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * canvas.height / fontSize)
    }

    // Animation function
    const draw = () => {
      // White overlay for trail effect while keeping background white
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Gray text for matrix effect with transparency (darker)
      ctx.fillStyle = 'rgba(107, 114, 128, 0.3)'
      ctx.font = `${fontSize}px monospace`

      // Loop through drops
      for (let i = 0; i < drops.length; i++) {
        // Random character
        const text = characters[Math.floor(Math.random() * characters.length)]
        
        // Draw the character
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        // Reset drop to top randomly or when it reaches bottom
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }

        // Move the drop down
        drops[i]++
      }
    }

    // Start animation
    const animationId = setInterval(draw, 35)

    // Handle window resize
    const handleResize = () => {
      resizeCanvas()
      // Recalculate columns
      const newColumns = Math.floor(canvas.width / fontSize)
      drops.length = newColumns
      for (let i = 0; i < newColumns; i++) {
        if (drops[i] === undefined) {
          drops[i] = Math.floor(Math.random() * canvas.height / fontSize)
        }
      }
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      clearInterval(animationId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
      {/* Subtle start gradient */}
      <div className="absolute inset-0 bg-white" />
      
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{ background: 'transparent' }}
      />
    </div>
  )
}