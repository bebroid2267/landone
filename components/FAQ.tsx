import { useState } from 'react'
import { motion } from 'framer-motion'

const faqItems = [
  {
    question: 'How long does it take to get results?',
    answer:
      "You'll receive your initial audit within 24 hours. Implementation of our recommendations typically shows measurable improvement in ROI within the first week.",
  },
  {
    question: 'Do I need to change my Google Ads account?',
    answer:
      'No, we work with your existing account. You just need to grant us read access for the analysis, and all recommendations can be implemented within your current setup.',
  },
  {
    question: 'Is my data secure?',
    answer:
      "Absolutely. We use industry-leading encryption and security practices. We never store your Google Ads login credentials, and all data access is read-only and compliant with Google's API terms of service.",
  },
  {
    question: "What if I'm not satisfied with the results?",
    answer:
      "We offer a 100% satisfaction guarantee. If you don't see potential ROI improvements in your audit, we'll refund your payment completely. No questions asked.",
  },
  {
    question: 'Do you offer ongoing management?',
    answer:
      'Yes, after your initial audit, we offer several tiers of ongoing optimization services. From weekly recommendations to full account management - all tailored to your business goals.',
  },
]

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-20 px-4 bg-gray-100">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-700">
            Everything you need to know about working with roas.dog
          </p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <motion.div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <button
                className="flex justify-between items-center w-full p-5 text-left bg-white hover:bg-gray-50 transition-colors"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
              >
                <span className="text-lg font-medium text-black">
                  {item.question}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  openIndex === index ? 'max-h-96 p-5 bg-white' : 'max-h-0 p-0'
                }`}
              >
                <p className="text-gray-700">{item.answer}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FAQ
