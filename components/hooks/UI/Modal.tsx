import { MouseEvent, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  id: string
  className?: string
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

const Modal = ({
  id,
  className = '',
  isOpen,
  onClose,
  children,
}: ModalProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen || typeof window === 'undefined') {
    return null
  }

  const modalContent = (
    <div
      id={id}
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
      className={`fixed z-[9999999] h-[100vh] w-[100vw] top-0 left-0 bg-black bg-opacity-30 flex justify-center items-center p-4 ${className}`}
    >
      <div className="relative w-full max-w-md bg-gray-900/90 backdrop-blur-xl rounded-xl border border-gray-700/50 shadow-xl">

        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3 right-5 z-[10000] w-8 h-8 flex items-center justify-center rounded-full bg-black/70 hover:bg-black/90 text-gray-300 hover:text-white transition-all duration-200 backdrop-blur-sm border border-gray-600/50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {children}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export { Modal }
