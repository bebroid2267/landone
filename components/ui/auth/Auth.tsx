'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/hooks/UI/Modal'
import SignModal from './SignModal'

interface AuthProps {
  modalAuth?: string | null
  modalRegister?: string | null
  onModalOpen?: (modalId: string) => void
}

const Auth = ({
  modalAuth = 'modal__auth',
  modalRegister = 'modal__register',
  onModalOpen,
}: AuthProps) => {
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [options, setOptions] = useState({
    scope: 'email profile',
    state: 'default_state',
  })

  // Initialize options only on client side
  useEffect(() => {
    const newOptions = {
      scope: 'email profile',
      state: 'default_state',
    }
    setOptions(newOptions)
  }, [])

  const handleOpenModal = (modalId: string) => {
    if (onModalOpen) {
      onModalOpen(modalId)
    } else {
      setActiveModal(modalId)
    }
  }

  const handleCloseModal = () => {
    setActiveModal(null)
  }

  return (
    <>
      <div className="flex md:justify-center lg:justify-end items-center gap-2 md:gap-2 lg:gap-3 w-full">
        {!!modalAuth && (
          <button
            className="relative whitespace-nowrap min-w-[100px] lg:min-w-[100px] md:min-w-[80px] bg-gradient-to-r from-yellow-400 via-fuchsia-500 to-cyan-400 text-white hover:opacity-90 py-2 px-6 md:px-3 lg:px-6 tracking-[.02rem] font-medium rounded-lg shadow-lg shadow-yellow-400/20 transition-all duration-200 text-sm md:text-sm lg:text-base"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleOpenModal(modalAuth)
            }}
          >
            <span className="relative text-white font-medium tracking-wide whitespace-nowrap">
              Sign In
            </span>
          </button>
        )}
        {!!modalRegister && (
          <button
            className="relative whitespace-nowrap min-w-[100px] lg:min-w-[100px] md:min-w-[80px] bg-[#0D0D0D] text-white hover:bg-[#1A1A1A] py-2 px-6 md:px-3 lg:px-6 tracking-[.02rem] font-medium rounded-lg border border-gray-800 transition-all duration-200 text-sm md:text-sm lg:text-base"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleOpenModal(modalRegister)
            }}
          >
            <span className="relative text-white font-medium tracking-wide whitespace-nowrap">
              Sign Up
            </span>
          </button>
        )}
      </div>

      {/* Fallback modals if no parent handler */}
      {!onModalOpen && modalAuth && (
        <Modal
          id={modalAuth}
          isOpen={activeModal === modalAuth}
          onClose={handleCloseModal}
        >
          <SignModal options={options} />
        </Modal>
      )}

      {!onModalOpen && modalRegister && (
        <Modal
          id={modalRegister}
          isOpen={activeModal === modalRegister}
          onClose={handleCloseModal}
        >
          <SignModal options={options} register />
        </Modal>
      )}
    </>
  )
}

export default Auth
