import AdminHeader from '@/components/admin/AdminHeader'
import AdminSidebar from '@/components/admin/AdminSidebar'
import useAuthStore from '@/store/authStore'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

/**
 * AdminLayout — protected shell for all /admin/* routes
 *
 * Route guard:
 *   - Not authenticated            → /login/admin
 *   - Authenticated but wrong role → /login/admin
 *
 * Layout:
 *   [Sidebar] | [Header + Outlet]
 *
 * The page title shown in the header is derived from the current route pathname.
 */

const PAGE_TITLES = {
  '/admin/dashboard':      'nav.dashboard',
  '/admin/users':          'nav.users',
  '/admin/roles':          'nav.roles',
  '/admin/standard-items': 'nav.standard_items',
  '/admin/projects':       'nav.projects',
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
    : PAGE_TITLES[location.pathname] ?? 'nav.dashboard'
  const pageTitle = t(titleKey)

  return (
    <div className="flex h-dvh overflow-hidden bg-auth-pattern">
      {/* Sidebar */}
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

        {/* Page content */}
        <main
          id="admin-main-content"
          className="flex-1 overflow-y-auto scrollbar-thin p-4 lg:p-6"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
