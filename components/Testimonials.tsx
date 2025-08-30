import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Компонент с тегом для имени
const DogTag = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex items-center py-1.5 px-4 rounded-full bg-gray-50 border border-gray-200">
    <span className="font-medium text-black">{children}</span>
  </div>
)

interface Testimonial {
  quote: string
  author: string
  company: string
}

const testimonials: Testimonial[] = [
  {
    quote: 'roas.dog cut our CPA by 30% in just one audit.',
    author: 'Marketing Manager',
    company: 'TechCo',
  },
  {
    quote: 'Quick, clear, and actionable—best $250 we ever spent.',
    author: 'eCommerce Lead',
    company: 'ShopNow',
  },
  {
    quote: "They found keyword opportunities we'd overlooked for years.",
    author: 'Digital Director',
    company: 'SaaS Platform',
  },
]

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Calculate max height for testimonials to maintain consistent sizing
  const maxHeight = 200 // Adjust this value based on your design needs

  // Автоматическое переключение слайдов каждые 6 секунд
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
    }, 6000)

    return () => clearInterval(timer)
  }, [])

  // Переключение на предыдущий слайд
  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1,
    )
  }

  // Переключение на следующий слайд
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
  }

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
            What Our Pack Says
          </h2>
        </div>

        <div className="relative py-10">
          {/* Navigation arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-100"
            aria-label="Previous testimonial"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-100"
            aria-label="Next testimonial"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Slides container with fixed height */}
          <div className="overflow-hidden px-12">
            {/* Fixed height container to prevent layout shifts */}
            <div
              className="max-w-3xl mx-auto text-center relative"
              style={{ height: `${maxHeight}px` }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 100, y: 0 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    y: [0, -15, 0], // "Bark" animation - подпрыгивание вверх
                  }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{
                    duration: 0.5,
                    y: {
                      duration: 0.3,
                      times: [0, 0.5, 1],
                    },
                  }}
                  className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center"
                >
                  <p className="text-2xl md:text-3xl font-medium italic text-gray-800 mb-8">
                    &ldquo;{testimonials[currentIndex].quote}&rdquo;
                  </p>
                  <div className="flex items-center justify-center">
                    <DogTag>
                      {testimonials[currentIndex].author},{' '}
                      {testimonials[currentIndex].company}
                    </DogTag>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Pagination dots */}
          <div className="flex justify-center mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 mx-1 rounded-full ${
                  index === currentIndex ? 'bg-black' : 'bg-gray-300'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
