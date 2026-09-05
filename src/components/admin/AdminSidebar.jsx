import { logout as logoutApi } from '@/api/authApi'
import useAuthStore from '@/store/authStore'
import useUIStore from '@/store/uiStore'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useNavigate } from 'react-router-dom'

/**
 * AdminSidebar — collapsible desktop navigation + mobile overlay drawer
 *
 * Desktop: persistent sidebar, collapses to icon-only on toggle
 * Mobile:  slides in as full overlay drawer when open
 *
 * Props:
 *   mobileOpen  boolean    — mobile drawer open state
 *   onClose     () => void — close mobile drawer
 */

const NAV_ITEMS = [
  {
    key: 'dashboard',
    to: '/admin/dashboard',
    icon: DashboardIcon,
  },
  {
    key: 'users',
    to: '/admin/users',
    icon: UsersIcon,
  },
  {
    key: 'roles',
    to: '/admin/roles',
    icon: RolesIcon,
  },
  {
    key: 'standard_items',
    to: '/admin/standard-items',
    icon: CatalogIcon,
  },
  {
    key: 'projects',
    to: '/admin/projects',
    icon: ProjectsIcon,
  },
  {
    key: 'daily_updates',
    to: '/admin/daily-updates',
    icon: DailyUpdatesIcon,
  },
  {
    key: 'profile',
    to: '/profile',
    icon: ProfileIcon,
  },
]


export default function AdminSidebar({
  mobileOpen,
  onClose,
  navItems = NAV_ITEMS,
  panelSubtitle = 'Admin Panel',
}) {
  const { t } = useTranslation()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { refreshToken, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      if (refreshToken) await logoutApi(refreshToken)
    } catch {
      // Proceed even if logout API fails (network issue, expired token)
    } finally {
      clearAuth()
      navigate('/', { replace: true })
    }
  }

  const navLinkClass = ({ isActive }) =>
    `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
     transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40
     ${isActive
       ? 'bg-brand-600/20 border border-brand-500/30 text-brand-300'
       : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
     }`

  /* ── Shared sidebar content ──────────────────────────────── */
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-surface-border flex-shrink-0
        ${sidebarCollapsed ? 'justify-center' : ''}`}>
        <OttimaLogoMark />
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <p className="text-white font-bold text-base tracking-tight truncate">OTTIMA</p>
            <p className="text-slate-600 text-[10px] truncate">{panelSubtitle}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map(({ key, to, icon: Icon }) => (
          <NavLink
            key={key}
            to={to}
            className={navLinkClass}
            onClick={onClose}
            title={sidebarCollapsed ? t(`nav.${key}`) : undefined}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 ${sidebarCollapsed ? 'mx-auto' : ''}`} />
            {!sidebarCollapsed && (
              <span className="truncate">{t(`nav.${key}`)}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: logout */}
      <div className="px-3 py-4 border-t border-surface-border flex-shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
            text-slate-500 hover:text-red-400 hover:bg-red-900/20
            border border-transparent hover:border-red-800/30
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/30
            disabled:opacity-60 disabled:cursor-not-allowed
            ${sidebarCollapsed ? 'justify-center' : ''}`}
          title={sidebarCollapsed ? t('nav.logout') : undefined}
        >
          <LogoutIcon className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && (
            <span className="truncate">
              {loggingOut ? t('nav.logging_out') : t('nav.logout')}
            </span>
          )}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Mobile overlay backdrop ─────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer ───────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 start-0 z-40 w-64
          bg-surface-card border-e border-surface-border
          transition-transform duration-300 ease-in-out
          lg:hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'}`}
        aria-label="Sidebar navigation"
      >
        {/* Close button on mobile */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="absolute top-4 end-3 w-8 h-8 flex items-center justify-center
            text-slate-500 hover:text-slate-200 rounded-lg hover:bg-slate-700/60
            transition-colors focus:outline-none"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <SidebarContent />
      </aside>

      {/* ── Desktop persistent sidebar ──────────────────── */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0
          bg-surface-card border-e border-surface-border
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-[68px]' : 'w-60'}`}
        aria-label="Sidebar navigation"
      >
        {/* Collapse toggle button */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute top-4 -end-3.5 z-10 w-7 h-7
            bg-surface-card border border-surface-border rounded-full
            flex items-center justify-center
            text-slate-500 hover:text-slate-200
            shadow-card transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-300
              ${sidebarCollapsed ? 'rotate-180 rtl:rotate-0' : 'rtl:rotate-180'}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        <SidebarContent />
      </aside>
    </>
  )
}

/* ── Icons ────────────────────────────────────────────────── */

function OttimaLogoMark() {
  return (
    <div className="w-8 h-8 rounded-lg bg-brand-900/80 border border-brand-700/50 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 40 40">
        <path d="M8 32 L20 8 L32 32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M13 24 L27 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

export function DashboardIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  )
}

export function RolesIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  )
}

export function CatalogIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  )
}

export function ProjectsIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M5.25 21V9.75l6.75-4.5 6.75 4.5V21M9 21v-5.25h6V21M9 10.5h.008v.008H9V10.5Zm6 0h.008v.008H15V10.5Z" />
    </svg>
  )
}

export function DailyUpdatesIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 3.75h1.875A1.875 1.875 0 0 1 20.25 5.625v12.75a1.875 1.875 0 0 1-1.875 1.875H5.625A1.875 1.875 0 0 1 3.75 18.375V5.625A1.875 1.875 0 0 1 5.625 3.75H7.5m9 0V2.625m0 1.125v1.125m0-1.125h-9m9 0H7.5m0 0V2.625m0 1.125v1.125m8.25 4.5h-7.5m7.5 3h-7.5m4.5 3h-4.5"
      />
    </svg>
  )
}

export function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

export function ProfileIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function LogoutIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
    </svg>
  )
}
