import axiosClient from './axiosClient'

const adminBase = '/api/v1/admin'

/**
 * Fetch paginated comments for a daily update (admin view).
 * @param {number|string} dailyUpdateId
 * @param {number} page - Zero-based page index.
 * @param {number} size - Page size.
 */
export const getAdminComments = (dailyUpdateId, page = 0, size = 10) =>
  axiosClient.get(`${adminBase}/daily-updates/${dailyUpdateId}/comments`, {
    params: { page, size },
  })

/**
 * Submit or update the admin's reply to a client comment.
 * @param {number|string} commentId
 * @param {string} adminReply - The admin's reply text.
 */
export const replyToComment = (commentId, adminReply) =>
  axiosClient.put(`${adminBase}/comments/${commentId}/reply`, { adminReply })

/**
 * Delete any comment (admin privilege).
 * @param {number|string} commentId
 */
export const deleteAdminComment = (commentId) =>
  axiosClient.delete(`${adminBase}/comments/${commentId}`)
