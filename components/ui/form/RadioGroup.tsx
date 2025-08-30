import { InputHTMLAttributes } from 'react'

interface Option {
  id: string | number
  label: string
  description?: string
}

interface RadioGroupProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  options: Option[]
  value: string | number
  onChange: (value: string | number) => void
  variant?: 'default' | 'pill'
}

export function RadioGroup({
  label,
  options,
  value,
  onChange,
  variant = 'default',
  className = '',
  ...props
}: RadioGroupProps) {
  const baseOptionStyles = 'transition-all duration-200 cursor-pointer'

  const variants = {
    default: 'px-4 py-3 rounded-lg',
    pill: 'px-4 py-2 rounded-full',
  }

  const selectedStyles = {
    default:
      'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-gray-900',
    pill: 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-gray-900',
  }

  const unselectedStyles = {
    default:
      'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60 border border-gray-700',
    pill: 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60 border border-gray-700',
  }

  return (
    <div className="space-y-3">
      {label && (
        <h3 className="text-white font-semibold flex items-center gap-2">
          {label}
        </h3>
      )}

      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.id}
            className={`
              ${baseOptionStyles}
              ${variants[variant]}
              ${
                value === option.id
                  ? selectedStyles[variant]
                  : unselectedStyles[variant]
              }
              ${className}
              group
            `}
          >
            <input
              type="radio"
              className="hidden"
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              {...props}
            />
            {option.label}
            {option.description && (
              <div className="absolute pointer-events-none bottom-full left-0 mb-2 max-w-[400px] px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-gray-700 z-50 shadow-lg break-words">
                {option.description}
              </div>
            )}
          </label>
        ))}
      </div>
    </div>
  )
}
