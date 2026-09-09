import axiosClient from './axiosClient'

/**
 * Admin Activity Logs API
 *
 * GET /api/v1/admin/activity-logs?userId={userId}&action={action}&status={status}&entityName={entityName}&page={page}&size={size}
 * GET /api/v1/admin/activity-logs/users/{userId}?page={page}&size={size}
 */

/**
 * Fetch activity logs with optional filters
 * @param {Object|number} filters Filter criteria ({ userId, action, status, entityName }) or page number
 * @param {number} page 0-indexed page number
 * @param {number} size page size
 */
export const getAllActivityLogs = (filters = {}, page = 0, size = 10) => {
  // Support legacy signature (page, size)
  if (typeof filters === 'number') {
    const pageNum = filters
    const sizeNum = page || 10
    return axiosClient.get('/api/v1/admin/activity-logs', { params: { page: pageNum, size: sizeNum } })
  }

  const { userId, action, status, entityName } = filters || {}
  const params = { page, size }

  // Ensure userId is valid numeric value before sending
  if (userId !== undefined && userId !== null && userId !== '' && !isNaN(Number(userId))) {
    params.userId = Number(userId)
  }
  if (action) params.action = action
  if (status) params.status = status
  if (entityName) params.entityName = entityName

  return axiosClient.get('/api/v1/admin/activity-logs', { params })
}

/**
 * Fetch activity logs for a specific user paginated
 * @param {string|number} userId User ID
 * @param {number} page 0-indexed page number
 * @param {number} size page size
 */
export const getActivityLogsByUser = (userId, page = 0, size = 10) =>
  axiosClient.get(`/api/v1/admin/activity-logs/users/${userId}`, { params: { page, size } })
