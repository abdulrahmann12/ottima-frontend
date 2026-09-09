import { connectWebSocket, disconnectWebSocket } from '@/services/websocketService'
import useAuthStore from '@/store/authStore'
import useNotificationStore from '@/store/useNotificationStore'
import { getNotificationRoute } from '@/utils/NotificationNavigator'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

/**
 * Reference type badge style mapping
 */
function ReferenceTypeBadge({ type }) {
  const refType = (type || '').toUpperCase()
  let badgeColor = 'bg-slate-800 text-slate-400 border-slate-700'

  if (refType === 'DAILY_UPDATE') {
    badgeColor = 'bg-sky-500/10 text-sky-400 border-sky-500/20'
  } else if (refType === 'COMMENT') {
    badgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  } else if (refType === 'TICKET') {
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  } else if (refType === 'PROJECT') {
    badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  }

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${badgeColor}`}>
      {refType || 'INFO'}
    </span>
  )
}

/**
 * NotificationBell — Topbar Bell icon + Notification popover dropdown + STOMP WebSocket connector
 */
export default function NotificationBell() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { role, user } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef(null)

  const {
    notifications,
    unreadCount,
    loading,
    fetchUnreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore()

  // Initialize STOMP WebSocket connection & initial fetch when user is logged in
  useEffect(() => {
    const currentUserId = user?.userId ?? user?.id
    if (currentUserId) {
      fetchUnreadCount()
      fetchNotifications(0, 10, true)
      connectWebSocket(currentUserId)
    }

    return () => {
      disconnectWebSocket()
    }
  }, [user, fetchUnreadCount, fetchNotifications])

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const togglePopover = () => {
    if (!isOpen) {
      fetchNotifications(0, 10, true)
    }
    setIsOpen(!isOpen)
  }

  /**
   * Explicit Notification Card Click Handler
   */
  const handleNotificationClick = async (notification) => {
    const notificationId = notification.notificationId || notification.id

    // 1. Mark as read in the background (if not already read)
    if (!notification.isRead && !notification.read) {
      markAsRead(notificationId)
    }

    // 2. Determine target path and navigate IMMEDIATELY
    const targetPath = getNotificationRoute(
      notification.referenceType,
      notification.referenceId,
      role
    )

    if (targetPath) {
      setIsOpen(false) // Close the popover
      navigate(targetPath)
    } else {
      console.warn('No route mapped for referenceType:', notification.referenceType)
    }
  }

  const displayBadge = unreadCount > 99 ? '99+' : unreadCount

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button Icon */}
      <button
        type="button"
        onClick={togglePopover}
        aria-label={t('notifications.title', 'Notifications')}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center
          text-slate-400 hover:text-slate-200 hover:bg-slate-800/80
          transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>

        {/* Red Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 px-1.5 py-0.5 min-w-[18px] h-[18px] rounded-full
            bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center
            border-2 border-surface-card shadow-sm animate-pulse">
            {displayBadge}
          </span>
        )}
      </button>

      {/* Popover Dropdown Drawer */}
      {isOpen && (
        <div className="absolute end-0 mt-2 w-80 sm:w-96 glass-card border border-surface-border rounded-2xl shadow-card z-50 overflow-hidden animate-slide-up flex flex-col max-h-[480px]">
          {/* Popover Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border bg-slate-900/90">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {t('notifications.title', 'Notifications')}
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-600/30 text-brand-300 border border-brand-500/40">
                  {t('notifications.unread_count', { count: unreadCount, defaultValue: `${unreadCount} unread` })}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium"
              >
                {t('notifications.mark_all_read', 'Mark all read')}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-surface-border/50">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <div className="inline-block w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p>{t('table.loading', 'Loading...')}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500">
                <svg className="w-8 h-8 mx-auto text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                {t('notifications.empty', 'No notifications yet')}
              </div>
            ) : (
              notifications.map((item) => {
                const isUnread = !item.isRead && !item.read
                const id = item.notificationId || item.id

                return (
                  <div
                    key={id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-slate-800/60 ${
                      isUnread ? 'bg-brand-950/20' : 'bg-transparent'
                    }`}
                  >
                    {/* Unread indicator dot */}
                    <div className="mt-1 flex-shrink-0">
                      {isUnread ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-brand-400 shadow-glow-indigo block" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-700 block" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs truncate ${isUnread ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>
                          {item.title || 'Notification'}
                        </p>
                        <ReferenceTypeBadge type={item.referenceType} />
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      <span className="text-[10px] text-slate-500 font-mono block">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleTimeString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
