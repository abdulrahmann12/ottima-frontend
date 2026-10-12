import { useState, useEffect, useRef, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { getTicketById, addTicketMessage, updateTicketStatus } from '@/api/internalTicketApi'
import useAuthStore from '@/store/authStore'
import Modal from '@/components/admin/Modal'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/icons/Globe'
import { isPdfDocument } from '@/utils/imageUtils'
import DocumentViewerModal from '@/components/ui/DocumentViewerModal'

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

export default function TicketChatModal({
  isOpen,
  onClose,
  ticketId,
  initialTicket = null,
  onTicketUpdated,
}) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const { user } = useAuthStore()
  const currentUserId = user?.userId ?? user?.id

  const [ticket, setTicket] = useState(initialTicket)
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [error, setError] = useState(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState([])
  const [activeDoc, setActiveDoc] = useState(null)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }

  const fetchTicketDetails = async () => {
    if (!ticketId) return
    setLoading(true)
    setError(null)
    try {
      const res = await getTicketById(ticketId)
      const data = res.data?.data || res.data
      setTicket(data)
      setMessages(data.chatMessages || [])
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || (isAr ? 'فشل تحميل بيانات التذكرة' : 'Failed to load ticket details'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && ticketId) {
      setPendingAttachments([])
      fetchTicketDetails()
    }
  }, [isOpen, ticketId])

  useEffect(() => {
    if (!loading) {
      scrollToBottom(false)
    }
  }, [loading, messages.length])

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
      setError(isAr ? 'فشل رفع الملف' : 'Failed to upload attachment')
    } finally {
      setUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSendMessage = async (text, onSuccess) => {
    const trimmed = (text || '').trim()
    if ((!trimmed && pendingAttachments.length === 0) || sending) return

    setSending(true)
    setError(null)
    try {
      const payload = {
        message: trimmed,
        fileUrls: pendingAttachments,
      }
      const res = await addTicketMessage(ticketId, payload)
      const updatedTicket = res.data?.data || res.data
      setTicket(updatedTicket)
      setMessages(updatedTicket.chatMessages || [])
      setPendingAttachments([])
      if (onTicketUpdated) onTicketUpdated(updatedTicket)
      if (onSuccess) onSuccess()
      setTimeout(() => scrollToBottom(true), 50)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || (isAr ? 'فشل إرسال الرسالة' : 'Failed to send message'))
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    if (!ticketId || updatingStatus) return
    setUpdatingStatus(true)
    setError(null)
    try {
      const res = await updateTicketStatus(ticketId, newStatus)
      const updated = res.data?.data || res.data
      setTicket((prev) => ({ ...prev, status: newStatus }))
      if (onTicketUpdated) onTicketUpdated(updated)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || (isAr ? 'فشل تغيير الحالة' : 'Failed to update status'))
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getStatusBadgeStyle = (st) => {
    switch (st) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'OPEN':
        return 'bg-amber-100 text-amber-800 border-amber-300'
      case 'RESOLVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300'
      case 'CLOSED':
        return 'bg-slate-100 text-slate-700 border-slate-300'
      default:
        return 'bg-warm-sand/50 text-warm-brown border-warm-sand'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        ticket
          ? `🎫 ${ticket.title} (#${ticket.ticketId?.substring(0, 8)})`
          : (isAr ? 'محادثة التذكرة' : 'Ticket Discussion')
      }
      size="xl"
    >
      <div className="flex flex-col h-[78vh] max-h-[760px] -mx-1">
        {/* ── Top Context Header ───────────────────────────────── */}
        {ticket && (
          <div className="p-3.5 bg-gradient-to-r from-warm-sand/30 to-[#FAF8F5] border border-warm-sand/70 rounded-2xl mb-3 shrink-0 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeStyle(ticket.status)}`}>
                  {ticket.status}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-warm-brown/10 text-warm-brown border border-warm-brown/20 uppercase">
                  {ticket.ticketType || 'INSTRUCTION'}
                </span>
                {ticket.amount != null && (
                  <span className="text-xs font-extrabold text-emerald-700 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                    💰 {Number(ticket.amount).toLocaleString()} EGP
                  </span>
                )}
              </div>

              {/* Status Switcher Chips */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
                  {isAr ? 'تغيير الحالة:' : 'Status:'}
                </span>
                {['NEW', 'OPEN', 'RESOLVED', 'CLOSED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    disabled={updatingStatus || ticket.status === st}
                    onClick={() => handleStatusChange(st)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg font-bold transition-all cursor-pointer ${
                      ticket.status === st
                        ? 'bg-warm-brown text-white shadow-xs scale-102'
                        : 'bg-white hover:bg-warm-sand/50 text-slate-700 border border-warm-sand/80 shadow-2xs'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            {ticket.description && (
              <p className="text-xs text-slate-600 line-clamp-2 mt-2 font-medium">
                {ticket.description}
              </p>
            )}

            {/* Initial attachments on ticket */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-warm-sand/50">
                <span className="text-[11px] font-bold text-slate-500">
                  📎 {isAr ? 'مرفقات التذكرة:' : 'Ticket Files:'}
                </span>
                {ticket.attachments.map((att, idx) => {
                  const url = typeof att === 'string' ? att : att.fileUrl || att.url
                  const isPdf = isPdfDocument(url)
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveDoc({ url, name: isPdf ? `Attachment ${idx + 1}.pdf` : `Attachment ${idx + 1}` })}
                      className="px-2 py-1 rounded-lg text-[11px] bg-white border border-warm-sand/80 hover:border-warm-brown text-warm-brown font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <span>{isPdf ? '📄' : '🖼️'}</span>
                      <span>#{idx + 1}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <Alert message={error} variant="error" onClose={() => setError(null)} />

        {/* ── Message Thread ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3.5 scrollbar-thin bg-white rounded-2xl border border-warm-sand/60 p-3 shadow-inner">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <Spinner className="w-6 h-6 text-warm-brown animate-spin" />
              <p className="text-xs text-slate-400 font-medium">
                {isAr ? 'جاري تحميل محادثة التذكرة...' : 'Loading ticket chat...'}
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-center">
              <span className="text-3xl mb-2">💬</span>
              <p className="text-xs font-bold text-slate-700">
                {isAr ? 'لا توجد رسائل بعد في هذه التذكرة' : 'No messages in this ticket thread'}
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                {isAr ? 'ابدأ النقاش التفاعلي مع المسؤولين عن هذا الطلب بالأسفل' : 'Start the discussion between admin and engineer below'}
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = String(msg.senderId) === String(currentUserId)
              return (
                <TicketChatMessageItem
                  key={msg.messageId || index}
                  msg={msg}
                  isMe={isMe}
                  isAr={isAr}
                  onOpenDoc={setActiveDoc}
                />
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Pending Attachments ──────────────────────────────── */}
        {pendingAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 py-2 bg-warm-sand/20 rounded-xl border border-warm-sand mt-2">
            <span className="text-xs font-bold text-slate-600 self-center">
              📎 {isAr ? 'جاهز للإرسال:' : 'Ready:'}
            </span>
            {pendingAttachments.map((url, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-warm-sand text-xs font-bold text-warm-brown shadow-2xs"
              >
                File #{idx + 1}
                <button
                  type="button"
                  onClick={() => setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-red-500 hover:text-red-700 ml-1 font-bold text-sm cursor-pointer"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}

        {/* ── Input Bar ────────────────────────────────────────── */}
        <TicketChatInputBar
          onSendMessage={handleSendMessage}
          uploadingFile={uploadingFile}
          sending={sending}
          isAr={isAr}
          hasPendingAttachments={pendingAttachments.length > 0}
          onUploadClick={() => fileInputRef.current?.click()}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          multiple
          className="hidden"
          accept="image/*,application/pdf"
        />
      </div>

      {activeDoc && (
        <DocumentViewerModal
          isOpen={!!activeDoc}
          onClose={() => setActiveDoc(null)}
          url={activeDoc.url}
          title={activeDoc.name}
        />
      )}
    </Modal>
  )
}

const TicketChatMessageItem = memo(function TicketChatMessageItem({
  msg,
  isMe,
  isAr,
  onOpenDoc,
}) {
  const files = msg.fileUrls || []

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
      <div className="flex items-center gap-1.5 mb-1 px-1">
        <span className="text-[11px] font-extrabold text-slate-700">
          {msg.senderName || (isMe ? (isAr ? 'أنت' : 'You') : 'User')}
        </span>
      </div>

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed font-medium ${
          isMe
            ? 'bg-gradient-to-br from-[#8C6246] to-[#704830] text-white rounded-tr-xs'
            : 'bg-[#FAF8F5] border border-warm-sand/80 text-slate-800 rounded-tl-xs'
        }`}
      >
        {msg.message && <p className="whitespace-pre-wrap break-words">{msg.message}</p>}

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 pt-1.5 border-t border-black/10">
            {files.map((fileUrl, fIdx) => {
              const isPdf = isPdfDocument(fileUrl)
              return (
                <button
                  key={fIdx}
                  type="button"
                  onClick={() => onOpenDoc({ url: fileUrl, name: isPdf ? `File ${fIdx + 1}.pdf` : `File ${fIdx + 1}` })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                    isMe
                      ? 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
                      : 'bg-warm-sand/50 text-warm-brown hover:bg-warm-sand border border-warm-sand'
                  }`}
                >
                  <span>{isPdf ? '📄' : '🖼️'}</span>
                  <span>{isPdf ? 'PDF' : (isAr ? 'صورة' : 'Img')} #{fIdx + 1}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
})

const TicketChatInputBar = memo(function TicketChatInputBar({
  onSendMessage,
  uploadingFile,
  sending,
  isAr,
  hasPendingAttachments,
  onUploadClick,
}) {
  const [inputText, setInputText] = useState('')
  const textareaRef = useRef(null)

  const handleSubmit = (e) => {
    e?.preventDefault()
    const trimmed = inputText.trim()
    if ((!trimmed && !hasPendingAttachments) || sending) return
    onSendMessage(trimmed, () => {
      setInputText('')
      textareaRef.current?.focus()
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2.5 pt-2 border-t border-warm-sand/60 flex items-center gap-2 shrink-0">
      <button
        type="button"
        disabled={uploadingFile || sending}
        onClick={onUploadClick}
        className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-warm-brown/10 text-gray-500 hover:text-warm-brown border border-gray-200 hover:border-warm-brown/30 transition-all cursor-pointer shadow-2xs active:scale-95 group"
        title={isAr ? 'إرفاق ملف' : 'Attach file'}
      >
        {uploadingFile ? (
          <Spinner className="w-4 h-4 animate-spin text-warm-brown" />
        ) : (
          <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.371L8.558 18.313a1.5 1.5 0 0 1-2.122-2.122l9.818-9.818" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Type your message...'}
          disabled={sending}
          className="w-full block min-h-[40px] sm:min-h-[44px] max-h-28 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-white focus:bg-white text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-warm-brown/25 focus:border-warm-brown resize-none transition-all shadow-2xs scrollbar-none"
        />
      </div>

      <button
        type="submit"
        disabled={(!inputText.trim() && !hasPendingAttachments) || sending}
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
  )
})
