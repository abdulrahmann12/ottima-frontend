import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Auth pages
import RoleSelect      from '@/pages/auth/RoleSelect'
import LoginAdmin      from '@/pages/auth/LoginAdmin'
import LoginEngineer   from '@/pages/auth/LoginEngineer'
import LoginClient     from '@/pages/auth/LoginClient'
import ForgotPassword  from '@/pages/auth/ForgotPassword'
import ResetPassword   from '@/pages/auth/ResetPassword'
import ChangePassword  from '@/pages/auth/ChangePassword'

// Admin shell + pages
import AdminLayout        from '@/pages/admin/AdminLayout'
import Dashboard          from '@/pages/admin/Dashboard'
import RolesPage          from '@/pages/admin/roles/RolesPage'
import StandardItemsPage  from '@/pages/admin/standard-items/StandardItemsPage'
import UsersPage          from '@/pages/admin/users/UsersPage'
import ProfilePage        from '@/pages/profile/ProfilePage'

/**
 * App — root router
 *
 * Auth routes (public):
 *   /                    → RoleSelect
 *   /login/admin         → LoginAdmin
 *   /login/engineer      → LoginEngineer
 *   /login/client        → LoginClient
 *   /forgot-password     → ForgotPassword
 *   /reset-password      → ResetPassword
 *   /change-password     → ChangePassword
 *
 * Profile route (protected — ANY authenticated user):
 *   /profile             → ProfilePage
 *
 * Admin routes (protected — ADMIN only, guarded in AdminLayout):
 *   /admin               → redirect to /admin/dashboard
 *   /admin/dashboard     → Dashboard
 *   /admin/users         → UsersPage
 *   /admin/roles         → RolesPage
 *   /admin/standard-items → StandardItemsPage
 *
 * Engineer / Client dashboards:
 *   Placeholder — to be implemented in future modules
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Auth ────────────────────────────────────────── */}
        <Route path="/"                element={<RoleSelect />} />
        <Route path="/login/admin"     element={<LoginAdmin />} />
        <Route path="/login/engineer"  element={<LoginEngineer />} />
        <Route path="/login/client"    element={<LoginClient />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* ── Shared Profile ──────────────────────────────── */}
        <Route path="/profile"         element={<ProfilePage />} />

        {/* ── Admin ───────────────────────────────────────── */}
        <Route path="/admin" element={<AdminLayout />}>
          {/* /admin → redirect to /admin/dashboard */}
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard"      element={<Dashboard />} />
          <Route path="users"          element={<UsersPage />} />
          <Route path="roles"          element={<RolesPage />} />
          <Route path="standard-items" element={<StandardItemsPage />} />
        </Route>

        {/* ── Engineer Dashboard (placeholder) ────────────── */}
        <Route path="/engineer/dashboard" element={<DashboardPlaceholder role="Engineer" />} />

        {/* ── Client Dashboard (placeholder) ──────────────── */}
        <Route path="/client/dashboard" element={<DashboardPlaceholder role="Client" />} />

        {/* ── Fallback ─────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

/**
 * Temporary placeholder for engineer/client dashboard routes.
 * Replace with real dashboard modules in future sprints.
 */
function DashboardPlaceholder({ role }) {
  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-900/60 border border-brand-700/40
          flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-brand-400" fill="none" viewBox="0 0 24 24"
            strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{role} Dashboard</h1>
        <p className="text-slate-500 text-sm mb-6">
          Successfully authenticated. Dashboard module coming soon.
        </p>
        <a href="/" className="link text-sm">← Back to Login</a>
      </div>
    </div>
  )
}
