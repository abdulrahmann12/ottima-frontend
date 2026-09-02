import { useTranslation } from 'react-i18next'
import Modal from './Modal'
import Button from '@/components/ui/Button'

/**
 * ConfirmDialog — destructive action confirmation
 *
 * Props:
 *   isOpen      boolean
 *   onClose     () => void
 *   onConfirm   () => void
 *   title       string
 *   message     string
 *   loading     boolean
 *   confirmLabel string  (optional, defaults to "Delete")
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  loading = false,
  confirmLabel,
}) {
  const { t } = useTranslation()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      {/* Warning icon */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-900/40 border border-red-700/40
          flex items-center justify-center mt-0.5">
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed flex-1 pt-1.5">
          {message}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 mt-6">
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={loading}
          className="px-5"
        >
          {t('common.cancel')}
        </Button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
            bg-red-700 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed
            text-white font-semibold text-sm transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-red-500/50 active:scale-[0.98]"
        >
          {loading && (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {confirmLabel || t('common.submit')}
        </button>
      </div>
    </Modal>
  )
}
