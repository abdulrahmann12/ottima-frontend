import {
  getNotifications as getNotificationsApi,
  getUnreadCount as getUnreadCountApi,
  markAllAsRead as markAllAsReadApi,
  markAsRead as markAsReadApi,
} from '@/api/notificationApi'
import { create } from 'zustand'

/**
 * useNotificationStore — Zustand store for universal notification management
 *
 * Manages in-app notification list, unread count badge, optimism updates,
 * and real-time STOMP WebSocket incoming payload handling.
 */
const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  page: 0,
  hasMore: true,
  error: null,

  /**
   * Fetch unread notifications count for topbar badge
   */
  fetchUnreadCount: async () => {
    try {
      const res = await getUnreadCountApi()
      const count = res.data?.data ?? res.data ?? 0
      set({ unreadCount: typeof count === 'number' ? count : 0 })
    } catch (err) {
      // Silently catch error for polling or initialization
    }
  },

  /**
   * Fetch paginated notifications for current user
   */
  fetchNotifications: async (page = 0, size = 10, reset = false) => {
    set({ loading: true, error: null })
    try {
      const res = await getNotificationsApi(page, size)
      const pageData = res.data?.data || res.data || {}
      const list = pageData.content || (Array.isArray(pageData) ? pageData : [])
      const totalPages = pageData.totalPages ?? 1

      set((state) => ({
        notifications: reset || page === 0 ? list : [...state.notifications, ...list],
        page,
        hasMore: page + 1 < totalPages,
        loading: false,
      }))

      // Also refresh unread count
      get().fetchUnreadCount()
    } catch (err) {
      set({
        error: err?.response?.data?.message || 'Failed to load notifications',
        loading: false,
      })
    }
  },

  /**
   * Mark single notification as read (Optimistic update)
   */
  markAsRead: async (notificationId) => {
    if (!notificationId) return

    const previousNotifications = get().notifications
    const previousUnreadCount = get().unreadCount

    // Optimistically update store
    set((state) => {
      let wasUnread = false
      const updatedList = state.notifications.map((n) => {
        if (n.notificationId === notificationId || n.id === notificationId) {
          if (!n.isRead && !n.read) wasUnread = true
          return { ...n, isRead: true, read: true }
        }
        return n
      })

      return {
        notifications: updatedList,
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      }
    })

    // Call backend API
    try {
      await markAsReadApi(notificationId)
    } catch (err) {
      // Rollback on API error
      set({
        notifications: previousNotifications,
        unreadCount: previousUnreadCount,
      })
    }
  },

  /**
   * Mark all notifications as read (Optimistic update)
   */
  markAllAsRead: async () => {
    const previousNotifications = get().notifications
    const previousUnreadCount = get().unreadCount

    // Optimistically mark all read
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true, read: true })),
      unreadCount: 0,
    }))

    try {
      await markAllAsReadApi()
    } catch (err) {
      // Rollback on error
      set({
        notifications: previousNotifications,
        unreadCount: previousUnreadCount,
      })
    }
  },

  /**
   * Add real-time notification received via STOMP WebSocket
   * Unshifts payload to top of array and increments unread count
   */
  addRealTimeNotification: (newNotification) => {
    if (!newNotification) return

    set((state) => {
      // Normalize incoming STOMP object field names
      const normalized = {
        notificationId: newNotification.notificationId || newNotification.id || `ws-${Date.now()}`,
        title: newNotification.title || 'New Notification',
        message: newNotification.message || newNotification.body || '',
        isRead: false,
        read: false,
        referenceType: newNotification.referenceType,
        referenceId: newNotification.referenceId,
        createdAt: newNotification.createdAt || new Date().toISOString(),
      }

      // Avoid duplicates
      const exists = state.notifications.some(
        (n) => (n.notificationId && n.notificationId === normalized.notificationId) || (n.id && n.id === normalized.notificationId)
      )

      if (exists) return state

      return {
        notifications: [normalized, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }
    })
  },
}))

export default useNotificationStore
