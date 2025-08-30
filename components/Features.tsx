'use client'
import first from '../public/generated (8).png'
import second from '../public/generated (9).png'
import third from '../public/generated (10).png'

import { motion } from 'framer-motion'
import { FiMusic, FiSettings, FiEdit } from 'react-icons/fi'
import React from 'react'

const features = [
  {
    title: 'Professional Studio Quality',
    description:
      'Generate high-quality audio that meets professional studio standards with advanced AI technology.',
    image: first,
    stats: [
      { label: 'Sample Rate', value: '48kHz' },
      { label: 'Bit Depth', value: '24bit' },
      { label: 'Dynamic Range', value: '120dB' },
    ],
    gradient: 'from-[#FF3358] to-[#FF4D9B]',
  },
  {
    title: 'Multiple Music Styles',
    description:
      'Create music across various genres with customizable instruments and arrangements.',
    image: second,
    stats: [
      { label: 'Genres', value: '15+' },
      { label: 'Instruments', value: '50+' },
      { label: 'Styles', value: '100+' },
    ],
    gradient: 'from-[#FF3358] to-[#FF4D9B]',
  },
  {
    title: 'Real-Time Generation',
    description:
      'Experience lightning-fast music generation with real-time updates and variations.',
    image: third,
    stats: [
      { label: 'Generation Time', value: '< 30s' },
      { label: 'Updates', value: 'Real-time' },
      { label: 'Variations', value: 'Unlimited' },
    ],
    gradient: 'from-[#FF3358] to-[#FF4D9B]',
  },
]

const processSteps = [
  {
    icon: FiEdit,
    title: 'Describe',
    color: 'bg-[#FF3358]',
    features: [
      'Natural language input',
      'Genre selection',
      'Mood specification',
      'Length control',
    ],
  },
  {
    icon: FiMusic,
    title: 'Generate',
    color: 'bg-[#FF3358]',
    features: [
      'AI composition',
      'Real-time preview',
      'Multiple variations',
      'Quality control',
    ],
  },
  {
    icon: FiSettings,
    title: 'Customize',
    color: 'bg-[#FF3358]',
    features: [
      'Instrument mixing',
      'Tempo adjustment',
      'Structure editing',
      'Export options',
    ],
  },
]

const Features = () => {
  return (
    <div className="w-full bg-[#0D0D0D] py-20 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute top-20 left-20 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-yellow-400 via-fuchsia-500 to-cyan-400 blur-[120px] opacity-30"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -70, 0],
          y: [0, 100, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute bottom-20 right-20 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-yellow-400 via-fuchsia-500 to-cyan-400 blur-[150px] opacity-20"
      />

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Advanced Features
          </h2>
          <p className="text-gray-300 text-lg">
            Experience the next generation of AI music creation
          </p>
        </motion.div>

        <div className="space-y-24">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className={`flex flex-col ${
                index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              } items-center gap-8`}
            >
              <div className="w-full md:w-1/2">
                <div className="relative rounded-2xl overflow-hidden shadow-[0_0_32px_4px_rgba(252,211,77,0.15)] bg-[#18181b]">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-fuchsia-500 to-cyan-400 opacity-10" />
                  <img
                    src={feature.image.src}
                    alt={feature.title}
                    className="w-full h-[400px] object-cover"
                  />
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <div className="p-8 rounded-2xl">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 mb-4">{feature.description}</p>
                  <div className="flex flex-wrap gap-4">
                    {feature.stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="flex flex-col items-center min-w-[80px]"
                      >
                        <span className="text-lg font-bold bg-gradient-to-r from-yellow-400 via-fuchsia-500 to-cyan-400 text-transparent bg-clip-text">
                          {stat.value}
                        </span>
                        <span className="text-xs text-gray-300 mt-1">
                          {stat.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Process Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-gray-300 text-lg">
            Create amazing music in three simple steps
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {processSteps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="relative group bg-[#18181b] border-2 border-gradient-to-r from-yellow-400 via-fuchsia-500 to-cyan-400 rounded-2xl shadow-[0_0_24px_4px_rgba(252,211,77,0.10)] p-8 flex flex-col items-center"
            >
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 via-fuchsia-500 to-cyan-400 mb-4 shadow-[0_0_16px_2px_rgba(252,211,77,0.15)]">
                <step.icon className="text-3xl text-black" />
              </div>
              <h4 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-fuchsia-500 to-cyan-400 text-transparent bg-clip-text mb-2">
                {step.title}
              </h4>
              <ul className="text-gray-300 text-sm space-y-1">
                {step.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Features
