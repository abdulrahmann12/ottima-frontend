import axiosClient from './axiosClient'

/**
 * Admin API — admin dashboard stats
 * GET /api/v1/admins/dashboard
 * Role: ADMIN
 * Returns: DashboardSummaryResponse
 *   { totalActiveUsers, totalDeactivatedUsers, totalClients,
 *     totalEngineers, totalAdmins, activeProjects, completedProjects }
 */
export const getAdminDashboard = () =>
  axiosClient.get('/api/v1/admins/dashboard')
