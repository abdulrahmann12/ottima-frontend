import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { getProjectChatMessages, sendProjectChatMessage } from '@/api/projectChatApi'
import { subscribeToTopic } from '@/services/websocketService'
import useAuthStore from '@/store/authStore'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/icons/Globe'
import { isPdfDocument, optimizeCloudinaryUrl } from '@/utils/imageUtils'
import DocumentViewerModal from '@/components/ui/DocumentViewerModal'
import DailyUpdateDetailsModal from '@/components/daily-updates/DailyUpdateDetailsModal'

const CLOUDINARY_ENDPOINT = 'https://api.cloudinary.com/v1_1/djhbgtqbg/image/upload'
const CLOUDINARY_UPLOAD_PRESET = 'ottima_daily_updates'

function formatTime(isoStr, lang = 'en') {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    return d.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return isoStr
  }
}

function formatDateLabel(isoStr, lang = 'en') {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) {
      return lang === 'ar' ? 'اليوم' : 'Today'
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return lang === 'ar' ? 'أمس' : 'Yesterday'
    }
    return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    })
  } catch {
    return isoStr
  }
}

function getFileNameFromUrl(url, fallback = 'Document.pdf') {
  if (!url || typeof url !== 'string') return fallback
  try {
    const raw = url.split('?')[0]
    const parts = raw.split('/')
    const last = parts[parts.length - 1]
    if (last && last.includes('.')) {
      const decoded = decodeURIComponent(last)
      return decoded.length > 35 ? decoded.substring(0, 32) + '...' : decoded
    }
  } catch {
    // fallback
  }
  return fallback
}

