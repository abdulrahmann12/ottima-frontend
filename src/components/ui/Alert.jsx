import { useEffect, useState } from 'react'
import { CheckCircle, InfoCircle, XCircle } from './icons/Globe'

const VARIANTS = {
  error: {
    container: 'bg-red-50 border border-red-200 text-red-700',
    icon: XCircle,
    iconClass: 'text-red-500',
  },
  success: {
    container: 'bg-emerald-50 border border-emerald-200 text-emerald-800',
    icon: CheckCircle,
    iconClass: 'text-emerald-600',
  },
  info: {
    container: 'bg-light-blue/30 border border-[#B0CEE2] text-gray-800',
    icon: InfoCircle,
    iconClass: 'text-warm-brown',
  },
}

/**
 * Alert
 *
 * Props:
 *   variant   'error' | 'success' | 'info'   (default: 'error')
 *   message   string | null                  — if null/undefined, renders nothing
 *   onClose   function                       — optional dismiss handler
 *   className string
 */
export default function Alert({ variant = 'error', message, onClose, className = '' }) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDismissed(false)
  }, [message])

  if (!message || dismissed) return null

  const { container, icon: Icon, iconClass } = VARIANTS[variant] ?? VARIANTS.error

  const handleClose = () => {
    setDismissed(true)
    onClose?.()
  }

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm animate-fade-in ${container} ${className}`}
    >
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconClass}`} />
      <p className="flex-1 leading-relaxed">{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={handleClose}
          aria-label="Dismiss"
          className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity duration-150 focus:outline-none"
        >
          ✕
        </button>
      )}
    </div>
  )
}
