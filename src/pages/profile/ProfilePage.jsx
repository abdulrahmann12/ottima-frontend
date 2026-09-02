import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useAuthStore from '@/store/authStore'
import { getMyProfile, updateMyProfile } from '@/api/usersApi'
import { changePassword } from '@/api/authApi'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import UserBadge from '@/components/admin/UserBadge'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'
import PasswordStrength from '@/components/auth/PasswordStrength'

/**
 * ProfilePage — /profile
 *
 * Shared User Profile view accessible to ALL authenticated roles (ADMIN, ENGINEER, CLIENT).
 *
 * Features:
 *   1. Displays user details (from GET /api/v1/users/data)
 *   2. Update profile info (PUT /api/v1/users/data — username, email, fullNameAr, fullNameEn, phoneNumber)
 *   3. Change password (POST /api/v1/auth/change-password — currentPassword, newPassword)
 */
export default function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { isAuthenticated, role } = useAuthStore()
  const navigate = useNavigate()

  // Profile data
  const [profile, setProfile]       = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    fullNameAr: '',
    fullNameEn: '',
    phoneNumber: '',
  })
  const [profileErrors, setProfileErrors] = useState({})
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileErrorMsg, setProfileErrorMsg] = useState(null)

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwdErrors, setPwdErrors]             = useState({})
  const [pwdSaving, setPwdSaving]             = useState(false)
  const [pwdSuccess, setPwdSuccess]           = useState(false)
  const [pwdErrorMsg, setPwdErrorMsg]         = useState(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Load user profile
  useEffect(() => {
    if (!isAuthenticated) return
    setProfileLoading(true)
    getMyProfile()
      .then(({ data: res }) => {
        const u = res.data
        setProfile(u)
        setProfileForm({
          username:    u.username ?? '',
          email:       u.email ?? '',
          fullNameAr:  u.fullNameAr ?? '',
          fullNameEn:  u.fullNameEn ?? '',
          phoneNumber: u.phoneNumber ?? '',
        })
      })
      .catch((err) => {
        setProfileErrorMsg(err.response?.data?.message ?? t('errors.generic'))
      })
      .finally(() => setProfileLoading(false))
  }, [isAuthenticated, t])

  /* ── Update Profile Handlers ───────────────────────── */
  const validateProfile = () => {
    const errs = {}
    if (!profileForm.username || profileForm.username.length < 6 || profileForm.username.length > 50) {
      errs.username = t('users.username_length')
    }
    if (!profileForm.email) errs.email = t('validation.required')
    if (!profileForm.fullNameAr) errs.fullNameAr = t('validation.required')
    if (!profileForm.fullNameEn) errs.fullNameEn = t('validation.required')
    if (!profileForm.phoneNumber || profileForm.phoneNumber.length !== 11) {
      errs.phoneNumber = t('users.phone_exact_length')
    }
    return errs
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileErrorMsg(null)
    setProfileSuccess(false)

    const errs = validateProfile()
    if (Object.keys(errs).length) {
      setProfileErrors(errs)
      return
    }
    setProfileErrors({})
    setProfileSaving(true)

    try {
      const { data: res } = await updateMyProfile(profileForm)
      setProfile(res.data)
      setProfileSuccess(true)
    } catch (err) {
      setProfileErrorMsg(err.response?.data?.message ?? t('errors.generic'))
    } finally {
      setProfileSaving(false)
    }
  }

  /* ── Change Password Handlers ──────────────────────── */
  const validatePassword = () => {
    const errs = {}
    if (!currentPassword) errs.currentPassword = t('validation.required')
    if (!newPassword || newPassword.length < 8) errs.newPassword = t('validation.password_min')
    if (newPassword !== confirmPassword) errs.confirmPassword = t('validation.passwords_mismatch')
    return errs
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPwdErrorMsg(null)
    setPwdSuccess(false)

    const errs = validatePassword()
    if (Object.keys(errs).length) {
      setPwdErrors(errs)
      return
    }
    setPwdErrors({})
    setPwdSaving(true)

    try {
      await changePassword(currentPassword, newPassword)
      setPwdSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPwdErrorMsg(err.response?.data?.message ?? t('errors.generic'))
    } finally {
      setPwdSaving(false)
    }
  }

  const dashboardPath =
    role === 'ADMIN'
      ? '/admin/dashboard'
      : role === 'ENGINEER'
      ? '/engineer/dashboard'
      : '/client/dashboard'

  if (!isAuthenticated) return null

  return (
    <div className="min-h-dvh bg-auth-pattern flex flex-col">
      {/* Header Bar */}
      <header className="px-6 py-4 border-b border-surface-border bg-surface-card/60 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={dashboardPath}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <span className="rtl:rotate-180">←</span>
            {t('common.back')}
          </Link>
          <span className="text-slate-600">|</span>
          <h1 className="text-white font-bold text-lg">{t('profile.title')}</h1>
        </div>
        <LanguageSwitcher />
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-slide-up">
        {/* Profile Banner */}
        <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-900/80 border border-brand-700/50 flex items-center justify-center text-brand-400 font-bold text-xl">
              {profile?.fullNameEn?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {i18n.language === 'ar' ? profile?.fullNameAr : profile?.fullNameEn}
              </h2>
              <p className="text-slate-400 text-sm font-mono">@{profile?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <UserBadge roleName={profile?.roleName || role} type="role" />
            <UserBadge active={profile?.active ?? true} type="status" />
          </div>
        </div>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel 1: Personal Info Form */}
          <div className="glass-card p-6 flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white">{t('profile.personal_info')}</h3>
                <p className="text-slate-400 text-xs mt-0.5">{t('profile.personal_info_subtitle')}</p>
              </div>

              <Alert message={profileErrorMsg} variant="error" onClose={() => setProfileErrorMsg(null)} className="mb-4" />
              <Alert
                message={profileSuccess ? t('profile.update_success') : null}
                variant="success"
                onClose={() => setProfileSuccess(false)}
                className="mb-4"
              />

              {profileLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-10 bg-slate-800 rounded-xl" />
                  <div className="h-10 bg-slate-800 rounded-xl" />
                  <div className="h-10 bg-slate-800 rounded-xl" />
                </div>
              ) : (
                <form id="profile-info-form" onSubmit={handleProfileSubmit} noValidate className="space-y-4">
                  <Input
                    id="profile-username"
                    label={t('users.username')}
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    error={profileErrors.username}
                  />
                  <Input
                    id="profile-email"
                    label={t('users.email')}
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    error={profileErrors.email}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      id="profile-fullname-ar"
                      label={t('users.full_name_ar')}
                      value={profileForm.fullNameAr}
                      onChange={(e) => setProfileForm({ ...profileForm, fullNameAr: e.target.value })}
                      error={profileErrors.fullNameAr}
                      dir="rtl"
                    />
                    <Input
                      id="profile-fullname-en"
                      label={t('users.full_name_en')}
                      value={profileForm.fullNameEn}
                      onChange={(e) => setProfileForm({ ...profileForm, fullNameEn: e.target.value })}
                      error={profileErrors.fullNameEn}
                    />
                  </div>
                  <Input
                    id="profile-phone"
                    label={t('users.phone')}
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                    error={profileErrors.phoneNumber}
                  />
                  <div className="pt-2">
                    <Button type="submit" loading={profileSaving}>
                      {profileSaving ? t('profile.saving') : t('profile.save_changes')}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Panel 2: Security & Change Password */}
          <div className="glass-card p-6 flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white">{t('profile.security')}</h3>
                <p className="text-slate-400 text-xs mt-0.5">{t('profile.security_subtitle')}</p>
              </div>

              <Alert message={pwdErrorMsg} variant="error" onClose={() => setPwdErrorMsg(null)} className="mb-4" />
              <Alert
                message={pwdSuccess ? t('change_password.success_message') : null}
                variant="success"
                onClose={() => setPwdSuccess(false)}
                className="mb-4"
              />

              <form id="profile-pwd-form" onSubmit={handlePasswordSubmit} noValidate className="space-y-4">
                <Input
                  id="pwd-current"
                  label={t('change_password.current_password')}
                  type="password"
                  placeholder={t('change_password.current_password_placeholder')}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  error={pwdErrors.currentPassword}
                />

                <div>
                  <Input
                    id="pwd-new"
                    label={t('change_password.new_password')}
                    type="password"
                    placeholder={t('change_password.new_password_placeholder')}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    error={pwdErrors.newPassword}
                  />
                  <PasswordStrength password={newPassword} lang={i18n.language} />
                </div>

                <Input
                  id="pwd-confirm"
                  label={t('change_password.confirm_password')}
                  type="password"
                  placeholder={t('change_password.confirm_password_placeholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={pwdErrors.confirmPassword}
                />

                <div className="pt-2">
                  <Button type="submit" loading={pwdSaving}>
                    {pwdSaving ? t('change_password.changing') : t('change_password.change')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
