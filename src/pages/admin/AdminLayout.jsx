import AdminHeader from '@/components/admin/AdminHeader'
import AdminSidebar from '@/components/admin/AdminSidebar'
import MobileBottomNav from '@/components/navigation/MobileBottomNav'
import useAuthStore from '@/store/authStore'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

/**
 * AdminLayout — protected shell for all /admin/* routes
 */

const PAGE_TITLES = {
  '/admin/dashboard':      'nav.dashboard',
  '/admin/users':          'nav.users',
  '/admin/roles':          'nav.roles',
  '/admin/standard-items': 'nav.standard_items',
  '/admin/projects':       'nav.projects',
  '/admin/daily-updates':  'nav.daily_updates',
  '/admin/tickets':        'nav.tickets',
  '/admin/comments':       'nav.comments',
  '/admin/finance':        'nav.finance',
  '/admin/activity-logs':  'nav.activity_logs',
  '/admin/profile':        'nav.profile',
}

export default function AdminLayout() {
  const { isAuthenticated, role } = useAuthStore()
  const { t } = useTranslation()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Route guard
  if (!isAuthenticated || role !== 'ADMIN') {
    return <Navigate to="/login/admin" replace state={{ from: location }} />
  }

  const titleKey = location.pathname.includes('/daily-updates')
    ? 'nav.daily_updates'
    : location.pathname.startsWith('/admin/projects/')
    ? 'nav.projects'
    : location.pathname.startsWith('/admin/profile')
    ? 'nav.profile'
    : PAGE_TITLES[location.pathname] ?? 'nav.dashboard'
  const pageTitle = t(titleKey)

  return (
    <div className="flex h-dvh overflow-hidden bg-cream">
      {/* Sidebar (Desktop persistent, Mobile drawer on toggle) */}
      <AdminSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main content column */}
      <div className="relative flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <AdminHeader
          title={pageTitle}
          onMenuToggle={() => setMobileOpen(true)}
        />

        {/* Page content with safe area padding for bottom nav */}
        <main
          id="admin-main-content"
          className="flex-1 overflow-y-auto scrollbar-thin p-3.5 sm:p-5 lg:p-6 pb-24 lg:pb-6"
        >
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
  )
}
