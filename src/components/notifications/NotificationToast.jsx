import { resolveNotificationContext } from '@/api/notificationApi'
import { setNotificationToastCallback } from '@/services/websocketService'
import useAuthStore from '@/store/authStore'
import { getNotificationRoute } from '@/utils/NotificationNavigator'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

const TOAST_DURATION_MS = 6000

/**
 * NotificationToast — Luxury top-banner push notification toast with swipe gestures,
 * high-contrast visual clarity, and multi-notification swapping queue.
 */
export default function NotificationToast() {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'
  const { role } = useAuthStore()
  const navigate = useNavigate()

  const [toasts, setToasts] = useState([])
  const [progress, setProgress] = useState(100)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 })

  const currentToast = toasts[0] || null

  // Register real-time incoming notification callback from WebSocket
  useEffect(() => {
    setNotificationToastCallback((payload) => {
      setToasts((prev) => [
        ...prev,
        {
          ...payload,
          queueId: `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        },
      ])
    })

    return () => {
      setNotificationToastCallback(null)
    }
  }, [])

  // Dismiss currently active toast and reveal next in queue
  const dismissCurrent = useCallback(() => {
    setDragOffset({ x: 0, y: 0 })
    setIsDragging(false)
    setToasts((prev) => prev.slice(1))
    setProgress(100)
  }, [])

  // Auto-dismiss countdown timer
  useEffect(() => {
    if (!currentToast) return

    setProgress(100)
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remainingPct = Math.max(0, 100 - (elapsed / TOAST_DURATION_MS) * 100)
      setProgress(remainingPct)

      if (elapsed >= TOAST_DURATION_MS) {
        clearInterval(interval)
        dismissCurrent()
      }
    }, 50)

    return () => clearInterval(interval)
  }, [currentToast?.queueId, dismissCurrent])

  if (!currentToast) return null

  // Handle toast click navigation
  const handleToastClick = async (e) => {
    // If user dragged more than 10px, treat as drag rather than tap
    if (Math.abs(dragOffset.x) > 10 || Math.abs(dragOffset.y) > 10) {
      return
    }

    const toast = currentToast
    const refType = (toast.referenceType || '').toUpperCase()
    const refId = toast.referenceId
    const currentRole = (role || 'ADMIN').toUpperCase()

    dismissCurrent()

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
        console.warn('Failed to resolve toast notification context:', err)
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
        console.warn('Failed to resolve toast notification context:', err)
      }
    }

    const route = getNotificationRoute(refType, refId, currentRole)
    if (route) {
      navigate(route)
    }
  }

  // Touch Swipe Handlers (Swipe Up or Horizontal to Dismiss/Swap)
  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }
    setIsDragging(true)
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return
    const touch = e.touches[0]
    const dx = touch.clientX - touchStartRef.current.x
    const dy = touch.clientY - touchStartRef.current.y

    // Allow upward drag freely; damp downward drag since it's at top
    const clampedY = dy < 0 ? dy : dy * 0.3
    setDragOffset({ x: dx, y: clampedY })
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    // If swiped UP by > 35px or swiped HORIZONTALLY by > 65px: Dismiss / Swap
    if (dragOffset.y < -35 || Math.abs(dragOffset.x) > 65) {
      dismissCurrent()
    } else {
      setDragOffset({ x: 0, y: 0 })
    }
  }

  const remainingCount = toasts.length

  return (
    <div className="fixed top-[max(0.75rem,env(safe-area-inset-top,0px))] inset-x-3 sm:inset-x-auto sm:top-5 sm:end-5 sm:w-[420px] max-w-lg mx-auto z-50 pointer-events-none select-none">
      <div
        onClick={handleToastClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
          opacity: isDragging ? Math.max(0.2, 1 - (Math.abs(dragOffset.y) + Math.abs(dragOffset.x)) / 140) : 1,
          transition: isDragging ? 'none' : 'transform 0.25s ease-out, opacity 0.25s ease-out',
        }}
        className="pointer-events-auto relative bg-white/98 backdrop-blur-xl border-2 border-[#7D583F]/35 hover:border-[#7D583F]/70 p-4 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.18)] cursor-pointer active:scale-[0.99] transition-all group overflow-hidden"
      >
        {/* Top Swipe Indicator Pill */}
        <div className="w-10 h-1 bg-gray-300/80 rounded-full mx-auto -mt-1 mb-2.5 opacity-60 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-start gap-3.5">
          {/* Bell Icon with Ambient Glow */}
          <div className="relative shrink-0 mt-0.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7D583F] to-[#5A3D2B] text-white flex items-center justify-center shadow-md shadow-[#7D583F]/30">
              <svg className="w-5 h-5 animate-bounce" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            </div>
            <span className="absolute -top-1 -end-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border-2 border-white" />
            </span>
          </div>

          {/* Content Body */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-950 truncate leading-snug">
                {currentToast.title || t('notifications.new_notification', { defaultValue: 'New Notification' })}
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                {remainingCount > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      dismissCurrent()
                    }}
                    title={isRtl ? 'التالي' : 'Next'}
                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#7D583F]/15 text-[#7D583F] hover:bg-[#7D583F] hover:text-white px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                  >
                    <span>1/{remainingCount}</span>
                    <span className="text-[11px] rtl:rotate-180">›</span>
                  </button>
                )}
                <span className="text-[10px] text-[#7D583F] font-bold bg-[#F4EDE4] border border-[#D9C7B8]/70 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {isRtl ? 'الآن' : 'NOW'}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-700 font-light line-clamp-2 mt-1 leading-relaxed">
              {currentToast.message || currentToast.body}
            </p>

            {/* Bottom Interactive Hints */}
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100 text-[10px] text-gray-400">
              <span className="flex items-center gap-1">
                <span>{isRtl ? '👆 اسحب للأعلى للإغلاق' : '👆 Swipe up to dismiss'}</span>
              </span>
              <span className="font-semibold text-[#7D583F] flex items-center gap-1 group-hover:underline">
                <span>{isRtl ? 'عرض التفاصيل' : 'View details'}</span>
                <span className="rtl:rotate-180">→</span>
              </span>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              dismissCurrent()
            }}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors flex items-center justify-center shrink-0 -mt-1 -me-1 cursor-pointer"
            title={isRtl ? 'إغلاق' : 'Dismiss'}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar Timer (Remaining duration) */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#7D583F] to-amber-600 transition-all ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
