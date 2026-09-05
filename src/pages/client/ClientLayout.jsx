import { useState } from 'react'
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useAuthStore from '@/store/authStore'
import { logout as logoutApi } from '@/api/authApi'

/**
 * ClientLayout — top-navigation shell for the Client portal.
 *
 * Guards: redirects to /login/client if not authenticated or wrong role.
 */
export default function ClientLayout() {
  const { isAuthenticated, role, clearAuth } = useAuthStore()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  if (!isAuthenticated || role !== 'CLIENT') {
    return <Navigate to="/login/client" replace />
  }

  const toggleLang = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar'
    i18n.changeLanguage(next)
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = next
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try { await logoutApi() } catch { /* ignore */ }
    clearAuth()
    navigate('/')
  }

  return (
    <div className="min-h-dvh bg-surface text-white">
      {/* ── Top navigation bar ──────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-surface-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Logo + role badge */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-700">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-bold text-white">{t('app.name')}</span>
              <span className="ms-2 rounded-full bg-cyan-900/40 border border-cyan-700/40 px-2 py-0.5 text-[10px] font-semibold text-cyan-400">
                {t('role.client')}
              </span>
            </div>
          </div>

          {/* Desktop nav links */}
          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink
              to="/client/projects"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-cyan-900/40 text-cyan-300' : 'text-slate-400 hover:text-white'}`
              }
            >
              {t('nav.projects')}
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-cyan-900/40 text-cyan-300' : 'text-slate-400 hover:text-white'}`
              }
            >
              {t('nav.profile')}
            </NavLink>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLang}
              className="rounded-lg border border-surface-border px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-cyan-500/60 hover:text-white"
            >
              {t('lang.switch')}
            </button>

            <button
              type="button"
              id="btn-client-logout"
              disabled={loggingOut}
              onClick={handleLogout}
              className="hidden rounded-lg border border-surface-border px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-red-500/60 hover:text-red-400 disabled:opacity-40 sm:block"
            >
              {loggingOut ? t('nav.logging_out') : t('nav.logout')}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg border border-surface-border p-2 text-slate-400 hover:text-white sm:hidden"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="border-t border-surface-border bg-surface px-4 pb-3 pt-2 sm:hidden">
            <nav className="flex flex-col gap-1">
              <NavLink to="/client/projects" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:text-white">
                {t('nav.projects')}
              </NavLink>
              <NavLink to="/profile" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:text-white">
                {t('nav.profile')}
              </NavLink>
              <button onClick={handleLogout} disabled={loggingOut} className="rounded-lg px-3 py-2 text-start text-sm font-medium text-red-400 hover:text-red-300 disabled:opacity-40">
                {loggingOut ? t('nav.logging_out') : t('nav.logout')}
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* ── Page content ───────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}

