import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  getTicketsByProject,
  updateTicketStatus,
  deleteTicket,
} from '@/api/internalTicketApi'
import useAuthStore from '@/store/authStore'
import CreateTicketModal from './CreateTicketModal'
import EditTicketModal from './EditTicketModal'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/icons/Globe'
import { optimizeCloudinaryUrl, getPdfThumbnailUrl, isPdfDocument } from '@/utils/imageUtils'
import DocumentViewerModal from '@/components/ui/DocumentViewerModal'

const fmtAmount = (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const apiError = (err, fallback) => err?.response?.data?.message ?? err?.message ?? fallback

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

function formatDateGroup(isoStr, lang = 'en') {
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
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    })
  } catch {
    return isoStr
  }
}

export default function ProjectTicketsChat({
  projectId,
  project = null,
}) {
  const { t, i18n } = useTranslation()
  const { user } = useAuthStore()
  const currentUserId = user?.userId ?? user?.id

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Filters
  const [typeFilter, setTypeFilter]     = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery]   = useState('')

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [initialType, setInitialType]         = useState('INSTRUCTION')
  const [editModalOpen, setEditModalOpen]     = useState(false)
  const [editingTicket, setEditingTicket]     = useState(null)

  // Document / Image Viewer modal state
  const [activeDoc, setActiveDoc] = useState(null)

  // Action loading IDs
  const [actionLoadingId, setActionLoadingId] = useState(null)

  const [searchParams] = useSearchParams()
  const targetTicketId = searchParams.get('targetTicketId')
  const [highlightedTicketId, setHighlightedTicketId] = useState(targetTicketId)

  const chatBottomRef = useRef(null)

  const fetchTickets = useCallback(async (isSilent = false) => {
    if (!projectId) return
    if (!isSilent) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      const { data } = await getTicketsByProject(projectId, 0, 200)
      const list = data?.data?.content ?? data?.data ?? []
      setTickets(list)
    } catch (err) {
      setError(apiError(err, t('errors.generic', { defaultValue: 'Failed to load tickets.' })))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [projectId, t])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  // Sort tickets ascending (oldest -> newest) so newer messages appear at the bottom (WhatsApp style)
  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
  }, [tickets])

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return sortedTickets.filter((tk) => {
      if (typeFilter !== 'ALL' && tk.ticketType !== typeFilter) return false
      if (statusFilter !== 'ALL' && tk.status !== statusFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = tk.title?.toLowerCase().includes(q)
        const matchDesc  = tk.description?.toLowerCase().includes(q)
        const matchSender = (tk.senderNameEn || tk.senderNameAr || '').toLowerCase().includes(q)
        if (!matchTitle && !matchDesc && !matchSender) return false
      }
      return true
    })
  }, [sortedTickets, typeFilter, statusFilter, searchQuery])

  // Scroll to target ticket (if deep-linked) or to bottom on initial load / new message
  useEffect(() => {
    if (loading || filteredTickets.length === 0) return

    if (targetTicketId) {
      setHighlightedTicketId(targetTicketId)
      const scrollTimer = setTimeout(() => {
        const el = document.getElementById(`ticket-bubble-${targetTicketId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else {
          chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
      }, 150)

      const clearHighlightTimer = setTimeout(() => {
        setHighlightedTicketId(null)
      }, 4000)

      return () => {
        clearTimeout(scrollTimer)
        clearTimeout(clearHighlightTimer)
      }
    } else {
      const scrollTimer = setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
      return () => clearTimeout(scrollTimer)
    }
  }, [targetTicketId, filteredTickets.length, loading])

  // Group tickets by Date
  const groupedTickets = useMemo(() => {
    const groups = []
    let currentDate = null
    let currentList = []

    filteredTickets.forEach((tk) => {
      const dateKey = formatDateGroup(tk.createdAt, i18n.language)
      if (dateKey !== currentDate) {
        if (currentDate !== null) {
          groups.push({ date: currentDate, items: currentList })
        }
        currentDate = dateKey
        currentList = [tk]
      } else {
        currentList.push(tk)
      }
    })

    if (currentDate !== null) {
      groups.push({ date: currentDate, items: currentList })
    }

    return groups
  }, [filteredTickets, i18n.language])

  // ── Status Action (Approve / Reject) ─────────────────────────
  const handleStatusChange = async (ticketId, newStatus) => {
    setActionLoadingId(ticketId)
    setError(null)
    try {
      await updateTicketStatus(ticketId, newStatus)
      setSuccess(
        newStatus === 'APPROVED'
          ? t('tickets.approved_success', { defaultValue: 'Request approved successfully.' })
          : t('tickets.rejected_success', { defaultValue: 'Request rejected.' })
      )
      await fetchTickets(true)
    } catch (err) {
      setError(apiError(err, 'Failed to update request status.'))
    } finally {
      setActionLoadingId(null)
    }
  }

  // ── Delete Ticket ────────────────────────────────────────────
  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm(t('tickets.delete_confirm', { defaultValue: 'Are you sure you want to delete this pending request?' }))) {
      return
    }
    setActionLoadingId(ticketId)
    setError(null)
    try {
      await deleteTicket(ticketId)
      setSuccess(t('tickets.deleted_success', { defaultValue: 'Request deleted successfully.' }))
      await fetchTickets(true)
    } catch (err) {
      setError(apiError(err, 'Failed to delete request.'))
    } finally {
      setActionLoadingId(null)
    }
  }

  const openCreateModal = (type = 'INSTRUCTION') => {
    setInitialType(type)
    setCreateModalOpen(true)
  }

  const openEditModal = (ticket) => {
    setEditingTicket(ticket)
    setEditModalOpen(true)
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-135px)] md:h-[750px] max-h-[88vh] md:max-h-[82vh] rounded-2xl border border-[#D9C7B8] bg-cream overflow-hidden shadow-card animate-fade-in">
      
      {/* ── Top Bar: Header & Filters ─────────────────────── */}
      <div className="p-3 sm:p-4 bg-beige/60 border-b border-[#D9C7B8] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-warm-brown text-white flex items-center justify-center shadow-xs shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                {t('tickets.chat_title', { defaultValue: 'Internal Requests & Tickets Feed' })}
              </h2>
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-warm-brown/10 text-warm-brown text-[10px] sm:text-[11px] font-bold border border-warm-brown/20 shrink-0">
                {filteredTickets.length}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-gray-600 truncate">
              {t('tickets.chat_subtitle', { defaultValue: 'Direct Admin ↔ Engineer coordination channel' })}
            </p>
          </div>
        </div>

        {/* Filter selectors & actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full pb-0.5">
          {/* Type Filter */}
          <select
            className="input-base py-1 px-2 sm:py-1.5 sm:px-3 text-[11px] sm:text-xs w-auto bg-white border-gray-200 font-medium shrink-0"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">{t('tickets.all_types', { defaultValue: 'All Types' })}</option>
            <option value="EXPENSE">💰 {t('tickets.types.expense', { defaultValue: 'Expense' })}</option>
            <option value="INSTRUCTION">📝 {t('tickets.types.instruction', { defaultValue: 'Instruction' })}</option>
            <option value="MEASUREMENT">📐 {t('tickets.types.measurement', { defaultValue: 'Measurement' })}</option>
            <option value="SITE_REPORT">📋 {t('tickets.types.site_report', { defaultValue: 'Site Report' })}</option>
          </select>

          {/* Status Filter */}
          <select
            className="input-base py-1 px-2 sm:py-1.5 sm:px-3 text-[11px] sm:text-xs w-auto bg-white border-gray-200 font-medium shrink-0"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">{t('tickets.all_statuses', { defaultValue: 'All Statuses' })}</option>
            <option value="PENDING">⏳ {t('tickets.statuses.pending', { defaultValue: 'Pending' })}</option>
            <option value="APPROVED">✅ {t('tickets.statuses.approved', { defaultValue: 'Approved' })}</option>
            <option value="REJECTED">❌ {t('tickets.statuses.rejected', { defaultValue: 'Rejected' })}</option>
            <option value="VIEWED">👀 {t('tickets.statuses.viewed', { defaultValue: 'Viewed' })}</option>
          </select>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchTickets(true)}
            disabled={refreshing}
            className="p-1.5 sm:p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-black hover:bg-light-blue/40 transition-all shadow-xs shrink-0 cursor-pointer"
            title={t('common.refresh', { defaultValue: 'Refresh Feed' })}
          >
            <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>

          {/* New Request Button */}
          <Button
            type="button"
            className="w-auto py-1.5 px-3 text-[11px] sm:text-xs shadow-xs shrink-0"
            onClick={() => openCreateModal('INSTRUCTION')}
          >
            + {t('tickets.new_request', { defaultValue: 'New' })}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="px-4 pt-3"><Alert message={error} variant="error" onClose={() => setError(null)} /></div>}
      {success && <div className="px-4 pt-3"><Alert message={success} variant="success" onClose={() => setSuccess(null)} /></div>}

      {/* ── Chat Messages Scroll Area ─────────────────────── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6 space-y-6">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2">
            <Spinner className="w-8 h-8 text-warm-brown" />
            <p className="text-xs font-medium">{t('tickets.loading_chat', { defaultValue: 'Loading requests feed…' })}</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
            <div className="w-16 h-16 rounded-2xl bg-white border border-[#D9C7B8] flex items-center justify-center mb-3 text-warm-brown shadow-xs">
              <svg className="w-8 h-8 opacity-70" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">
              {t('tickets.empty_chat_title', { defaultValue: 'No Requests Found' })}
            </h3>
            <p className="text-xs text-gray-600 max-w-sm mb-4">
              {t('tickets.empty_chat_desc', { defaultValue: 'Start the conversation by creating an internal request or expense approval.' })}
            </p>
            <Button
              type="button"
              className="w-auto py-2 px-5 text-xs shadow-xs"
              onClick={() => openCreateModal('INSTRUCTION')}
            >
              + {t('tickets.create_first_request', { defaultValue: 'Create First Request' })}
            </Button>
          </div>
        ) : (
          groupedTickets.map((group, gIdx) => (
            <div key={gIdx} className="space-y-4">
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <span className="px-3.5 py-1 rounded-full bg-[#EADBCE]/80 border border-[#D9C7B8] text-[11px] font-bold text-gray-700 shadow-xs tracking-wide">
                  {group.date}
                </span>
              </div>

              {/* Messages in this date group */}
              {group.items.map((ticket) => {
                const isOutgoing = Number(ticket.senderId) === Number(currentUserId)
                const isReceiver = Number(ticket.receiverId) === Number(currentUserId)
                const isPending  = ticket.status === 'PENDING'
                const isActionLoading = actionLoadingId === ticket.ticketId

                return (
                  <div
                    key={ticket.ticketId}
                    id={`ticket-bubble-${ticket.ticketId}`}
                    className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} animate-slide-up scroll-mt-24`}
                  >
                    <div
                      className={`relative w-full max-w-[90%] sm:max-w-[75%] md:max-w-[65%] rounded-2xl p-4 shadow-sm transition-all duration-300
                        ${highlightedTicketId === String(ticket.ticketId) ? 'ring-4 ring-warm-brown ring-offset-2 scale-[1.01] shadow-lg animate-pulse' : ''}
                        ${isOutgoing
                          ? 'bg-white border border-[#D9C7B8] rounded-tr-xs'
                          : 'bg-[#FAF7F2] border border-[#E0D0C0] rounded-tl-xs'
                        }`}
                    >
                      {/* ── Incoming sender label ────────────────── */}
                      {!isOutgoing && (
                        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#E0D0C0]/60">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-warm-brown text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {(ticket.senderNameEn || ticket.senderNameAr || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-gray-900 truncate">
                              {i18n.language === 'ar' ? (ticket.senderNameAr || ticket.senderNameEn) : (ticket.senderNameEn || ticket.senderNameAr)}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200/80 text-gray-700 uppercase">
                              {ticket.senderRole}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <TicketTypeBadge type={ticket.ticketType} />
                            <TicketStatusBadge status={ticket.status} />
                          </div>
                        </div>
                      )}

                      {/* ── Outgoing top badges & action icons ──── */}
                      {isOutgoing && (
                        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-100">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <TicketTypeBadge type={ticket.ticketType} />
                            <TicketStatusBadge status={ticket.status} />
                          </div>

                          {/* Edit / Delete Icons for pending outgoing tickets */}
                          {isPending && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => openEditModal(ticket)}
                                disabled={isActionLoading}
                                className="p-1 rounded-lg text-gray-400 hover:text-warm-brown hover:bg-warm-brown/10 transition-colors"
                                title={t('common.edit', { defaultValue: 'Edit' })}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTicket(ticket.ticketId)}
                                disabled={isActionLoading}
                                className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title={t('common.delete', { defaultValue: 'Delete' })}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Title & Content ──────────────────────── */}
                      <h4 className="text-sm font-bold text-gray-900 leading-snug">
                        {ticket.title}
                      </h4>

                      {ticket.description && (
                        <p className="mt-1.5 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {ticket.description}
                        </p>
                      )}

                      {/* ── Expense Amount Highlight ─────────────── */}
                      {ticket.ticketType === 'EXPENSE' && ticket.amount != null && (
                        <div className="mt-2.5 px-3 py-2 rounded-xl bg-warm-brown/10 border border-warm-brown/25 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-warm-brown flex items-center gap-1">
                            <span>💰</span> {t('tickets.expense_amount', { defaultValue: 'Expense Amount:' })}
                          </span>
                          <span className="text-sm font-extrabold text-gray-950 font-mono tracking-tight">
                            {fmtAmount(ticket.amount)} <span className="text-xs font-semibold text-warm-brown">EGP</span>
                          </span>
                        </div>
                      )}

                      {/* ── Attachments ──────────────────────────── */}
                      {ticket.attachments && ticket.attachments.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-gray-100/80 space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            {t('tickets.attachments', { defaultValue: 'Attachments' })} ({ticket.attachments.length})
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {ticket.attachments.map((att, attIdx) => {
                              const isPdf = isPdfDocument(att.fileUrl, att.fileType)
                              const attTitle = isPdf
                                ? (ticket.title ? `${ticket.title} - Document` : 'Document.pdf')
                                : (ticket.title ? `${ticket.title} - Image` : 'Attachment')

                              return (
                                <button
                                  key={att.ticketAttachmentId || att.fileUrl || attIdx}
                                  type="button"
                                  onClick={() => setActiveDoc({ url: att.fileUrl, title: attTitle, fileType: att.fileType })}
                                  className="group relative flex flex-col rounded-xl overflow-hidden border border-gray-200 bg-white hover:border-warm-brown/60 hover:shadow-xs transition-all text-left rtl:text-right focus:outline-none cursor-pointer"
                                >
                                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                    {isPdf ? (
                                      <>
                                        <img
                                          src={getPdfThumbnailUrl(att.fileUrl, { width: 320 })}
                                          alt="PDF Preview"
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                          loading="lazy"
                                        />
                                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-red-600 text-white font-bold text-[9px] shadow-xs">
                                          PDF
                                        </span>
                                      </>
                                    ) : (
                                      <img
                                        src={optimizeCloudinaryUrl(att.fileUrl, { width: 320, quality: 'auto' })}
                                        alt="Thumbnail"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        loading="lazy"
                                      />
                                    )}
                                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                      <span className="text-[11px] font-bold bg-black/60 px-2 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        </svg>
                                        {t('common.view', { defaultValue: 'View' })}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="p-1.5 bg-gray-50/90 border-t border-gray-100 flex items-center justify-between gap-1">
                                    <span className="text-[11px] font-medium text-gray-800 truncate group-hover:text-warm-brown">
                                      {isPdf ? 'Document.pdf' : 'Image.jpg'}
                                    </span>
                                    <span className="text-[9px] text-gray-400 font-bold uppercase">{att.fileType || (isPdf ? 'PDF' : 'IMG')}</span>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* ── Receiver Evaluation Actions (Approve / Reject) ── */}
                      {!isOutgoing && isReceiver && isPending && (
                        <div className="mt-3.5 pt-3 border-t border-[#E0D0C0] flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleStatusChange(ticket.ticketId, 'REJECTED')}
                            className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            ✕ {t('tickets.reject', { defaultValue: 'Reject' })}
                          </button>
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleStatusChange(ticket.ticketId, 'APPROVED')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            ✓ {t('tickets.approve', { defaultValue: 'Approve' })}
                          </button>
                        </div>
                      )}

                      {/* ── Timestamp + Delivery ticks ────────── */}
                      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-gray-400">
                        <span>{formatTime(ticket.createdAt, i18n.language)}</span>
                        {isOutgoing && (
                          <span className={ticket.status === 'APPROVED' ? 'text-emerald-500' : 'text-gray-400'} title={ticket.status}>
                            ✓✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* ── Bottom Sticky Bar: Quick Actions & New Request ── */}
      <div className="p-3 sm:p-4 bg-white border-t border-[#D9C7B8] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <span className="text-[11px] font-semibold text-gray-500 hidden md:inline shrink-0 mr-1">
            {t('tickets.quick_actions', { defaultValue: 'Quick Action:' })}
          </span>
          <button
            type="button"
            onClick={() => openCreateModal('EXPENSE')}
            className="min-h-[40px] sm:min-h-0 px-3 py-2 sm:py-1.5 rounded-xl bg-warm-brown/10 hover:bg-warm-brown/20 text-warm-brown text-xs font-bold transition-colors flex items-center gap-1.5 border border-warm-brown/20 shrink-0 cursor-pointer"
          >
            💰 + {t('tickets.types.expense', { defaultValue: 'Expense' })}
          </button>
          <button
            type="button"
            onClick={() => openCreateModal('INSTRUCTION')}
            className="min-h-[40px] sm:min-h-0 px-3 py-2 sm:py-1.5 rounded-xl bg-light-blue/40 hover:bg-light-blue text-gray-800 text-xs font-bold transition-colors flex items-center gap-1.5 border border-light-blue shrink-0 cursor-pointer"
          >
            📝 + {t('tickets.types.instruction', { defaultValue: 'Instruction' })}
          </button>
          <button
            type="button"
            onClick={() => openCreateModal('MEASUREMENT')}
            className="min-h-[40px] sm:min-h-0 px-3 py-2 sm:py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-colors flex items-center gap-1.5 border border-teal-200 shrink-0 cursor-pointer"
          >
            📐 + {t('tickets.types.measurement', { defaultValue: 'Measurement' })}
          </button>
          <button
            type="button"
            onClick={() => openCreateModal('SITE_REPORT')}
            className="min-h-[40px] sm:min-h-0 px-3 py-2 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-200 shrink-0 cursor-pointer"
          >
            📋 + {t('tickets.types.site_report', { defaultValue: 'Report' })}
          </button>
        </div>

        <Button
          type="button"
          className="w-full sm:w-auto min-h-[44px] sm:min-h-0 py-2.5 px-6 text-xs font-bold shadow-sm"
          onClick={() => openCreateModal('INSTRUCTION')}
        >
          + {t('tickets.create_request_btn', { defaultValue: 'Create Internal Request' })}
        </Button>
      </div>

      {/* ── Create Ticket Modal ────────────────────────────── */}
      <CreateTicketModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        projectId={projectId}
        project={project}
        initialType={initialType}
        onCreated={() => {
          setSuccess(t('tickets.created_success', { defaultValue: 'Request submitted successfully.' }))
          fetchTickets(true)
        }}
      />

      {/* ── Edit Ticket Modal ──────────────────────────────── */}
      {editingTicket && (
        <EditTicketModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setEditingTicket(null)
          }}
          ticket={editingTicket}
          onUpdated={() => {
            setSuccess(t('tickets.updated_success', { defaultValue: 'Request updated successfully.' }))
            fetchTickets(true)
          }}
        />
      )}

      {/* ── Document / PDF Viewer Modal ───────────────────── */}
      <DocumentViewerModal
        isOpen={Boolean(activeDoc)}
        onClose={() => setActiveDoc(null)}
        url={activeDoc?.url}
        title={activeDoc?.title}
        fileType={activeDoc?.fileType}
      />
    </div>
  )
}

/* ── Badges ─────────────────────────────────────────────────── */

function TicketTypeBadge({ type }) {
  const { t } = useTranslation()
  const styles = {
    EXPENSE:     'bg-warm-brown/10 text-warm-brown border-warm-brown/30',
    INSTRUCTION: 'bg-blue-50 text-blue-700 border-blue-200',
    MEASUREMENT: 'bg-teal-50 text-teal-700 border-teal-200',
    SITE_REPORT: 'bg-slate-100 text-slate-700 border-slate-300',
  }
  const icons = {
    EXPENSE:     '💰',
    INSTRUCTION: '📝',
    MEASUREMENT: '📐',
    SITE_REPORT: '📋',
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${styles[type] || 'bg-gray-100 text-gray-700'}`}>
      <span>{icons[type] || '•'}</span>
      <span>{t(`tickets.types.${(type || '').toLowerCase()}`, { defaultValue: type })}</span>
    </span>
  )
}

function TicketStatusBadge({ status }) {
  const { t } = useTranslation()
  const styles = {
    PENDING:  'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
    VIEWED:   'bg-blue-50 text-blue-700 border-blue-200',
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {t(`tickets.statuses.${(status || '').toLowerCase()}`, { defaultValue: status })}
    </span>
  )
}
