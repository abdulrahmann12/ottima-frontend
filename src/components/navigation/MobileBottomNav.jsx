import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useAuthStore from '@/store/authStore'
import { logout as logoutApi } from '@/api/authApi'
import {
  DashboardIcon,
  ProjectsIcon,
  TicketsIcon,
  DailyUpdatesIcon,
  UsersIcon,
  RolesIcon,
  CatalogIcon,
  FinanceIcon,
  CommentsIcon,
  ActivityLogsIcon,
  ProfileIcon,
} from '@/components/admin/AdminSidebar'

const ADMIN_PRIMARY_KEYS = ['dashboard', 'projects', 'tickets', 'daily_updates']
const ENGINEER_PRIMARY_KEYS = ['projects', 'daily_updates', 'tickets', 'profile']
const CLIENT_PRIMARY_KEYS = ['projects', 'finance', 'profile']

export default function MobileBottomNav({ navItems: customNavItems }) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { role, user, logout } = useAuthStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // Close sheet on route change
  useEffect(() => {
    setSheetOpen(false)
  }, [location.pathname])

  // Prevent background scroll when menu sheet is open
  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [sheetOpen])

  // All navigation items per role
  const allNavItems = customNavItems || (
    role === 'ADMIN'
      ? [
          { key: 'dashboard', to: '/admin/dashboard', icon: DashboardIcon },
          { key: 'projects', to: '/admin/projects', icon: ProjectsIcon },
          { key: 'tickets', to: '/admin/tickets', icon: TicketsIcon },
          { key: 'daily_updates', to: '/admin/daily-updates', icon: DailyUpdatesIcon },
          { key: 'finance', to: '/admin/finance', icon: FinanceIcon },
          { key: 'users', to: '/admin/users', icon: UsersIcon },
          { key: 'roles', to: '/admin/roles', icon: RolesIcon },
          { key: 'standard_items', to: '/admin/standard-items', icon: CatalogIcon },
          { key: 'comments', to: '/admin/comments', icon: CommentsIcon },
          { key: 'activity_logs', to: '/admin/activity-logs', icon: ActivityLogsIcon },
          { key: 'profile', to: '/admin/profile', icon: ProfileIcon },
        ]
      : role === 'ENGINEER'
      ? [
          { key: 'projects', to: '/engineer/projects', icon: ProjectsIcon },
          { key: 'daily_updates', to: '/engineer/daily-updates', icon: DailyUpdatesIcon },
          { key: 'tickets', to: '/engineer/tickets', icon: TicketsIcon },
          { key: 'profile', to: '/engineer/profile', icon: ProfileIcon },
        ]
      : [
          { key: 'projects', to: '/client/projects', icon: ProjectsIcon },
          { key: 'finance', to: '/client/finance', icon: FinanceIcon },
          { key: 'profile', to: '/client/profile', icon: ProfileIcon },
        ]
  )

  const primaryKeys =
    role === 'ADMIN'
      ? ADMIN_PRIMARY_KEYS
      : role === 'ENGINEER'
      ? ENGINEER_PRIMARY_KEYS
      : CLIENT_PRIMARY_KEYS

  const primaryTabs = allNavItems.filter((item) => primaryKeys.includes(item.key))
  const overflowTabs = allNavItems.filter((item) => !primaryKeys.includes(item.key))

  const isActive = (to) => {
    if (!to) return false
    if (location.pathname === to) return true
    if (to !== '/admin/dashboard' && to !== '/engineer/dashboard' && location.pathname.startsWith(to)) {
      return true
    }
    return false
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logoutApi().catch(() => {})
    } finally {
      logout()
      navigate(`/login/${(role || 'admin').toLowerCase()}`, { replace: true })
    }
  }

  return (
    <>
      {/* ── Native Fixed Bottom Navigation Bar ───────────────── */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#D9C7B8] shadow-lg select-none"
      >
        <div className={`grid ${overflowTabs.length > 0 ? 'grid-cols-5' : 'grid-cols-4'} h-16 w-full max-w-lg mx-auto items-center px-1`}>
          {primaryTabs.map((item) => {
            const active = isActive(item.to)
            const Icon = item.icon
            const label = t(`nav.${item.key}_short`, { defaultValue: t(`nav.${item.key}`, item.key.replace('_', ' ')) })
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.to)}
                className={`relative flex flex-col items-center justify-center h-full min-h-[48px] py-1 px-0.5 transition-all cursor-pointer ${
                  active ? 'text-[#7D583F]' : 'text-gray-400 hover:text-gray-700 active:scale-95'
                }`}
              >
                {/* Active Indicator Top Pill */}
                {active && (
                  <span className="absolute top-0 w-8 h-1 rounded-b-full bg-[#7D583F] shadow-xs animate-fade-in" />
                )}
                {Icon && (
                  <Icon className={`w-5 h-5 transition-transform shrink-0 ${active ? 'scale-110' : ''}`} />
                )}
                <span className={`text-[10px] mt-1 w-full text-center truncate px-0.5 leading-tight ${active ? 'font-bold text-[#7D583F]' : 'font-medium text-gray-500'}`}>
                  {label}
                </span>
              </button>
            )
          })}

          {/* 5th Tab: Menu / More Bottom Sheet */}
          {overflowTabs.length > 0 && (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className={`relative flex flex-col items-center justify-center h-full min-h-[48px] py-1 px-0.5 transition-all cursor-pointer ${
                sheetOpen ? 'text-[#7D583F]' : 'text-gray-400 hover:text-gray-700 active:scale-95'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              <span className="text-[10px] mt-1 w-full text-center truncate px-0.5 leading-tight font-medium text-gray-500">
                {t('common.more', { defaultValue: 'Menu' })}
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* ── Native Mobile 'More' Action Sheet Drawer ─────────── */}
      {sheetOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-fade-in"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="bg-white rounded-t-3xl border-t border-[#D9C7B8] shadow-2xl p-5 max-h-[85vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Top Drag Handle */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#7D583F] text-white flex items-center justify-center font-bold text-xs">
                  {(user?.fullNameEn || user?.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 leading-none">
                    {user?.fullNameEn || user?.fullNameAr || user?.username}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase mt-0.5">{role}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Secondary Links Grid */}
            <div className="grid grid-cols-2 gap-2.5 py-4">
              {allNavItems.map((item) => {
                const active = isActive(item.to)
                const Icon = item.icon
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      navigate(item.to)
                      setSheetOpen(false)
                    }}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left rtl:text-right min-h-[50px] transition-all cursor-pointer ${
                      active
                        ? 'bg-[#7D583F]/10 border-[#7D583F] text-[#7D583F] font-bold shadow-xs'
                        : 'bg-[#F4EDE4]/40 border-gray-200 text-gray-700 hover:bg-[#F4EDE4]'
                    }`}
                  >
                    {Icon && <Icon className="w-5 h-5 shrink-0" />}
                    <span className="text-xs font-semibold truncate">
                      {t(`nav.${item.key}`, { defaultValue: item.key.replace('_', ' ') })}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Logout Button */}
            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                </svg>
                <span>{t('auth.logout', { defaultValue: 'Logout' })}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
