import axiosClient from './axiosClient'

/**
 * Users API — all user-related endpoints
 *
 * Admin-scoped endpoints (role-specific creation & listing):
 *   POST  /api/v1/admins                 — CreateUserRequest → UserResponse
 *   GET   /api/v1/admins?page&size        — paginated UserResponse list
 *   POST  /api/v1/engineers              — CreateUserRequest → UserResponse
 *   GET   /api/v1/engineers?page&size     — paginated UserResponse list
 *   POST  /api/v1/clients                — CreateUserRequest → UserResponse
 *   GET   /api/v1/clients?page&size       — paginated UserResponse list
 *
 * Generic user management (ADMIN only):
 *   GET   /api/v1/users/{userId}          — UserResponse
 *   PUT   /api/v1/users/{userId}          — AdminUpdateUserRequest → UserResponse
 *   DELETE /api/v1/users/{userId}         — soft-delete (deactivate)
 *   PATCH /api/v1/users/{userId}/activate — reactivate
 *
 * Self-service profile (any authenticated role):
 *   GET   /api/v1/users/data             — my UserResponse
 *   PUT   /api/v1/users/data             — UpdateProfileRequest → UserResponse
 */

// ── Admin-specific creation & listing ──────────────────────────
export const createAdmin    = (data)             => axiosClient.post('/api/v1/admins', data)
export const getAllAdmins    = (page = 0, size = 10) => axiosClient.get('/api/v1/admins', { params: { page, size } })

export const createEngineer = (data)             => axiosClient.post('/api/v1/engineers', data)
export const getAllEngineers = (page = 0, size = 10) => axiosClient.get('/api/v1/engineers', { params: { page, size } })

export const createClient   = (data)             => axiosClient.post('/api/v1/clients', data)
export const getAllClients   = (page = 0, size = 10) => axiosClient.get('/api/v1/clients', { params: { page, size } })

// ── Generic user management (ADMIN only) ───────────────────────
export const getUserById    = (userId)           => axiosClient.get(`/api/v1/users/${userId}`)
export const updateUserByAdmin = (userId, data)  => axiosClient.put(`/api/v1/users/${userId}`, data)
export const deleteUser     = (userId)           => axiosClient.delete(`/api/v1/users/${userId}`)
export const activateUser   = (userId)           => axiosClient.patch(`/api/v1/users/${userId}/activate`)

export const searchUsers    = (keyword, page = 0, size = 10) => axiosClient.get('/api/v1/users/search', { params: { keyword, page, size } })
export const getAllDeactivatedUsers = (page = 0, size = 10) => axiosClient.get('/api/v1/users/deactivated', { params: { page, size } })

// ── Self-service profile (any authenticated role) ─────────────
export const getMyProfile    = ()     => axiosClient.get('/api/v1/users/data')
export const updateMyProfile = (data) => axiosClient.put('/api/v1/users/data', data)
