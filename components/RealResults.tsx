'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CaseStudy {
  businessType: string
  companyName: string
  description: string
  opportunities: Array<{
    problem: string
    improvement: string
    color: string
  }>
  results: {
    totalLift: string
    roasFrom: string
    roasTo: string
    profitFrom: string
    profitTo: string
  }
}

const caseStudies: CaseStudy[] = [
  {
    businessType: "E-commerce Store",
    companyName: "Artisan Coffee Co.",
    description: "Was struggling with rising ad costs and stagnant sales from their Shopping campaigns.",
    opportunities: [
      {
        problem: "**Misaligned Conversions:** Low-value goals were confusing the bidding AI.",
        improvement: "+20% Profit",
        color: "text-green-600"
      },
      {
        problem: "**Poorly Themed Ad Groups:** Mixed keywords led to low ad relevance.",
        improvement: "+15% ROAS",
        color: "text-green-600"
      },
      {
        problem: "**Wasted Spend:** High cost on generic, non-converting search terms.",
        improvement: "-$7.5k/mo",
        color: "text-green-600"
      },
      {
        problem: "**Device Targeting:** Mobile bids were 3x too high for their audience.",
        improvement: "+12% ROAS",
        color: "text-green-600"
      }
    ],
    results: {
      totalLift: "+112%",
      roasFrom: "2.8x",
      roasTo: "4.9x",
      profitFrom: "$18k",
      profitTo: "$38.2k"
    }
  },
  {
    businessType: "SaaS Company",
    companyName: "CloudSync Pro",
    description: "B2B software struggling with high cost-per-lead and low-quality traffic from search campaigns.",
    opportunities: [
      {
        problem: "**Attribution Window:** 7-day setting missed 40% of conversions from long sales cycles.",
        improvement: "+28% Conversions",
        color: "text-green-600"
      },
      {
        problem: "**Negative Keywords:** Competing with free alternatives and unqualified searches.",
        improvement: "-$4.2k/mo",
        color: "text-green-600"
      },
      {
        problem: "**Landing Page Mismatch:** Generic pages for specific product searches.",
        improvement: "+18% CVR",
        color: "text-green-600"
      },
      {
        problem: "**Bid Strategy:** Manual CPC instead of optimizing for lead value.",
        improvement: "+22% ROAS",
        color: "text-green-600"
      }
    ],
    results: {
      totalLift: "+89%",
      roasFrom: "1.4x",
      roasTo: "3.1x",
      profitFrom: "$12k",
      profitTo: "$26.8k"
    }
  },
  {
    businessType: "Local Service",
    companyName: "Elite Home Cleaning",
    description: "Local business wasting budget on clicks from wrong locations and competitor searches.",
    opportunities: [
      {
        problem: "**Geo-Targeting:** Showing ads 50+ miles outside service area.",
        improvement: "-$3.1k/mo",
        color: "text-green-600"
      },
      {
        problem: "**Search Terms:** Paying for competitor names and DIY searches.",
        improvement: "+25% CTR",
        color: "text-green-600"
      },
      {
        problem: "**Scheduling:** Running ads when phones weren't answered.",
        improvement: "+15% Conversions",
        color: "text-green-600"
      },
      {
        problem: "**Extensions:** Missing location and call extensions reduced visibility.",
        improvement: "+35% CTR",
        color: "text-green-600"
      }
    ],
    results: {
      totalLift: "+156%",
      roasFrom: "1.8x",
      roasTo: "4.6x",
      profitFrom: "$8k",
      profitTo: "$20.5k"
    }
  },
  {
    businessType: "Online Retailer",
    companyName: "TechGadgets Plus",
    description: "Electronics retailer losing to Amazon with poor product feed optimization and generic campaigns.",
    opportunities: [
      {
        problem: "**Product Titles:** Generic names hurt Shopping campaign performance.",
        improvement: "+30% Impressions",
        color: "text-green-600"
      },
      {
        problem: "**Price Competitiveness:** Outdated competitor price tracking.",
        improvement: "+24% ROAS",
        color: "text-green-600"
      },
      {
        problem: "**Campaign Structure:** All products in one campaign diluted budget.",
        improvement: "+19% Conversions",
        color: "text-green-600"
      },
      {
        problem: "**Seasonal Adjustments:** Missing inventory-based bid modifications.",
        improvement: "+16% Profit",
        color: "text-green-600"
      }
    ],
    results: {
      totalLift: "+134%",
      roasFrom: "2.1x",
      roasTo: "4.9x",
      profitFrom: "$22k",
      profitTo: "$51.5k"
    }
  }
]

