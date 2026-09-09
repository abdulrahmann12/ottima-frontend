import axiosClient from './axiosClient'

/**
 * Notifications API — user in-app notifications
 *
 * GET   /api/v1/notifications?page={page}&size={size} - Fetch paginated user notifications
 * GET   /api/v1/notifications/unread-count           - Fetch unread notification count
 * PATCH /api/v1/notifications/{id}/read               - Mark single notification as read
 * PATCH /api/v1/notifications/read-all                - Mark all notifications as read
 */

/**
 * Fetch paginated notifications for the current user
 * @param {number} page 0-indexed page number
 * @param {number} size page size
 */
export const getNotifications = (page = 0, size = 10) =>
  axiosClient.get('/api/v1/notifications', { params: { page, size } })

/**
 * Fetch total unread notification count for badge indicator
 */
export const getUnreadCount = () =>
  axiosClient.get('/api/v1/notifications/unread-count')

/**
 * Mark a single notification as read by ID
 * @param {string} notificationId UUID
 */
export const markAsRead = (notificationId) =>
  axiosClient.patch(`/api/v1/notifications/${notificationId}/read`)

/**
 * Mark all notifications for the current user as read
 */
export const markAllAsRead = () =>
  axiosClient.patch('/api/v1/notifications/read-all')
