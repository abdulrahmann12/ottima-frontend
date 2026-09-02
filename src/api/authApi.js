import axiosClient from './axiosClient'

/**
 * Auth API — typed wrappers matching the Spring Boot AuthController
 *
 * All endpoints live under /api/v1/auth
 * All responses follow BaseResponse: { message, data, timestamp }
 */

// POST /api/v1/auth/login
// Payload: { usernameOrEmailOrNumber, password }
// Returns: BaseResponse<AuthResponse { accessToken, refreshToken }>
export const login = (usernameOrEmailOrNumber, password) =>
  axiosClient.post('/api/v1/auth/login', { usernameOrEmailOrNumber, password })

// POST /api/v1/auth/refresh-token
// Payload: { refreshToken }
// Returns: BaseResponse<AuthResponse>
export const refreshToken = (refreshToken) =>
  axiosClient.post('/api/v1/auth/refresh-token', { refreshToken })

// POST /api/v1/auth/logout  (requires Bearer token)
// Payload: { refreshToken }
// Returns: BaseResponse
export const logout = (refreshToken) =>
  axiosClient.post('/api/v1/auth/logout', { refreshToken })

// POST /api/v1/auth/forget-password
// Payload: { identifier }  (EmailRequestDTO)
// Returns: BaseResponse
export const forgetPassword = (identifier) =>
  axiosClient.post('/api/v1/auth/forget-password', { identifier })

// POST /api/v1/auth/regenerate-code
// Payload: { identifier }  (EmailRequestDTO)
// Returns: BaseResponse
export const regenerateCode = (identifier) =>
  axiosClient.post('/api/v1/auth/regenerate-code', { identifier })

// POST /api/v1/auth/reset-password
// Payload: { usernameOrEmailOrPhoneNumber, code, newPassword }
// Returns: BaseResponse
export const resetPassword = (usernameOrEmailOrPhoneNumber, code, newPassword) =>
  axiosClient.post('/api/v1/auth/reset-password', {
    usernameOrEmailOrPhoneNumber,
    code,
    newPassword,
  })

// POST /api/v1/auth/change-password  (requires Bearer token)
// Payload: { currentPassword, newPassword }
// Returns: BaseResponse
export const changePassword = (currentPassword, newPassword) =>
  axiosClient.post('/api/v1/auth/change-password', { currentPassword, newPassword })
