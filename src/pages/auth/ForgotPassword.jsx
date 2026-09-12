import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthLayout from '@/components/auth/AuthLayout'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { forgetPassword, regenerateCode } from '@/api/authApi'

/**
 * ForgotPassword — /forgot-password
 *
 * Step 1: User enters identifier (email / username / phone)
 * POST /api/v1/auth/forget-password  → { identifier }
 *
 * On success: shows success banner with a link to /reset-password.
 * Also allows re-sending the code (POST /api/v1/auth/regenerate-code).
 */
export default function ForgotPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading]       = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError]           = useState(null)
  const [fieldError, setFieldError] = useState(null)
  const [sent, setSent]             = useState(false)

  const validate = () => {
    if (!identifier.trim()) return t('validation.required')
    return null
  }

  /* ── Send code ──────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    const err = validate()
    if (err) { setFieldError(err); return }
    setFieldError(null)
    setLoading(true)

    try {
      await forgetPassword(identifier.trim())
      setSent(true)
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.message === 'Network Error' ? t('errors.network') : t('errors.generic'))
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  /* ── Regenerate code ────────────────────────────────────── */
  const handleResend = async () => {
    setError(null)
    setResendLoading(true)
    try {
      await regenerateCode(identifier.trim())
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.message === 'Network Error' ? t('errors.network') : t('errors.generic'))
      setError(msg)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <AuthLayout>
      {/* Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-gray-500
          hover:text-warm-brown transition-colors duration-200 mb-5 group font-medium"
      >
        <span className="group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5 transition-transform duration-200">←</span>
        {t('common.back')}
      </Link>

      {/* Header */}
      <div className="mb-7">
        <div className="w-11 h-11 rounded-xl bg-warm-brown/10 border border-warm-brown/25
          flex items-center justify-center mb-3 shadow-sm text-warm-brown">
          <LockIcon className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{t('forgot_password.title')}</h2>
        <p className="mt-1 text-gray-600 text-sm">{t('forgot_password.subtitle')}</p>
      </div>

      {/* Server error */}
      <Alert message={error} variant="error" onClose={() => setError(null)} className="mb-5" />

      {/* ── Success State ────────────────────────────────── */}
      {sent ? (
        <div className="bg-[#FAF6F2] border border-warm-brown/20 rounded-2xl p-5 sm:p-6 shadow-sm animate-slide-up">
          <div className="flex items-start gap-3.5 mb-5">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-100
              border border-emerald-300 flex items-center justify-center text-emerald-600">
              <CheckIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-900 font-bold text-base tracking-tight">{t('forgot_password.success_title')}</p>
              <p className="text-gray-600 text-xs mt-1 leading-relaxed">{t('forgot_password.success_message')}</p>
            </div>
          </div>

          {/* Proceed to reset */}
          <Button
            id="proceed-to-reset-btn"
            onClick={() =>
              navigate('/reset-password', { state: { identifier: identifier.trim() } })
            }
            className="w-full mb-3 shadow-sm"
          >
            {t('forgot_password.proceed_to_reset')}
          </Button>

          {/* Resend code */}
          <button
            type="button"
            id="resend-code-btn"
            disabled={resendLoading}
            onClick={handleResend}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold
              text-warm-brown hover:text-[#6B4A33] hover:bg-warm-brown/10
              border border-warm-brown/25 hover:border-warm-brown/40
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-warm-brown/30
              flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendLoading && <div className="w-3.5 h-3.5 border-2 border-warm-brown border-t-transparent rounded-full animate-spin" />}
            {resendLoading ? t('forgot_password.resending') : t('forgot_password.resend_code')}
          </button>
        </div>
      ) : (
        /* ── Input Form ──────────────────────────────────── */
        <form id="forgot-password-form" onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
          <Input
            id="forgot-identifier"
            label={t('forgot_password.identifier')}
            type="text"
            placeholder={t('forgot_password.identifier_placeholder')}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            error={fieldError}
            autoFocus
          />

          <Button id="send-code-btn" type="submit" loading={loading} className="w-full shadow-sm">
            {loading ? t('forgot_password.sending') : t('forgot_password.send_code')}
          </Button>
        </form>
      )}

      <div className="mt-6 text-center">
        <Link to="/" className="inline-block text-warm-brown hover:text-[#6B4A33] font-semibold text-xs sm:text-sm transition-colors duration-200">
          {t('forgot_password.back_to_login')}
        </Link>
      </div>
    </AuthLayout>
  )
}

function LockIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  )
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

