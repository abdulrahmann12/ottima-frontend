import { resolveNotificationContext } from '@/api/notificationApi'
import { getMyProfile } from '@/api/usersApi'
import { connectWebSocket, disconnectWebSocket } from '@/services/websocketService'
import useAuthStore from '@/store/authStore'
import useNotificationStore from '@/store/useNotificationStore'
import { getNotificationRoute } from '@/utils/NotificationNavigator'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

/**
 * Reference type badge style mapping matching the luxury palette
 */
function ReferenceTypeBadge({ type }) {
  const refType = (type || '').toUpperCase()
  let badgeColor = 'bg-gray-100 text-gray-700 border-gray-200'

  if (refType === 'DAILY_UPDATE') {
    badgeColor = 'bg-amber-50 text-amber-800 border-amber-200'
  } else if (refType === 'COMMENT') {
    badgeColor = 'bg-warm-brown/10 text-warm-brown border-warm-brown/20'
  } else if (refType === 'PROJECT') {
    badgeColor = 'bg-olive/10 text-olive border-olive/20'
  } else if (refType === 'TICKET' || refType === 'FINANCE') {
    badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200'
  }

  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${badgeColor}`}>
      {refType || 'INFO'}
    </span>
  )
}

/**
 * NotificationBell — Topbar Bell icon + Luxury Notification popover dropdown + STOMP WebSocket connector
 */
export default function NotificationBell() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { role, user, setUser, isAuthenticated } = useAuthStore()
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

  // Initialize STOMP WebSocket connection & initial unread count fetch whenever authenticated
  useEffect(() => {
    if (!isAuthenticated) return

    // 1. Immediately fetch unread badge count on mount + start sync interval
    fetchUnreadCount()
    const intervalId = setInterval(() => {
      fetchUnreadCount()
    }, 25000)

    // 2. Ensure user profile & userId is available, then connect WebSocket
    let active = true
    const currentUserId = user?.userId ?? user?.id

    if (currentUserId) {
      connectWebSocket(currentUserId)
    } else {
      getMyProfile()
        .then((res) => {
          if (!active) return
          const profile = res.data?.data || res.data || {}
          setUser(profile)
          const fetchedId = profile.userId ?? profile.id
          if (fetchedId) {
            connectWebSocket(fetchedId)
          }
        })
        .catch(() => {
          // Ignore profile error if offline
        })
    }

    return () => {
      active = false
      clearInterval(intervalId)
      disconnectWebSocket()
    }
  }, [isAuthenticated, user?.userId, user?.id, fetchUnreadCount, setUser])

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
   * Notification Card Click Handler — Resolves exact nested entity context for smooth navigation
   */
  const handleNotificationClick = async (notification) => {
    const notificationId = notification.notificationId || notification.id
    const refType = (notification.referenceType || '').toUpperCase()
    const refId = notification.referenceId
    const currentRole = (role || 'ADMIN').toUpperCase()

    // 1. Mark as read in the background (if not already read)
    if (!notification.isRead && !notification.read) {
      markAsRead(notificationId)
    }

    setIsOpen(false) // Close the popover

    // 2. Context-aware navigation for nested entities (Client and Engineer)
    if (currentRole === 'CLIENT' && (refType === 'COMMENT' || refType === 'DAILY_UPDATE')) {
      try {
        const res = await resolveNotificationContext(refType, refId)
        const ctx = res.data?.data || res.data || {}
        if (ctx.projectItemId) {
          navigate(`/client/items/${ctx.projectItemId}/daily-updates`, {
            state: {
              projectId: ctx.projectId,
              itemNameAr: ctx.itemNameAr,
              itemNameEn: ctx.itemNameEn,
              projectNameAr: ctx.projectNameAr,
              projectNameEn: ctx.projectNameEn,
              targetCommentId: refType === 'COMMENT' ? refId : undefined,
              targetUpdateId: ctx.dailyUpdateId || (refType === 'DAILY_UPDATE' ? refId : undefined),
            },
          })
          return
        }
      } catch (err) {
        console.warn('Failed to resolve client notification context:', err)
      }
    } else if (currentRole === 'ENGINEER' && (refType === 'COMMENT' || refType === 'DAILY_UPDATE')) {
      try {
        const res = await resolveNotificationContext(refType, refId)
        const ctx = res.data?.data || res.data || {}
        if (ctx.projectId) {
          navigate(`/engineer/projects/${ctx.projectId}/daily-updates`, {
            state: {
              projectSummary: {
                projectId: ctx.projectId,
                nameAr: ctx.projectNameAr,
                nameEn: ctx.projectNameEn,
              },
            },
          })
          return
        }
      } catch (err) {
        console.warn('Failed to resolve engineer notification context:', err)
      }
    }

    // 3. Fallback to standard route mapping
    const targetPath = getNotificationRoute(refType, refId, currentRole)
    if (targetPath) {
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
          text-gray-700 hover:text-black hover:bg-warm-brown/10
          transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-warm-brown/30"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>

        {/* Luxury Warm Brown Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 px-1.5 py-0.5 min-w-[18px] h-[18px] rounded-full
            bg-warm-brown text-white text-[10px] font-bold flex items-center justify-center
            border-2 border-white shadow-sm animate-pulse">
            {displayBadge}
          </span>
        )}
      </button>

      {/* Popover Dropdown Drawer */}
      {isOpen && (
        <div className="absolute end-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-slide-up flex flex-col max-h-[480px]">
          {/* Popover Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200/80 bg-gray-50/90">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                {t('notifications.title', 'Notifications')}
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warm-brown/10 text-warm-brown border border-warm-brown/20">
                  {t('notifications.unread_count', { count: unreadCount, defaultValue: `${unreadCount} unread` })}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="text-xs text-warm-brown hover:text-warm-brown/80 transition-colors font-semibold hover:underline"
              >
                {t('notifications.mark_all_read', 'Mark all read')}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-gray-100">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                <div className="inline-block w-5 h-5 border-2 border-warm-brown border-t-transparent rounded-full animate-spin mb-2" />
                <p>{t('table.loading', 'Loading...')}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center text-xs text-gray-500">
                <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
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
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                      isUnread
                        ? 'bg-warm-brown/[0.04] border-s-2 border-warm-brown hover:bg-warm-brown/[0.08]'
                        : 'bg-white hover:bg-gray-50/90'
                    }`}
                  >
                    {/* Unread indicator dot */}
                    <div className="mt-1 flex-shrink-0">
                      {isUnread ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-warm-brown shadow-sm block" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-gray-300 block" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs truncate ${isUnread ? 'font-bold text-gray-950' : 'font-medium text-gray-700'}`}>
                          {item.title || 'Notification'}
                        </p>
                        <ReferenceTypeBadge type={item.referenceType} />
                      </div>

                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      <span className="text-[10px] text-gray-400 font-medium block">
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
