import { useTranslation } from 'react-i18next'
import { Globe } from './icons/Globe'

/**
 * LanguageSwitcher
 *
 * Toggles between English (LTR) and Arabic (RTL).
 * The i18n module handles updating document.dir/lang automatically.
 */
export default function LanguageSwitcher({ className = '' }) {
  const { i18n, t } = useTranslation()

  const toggle = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar'
    i18n.changeLanguage(next)
  }

  return (
    <button
      id="lang-switcher-btn"
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
        bg-slate-800/70 border border-surface-border
        text-slate-400 hover:text-slate-100
        text-xs font-medium tracking-wide
        transition-all duration-200
        hover:bg-slate-700/70 hover:border-brand-500/50
        focus:outline-none focus:ring-2 focus:ring-brand-500/40
        ${className}`}
      aria-label="Switch language"
      title={t('lang.switch')}
    >
      <Globe className="w-3.5 h-3.5" />
      <span>{t('lang.switch')}</span>
    </button>
  )
}
