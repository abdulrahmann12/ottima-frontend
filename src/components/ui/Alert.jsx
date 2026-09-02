import { useState } from 'react'
import { CheckCircle, XCircle, InfoCircle } from './icons/Globe'

const VARIANTS = {
  error: {
    container: 'bg-red-950/60 border border-red-800/60 text-red-300',
    icon: XCircle,
    iconClass: 'text-red-400',
  },
  success: {
    container: 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300',
    icon: CheckCircle,
    iconClass: 'text-emerald-400',
  },
  info: {
    container: 'bg-brand-950/60 border border-brand-800/60 text-brand-300',
    icon: InfoCircle,
    iconClass: 'text-brand-400',
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
