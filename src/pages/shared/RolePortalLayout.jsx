import AdminHeader from '@/components/admin/AdminHeader'
import AdminSidebar from '@/components/admin/AdminSidebar'
import useAuthStore from '@/store/authStore'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

export default function RolePortalLayout({
  requiredRole,
  loginPath,
  navItems,
  pageTitleResolver,
  panelSubtitle,
}) {
  const { isAuthenticated, role } = useAuthStore()
  const { t } = useTranslation()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!isAuthenticated || role !== requiredRole) {
    return <Navigate to={loginPath} replace state={{ from: location }} />
  }

  const titleKey = pageTitleResolver(location.pathname)
  const pageTitle = t(titleKey)

  return (
    <div className="flex h-dvh overflow-hidden bg-auth-pattern">
      <AdminSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navItems={navItems}
        panelSubtitle={panelSubtitle}
      />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminHeader
          title={pageTitle}
          onMenuToggle={() => setMobileOpen(true)}
        />

        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}