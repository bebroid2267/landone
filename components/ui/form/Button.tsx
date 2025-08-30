import { ButtonHTMLAttributes, ReactNode } from 'react'
import LoadingDots from '../LoadingDots'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'black'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2'

  const variants = {
    primary:
      'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-700',
    secondary:
      'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60 border border-gray-700',
    outline:
      'border border-gray-700 text-gray-400 hover:border-indigo-500 hover:text-indigo-500',
    black: 'bg-black text-white hover:bg-gray-800 disabled:bg-gray-700',
  }

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3',
    lg: 'px-6 py-4 text-lg',
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="scale-150 mr-2">
            <LoadingDots />
          </div>
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
