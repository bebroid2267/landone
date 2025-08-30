'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function ROASCalculator() {
  const [monthlySpendDisplay, setMonthlySpendDisplay] = useState('10000')
  const [currentROASDisplay, setCurrentROASDisplay] = useState('2.5')
  
  // Convert display strings to numbers for calculations
  const monthlySpend = Number(monthlySpendDisplay) || 0
  const currentROAS = Number(currentROASDisplay) || 0
  
  // Optimization levers with their improvements
  const optimizationLevers = [
    { name: "Add Proper Negative Keywords", improvement: 0.08, enabled: false },
    { name: "Refine Bidding Based on Data", improvement: 0.15, enabled: false },
    { name: "Fix Keyword Cannibalization", improvement: 0.06, enabled: false },
    { name: "Fix Poorly Themed Ad Groups", improvement: 0.05, enabled: false },
    { name: "Remove Non-Performing Assets", improvement: 0.10, enabled: false },
    { name: "Improve Device/Geo Targeting", improvement: 0.07, enabled: false },
    { name: "Implement Ad Scheduling", improvement: 0.04, enabled: false },
    { name: "SECRET SAUCE", improvement: 0.17, enabled: false }
  ]

  const [levers, setLevers] = useState(optimizationLevers)

  // Calculate compounded improvement
  const totalCompoundedImprovement = levers.reduce((compound, lever) => {
    if (lever.enabled) {
      return compound * (1 + lever.improvement)
    }
    return compound
  }, 1) - 1

  const newROAS = currentROAS * (1 + totalCompoundedImprovement)
  const currentProfit = monthlySpend * (currentROAS - 1)
  const newProfit = monthlySpend * (newROAS - 1)
  const profitLift = newProfit - currentProfit
  const profitLiftPercentage = currentProfit > 0 ? (profitLift / currentProfit) * 100 : 0

  const toggleLever = (index: number) => {
    setLevers(prev => prev.map((lever, i) => 
      i === index ? { ...lever, enabled: !lever.enabled } : lever
    ))
  }

  const handleMonthlySpendChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    
    // If value is empty, set to '0'
    if (value === '') {
      setMonthlySpendDisplay('0')
      return
    }
    
    // Remove any non-digit characters
    value = value.replace(/[^\d]/g, '')
    
    // If value starts with '0' and has more digits, remove leading zeros
    if (value.length > 1 && value.startsWith('0')) {
      value = value.replace(/^0+/, '')
    }
    
    // If all zeros were removed, set to '0'
    if (value === '') {
      value = '0'
    }
    
    setMonthlySpendDisplay(value)
  }

  const handleROASChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    
    // If value is empty, set to '0'
    if (value === '') {
      setCurrentROASDisplay('0')
      return
    }
    
    // Allow only digits and one decimal point
    value = value.replace(/[^\d.]/g, '')
    
    // Ensure only one decimal point
    const parts = value.split('.')
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('')
    }
    
    // Handle leading zeros for whole numbers (but not for decimals like 0.5)
    if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
      value = value.replace(/^0+/, '')
    }
    
    // If all digits were removed, set to '0'
    if (value === '' || value === '.') {
      value = '0'
    }
    
    setCurrentROASDisplay(value)
  }

  return (
    <section className="py-20 px-4 relative overflow-hidden bg-gray-50/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto" style={{ padding: '0 clamp(16px, 4vw, 48px)' }}>
        <motion.div
          className="text-center mb-12"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
            The Roas.dog <span className="text-black">Optimization Engine</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Flip the switches to see how fixing core issues in your account compounds into massive returns.
          </p>
        </motion.div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Input Controls */}
          <div className="bg-gray-50 p-8 border-b">
            <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Monthly Ad Spend
                </label>
                <input
                  type="number"
                  value={monthlySpendDisplay}
                  onChange={handleMonthlySpendChange}
                  className="w-full text-2xl font-bold text-gray-900 bg-white border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Current ROAS
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={currentROASDisplay}
                  onChange={handleROASChange}
                  className="w-full text-2xl font-bold text-gray-900 bg-white border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-black"
                />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-0">
            {/* Left Side - Optimization Levers */}
            <div className="p-8">
              <h3 className="text-xl font-bold mb-6 text-gray-900">1. Optimization Levers</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {levers.map((lever, index) => (
                  <motion.div
                    key={index}
                    className="relative h-full"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all h-full ${
                        lever.enabled
                          ? 'border-gray-800 bg-gray-100'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => toggleLever(index)}
                    >
                      <div className="flex flex-col gap-2 h-full justify-between">
                        {/* Top row: Lever name only */}
                        <div className="min-h-[2.5rem] flex items-start">
                          <p className="text-sm font-medium text-gray-900 leading-tight">
                            {lever.name}
                          </p>
                        </div>
                        
                        {/* Middle row: Toggle switch centered */}
                        <div className="flex justify-center">
                          <div
                            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                              lever.enabled
                                ? 'bg-gray-600'
                                : 'bg-gray-300'
                            }`}
                          >
                            <motion.div
                              className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-lg"
                              animate={{ x: lever.enabled ? 28 : 2 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                            />
                          </div>
                        </div>

                        {/* Bottom row: Percentage centered (fixed height area) */}
                        <div className="flex justify-center min-h-[1.5rem]">
                          {lever.enabled && (
                            <motion.span
                              className="text-green-500 font-bold text-sm"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.3 }}
                            >
                              +{(lever.improvement * 100).toFixed(0)}%
                            </motion.span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right Side - Results */}
            <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100">
              <h3 className="text-xl font-bold mb-6 text-gray-900">2. Live Results</h3>
              
              <div className="text-center">
                <motion.div
                  className="mb-8"
                  key={totalCompoundedImprovement}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-sm font-medium text-gray-600 mb-2">
                    Total Compounded Profit Lift
                  </div>
                  <div className={`text-6xl font-bold mb-2 ${profitLiftPercentage > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    +{profitLiftPercentage.toFixed(1)}%
                  </div>
                </motion.div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-xs font-medium text-gray-500 mb-1">New ROAS</div>
                    <div className="text-lg sm:text-2xl font-bold text-gray-900 break-words">
                      {newROAS.toFixed(2)}x
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-xs font-medium text-gray-500 mb-1">New Monthly Profit</div>
                    <div className="text-lg sm:text-2xl font-bold text-green-600 break-words">
                      ${newProfit.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}