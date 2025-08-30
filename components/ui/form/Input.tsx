import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  variant?: 'default' | 'custom'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, variant = 'default', className = '', disabled, ...props },
    ref,
  ) => {
    const baseStyles =
      'w-full rounded-lg p-3 text-white transition-all duration-200'

    const variants = {
      default: `bg-gray-900/80 backdrop-blur-sm border border-gray-700 
                focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                disabled:bg-gray-900/40 disabled:border-gray-700/50 disabled:cursor-not-allowed`,
      custom: className,
    }

    const errorStyles = error
      ? 'border-2 border-red-500 focus:border-red-500'
      : ''

    return (
      <div>
        {label && (
          <label className="block text-sm font-medium mb-2 text-white">
            {label}
            {error && (
              <span className="text-red-400 text-xs ml-2">({error})</span>
            )}
          </label>
        )}
        <input
          ref={ref}
          className={`${baseStyles} ${variants[variant]} ${errorStyles}`}
          disabled={disabled}
          {...props}
        />
      </div>
    )
  },
)

Input.displayName = 'Input'
