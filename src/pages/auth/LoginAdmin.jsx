import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthLayout from '@/components/auth/AuthLayout'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { login as loginApi } from '@/api/authApi'
import useAuthStore from '@/store/authStore'

/**
 * LoginAdmin — /login/admin
 *
 * Fields: Username or Email + Password
 * On success: stores tokens, sets role to ADMIN, redirects to /admin/dashboard
 */
export default function LoginAdmin() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setTokens, setRole } = useAuthStore()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!identifier.trim()) errs.identifier = t('validation.required')
    if (!password)          errs.password    = t('validation.required')
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
      const { data: res } = await loginApi(identifier.trim(), password)
      const { accessToken, refreshToken } = res.data
      setTokens(accessToken, refreshToken)
      setRole('ADMIN')
      navigate('/admin/dashboard', { replace: true })
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
      {/* Back to role select */}
      <BackLink />

      {/* Header */}
      <div className="mb-8">
        <RoleBadge label={t('role.admin')} color="brand" />
        <h2 className="mt-4 text-2xl font-bold text-white">{t('login.title_admin')}</h2>
        <p className="mt-1 text-slate-400 text-sm">{t('login.subtitle')}</p>
      </div>

      {/* Error */}
      <Alert message={error} variant="error" onClose={() => setError(null)} className="mb-5" />

      {/* Form */}
      <form id="admin-login-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        <Input
          id="admin-identifier"
          label={t('login.username_or_email')}
          type="text"
          placeholder={t('login.username_or_email_placeholder')}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          error={fieldErrors.identifier}
          autoComplete="username"
          autoFocus
        />

        <Input
          id="admin-password"
          label={t('login.password')}
          type="password"
          placeholder={t('login.password_placeholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          autoComplete="current-password"
        />

        {/* Forgot password */}
        <div className="flex justify-end">
          <Link to="/forgot-password" className="link text-sm">
            {t('login.forgot_password')}
          </Link>
        </div>

        <Button
          id="admin-login-btn"
          type="submit"
          loading={loading}
        >
          {loading ? t('login.signing_in') : t('login.sign_in')}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-600">
        {t('login.no_access')}{' '}
        <span className="text-slate-500">{t('login.contact_admin')}</span>
      </p>
    </AuthLayout>
  )
}

function BackLink() {
  const { t } = useTranslation()
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1.5 text-xs text-slate-500
        hover:text-slate-300 transition-colors duration-200 mb-6 group"
    >
      <span className="group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5 transition-transform duration-200">←</span>
      {t('common.back')}
    </Link>
  )
}

function RoleBadge({ label, color }) {
  const colors = {
    brand:   'bg-brand-900/60 border-brand-700/50 text-brand-300',
    cyan:    'bg-cyan-900/60  border-cyan-700/50  text-cyan-300',
    emerald: 'bg-emerald-900/60 border-emerald-700/50 text-emerald-300',
  }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full
      text-xs font-medium border ${colors[color] || colors.brand}`}>
      {label}
    </span>
  )
}
