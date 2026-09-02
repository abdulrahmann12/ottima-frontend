import axiosClient from './axiosClient'

/**
 * Roles API — all endpoints at /api/v1/roles
 * Role required: ADMIN (enforced server-side via @PreAuthorize)
 *
 * RoleResponse shape: { roleId, roleName, createdAt, updatedAt }
 * Paginated list returns Spring Data Page: { content[], totalElements, totalPages, number, size }
 */

// GET /api/v1/roles?page=0&size=10
export const getAllRoles = (page = 0, size = 10) =>
  axiosClient.get('/api/v1/roles', { params: { page, size } })

// GET /api/v1/roles/{roleId}
export const getRoleById = (roleId) =>
  axiosClient.get(`/api/v1/roles/${roleId}`)

// GET /api/v1/roles/name/{roleName}
export const getRoleByName = (roleName) =>
  axiosClient.get(`/api/v1/roles/name/${roleName}`)

// POST /api/v1/roles — payload: { roleName }
export const createRole = (roleName) =>
  axiosClient.post('/api/v1/roles', { roleName })

// PUT /api/v1/roles/{roleId} — payload: { roleName }
export const updateRole = (roleId, roleName) =>
  axiosClient.put(`/api/v1/roles/${roleId}`, { roleName })

// DELETE /api/v1/roles/{roleId}
export const deleteRole = (roleId) =>
  axiosClient.delete(`/api/v1/roles/${roleId}`)
