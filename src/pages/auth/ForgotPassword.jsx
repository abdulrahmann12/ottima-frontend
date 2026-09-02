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
        className="inline-flex items-center gap-1.5 text-xs text-slate-500
          hover:text-slate-300 transition-colors duration-200 mb-6 group"
      >
        <span className="group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5 transition-transform duration-200">←</span>
        {t('common.back')}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="w-12 h-12 rounded-xl bg-brand-900/60 border border-brand-700/40
          flex items-center justify-center mb-4">
          <LockIcon className="w-6 h-6 text-brand-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">{t('forgot_password.title')}</h2>
        <p className="mt-1 text-slate-400 text-sm">{t('forgot_password.subtitle')}</p>
      </div>

      {/* Server error */}
      <Alert message={error} variant="error" onClose={() => setError(null)} className="mb-5" />

      {/* ── Success State ────────────────────────────────── */}
      {sent ? (
        <div className="glass-card p-6 animate-slide-up">
          <div className="flex items-start gap-3 mb-5">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-900/60
              border border-emerald-700/50 flex items-center justify-center">
              <CheckIcon className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{t('forgot_password.success_title')}</p>
              <p className="text-slate-400 text-xs mt-1">{t('forgot_password.success_message')}</p>
            </div>
          </div>

          {/* Proceed to reset */}
          <Button
            id="proceed-to-reset-btn"
            onClick={() =>
              navigate('/reset-password', { state: { identifier: identifier.trim() } })
            }
            className="mb-3"
          >
            {t('forgot_password.proceed_to_reset')}
          </Button>

          {/* Resend code */}
          <Button
            id="resend-code-btn"
            variant="ghost"
            loading={resendLoading}
            onClick={handleResend}
            className="w-full"
          >
            {resendLoading ? t('forgot_password.resending') : t('forgot_password.resend_code')}
          </Button>
        </div>
      ) : (
        /* ── Input Form ──────────────────────────────────── */
        <form id="forgot-password-form" onSubmit={handleSubmit} noValidate className="space-y-5">
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

          <Button id="send-code-btn" type="submit" loading={loading}>
            {loading ? t('forgot_password.sending') : t('forgot_password.send_code')}
          </Button>
        </form>
      )}

      <div className="mt-6 text-center">
        <Link to="/" className="link text-sm">
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
