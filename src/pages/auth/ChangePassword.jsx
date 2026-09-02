import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthLayout from '@/components/auth/AuthLayout'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import PasswordStrength from '@/components/auth/PasswordStrength'
import { changePassword } from '@/api/authApi'

/**
 * ChangePassword — /change-password
 *
 * Protected route — requires an active session (Bearer token is attached
 * automatically via the Axios request interceptor).
 *
 * POST /api/v1/auth/change-password
 * Payload: { currentPassword, newPassword }
 */
export default function ChangePassword() {
  const { t, i18n } = useTranslation()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState(null)
  const [success, setSuccess]                 = useState(false)
  const [fieldErrors, setFieldErrors]         = useState({})

  const validate = () => {
    const errs = {}
    if (!currentPassword)  errs.currentPassword  = t('validation.required')
    if (!newPassword)      errs.newPassword       = t('validation.required')
    else if (newPassword.length < 8)
                           errs.newPassword       = t('validation.password_min')
    if (newPassword !== confirmPassword)
                           errs.confirmPassword   = t('validation.passwords_mismatch')
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const errs = validate()
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      return
    }
    setFieldErrors({})
    setLoading(true)

    try {
      await changePassword(currentPassword, newPassword)
      setSuccess(true)
      // Clear sensitive fields after success
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
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
          <ShieldIcon className="w-6 h-6 text-brand-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">{t('change_password.title')}</h2>
        <p className="mt-1 text-slate-400 text-sm">{t('change_password.subtitle')}</p>
      </div>

      {/* Alerts */}
      <Alert message={error} variant="error" onClose={() => setError(null)} className="mb-5" />
      <Alert
        message={success ? t('change_password.success_message') : null}
        variant="success"
        onClose={() => setSuccess(false)}
        className="mb-5"
      />

      {/* Form */}
      <form id="change-password-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        <Input
          id="current-password"
          label={t('change_password.current_password')}
          type="password"
          placeholder={t('change_password.current_password_placeholder')}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          error={fieldErrors.currentPassword}
          autoComplete="current-password"
        />

        <div>
          <Input
            id="new-password"
            label={t('change_password.new_password')}
            type="password"
            placeholder={t('change_password.new_password_placeholder')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={fieldErrors.newPassword}
            autoComplete="new-password"
          />
          <PasswordStrength password={newPassword} lang={i18n.language} />
        </div>

        <Input
          id="confirm-new-password"
          label={t('change_password.confirm_password')}
          type="password"
          placeholder={t('change_password.confirm_password_placeholder')}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
          autoComplete="new-password"
        />

        <Button id="change-password-btn" type="submit" loading={loading}>
          {loading ? t('change_password.changing') : t('change_password.change')}
        </Button>
      </form>
    </AuthLayout>
  )
}

function ShieldIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  )
}
