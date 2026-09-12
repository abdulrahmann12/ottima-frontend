import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthLayout from '@/components/auth/AuthLayout'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import PasswordStrength from '@/components/auth/PasswordStrength'
import { resetPassword } from '@/api/authApi'

/**
 * ResetPassword — /reset-password
 *
 * Accepts state.identifier from ForgotPassword page (pre-fills identifier).
 *
 * POST /api/v1/auth/reset-password
 * Payload: { usernameOrEmailOrPhoneNumber, code, newPassword }
 */
export default function ResetPassword() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  // Pre-fill identifier if navigated from ForgotPassword
  const prefilledIdentifier = location.state?.identifier || ''

  const [identifier, setIdentifier] = useState(prefilledIdentifier)
  const [code, setCode]             = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [success, setSuccess]       = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!identifier.trim())  errs.identifier = t('validation.required')
    if (!code.trim())        errs.code        = t('validation.required')
    if (!newPassword)        errs.newPassword  = t('validation.required')
    else if (newPassword.length < 8) errs.newPassword = t('validation.password_min')
    if (newPassword !== confirmPassword) errs.confirmPassword = t('validation.passwords_mismatch')
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const errs = validate()
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      return
    }
    setFieldErrors({})
    setLoading(true)

    try {
      await resetPassword(identifier.trim(), code.trim(), newPassword)
      setSuccess(true)
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.message === 'Network Error' ? t('errors.network') : t('errors.generic'))
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      {/* Back */}
      <Link
        to="/forgot-password"
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
          <KeyIcon className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{t('reset_password.title')}</h2>
        <p className="mt-1 text-gray-600 text-sm">{t('reset_password.subtitle')}</p>
      </div>

      {/* Errors */}
      <Alert message={error} variant="error" onClose={() => setError(null)} className="mb-5" />

      {/* ── Success State ─────────────────────────────── */}
      {success ? (
        <div className="bg-[#FAF6F2] border border-warm-brown/20 rounded-2xl p-6 text-center shadow-sm animate-slide-up">
          <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300
            flex items-center justify-center mx-auto mb-3 text-emerald-600">
            <CheckIcon className="w-6 h-6" />
          </div>
          <h3 className="text-gray-900 font-bold text-lg mb-1.5">
            {t('reset_password.success_title')}
          </h3>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            {t('reset_password.success_message')}
          </p>
          <Button
            id="goto-login-btn"
            onClick={() => navigate('/', { replace: true })}
            className="w-full shadow-sm"
          >
            {t('reset_password.back_to_login')}
          </Button>
        </div>
      ) : (
        /* ── Form ──────────────────────────────────────── */
        <form id="reset-password-form" onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
          <Input
            id="reset-identifier"
            label={t('reset_password.identifier')}
            type="text"
            placeholder={t('reset_password.identifier_placeholder')}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            error={fieldErrors.identifier}
          />

          <Input
            id="reset-code"
            label={t('reset_password.code')}
            type="text"
            placeholder={t('reset_password.code_placeholder')}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={fieldErrors.code}
            inputMode="numeric"
            maxLength={10}
            autoComplete="one-time-code"
          />

          <div>
            <Input
              id="reset-new-password"
              label={t('reset_password.new_password')}
              type="password"
              placeholder={t('reset_password.new_password_placeholder')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={fieldErrors.newPassword}
              autoComplete="new-password"
            />
            <PasswordStrength password={newPassword} lang={i18n.language} />
          </div>

          <Input
            id="reset-confirm-password"
            label={t('reset_password.confirm_password')}
            type="password"
            placeholder={t('reset_password.confirm_password_placeholder')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={fieldErrors.confirmPassword}
            autoComplete="new-password"
          />

          <Button id="reset-password-btn" type="submit" loading={loading} className="w-full shadow-sm">
            {loading ? t('reset_password.resetting') : t('reset_password.reset')}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}

function KeyIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" />
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