export default function RealResults() {
  const [currentCase, setCurrentCase] = useState(0)

  const nextCase = () => {
    setCurrentCase((prev) => (prev + 1) % caseStudies.length)
  }

  const prevCase = () => {
    setCurrentCase((prev) => (prev - 1 + caseStudies.length) % caseStudies.length)
  }

  const goToCase = (index: number) => {
    setCurrentCase(index)
  }

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto" style={{ padding: '0 clamp(16px, 4vw, 48px)' }}>
        {/* Title */}
        <motion.div
          className="text-center mb-12"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
            Real Results from Businesses Like Yours
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            See how the Roas.dog AI audit identified key issues and unlocked new growth.
          </p>
        </motion.div>

        {/* Case Study Container */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCase}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl shadow-xl overflow-hidden"
            >
              <div className="grid lg:grid-cols-2 gap-0">
                {/* Left Side - Case Details */}
                <div className="p-8">
                  {/* Business Type Tag */}
                  <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
                    {caseStudies[currentCase].businessType}
                  </div>

                  {/* Company Name */}
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">
                    {caseStudies[currentCase].companyName}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 mb-8">
                    {caseStudies[currentCase].description}
                  </p>

                  {/* Key Opportunities */}
                  <h4 className="text-lg font-bold mb-4 text-gray-900">
                    Key Opportunities Unlocked:
                  </h4>

                  <div className="space-y-4">
                    {caseStudies[currentCase].opportunities.map((opportunity, index) => (
                      <motion.div
                        key={index}
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 mb-1">
                            {opportunity.problem}
                          </p>
                        </div>
                        <div className={`font-semibold text-sm ${opportunity.color} whitespace-nowrap`}>
                          {opportunity.improvement}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Right Side - Results */}
                <div className="bg-gray-900 text-white p-8 flex flex-col justify-center">
                  <h4 className="text-lg font-bold mb-8 text-gray-300">
                    Overall Results
                  </h4>

                  {/* Total Profit Lift */}
                  <div className="text-center mb-8">
                    <div className="text-sm text-gray-400 mb-2">
                      Total Profit Lift
                    </div>
                    <div className="text-6xl font-bold text-green-400 mb-2">
                      {caseStudies[currentCase].results.totalLift}
                    </div>
                  </div>

                  {/* ROAS */}
                  <div className="bg-gray-800 rounded-xl p-4 mb-4">
                    <div className="text-xs text-gray-400 mb-1">ROAS</div>
                    <div className="text-xl font-bold">
                      {caseStudies[currentCase].results.roasFrom} → {caseStudies[currentCase].results.roasTo}
                    </div>
                  </div>

                  {/* Monthly Profit */}
                  <div className="bg-gray-800 rounded-xl p-4">
                    <div className="text-xs text-gray-400 mb-1">Monthly Profit</div>
                    <div className="text-xl font-bold">
                      {caseStudies[currentCase].results.profitFrom} → {caseStudies[currentCase].results.profitTo}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          <button
            onClick={prevCase}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextCase}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Dots Navigation */}
        <div className="flex justify-center mt-8 gap-2">
          {caseStudies.map((_, index) => (
            <button
              key={index}
              onClick={() => goToCase(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentCase ? 'bg-gray-800' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}