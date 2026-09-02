import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

/**
 * Modal — accessible dialog portal
 *
 * Props:
 *   isOpen     boolean
 *   onClose    () => void
 *   title      string
 *   size       'sm' | 'md' | 'lg'  (default 'md')
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
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  }[size] ?? 'max-w-lg'

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`relative w-full ${sizeClass} glass-card border border-surface-border
          animate-slide-up max-h-[90dvh] flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border flex-shrink-0">
          <h2 id="modal-title" className="text-white font-semibold text-base">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="w-8 h-8 rounded-lg flex items-center justify-center
              text-slate-500 hover:text-slate-200 hover:bg-slate-700/60
              transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
