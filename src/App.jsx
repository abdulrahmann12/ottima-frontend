import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

// Auth pages
import ChangePassword from '@/pages/auth/ChangePassword'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import LoginAdmin from '@/pages/auth/LoginAdmin'
import LoginClient from '@/pages/auth/LoginClient'
import LoginEngineer from '@/pages/auth/LoginEngineer'
import ResetPassword from '@/pages/auth/ResetPassword'
import RoleSelect from '@/pages/auth/RoleSelect'

// Admin shell + pages
import AdminLayout from '@/pages/admin/AdminLayout'
import Dashboard from '@/pages/admin/Dashboard'
import RolesPage from '@/pages/admin/roles/RolesPage'
import StandardItemsPage from '@/pages/admin/standard-items/StandardItemsPage'
import UsersPage from '@/pages/admin/users/UsersPage'
import AdminDailyUpdates from '@/pages/daily-updates/AdminDailyUpdates'
import AdminProjectDailyUpdatesPage from '@/pages/daily-updates/AdminProjectDailyUpdatesPage'
import ClientItemDailyUpdatesPage from '@/pages/daily-updates/ClientItemDailyUpdatesPage'
import EngineerDailyUpdates from '@/pages/daily-updates/EngineerDailyUpdates'
import ProfilePage from '@/pages/profile/ProfilePage'
import AdminProjectDetailsPage from '@/pages/projects/AdminProjectDetailsPage'
import ProjectsPage from '@/pages/projects/ProjectsPage'

// Engineer shell + page
import EngineerProjectDailyUpdatesPage from '@/pages/daily-updates/EngineerProjectDailyUpdatesPage'
import EngineerLayout from '@/pages/engineer/EngineerLayout'
import EngineerProjectDetailsPage from '@/pages/engineer/EngineerProjectDetailsPage'
import EngineerProjectsPage from '@/pages/engineer/EngineerProjectsPage'

// Client shell + page
import ClientLayout from '@/pages/client/ClientLayout'
import ClientProjectDetailsPage from '@/pages/client/ClientProjectDetailsPage'
import ClientProjectsPage from '@/pages/client/ClientProjectsPage'

/**
 * App - root router
 *
 * Admin  → /admin/* (AdminLayout guards ADMIN role)
 * Engineer → /engineer/* (EngineerLayout guards ENGINEER role)
 * Client   → /client/* (ClientLayout guards CLIENT role)
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/"                element={<RoleSelect />} />
        <Route path="/login/admin"     element={<LoginAdmin />} />
        <Route path="/login/engineer"  element={<LoginEngineer />} />
        <Route path="/login/client"    element={<LoginClient />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* Shared */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard"      element={<Dashboard />} />
          <Route path="users"          element={<UsersPage />} />
          <Route path="roles"          element={<RolesPage />} />
          <Route path="standard-items" element={<StandardItemsPage />} />
          <Route path="daily-updates"  element={<AdminDailyUpdates />} />
          <Route path="projects"       element={<ProjectsPage />} />
          <Route path="projects/:projectId" element={<AdminProjectDetailsPage />} />
          <Route path="projects/:projectId/daily-updates" element={<AdminProjectDailyUpdatesPage />} />
        </Route>

        {/* Engineer */}
        <Route path="/engineer" element={<EngineerLayout />}>
          <Route index element={<Navigate to="/engineer/projects" replace />} />
          <Route path="daily-updates" element={<EngineerDailyUpdates />} />
          <Route path="projects"  element={<EngineerProjectsPage />} />
          <Route path="projects/:projectId" element={<EngineerProjectDetailsPage />} />
          <Route path="projects/:projectId/daily-updates" element={<EngineerProjectDailyUpdatesPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="dashboard" element={<Navigate to="/engineer/projects" replace />} />
        </Route>

        {/* Client */}
        <Route path="/client" element={<ClientLayout />}>
          <Route index element={<Navigate to="/client/projects" replace />} />
          <Route path="projects"  element={<ClientProjectsPage />} />
          <Route path="projects/:projectId" element={<ClientProjectDetailsPage />} />
          <Route path="items/:projectItemId/daily-updates" element={<ClientItemDailyUpdatesPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="dashboard" element={<Navigate to="/client/projects" replace />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
