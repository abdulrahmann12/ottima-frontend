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
import { getMyProfile } from '@/api/usersApi'

export default function LoginAdmin() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setTokens, setRole, setUser, clearAuth } = useAuthStore()

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

      // Strict role authorization check
      try {
        const profileRes = await getMyProfile()
        const user = profileRes.data?.data || profileRes.data || {}
        const userRole = (user.roleName || user.role || '').toUpperCase()

        if (userRole !== 'ADMIN') {
          clearAuth()
          const correctRoleDisplay = userRole ? (userRole.charAt(0) + userRole.slice(1).toLowerCase()) : 'appropriate'
          setError(`Access Denied: You are not authorized to access this portal. Please use the ${correctRoleDisplay} login page.`)
          return
        }

        setUser(user)
        setRole('ADMIN')
        navigate('/admin/dashboard', { replace: true })
      } catch (profileErr) {
        clearAuth()
        setError(profileErr.response?.data?.message || t('errors.generic'))
      }
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
      <div className="mb-7">
        <RoleBadge label={t('role.admin')} />
        <h2 className="mt-3 text-2xl font-extrabold text-gray-900 tracking-tight">{t('login.title_admin')}</h2>
        <p className="mt-1 text-gray-600 text-sm">{t('login.subtitle')}</p>
      </div>

      {/* Error */}
      <Alert message={error} variant="error" onClose={() => setError(null)} className="mb-5" />

      {/* Form */}
      <form id="admin-login-form" onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
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
          <Link to="/forgot-password" className="text-warm-brown hover:text-[#6B4A33] font-semibold text-xs sm:text-sm transition-colors duration-200">
            {t('login.forgot_password')}
          </Link>
        </div>

        <Button
          id="admin-login-btn"
          type="submit"
          loading={loading}
          className="w-full shadow-sm"
        >
          {loading ? t('login.signing_in') : t('login.sign_in')}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-gray-500">
        {t('login.no_access')}{' '}
        <span className="text-gray-700 font-medium">{t('login.contact_admin')}</span>
      </p>
    </AuthLayout>
  )
}

function BackLink() {
  const { t } = useTranslation()
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1.5 text-xs text-gray-500
        hover:text-warm-brown transition-colors duration-200 mb-5 group font-medium"
    >
      <span className="group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5 transition-transform duration-200">←</span>
      {t('common.back')}
    </Link>
  )
}

function RoleBadge({ label }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full
      text-xs font-semibold bg-warm-brown/10 border border-warm-brown/25 text-warm-brown">
      {label}
    </span>
  )
}