function ChatAttachmentsView({ attachments, isMe, isAr, onOpenDoc }) {
  if (!attachments || attachments.length === 0) return null

  const pdfs = attachments.filter((url) => isPdfDocument(url))
  const images = attachments.filter((url) => !isPdfDocument(url))

  return (
    <div className="space-y-2 mt-1">
      {/* Images Grid */}
      {images.length > 0 && (
        <div className={`grid gap-2 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {images.map((url, idx) => (
            <div
              key={idx}
              onClick={() => onOpenDoc({ url, name: isAr ? `صورة ${idx + 1}` : `Image ${idx + 1}` })}
              className="relative group/img rounded-xl overflow-hidden cursor-pointer border border-black/10 shadow-2xs bg-black/5 aspect-auto"
            >
              <img
                src={optimizeCloudinaryUrl(url, { width: 800, quality: 'auto' })}
                alt={`Image ${idx + 1}`}
                loading="lazy"
                className="w-full max-h-72 object-cover rounded-xl group-hover/img:scale-[1.02] transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold backdrop-blur-[1px]">
                <span>🔍</span>
                <span>{isAr ? 'عرض الصورة' : 'View Image'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDFs List */}
      {pdfs.length > 0 && (
        <div className="space-y-1.5">
          {pdfs.map((url, idx) => {
            const fileName = getFileNameFromUrl(url, `Document_${idx + 1}.pdf`)
            return (
              <div
                key={idx}
                onClick={() => onOpenDoc({ url, name: fileName })}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer group/doc shadow-2xs ${
                  isMe
                    ? 'bg-black/20 hover:bg-black/30 border-white/20 text-white'
                    : 'bg-warm-sand/30 hover:bg-warm-sand/50 border-warm-sand/80 text-slate-800'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 text-red-600 flex items-center justify-center text-lg shrink-0 font-bold group-hover/doc:scale-105 transition-transform">
                  📄
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate tracking-tight">{fileName}</p>
                  <p className={`text-[10px] mt-0.5 ${isMe ? 'text-white/75' : 'text-slate-500'} flex items-center gap-1.5`}>
                    <span className="font-extrabold text-red-500">PDF</span>
                    <span>•</span>
                    <span>{isAr ? 'اضغط للمعاينة' : 'Click to preview'}</span>
                  </p>
                </div>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 transition-colors ${
                    isMe
                      ? 'bg-white/20 group-hover/doc:bg-white/30 text-white'
                      : 'bg-white group-hover/doc:bg-warm-sand/60 text-slate-700 shadow-2xs'
                  }`}
                  title={isAr ? 'معاينة' : 'Preview'}
                >
                  👁️
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const ChatMessageItem = memo(function ChatMessageItem({
  item,
  isMe,
  isAr,
  onOpenDoc,
  onSelectDailyUpdate,
}) {
  if (item.type === 'DATE_DIVIDER') {
    return (
      <div className="flex items-center justify-center my-3">
        <span className="px-3.5 py-1 rounded-full text-[11px] font-bold text-slate-600 bg-white/90 border border-[#E5DACF] shadow-2xs">
          {item.label}
        </span>
      </div>
    )
  }

  const msg = item.data
  const isForwarded = Boolean(msg.forwardedFromClient)
  const attachmentsList = msg.attachments || []

  return (
    <div
      className={`flex flex-col ${isMe && !isForwarded ? 'items-end' : 'items-start'} transition-all`}
    >
      {/* Sender info */}
      <div className="flex items-center gap-1.5 mb-1 px-1.5 text-[11px]">
        <span className="font-extrabold text-slate-700">
          {msg.senderName || (isMe ? (isAr ? 'أنت' : 'You') : 'Team Member')}
        </span>
      </div>

      {/* Forwarded Client Comment Message Style */}
      {isForwarded ? (
        <div className="max-w-[92%] sm:max-w-[82%] rounded-2xl p-4 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white border border-amber-300/90 shadow-xs text-xs text-slate-800 leading-relaxed transition-all">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-amber-200/80">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold">
              <span className="text-base">📢</span>
              <span>{isAr ? 'ملاحظة عميل محولة من الإدارة' : 'Client Comment Forwarded by Admin'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {msg.clientName && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-200">
                  👤 {msg.clientName}
                </span>
              )}
              {msg.dailyUpdateId && (
                <button
                  type="button"
                  onClick={() => onSelectDailyUpdate(msg.dailyUpdateId)}
                  className="px-2 py-0.5 rounded-full bg-amber-200/80 hover:bg-amber-300 text-amber-950 text-[10px] font-bold border border-amber-300 transition-all cursor-pointer flex items-center gap-1 shadow-2xs hover:shadow-xs"
                  title={isAr ? 'عرض تفاصيل التحديث اليومي في نافذة' : 'View daily update details in dialog'}
                >
                  <span>👁️</span>
                  <span>{isAr ? 'عرض التحديث' : 'View Update'}</span>
                </button>
              )}
            </div>
          </div>

          {msg.dailyUpdateTitle && (
            <div className="mb-2">
              {msg.dailyUpdateId ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectDailyUpdate(msg.dailyUpdateId)
                  }}
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100/90 hover:bg-amber-200 text-amber-950 text-[11px] font-semibold border border-amber-300 hover:border-amber-400 transition-all cursor-pointer shadow-2xs hover:shadow-xs text-start rtl:text-right"
                  title={isAr ? 'انقر لعرض تفاصيل التحديث اليومي في نافذة' : 'Click to view daily update details in dialog'}
                >
                  <span className="text-xs">🏷️</span>
                  <span className="text-amber-800 font-medium">
                    {isAr ? 'بشأن التحديث اليومي:' : 'Regarding Daily Update:'}
                  </span>
                  <span className="font-extrabold underline decoration-amber-500/70 group-hover:decoration-amber-950">
                    {msg.dailyUpdateTitle}
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/90 text-amber-900 border border-amber-300 text-[10px] font-bold group-hover:scale-105 transition-transform ml-1 rtl:mr-1 rtl:ml-0 shadow-2xs">
                    👁️ {isAr ? 'عرض' : 'View'}
                  </span>
                </button>
              ) : (
                <p className="text-[11px] font-semibold text-amber-800 mb-1">
                  🏷️ {isAr ? 'بشأن التحديث اليومي:' : 'Regarding Daily Update:'} {msg.dailyUpdateTitle}
                </p>
              )}
            </div>
          )}

          {/* Quotation text */}
          <div className="bg-white/95 p-3 rounded-xl border border-amber-200/70 mb-2.5 text-slate-800 font-medium whitespace-pre-wrap shadow-2xs italic relative">
            &ldquo;{msg.message}&rdquo;
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-amber-800/80 pt-1.5 border-t border-amber-200/50">
            <div className="flex items-center gap-2">
              <span>✓ {isAr ? 'تم التحويل للمتابعة' : 'Forwarded for engineer action'}</span>
              {msg.dailyUpdateId && (
                <button
                  type="button"
                  onClick={() => onSelectDailyUpdate(msg.dailyUpdateId)}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 hover:border-amber-400 font-bold text-[10px] shadow-2xs transition-all cursor-pointer"
                  title={isAr ? 'عرض تفاصيل التحديث اليومي' : 'View daily update details'}
                >
                  <span>👁️</span>
                  <span>{isAr ? 'تفاصيل التحديث' : 'Update Details'}</span>
                </button>
              )}
            </div>
            <span>{formatTime(msg.createdAt, isAr ? 'ar' : 'en')}</span>
          </div>
        </div>
      ) : (
        /* Standard Chat Bubble */
        <div
          className={`relative max-w-[88%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-2xs transition-all ${
            isMe
              ? 'bg-gradient-to-br from-[#8C6246] to-[#704830] text-white rounded-tr-xs'
              : 'bg-white border border-[#E5DACF] text-slate-800 rounded-tl-xs'
          }`}
        >
          {msg.message && (
            <p className="whitespace-pre-wrap break-words font-medium select-text mb-1.5">
              {msg.message}
            </p>
          )}

          {/* Enhanced Attachments preview */}
          {attachmentsList.length > 0 && (
            <div className={msg.message ? `pt-1.5 border-t ${isMe ? 'border-white/20' : 'border-[#E5DACF]'}` : ''}>
              <ChatAttachmentsView
                attachments={attachmentsList}
                isMe={isMe}
                isAr={isAr}
                onOpenDoc={onOpenDoc}
              />
            </div>
          )}

          {/* Timestamp tick inside bubble */}
          <div className={`flex items-center justify-end gap-1 mt-1.5 text-[9px] ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
            <span>{formatTime(msg.createdAt, isAr ? 'ar' : 'en')}</span>
            {isMe && <span>✓✓</span>}
          </div>
        </div>
      )}
    </div>
  )
})

const ChatInputBar = memo(function ChatInputBar({
  onSendMessage,
  uploadingFile,
  sending,
  pendingAttachments,
  setPendingAttachments,
  handleFileUpload,
  isAr,
}) {
  const [inputText, setInputText] = useState('')
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const trimmed = inputText.trim()
      if ((!trimmed && pendingAttachments.length === 0) || sending) return
      onSendMessage(trimmed)
      setInputText('')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = inputText.trim()
    if ((!trimmed && pendingAttachments.length === 0) || sending) return
    onSendMessage(trimmed)
    setInputText('')
  }

  return (
    <>
      {/* ── Pending Attachments Preview ───────────────────────── */}
      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 px-5 py-3 bg-[#F6F1EA] border-t border-[#E5DACF] shrink-0">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <span>📎</span>
            <span>{isAr ? 'المرفقات المحددة:' : 'Ready to send:'}</span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {pendingAttachments.map((url, idx) => {
              const isPdf = isPdfDocument(url)
              const fileName = getFileNameFromUrl(url, isPdf ? `Doc_${idx + 1}.pdf` : `Img_${idx + 1}`)
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-[#E5DACF] shadow-2xs text-xs font-bold text-slate-700 max-w-[200px]"
                >
                  <span className="text-sm shrink-0">{isPdf ? '📄' : '🖼️'}</span>
                  <span className="truncate">{fileName}</span>
                  <button
                    type="button"
                    onClick={() => setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))}
                    className="w-5 h-5 rounded-full bg-red-100 hover:bg-red-200 text-red-600 font-black text-xs flex items-center justify-center cursor-pointer transition-colors shrink-0"
                    title={isAr ? 'إزالة' : 'Remove'}
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Chat Input Bar ────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="p-3 sm:p-4 bg-white border-t border-gray-200 flex items-center gap-2 sm:gap-2.5 shrink-0 shadow-xs"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          multiple
          className="hidden"
          accept="image/*,application/pdf"
        />

        {/* Attachment trigger */}
        <button
          type="button"
          disabled={uploadingFile || sending}
          onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-warm-brown/10 text-gray-500 hover:text-warm-brown border border-gray-200 hover:border-warm-brown/30 transition-all cursor-pointer shadow-2xs active:scale-95 group"
          title={isAr ? 'إرفاق صور أو ملفات PDF' : 'Attach images or PDFs'}
        >
          {uploadingFile ? (
            <Spinner className="w-4 h-4 animate-spin text-warm-brown" />
          ) : (
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.371L8.558 18.313a1.5 1.5 0 0 1-2.122-2.122l9.818-9.818" />
            </svg>
          )}
        </button>

        {/* Textarea */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Type your message...'}
            disabled={sending}
            className="w-full block min-h-[40px] sm:min-h-[44px] max-h-32 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-white focus:bg-white text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-warm-brown/25 focus:border-warm-brown resize-none transition-all shadow-2xs scrollbar-none"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!inputText.trim() && pendingAttachments.length === 0) || sending}
          className="w-auto shrink-0 h-10 sm:h-11 px-4 sm:px-5 flex items-center justify-center gap-2 rounded-xl bg-warm-brown hover:bg-[#684730] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          title={isAr ? 'إرسال' : 'Send'}
        >
          {sending ? (
            <Spinner className="w-4 h-4 animate-spin text-white" />
          ) : (
            <>
              <span>{isAr ? 'إرسال' : 'Send'}</span>
              <svg className="w-4 h-4 rtl:-scale-x-100" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            </>
          )}
        </button>
      </form>
    </>
  )
})

export default function ProjectGlobalChat({
  projectId,
  project = null,
}) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const { user } = useAuthStore()
  const currentUserId = user?.userId ?? user?.id

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const [sending, setSending] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState([])
  const [activeDoc, setActiveDoc] = useState(null)
  const [selectedDailyUpdateId, setSelectedDailyUpdateId] = useState(null)
  const [showScrollBottom, setShowScrollBottom] = useState(false)

  const chatContainerRef = useRef(null)
  const chatBottomRef = useRef(null)

  const scrollToBottom = (smooth = true) => {
    chatBottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }

  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
    const isUp = scrollHeight - scrollTop - clientHeight > 180
    setShowScrollBottom((prev) => (prev !== isUp ? isUp : prev))
  }, [])

  const handleOpenDoc = useCallback((doc) => setActiveDoc(doc), [])
  const handleSelectDailyUpdate = useCallback((id) => setSelectedDailyUpdateId(id), [])

  const fetchMessages = useCallback(async (silent = false) => {
    if (!projectId) return
    if (!silent) setLoading(true)
    setError(null)
    try {
      const res = await getProjectChatMessages(projectId, 0, 200)
      const content = res.data?.data?.content || res.data?.content || res.data?.data || []
      const sorted = [...content].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
      
      setMessages((prev) => {
        if (silent && prev.length === sorted.length && prev.length > 0) {
          const prevLast = prev[prev.length - 1]
          const newLast = sorted[sorted.length - 1]
          if ((prevLast.messageId || prevLast.id) === (newLast.messageId || newLast.id)) {
            return prev
          }
        }
        return sorted
      })
    } catch (err) {
      if (!silent) {
        setError(err?.response?.data?.message || err?.message || (isAr ? 'فشل تحميل الرسائل' : 'Failed to load messages'))
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [projectId, isAr])

  // Initial load
  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Real-time STOMP WebSocket listener for instant incoming chat messages
  useEffect(() => {
    if (!projectId) return

    const destination = `/topic/projects/${projectId}/chat`
    const unsubscribe = subscribeToTopic(destination, (newMsg) => {
      if (!newMsg) return
      setMessages((prev) => {
        const incomingId = newMsg.messageId || newMsg.id
        if (incomingId && prev.some((m) => (m.messageId || m.id) === incomingId)) {
          return prev
        }
        return [...prev, newMsg]
      })
      setTimeout(() => scrollToBottom(true), 60)
    })

    return () => {
      unsubscribe()
    }
  }, [projectId])

  // Gentle silent sync (every 30 seconds or on tab focus) as fallback
  useEffect(() => {
    if (!projectId) return
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchMessages(true)
      }
    }, 30000)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchMessages(true)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleVisibility)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleVisibility)
    }
  }, [projectId, fetchMessages])

  useEffect(() => {
    if (!loading) {
      scrollToBottom(false)
    }
  }, [loading])

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploadingFile(true)
    setError(null)
    try {
      const uploadedUrls = []
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

        const res = await fetch(CLOUDINARY_ENDPOINT, {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (data.secure_url) {
          uploadedUrls.push(data.secure_url)
        }
      }
      setPendingAttachments((prev) => [...prev, ...uploadedUrls])
    } catch (err) {
      setError(isAr ? 'فشل رفع المرفقات، يرجى المحاولة مرة أخرى' : 'Failed to upload attachments')
    } finally {
      setUploadingFile(false)
    }
  };

  const handleSendMessage = useCallback(async (trimmedText) => {
    if ((!trimmedText && pendingAttachments.length === 0) || sending) return

    setSending(true)
    setError(null)
    try {
      const payload = {
        message: trimmedText ? trimmedText : null,
        attachments: pendingAttachments,
      }
      const res = await sendProjectChatMessage(projectId, payload)
      const newMsg = res.data?.data || res.data
      
      const msgToAppend = {
        ...newMsg,
        message: newMsg.message || (trimmedText ? trimmedText : null),
        attachments: newMsg.attachments || pendingAttachments,
        senderId: newMsg.senderId ?? currentUserId,
        senderName: newMsg.senderName ?? user?.fullNameEn ?? user?.username ?? 'Me',
        senderRole: newMsg.senderRole ?? user?.role ?? 'USER',
        createdAt: newMsg.createdAt || new Date().toISOString(),
      }

      setMessages((prev) => {
        const id = msgToAppend.messageId || msgToAppend.id
        if (id && prev.some((m) => (m.messageId || m.id) === id)) {
          return prev
        }
        return [...prev, msgToAppend]
      })
      setPendingAttachments([])
      setTimeout(() => scrollToBottom(true), 60)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || (isAr ? 'فشل إرسال الرسالة' : 'Failed to send message'))
    } finally {
      setSending(false)
    }
  }, [projectId, pendingAttachments, sending, currentUserId, user, isAr])

  // Memoized Group messages by Date for clean chat dividers
  const groupedMessages = useMemo(() => {
    const list = []
    let lastDateStr = ''
    messages.forEach((msg, idx) => {
      const dateStr = formatDateLabel(msg.createdAt, isAr ? 'ar' : 'en')
      if (dateStr !== lastDateStr) {
        list.push({ type: 'DATE_DIVIDER', label: dateStr, key: `div-${dateStr}` })
        lastDateStr = dateStr
      }
      list.push({
        type: 'MESSAGE',
        data: msg,
        key: msg.messageId ? String(msg.messageId) : `msg-${msg.createdAt || idx}`,
      })
    })
    return list
  }, [messages, isAr])

  return (
    <div className="bg-[#FAF8F5] rounded-3xl border border-[#E5DACF] shadow-sm flex flex-col h-[740px] max-h-[85vh] overflow-hidden transition-all">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="px-5 py-3.5 bg-white border-b border-[#E5DACF] flex items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8C6246] to-[#6E4931] text-white flex items-center justify-center font-bold shadow-xs shrink-0 text-base">
            💬
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-medium text-slate-800 truncate">
                {isAr ? 'محادثة المشروع العامة' : 'Project Global Chat'}
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isAr ? 'مباشر' : 'Live'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-light truncate mt-0.5 flex items-center gap-1.5">
              <span>{isAr ? 'قناة التواصل المشتركة بين الإدارة والمهندسين' : 'Admin & Engineers collaboration channel'}</span>
              {project?.engineerName && (
                <>
                  <span>•</span>
                  <span className="text-warm-brown font-semibold">{project.engineerName}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden md:inline-block px-2.5 py-1 text-xs font-semibold rounded-xl bg-warm-sand/40 text-warm-brown border border-warm-sand/70">
            {messages.length} {isAr ? 'رسالة' : 'messages'}
          </span>
          <button
            type="button"
            disabled={refreshing || loading}
            onClick={() => fetchMessages(true)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-slate-600 hover:text-warm-brown hover:bg-warm-sand/40 border border-warm-sand/80 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title={isAr ? 'تحديث' : 'Refresh'}
          >
            {refreshing ? (
              <Spinner className="w-4 h-4 animate-spin text-warm-brown" />
            ) : (
              <span>🔄</span>
            )}
            <span className="hidden sm:inline">{isAr ? 'تحديث' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      <Alert message={error} variant="error" onClose={() => setError(null)} />

      {/* ── Chat Messages Canvas ──────────────────────────────── */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-3.5 scrollbar-thin relative"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2.5">
            <Spinner className="w-8 h-8 text-warm-brown animate-spin" />
            <p className="text-xs font-medium text-slate-500">
              {isAr ? 'جاري تحميل المحادثة...' : 'Loading conversation...'}
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-3xl bg-white border border-[#E5DACF] flex items-center justify-center text-3xl shadow-xs mb-3">
              💬
            </div>
            <h4 className="text-sm font-medium text-slate-800 mb-1">
              {isAr ? 'لا توجد رسائل بعد في هذه المحادثة' : 'No messages yet in this project chat'}
            </h4>
            <p className="text-xs text-slate-500 font-light max-w-sm leading-relaxed">
              {isAr
                ? 'ابدأ النقاش والتنسيق مع المهندسين أو أرسل ملاحظات وتحديثات المشروع هنا.'
                : 'Start the conversation with assigned engineers, share updates, or forward client feedback.'}
            </p>
          </div>
        ) : (
          groupedMessages.map((item) => (
            <ChatMessageItem
              key={item.key}
              item={item}
              isMe={item.type === 'MESSAGE' && String(item.data.senderId) === String(currentUserId)}
              isAr={isAr}
              onOpenDoc={handleOpenDoc}
              onSelectDailyUpdate={handleSelectDailyUpdate}
            />
          ))
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-24 right-8 p-2.5 rounded-full bg-warm-brown text-white shadow-lg hover:scale-105 transition-all cursor-pointer z-10"
          title={isAr ? 'النزول لآخر رسالة' : 'Scroll to bottom'}
        >
          ⬇️
        </button>
      )}

      {/* ── Chat Input Bar (Isolated State) ───────────────────── */}
      <ChatInputBar
        onSendMessage={handleSendMessage}
        uploadingFile={uploadingFile}
        sending={sending}
        pendingAttachments={pendingAttachments}
        setPendingAttachments={setPendingAttachments}
        handleFileUpload={handleFileUpload}
        isAr={isAr}
      />

      {/* Document Viewer Modal */}
      {activeDoc && (
        <DocumentViewerModal
          isOpen={Boolean(activeDoc)}
          onClose={() => setActiveDoc(null)}
          url={activeDoc.url}
          title={activeDoc.name}
        />
      )}

      {/* Daily Update Details Dialog */}
      <DailyUpdateDetailsModal
        isOpen={Boolean(selectedDailyUpdateId)}
        onClose={() => setSelectedDailyUpdateId(null)}
        dailyUpdateId={selectedDailyUpdateId}
      />
    </div>
  )
}
