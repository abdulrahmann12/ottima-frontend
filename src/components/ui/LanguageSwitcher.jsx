import { useTranslation } from 'react-i18next'
import { Globe } from './icons/Globe'
import useAuthStore from '@/store/authStore'
import { updatePreferredLanguage } from '@/api/usersApi'

/**
 * LanguageSwitcher
 *
 * Toggles between English (LTR) and Arabic (RTL).
 * The i18n module handles updating document.dir/lang automatically.
 * When authenticated, also syncs the preferred language to the backend user table.
 */
export default function LanguageSwitcher({ className = '' }) {
  const { i18n, t } = useTranslation()
  const { isAuthenticated, updateUserLanguage } = useAuthStore()

  const toggle = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar'
    i18n.changeLanguage(next)
    if (isAuthenticated) {
      updateUserLanguage(next)
      updatePreferredLanguage(next).catch(() => {
        // Silently catch background preference sync failures
      })
    }
  }

  return (
    <button
      id="lang-switcher-btn"
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
        bg-white border border-gray-200
        text-gray-700 hover:text-black
        text-xs font-semibold tracking-wide
        transition-all duration-200
        hover:bg-light-blue/40 hover:border-warm-brown/30
        focus:outline-none focus:ring-2 focus:ring-warm-brown/30 shadow-sm
        ${className}`}
      aria-label="Switch language"
      title={t('lang.switch')}
    >
      <Globe className="w-3.5 h-3.5" />
      <span>{t('lang.switch')}</span>
    </button>
  )
}
