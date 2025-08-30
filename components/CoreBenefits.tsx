import { motion } from 'framer-motion'
import { useState } from 'react'

// Иконки для секции преимуществ
const SniffIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-10 h-10"
  >
    <path
      d="M12 6V4M12 6C10.8954 6 10 6.89543 10 8C10 9.10457 10.8954 10 12 10M12 6C13.1046 6 14 6.89543 14 8C14 9.10457 13.1046 10 12 10M6 20V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V20M18 8L20 10M6 8L4 10M12 10V14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const FetchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-10 h-10"
  >
    <path
      d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M14 9L11 12L14 15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const BarkIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-10 h-10"
  >
    <path
      d="M3 12H7M7 12L10 9M7 12L10 15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 12H21M17 12L14 9M17 12L14 15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 17V21M12 21L9 18M12 21L15 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 7V3M12 3L9 6M12 3L15 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const benefitItems = [
  {
    title: 'Sniff Out Waste',
    description: 'Pinpoint non-converting spend for instant budget efficiency.',
    icon: <SniffIcon />,
  },
  {
    title: 'Fetch Hidden Wins',
    description: 'Reveal untapped keyword gold that drives new traffic.',
    icon: <FetchIcon />,
  },
  {
    title: 'Bark Up Better Bidding',
    description: 'Optimize bids automatically for maximum returns.',
    icon: <BarkIcon />,
  },
]

const CoreBenefits = () => {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)

  return (
    <section id="benefits-core" className="py-20 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Why Marketers Love roas.dog
          </h2>
        </div>

        <div className="flex flex-col space-y-6">
          {benefitItems.map((item, index) => (
            <motion.div
              key={index}
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.15,
                ease: 'easeOut',
              }}
              viewport={{ once: true }}
              onMouseEnter={() => setHoveredItem(index)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <motion.div
                className="flex-shrink-0 bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center text-black mr-6"
                animate={
                  hoveredItem === index
                    ? {
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                        transition: {
                          duration: 0.5,
                          ease: 'easeInOut',
                        },
                      }
                    : {}
                }
              >
                {item.icon}
              </motion.div>

              <div className="flex-1">
                <h3 className="text-xl font-bold text-black mb-1">
                  {item.title}
                </h3>
                <p className="text-gray-700 text-sm md:text-base max-w-xs md:max-w-none break-words">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CoreBenefits
