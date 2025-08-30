import { TextareaHTMLAttributes } from 'react'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function TextArea({
  label,
  error,
  className = '',
  ...props
}: TextAreaProps) {
  const baseStyles = `
    w-full bg-gray-900/80 backdrop-blur-sm border border-gray-700 
    rounded-lg p-3 text-white placeholder-gray-400 
    focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
    transition-colors
  `

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
      <textarea
        className={`${baseStyles} ${errorStyles} ${className}`}
        {...props}
      />
    </div>
  )
}
