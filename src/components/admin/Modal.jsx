import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

/**
 * Modal — accessible dialog portal that behaves as a centered glass modal
 * on desktop (sm+) and a native Bottom Sheet drawer on mobile (<sm).
 *
 * Props:
 *   isOpen     boolean
 *   onClose    () => void
 *   title      string
 *   size       'sm' | 'md' | 'lg' | 'xl' | '2xl'  (default 'md')
 *   children   ReactNode
 */
export default function Modal({ isOpen, onClose, title, size = 'md', children }) {
  const { t } = useTranslation()
  const overlayRef = useRef(null)

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
  }[size] ?? 'max-w-lg'

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4
        bg-black/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`relative w-full ${sizeClass} bg-white sm:glass-card border border-[#D9C7B8]
          rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-up max-h-[92dvh] sm:max-h-[90dvh] flex flex-col overflow-hidden`}
      >
        {/* Mobile Drag Handle Indicator */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 sm:border-gray-200 flex-shrink-0">
          <h2 id="modal-title" className="text-gray-900 font-bold text-sm sm:text-base leading-snug">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close', { defaultValue: 'Close' })}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-full sm:rounded-lg flex items-center justify-center
              text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 sm:bg-transparent
              transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-warm-brown/30 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 sm:px-6 py-4 sm:py-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

