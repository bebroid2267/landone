import { InputHTMLAttributes } from 'react'

interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  value: number
  showValue?: boolean
  showMinMax?: boolean
  min?: number
  max?: number
}

export function Slider({
  label,
  value,
  showValue = true,
  showMinMax = true,
  min = 0,
  max = 100,
  className = '',
  ...props
}: SliderProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-white">
          {label} {showValue && `(${value})`}
        </label>
      )}

      <div className="flex items-center gap-2">
        {showMinMax && (
          <span className="text-white font-medium w-8 text-center">{min}</span>
        )}

        <input
          type="range"
          className={`w-full accent-indigo-600 bg-gray-900/80 h-2 rounded-lg appearance-none cursor-pointer ${className}`}
          min={min}
          max={max}
          value={value}
          {...props}
        />

        {showMinMax && (
          <span className="text-white font-medium w-8 text-center">{max}</span>
        )}
      </div>
    </div>
  )
}
