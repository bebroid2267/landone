import React, { useState, useRef, useEffect } from 'react'

interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selected = options.find((opt) => opt.value === value)

  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        className={`w-full bg-white border rounded-lg px-4 py-3 text-left flex items-center justify-between transition-all duration-200 ${
          disabled
            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            : open
            ? 'border-black ring-2 ring-black ring-opacity-20'
            : 'border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-20 focus:border-black'
        }`}
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        <span className="truncate block max-w-full text-sm">
          {selected ? (
            <span className="text-gray-900 font-medium">{selected.label}</span>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </span>
        <svg
          className={`w-5 h-5 ml-2 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          } ${disabled ? 'text-gray-300' : 'text-gray-400'}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-200 rounded-lg shadow-xl ring-1 ring-black ring-opacity-5">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              No options available
            </div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`w-full text-left px-4 py-3 text-sm transition-all duration-150 first:rounded-t-lg last:rounded-b-lg ${
                  opt.value === value
                    ? 'bg-black text-white font-medium'
                    : 'text-gray-900 hover:bg-gray-50 focus:bg-gray-50'
                } focus:outline-none`}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
              >
                <span className="truncate block">{opt.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default CustomSelect
