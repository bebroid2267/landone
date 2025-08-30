import { XMarkIcon } from '@heroicons/react/24/outline'

type ToastType = 'success' | 'error' | 'info'

const toastStyles: Record<ToastType, string> = {
  success: 'bg-green-50 text-green-900 border-green-200',
  error: 'bg-red-50 text-red-900 border-red-200',
  info: 'bg-blue-50 text-blue-900 border-blue-200',
}

const baseStyles =
  'pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all z-[111]'

interface ToastProps {
  message: string
  onClose: () => void
  type: ToastType
}

export function Toast({ message, type, onClose }: ToastProps) {
  return (
    <div className={`${baseStyles} ${toastStyles[type]}`}>
      <div className="flex-1">{message}</div>
      <button
        onClick={onClose}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  )
}
