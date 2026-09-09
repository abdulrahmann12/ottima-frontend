import { setNotificationToastCallback } from '@/services/websocketService'
import useAuthStore from '@/store/authStore'
import { getNotificationRoute } from '@/utils/NotificationNavigator'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

/**
 * NotificationToast — Floating real-time alert toast for incoming STOMP notifications
 */
export default function NotificationToast() {
  const { t } = useTranslation()
  const { role } = useAuthStore()
  const navigate = useNavigate()
  const [activeToast, setActiveToast] = useState(null)

  useEffect(() => {
    // Register toast callback for STOMP incoming messages
    setNotificationToastCallback((payload) => {
      setActiveToast(payload)
    })

    return () => {
      setNotificationToastCallback(null)
    }
  }, [])

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (!activeToast) return
    const timer = setTimeout(() => {
      setActiveToast(null)
    }, 5000)

    return () => clearTimeout(timer)
  }, [activeToast])

  if (!activeToast) return null

  const handleToastClick = () => {
    const route = getNotificationRoute(
      activeToast.referenceType,
      activeToast.referenceId,
      role
    )
    setActiveToast(null)
    navigate(route)
  }

  return (
    <div className="fixed bottom-5 end-5 z-50 max-w-sm w-full animate-slide-up">
      <div
        onClick={handleToastClick}
        className="glass-card border border-brand-500/40 p-4 rounded-2xl shadow-glow-indigo flex items-start gap-3 cursor-pointer hover:border-brand-400 transition-all group"
      >
        <div className="w-9 h-9 rounded-xl bg-brand-600/30 border border-brand-500/50 flex items-center justify-center text-brand-300 flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5 animate-bounce" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-white truncate">
              {activeToast.title || t('notifications.new_notification', 'New Notification')}
            </span>
            <span className="text-[10px] text-brand-400 font-mono">NOW</span>
          </div>
          <p className="text-xs text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
            {activeToast.message || activeToast.body}
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setActiveToast(null)
          }}
          className="text-slate-500 hover:text-slate-200 transition-colors p-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
