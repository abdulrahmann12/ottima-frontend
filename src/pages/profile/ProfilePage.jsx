import { changePassword } from '@/api/authApi'
import { getMyProfile, updateMyProfile } from '@/api/usersApi'
import UserBadge from '@/components/admin/UserBadge'
import PasswordStrength from '@/components/auth/PasswordStrength'
import Alert from '@/components/ui/Alert'
import Input from '@/components/ui/Input'
import { Spinner } from '@/components/ui/icons/Globe'
import useAuthStore from '@/store/authStore'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

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
  const location = useLocation()

  // Profile data
  const [profile, setProfile] = useState(null)
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
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwdErrors, setPwdErrors] = useState({})
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdSuccess, setPwdSuccess] = useState(false)
  const [pwdErrorMsg, setPwdErrorMsg] = useState(null)

  // Redirect if not authenticated or if accessing un-nested /profile route
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true })
      return
    }

    if (location.pathname === '/profile') {
      if (role === 'CLIENT') navigate('/client/profile', { replace: true })
      else if (role === 'ENGINEER') navigate('/engineer/profile', { replace: true })
      else if (role === 'ADMIN') navigate('/admin/profile', { replace: true })
    }
  }, [isAuthenticated, location.pathname, role, navigate])

  // Load user profile
  useEffect(() => {
    if (!isAuthenticated) return
    setProfileLoading(true)
    getMyProfile()
      .then(({ data: res }) => {
        const u = res.data
        setProfile(u)
        setProfileForm({
          username: u.username ?? '',
          email: u.email ?? '',
          fullNameAr: u.fullNameAr ?? '',
          fullNameEn: u.fullNameEn ?? '',
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

  if (!isAuthenticated) return null

  const initialLetter =
    (profile?.fullNameEn?.trim()?.charAt(0) || profile?.username?.trim()?.charAt(0) || 'U').toUpperCase()

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('profile.title', 'My Profile')}</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {t('profile.subtitle', 'View and update your personal info and security settings')}
          </p>
        </div>
      </div>

      {/* Profile Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-warm-brown text-white shadow-sm flex items-center justify-center font-bold text-2xl tracking-wider select-none shrink-0">
            {initialLetter}
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">
              {i18n.language === 'ar'
                ? profile?.fullNameAr || profile?.fullNameEn
                : profile?.fullNameEn || profile?.fullNameAr || profile?.username}
            </h2>
            <div className="flex items-center gap-2.5 flex-wrap text-sm">
              <span className="font-mono text-xs bg-beige/30 text-gray-700 px-2.5 py-0.5 rounded-lg border border-gray-200 font-medium">
                @{profile?.username}
              </span>
              {profile?.email && (
                <span className="text-xs text-gray-500 font-mono hidden sm:inline">{profile?.email}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <UserBadge roleName={profile?.roleName || role} type="role" />
          <UserBadge active={profile?.active ?? true} type="status" />
        </div>
      </div>

      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Panel 1: Personal Info Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-4 mb-5 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-warm-brown/10 text-warm-brown flex items-center justify-center shrink-0">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">{t('profile.personal_info')}</h3>
                <p className="text-gray-500 text-xs mt-0.5">{t('profile.personal_info_subtitle')}</p>
              </div>
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
                <div className="h-10 bg-gray-100 rounded-xl" />
                <div className="h-10 bg-gray-100 rounded-xl" />
                <div className="h-10 bg-gray-100 rounded-xl" />
                <div className="h-10 bg-gray-100 rounded-xl" />
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
                <div className="pt-3 border-t border-gray-100 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl
                      bg-warm-brown hover:bg-[#6B4A33] text-white font-semibold text-sm
                      transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-warm-brown/50
                      disabled:opacity-60 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
                  >
                    {profileSaving ? (
                      <>
                        <Spinner className="w-4 h-4" />
                        <span>{t('profile.saving')}</span>
                      </>
                    ) : (
                      t('profile.save_changes')
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Panel 2: Security & Change Password */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-4 mb-5 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-warm-brown/10 text-warm-brown flex items-center justify-center shrink-0">
                <LockIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">{t('profile.security')}</h3>
                <p className="text-gray-500 text-xs mt-0.5">{t('profile.security_subtitle')}</p>
              </div>
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

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={pwdSaving}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl
                    bg-warm-brown hover:bg-[#6B4A33] text-white font-semibold text-sm
                    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-warm-brown/50
                    disabled:opacity-60 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
                >
                  {pwdSaving ? (
                    <>
                      <Spinner className="w-4 h-4" />
                      <span>{t('change_password.changing')}</span>
                    </>
                  ) : (
                    t('change_password.change')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Inline Icons ─────────────────────────────────────────── */
function UserIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />
    </svg>
  )
}

function LockIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
      />
    </svg>
  )
}
