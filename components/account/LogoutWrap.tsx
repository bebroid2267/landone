'use client'

import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { useUser } from '@/components/hooks/useUser'

const LogoutWrap = () => {
  const { signOut } = useUser()

  const handleLogout = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error while logout:', error)
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => void handleLogout()}
      className="inline-flex items-center gap-2 px-5 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-all duration-200 font-medium border border-red-900/50 hover:border-red-800"
    >
      <ArrowRightOnRectangleIcon className="h-5 w-5" />
      <span>Sign Out</span>
    </motion.button>
  )
}

export default LogoutWrap
