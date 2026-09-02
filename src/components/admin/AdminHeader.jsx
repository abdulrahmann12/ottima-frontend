import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'

/**
 * AdminHeader — top bar for admin pages
 *
 * Props:
 *   title         string   — current page title
 *   onMenuToggle  () => void — opens mobile sidebar
 */
export default function AdminHeader({ title, onMenuToggle }) {
  const { t } = useTranslation()

  return (
    <header className="flex-shrink-0 flex items-center justify-between
      px-4 lg:px-6 py-3.5
      bg-surface-card/80 border-b border-surface-border backdrop-blur-sm
      sticky top-0 z-20">

      {/* Left: hamburger + page title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu button */}
        <button
          type="button"
          id="mobile-menu-btn"
          onClick={onMenuToggle}
          aria-label="Open navigation"
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg
            text-slate-500 hover:text-slate-200 hover:bg-slate-700/60
            transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {/* Page title */}
        <div className="min-w-0">
          <h1 className="text-white font-semibold text-base truncate">{title}</h1>
        </div>
      </div>

      {/* Right: lang switcher */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <LanguageSwitcher />
      </div>
    </header>
  )
}
