import axiosClient from './axiosClient'

const clientBase = '/api/v1/client/daily-updates'

/**
 * Post a new comment on an APPROVED daily update.
 * @param {number|string} dailyUpdateId
 * @param {string} clientComment - The comment text body.
 */
export const addClientComment = (dailyUpdateId, clientComment) =>
  axiosClient.post(`${clientBase}/${dailyUpdateId}/comments`, { clientComment })

/**
 * Fetch paginated comments for a daily update (client view).
 * @param {number|string} dailyUpdateId
 * @param {number} page - Zero-based page index.
 * @param {number} size - Page size.
 */
export const getClientComments = (dailyUpdateId, page = 0, size = 10) =>
  axiosClient.get(`${clientBase}/${dailyUpdateId}/comments`, {
    params: { page, size },
  })

/**
 * Edit an existing comment. Only allowed when adminReply is null.
 * @param {number|string} dailyUpdateId
 * @param {number|string} commentId
 * @param {string} clientComment - Updated comment text.
 */
export const updateClientComment = (dailyUpdateId, commentId, clientComment) =>
  axiosClient.put(`${clientBase}/${dailyUpdateId}/comments/${commentId}`, {
    clientComment,
  })

/**
 * Delete a client's own comment.
 * @param {number|string} dailyUpdateId
 * @param {number|string} commentId
 */
export const deleteClientComment = (dailyUpdateId, commentId) =>
  axiosClient.delete(`${clientBase}/${dailyUpdateId}/comments/${commentId}`)
