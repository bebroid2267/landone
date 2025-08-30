import { motion } from 'framer-motion'
import { useState } from 'react'

const steps = [
  {
    title: 'Connect',
    description: 'Securely link your Google Ads account in seconds.',
    icon: 'connect',
  },
  {
    title: 'Analyze',
    description:
      'Our AI-trained snout scans for wasted spend and hidden keywords.',
    icon: 'analyze',
  },
  {
    title: 'Implement',
    description: 'Receive an actionable report and watch your ROI climb.',
    icon: 'implement',
  },
]

const HowItWorks = () => {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null)

  return (
    <section id="how-it-works" className="py-20 px-4 bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            How roas.dog Works
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Three simple steps to supercharge your Google Ads
          </p>
        </div>

        <div className="relative">
          {/* Horizontal connecting line between steps */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gray-200">
            <motion.div
              className="h-full bg-black"
              initial={{ width: '0%' }}
              whileInView={{ width: '100%' }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              viewport={{ once: true }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm relative"
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                onMouseEnter={() => setHoveredStep(index)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                {/* Dog image badge with bounce/return animation */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    className="relative"
                    initial={{ x: 0 }}
                    animate={
                      hoveredStep === index ? { x: [0, 10, 0] } : { x: 0 }
                    }
                    transition={{
                      duration: 0.5,
                      ease: 'easeOut',
                    }}
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                      <div
                        className="w-14 h-14 relative"
                        style={{
                          backgroundImage: `url('/dog (1).png')`,
                          backgroundSize: 'contain',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          transform:
                            index % 2 === 0 ? 'rotate(5deg)' : 'rotate(-5deg)',
                        }}
                      />
                    </div>

                    {/* Step number */}
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                  </motion.div>
                </div>

                <h3 className="text-xl font-bold text-black mb-3 text-center">
                  {step.title}
                </h3>
                <p className="text-gray-700 text-center">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
