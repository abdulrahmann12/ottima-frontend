import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  getMyInbox,
  getMySentRequests,
  updateTicketStatus,
  deleteTicket,
} from '@/api/internalTicketApi'
import useAuthStore from '@/store/authStore'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import Modal from '@/components/admin/Modal'
import { Spinner } from '@/components/ui/icons/Globe'
import { optimizeCloudinaryUrl, getPdfThumbnailUrl, isPdfDocument } from '@/utils/imageUtils'
import DocumentViewerModal from '@/components/ui/DocumentViewerModal'

const fmtAmount = (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const apiError = (err, fallback) => err?.response?.data?.message ?? err?.message ?? fallback

function formatDateTime(isoStr, lang = 'en') {
  if (!isoStr) return '—'
  try {
    const d = new Date(isoStr)
    return d.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return isoStr
  }
}

export default function InternalTicketsDashboard() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { role, user } = useAuthStore()
  const isAdmin = role === 'ADMIN'
  const currentUserId = user?.userId ?? user?.id

  const [activeTab, setActiveTab] = useState('INBOX') // 'INBOX' | 'SENT'
  const [tickets, setTickets]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [success, setSuccess]     = useState(null)

  // Filters & Pagination
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter]     = useState('ALL')
  const [page, setPage]                 = useState(0)
  const [totalPages, setTotalPages]     = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // Details & Evaluate Modal
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [actionLoading, setActionLoading]   = useState(false)
  const [activeDoc, setActiveDoc]           = useState(null)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const apiCall = activeTab === 'INBOX' ? getMyInbox : getMySentRequests
      const { data } = await apiCall(page, 20)
      const content = data?.data?.content ?? data?.data ?? []
      setTickets(content)
      setTotalPages(data?.data?.totalPages ?? 1)
      setTotalElements(data?.data?.totalElements ?? content.length)
    } catch (err) {
      setError(apiError(err, 'Failed to fetch tickets list.'))
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [activeTab, page])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  // Filter client-side when user searches
  const filteredTickets = useMemo(() => {
    return tickets.filter((tk) => {
      if (statusFilter !== 'ALL' && tk.status !== statusFilter) return false
      if (typeFilter !== 'ALL' && tk.ticketType !== typeFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchTitle = tk.title?.toLowerCase().includes(q)
        const matchDesc  = tk.description?.toLowerCase().includes(q)
        const matchSender = (tk.senderNameEn || tk.senderNameAr || '').toLowerCase().includes(q)
        const matchReceiver = (tk.receiverNameEn || tk.receiverNameAr || '').toLowerCase().includes(q)
        if (!matchTitle && !matchDesc && !matchSender && !matchReceiver) return false
      }
      return true
    })
  }, [tickets, statusFilter, typeFilter, search])

  // ── Status Action (Approve / Reject) ─────────────────────────
  const handleStatusChange = async (ticketId, newStatus) => {
    setActionLoading(true)
    setError(null)
    try {
      await updateTicketStatus(ticketId, newStatus)
      setSuccess(
        newStatus === 'APPROVED'
          ? t('tickets.approved_success', { defaultValue: 'Request approved successfully.' })
          : t('tickets.rejected_success', { defaultValue: 'Request rejected.' })
      )
      setSelectedTicket(null)
      await fetchTickets()
    } catch (err) {
      setError(apiError(err, 'Failed to update status.'))
    } finally {
      setActionLoading(false)
    }
  }

  // ── Delete Action ────────────────────────────────────────────
  const handleDelete = async (ticketId) => {
    if (!window.confirm(t('tickets.delete_confirm', { defaultValue: 'Delete this pending request?' }))) return
    setActionLoading(true)
    setError(null)
    try {
      await deleteTicket(ticketId)
      setSuccess(t('tickets.deleted_success', { defaultValue: 'Request deleted.' }))
      setSelectedTicket(null)
      await fetchTickets()
    } catch (err) {
      setError(apiError(err, 'Failed to delete request.'))
    } finally {
      setActionLoading(false)
    }
  }

  const navigateToProjectChat = (projectId) => {
    if (!projectId) return
    const basePath = isAdmin ? '/admin/projects' : '/engineer/projects'
    navigate(`${basePath}/${projectId}?tab=tickets`)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            {t('tickets.dashboard_title', { defaultValue: 'Internal Requests Center' })}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
            {t('tickets.dashboard_subtitle', { defaultValue: 'Manage all engineering requests, expense approvals, and site notes' })}
          </p>
        </div>
      </div>

      <Alert message={error} variant="error" onClose={() => setError(null)} />
      <Alert message={success} variant="success" onClose={() => setSuccess(null)} />

      {/* ── Tabs & Filter Bar ───────────────────────────────── */}
      <div className="glass-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setActiveTab('INBOX'); setPage(0) }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'INBOX'
                  ? 'bg-warm-brown text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-light-blue/40'
              }`}
            >
              📥 {t('tickets.inbox_tab', { defaultValue: 'My Inbox (Received)' })}
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('SENT'); setPage(0) }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'SENT'
                  ? 'bg-warm-brown text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-light-blue/40'
              }`}
            >
              📤 {t('tickets.sent_tab', { defaultValue: 'Sent Requests (Outgoing)' })}
            </button>
          </div>

          <span className="text-xs text-gray-500 font-medium">
            {t('common.total', { defaultValue: 'Total:' })} <strong className="text-gray-900">{totalElements}</strong>
          </span>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <input
            type="text"
            className="input-base text-xs"
            placeholder={t('tickets.search_placeholder', { defaultValue: 'Search by title, sender, or notes…' })}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="input-base text-xs"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">{t('tickets.all_types', { defaultValue: 'All Request Types' })}</option>
            <option value="EXPENSE">💰 {t('tickets.types.expense', { defaultValue: 'Expense' })}</option>
            <option value="INSTRUCTION">📝 {t('tickets.types.instruction', { defaultValue: 'Instruction' })}</option>
            <option value="MEASUREMENT">📐 {t('tickets.types.measurement', { defaultValue: 'Measurement' })}</option>
            <option value="SITE_REPORT">📋 {t('tickets.types.site_report', { defaultValue: 'Site Report' })}</option>
          </select>

          <select
            className="input-base text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">{t('tickets.all_statuses', { defaultValue: 'All Statuses' })}</option>
            <option value="PENDING">⏳ {t('tickets.statuses.pending', { defaultValue: 'Pending' })}</option>
            <option value="APPROVED">✅ {t('tickets.statuses.approved', { defaultValue: 'Approved' })}</option>
            <option value="REJECTED">❌ {t('tickets.statuses.rejected', { defaultValue: 'Rejected' })}</option>
            <option value="VIEWED">👀 {t('tickets.statuses.viewed', { defaultValue: 'Viewed' })}</option>
          </select>
        </div>
      </div>

      {/* ── Table Content ───────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500 flex flex-col items-center gap-2">
            <Spinner className="w-8 h-8 text-warm-brown" />
            <p className="text-xs font-medium">{t('common.loading', { defaultValue: 'Loading requests…' })}</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <p className="text-sm font-semibold">{t('tickets.no_records', { defaultValue: 'No requests found in this view.' })}</p>
          </div>
        ) : (
          <>
            {/* ── Desktop View (md+): Standard Table ───────────────── */}
            <div className="hidden md:block overflow-x-auto scrollbar-thin">
              <table className="w-full text-left rtl:text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4">{t('tickets.subject', { defaultValue: 'Subject' })}</th>
                    <th className="py-3 px-4">{t('tickets.type', { defaultValue: 'Type' })}</th>
                    <th className="py-3 px-4">
                      {activeTab === 'INBOX'
                        ? t('tickets.sender', { defaultValue: 'Sender' })
                        : t('tickets.receiver', { defaultValue: 'Receiver' })
                      }
                    </th>
                    <th className="py-3 px-4">{t('tickets.amount', { defaultValue: 'Amount' })}</th>
                    <th className="py-3 px-4">{t('tickets.status', { defaultValue: 'Status' })}</th>
                    <th className="py-3 px-4">{t('tickets.date', { defaultValue: 'Date & Time' })}</th>
                    <th className="py-3 px-4 text-center">{t('common.actions', { defaultValue: 'Actions' })}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTickets.map((tk) => {
                    const partyName = activeTab === 'INBOX'
                      ? (i18n.language === 'ar' ? tk.senderNameAr || tk.senderNameEn : tk.senderNameEn || tk.senderNameAr)
                      : (i18n.language === 'ar' ? tk.receiverNameAr || tk.receiverNameEn : tk.receiverNameEn || tk.receiverNameAr)
                    const partyRole = activeTab === 'INBOX' ? tk.senderRole : tk.receiverRole

                    return (
                      <tr key={tk.ticketId} className="hover:bg-warm-brown/5 transition-colors">
                        <td className="py-3 px-4 max-w-xs">
                          <div className="flex flex-col">
                            {tk.projectId ? (
                              <button
                                type="button"
                                onClick={() => navigateToProjectChat(tk.projectId)}
                                className="font-bold text-gray-900 hover:text-warm-brown text-left rtl:text-right transition-colors truncate"
                              >
                                {tk.title}
                              </button>
                            ) : (
                              <p className="font-bold text-gray-900 truncate">{tk.title}</p>
                            )}
                            {tk.description && (
                              <p className="text-gray-500 text-[11px] truncate mt-0.5">{tk.description}</p>
                            )}
                            {(tk.projectNameEn || tk.projectNameAr) && (
                              <div className="mt-1 flex items-center gap-1">
                                <span className="text-[10px] text-gray-400 font-medium">📁</span>
                                <button
                                  type="button"
                                  onClick={() => navigateToProjectChat(tk.projectId)}
                                  className="text-[10px] text-warm-brown font-semibold hover:underline truncate"
                                >
                                  {i18n.language === 'ar' ? tk.projectNameAr || tk.projectNameEn : tk.projectNameEn || tk.projectNameAr}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <TicketTypeBadge type={tk.ticketType} />
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-gray-800">{partyName || '—'}</span>
                            {partyRole && (
                              <span className="text-[10px] px-1 py-0.2 rounded bg-gray-200 text-gray-700 uppercase">
                                {partyRole}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-gray-900">
                          {tk.ticketType === 'EXPENSE' && tk.amount != null ? (
                            <span>{fmtAmount(tk.amount)} EGP</span>
                          ) : (
                            <span className="text-gray-400 font-normal">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <TicketStatusBadge status={tk.status} />
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-gray-500">
                          {formatDateTime(tk.createdAt, i18n.language)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedTicket(tk)}
                              className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-warm-brown/10 text-warm-brown font-semibold transition-colors cursor-pointer"
                            >
                              {t('tickets.view_details', { defaultValue: 'View Details' })}
                            </button>
                            {tk.projectId && (
                              <button
                                type="button"
                                onClick={() => navigateToProjectChat(tk.projectId)}
                                className="px-3 py-1.5 rounded-lg bg-warm-brown text-white hover:bg-warm-brown/90 text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                                title={t('tickets.open_project_chat', { defaultValue: 'Open in Project Chat' })}
                              >
                                <span>💬</span>
                                <span>{t('tickets.chat', { defaultValue: 'Chat Feed' })}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile View (<md): Native Touch Cards ───────────── */}
            <div className="block md:hidden p-3.5 space-y-3">
              {filteredTickets.map((tk) => {
                const partyName = activeTab === 'INBOX'
                  ? (i18n.language === 'ar' ? tk.senderNameAr || tk.senderNameEn : tk.senderNameEn || tk.senderNameAr)
                  : (i18n.language === 'ar' ? tk.receiverNameAr || tk.receiverNameEn : tk.receiverNameEn || tk.receiverNameAr)
                const partyRole = activeTab === 'INBOX' ? tk.senderRole : tk.receiverRole

                return (
                  <div
                    key={tk.ticketId}
                    className="bg-white rounded-2xl border border-[#D9C7B8] p-4 shadow-xs space-y-3 transition-all active:scale-[0.99]"
                  >
                    {/* Top Row: Title + Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-gray-900 leading-snug">
                          {tk.title}
                        </h3>
                        {(tk.projectNameEn || tk.projectNameAr) && (
                          <p className="text-[11px] text-warm-brown font-semibold truncate mt-0.5">
                            📁 {i18n.language === 'ar' ? tk.projectNameAr || tk.projectNameEn : tk.projectNameEn || tk.projectNameAr}
                          </p>
                        )}
                      </div>
                      <TicketStatusBadge status={tk.status} />
                    </div>

                    {tk.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {tk.description}
                      </p>
                    )}

                    {/* Metadata Badges & Values */}
                    <div className="flex flex-wrap items-center justify-between gap-2 py-2 border-y border-gray-100 text-xs">
                      <div className="flex items-center gap-1.5">
                        <TicketTypeBadge type={tk.ticketType} />
                        {tk.ticketType === 'EXPENSE' && tk.amount != null && (
                          <span className="font-mono font-extrabold text-gray-950 bg-warm-brown/10 px-2 py-0.5 rounded-md border border-warm-brown/20 text-[11px]">
                            {fmtAmount(tk.amount)} EGP
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 text-[11px]">
                        <span>{partyName || '—'}</span>
                        {partyRole && <span className="text-[9px] px-1 py-0.2 rounded bg-gray-200 uppercase">{partyRole}</span>}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[10px] text-gray-400">
                        {formatDateTime(tk.createdAt, i18n.language)}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(tk)}
                          className="min-h-[40px] px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          {t('tickets.view_details', { defaultValue: 'Details' })}
                        </button>
                        {tk.projectId && (
                          <button
                            type="button"
                            onClick={() => navigateToProjectChat(tk.projectId)}
                            className="min-h-[40px] px-4 py-2 rounded-xl bg-warm-brown hover:bg-warm-brown/90 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
                          >
                            <span>💬</span>
                            <span>{t('tickets.chat', { defaultValue: 'Chat' })}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs">
            <Button
              type="button"
              variant="ghost"
              disabled={page === 0 || loading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ← {t('common.prev', { defaultValue: 'Previous' })}
            </Button>
            <span className="text-gray-600 font-medium">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              type="button"
              variant="ghost"
              disabled={page >= totalPages - 1 || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('common.next', { defaultValue: 'Next' })} →
            </Button>
          </div>
        )}
      </div>

      {/* ── Ticket Details & Evaluation Modal ────────────────── */}
      {selectedTicket && (
        <Modal
          isOpen={Boolean(selectedTicket)}
          onClose={() => setSelectedTicket(null)}
          title={selectedTicket.title}
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <TicketTypeBadge type={selectedTicket.ticketType} />
                <TicketStatusBadge status={selectedTicket.status} />
              </div>
              <span className="text-xs text-gray-500">
                {formatDateTime(selectedTicket.createdAt, i18n.language)}
              </span>
            </div>

            {/* Sender & Receiver Info */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs">
              <div>
                <span className="text-gray-500 font-medium">{t('tickets.sender', { defaultValue: 'Sender:' })}</span>
                <p className="font-bold text-gray-900 mt-0.5">
                  {i18n.language === 'ar' ? selectedTicket.senderNameAr || selectedTicket.senderNameEn : selectedTicket.senderNameEn || selectedTicket.senderNameAr}
                  <span className="ml-1.5 text-[10px] text-gray-500 uppercase">({selectedTicket.senderRole})</span>
                </p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">{t('tickets.receiver', { defaultValue: 'Receiver:' })}</span>
                <p className="font-bold text-gray-900 mt-0.5">
                  {i18n.language === 'ar' ? selectedTicket.receiverNameAr || selectedTicket.receiverNameEn : selectedTicket.receiverNameEn || selectedTicket.receiverNameAr}
                  <span className="ml-1.5 text-[10px] text-gray-500 uppercase">({selectedTicket.receiverRole})</span>
                </p>
              </div>
            </div>

            {/* Expense Amount */}
            {selectedTicket.ticketType === 'EXPENSE' && selectedTicket.amount != null && (
              <div className="p-3 rounded-xl bg-warm-brown/10 border border-warm-brown/25 flex items-center justify-between">
                <span className="text-xs font-semibold text-warm-brown">💰 {t('tickets.expense_amount', { defaultValue: 'Expense Amount:' })}</span>
                <span className="text-base font-extrabold text-gray-950 font-mono">
                  {fmtAmount(selectedTicket.amount)} EGP
                </span>
              </div>
            )}

            {/* Description */}
            {selectedTicket.description && (
              <div>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  {t('tickets.details', { defaultValue: 'Description / Instructions' })}
                </p>
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </div>
              </div>
            )}

            {/* Attachments */}
            {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  {t('tickets.attachments', { defaultValue: 'Attachments' })} ({selectedTicket.attachments.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {selectedTicket.attachments.map((att, attIdx) => {
                    const isPdf = isPdfDocument(att.fileUrl, att.fileType)
                    const attTitle = isPdf
                      ? (selectedTicket.title ? `${selectedTicket.title} - Document` : 'Document.pdf')
                      : (selectedTicket.title ? `${selectedTicket.title} - Image` : 'Attachment')

                    return (
                      <button
                        key={att.ticketAttachmentId || att.fileUrl || attIdx}
                        type="button"
                        onClick={() => setActiveDoc({ url: att.fileUrl, title: attTitle, fileType: att.fileType })}
                        className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:border-warm-brown/50 hover:bg-warm-brown/5 transition-all flex items-center gap-2.5 group text-left rtl:text-right cursor-pointer"
                      >
                        {isPdf ? (
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-red-200 shrink-0 bg-red-50 flex items-center justify-center">
                            <img
                              src={getPdfThumbnailUrl(att.fileUrl, { width: 100 })}
                              alt="PDF Preview"
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <span className="absolute bottom-0 right-0 left-0 bg-red-600 text-white font-bold text-[8px] text-center leading-tight">
                              PDF
                            </span>
                          </div>
                        ) : (
                          <img
                            src={optimizeCloudinaryUrl(att.fileUrl, { width: 100, quality: 'auto' })}
                            alt="Attachment"
                            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-200"
                            loading="lazy"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-warm-brown">
                            {isPdf ? 'Document.pdf' : 'Image.jpg'}
                          </p>
                          <span className="text-[10px] text-warm-brown font-medium">
                            {t('common.view', { defaultValue: 'View' })} →
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-gray-200">
              {selectedTicket.projectId && (
                <button
                  type="button"
                  onClick={() => navigateToProjectChat(selectedTicket.projectId)}
                  className="text-xs font-semibold text-warm-brown hover:underline"
                >
                  💬 {t('tickets.open_full_feed', { defaultValue: 'Open in Project Feed →' })}
                </button>
              )}

              <div className="flex items-center gap-2">
                {/* Receiver Approve / Reject buttons on pending ticket */}
                {Number(selectedTicket.receiverId) === Number(currentUserId) && selectedTicket.status === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleStatusChange(selectedTicket.ticketId, 'REJECTED')}
                      className="px-4 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all disabled:opacity-50"
                    >
                      ✕ {t('tickets.reject', { defaultValue: 'Reject' })}
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleStatusChange(selectedTicket.ticketId, 'APPROVED')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                    >
                      ✓ {t('tickets.approve', { defaultValue: 'Approve' })}
                    </button>
                  </>
                )}

                {/* Sender Delete button on pending ticket */}
                {Number(selectedTicket.senderId) === Number(currentUserId) && selectedTicket.status === 'PENDING' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleDelete(selectedTicket.ticketId)}
                    className="px-3.5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    🗑 {t('common.delete', { defaultValue: 'Delete Request' })}
                  </button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedTicket(null)}
                >
                  {t('common.close', { defaultValue: 'Close' })}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Document / PDF Viewer Modal ────────────────────── */}
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
