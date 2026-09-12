import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  addClientComment,
  deleteClientComment,
  getClientComments,
  updateClientComment,
} from '@/api/clientCommentApi'
import {
  deleteAdminComment,
  getAdminComments,
  replyToComment,
} from '@/api/adminCommentApi'

import Alert from '@/components/ui/Alert'
import { CheckCircle, Spinner, XCircle } from '@/components/ui/icons/Globe'

// ─── Constants ───────────────────────────────────────────────
const PAGE_SIZE = 10

// ─── Helpers ─────────────────────────────────────────────────
const apiError = (err, fallback) => err?.response?.data?.message ?? fallback

function formatRelativeTime(value, language) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  const locale = language === 'ar' ? 'ar-EG' : 'en-US'
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

// ─── Inline SVG icons ─────────────────────────────────────────

function PencilIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  )
}

function TrashIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}

function ReplyIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
    </svg>
  )
}

function DotsVerticalIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
    </svg>
  )
}

function ChatBubbleIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
    </svg>
  )
}

// ─── Sub-components ───────────────────────────────────────────

/**
 * Inline textarea + confirm/cancel for adding or editing a comment.
 */
function CommentTextarea({ initial = '', placeholder, onConfirm, onCancel, loading }) {
  const [text, setText] = useState(initial)

  return (
    <div className="space-y-2 animate-slide-up">
      <textarea
        id="comment-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="input-base resize-none text-sm"
        disabled={loading}
        autoFocus
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="btn-ghost text-xs px-3 py-1.5 rounded-lg"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(text.trim())}
          disabled={loading || !text.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-warm-brown px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#6B4A33] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Spinner className="w-3 h-3" />}
          <CheckCircle className="w-3.5 h-3.5" />
          Submit
        </button>
      </div>
    </div>
  )
}

/**
 * 3-dot dropdown menu for Client comments.
 */
function CommentMenu({ canEdit, onEdit, onDelete, deleting }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id="comment-menu-trigger"
        onClick={() => setOpen((o) => !o)}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        aria-label="Comment options"
      >
        <DotsVerticalIcon />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-20 min-w-[140px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg animate-fade-in">
          {canEdit && (
            <button
              type="button"
              id="comment-edit-btn"
              onClick={() => { setOpen(false); onEdit() }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <PencilIcon />
              Edit
            </button>
          )}
          <button
            type="button"
            id="comment-delete-btn"
            onClick={() => { setOpen(false); onDelete() }}
            disabled={deleting}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
          >
            {deleting ? <Spinner className="w-4 h-4" /> : <TrashIcon />}
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Single comment thread card.
 * Renders the client bubble + optional admin reply bubble.
 */
function CommentCard({
  comment,
  userRole,
  dailyUpdateId,
  onCommentUpdated,
  onCommentDeleted,
  isHighlighted,
  cardRef,
}) {
  const { i18n } = useTranslation()
  const [editing, setEditing]           = useState(false)
  const [editLoading, setEditLoading]   = useState(false)
  const [editError, setEditError]       = useState(null)

  const [replying, setReplying]           = useState(false)
  const [replyLoading, setReplyLoading]   = useState(false)
  const [replyError, setReplyError]       = useState(null)

  const [deleting, setDeleting] = useState(false)

  // ── Business rules ──
  const isAdmin   = userRole === 'ADMIN'
  const isClient  = userRole === 'CLIENT'
  const hasReply  = Boolean(comment.adminReply)
  const canEdit   = isClient && !hasReply     // hide Edit once admin replied

  // ── Handlers ──
  const handleEdit = async (newText) => {
    if (!newText) return
    setEditLoading(true)
    setEditError(null)
    try {
      const { data } = await updateClientComment(dailyUpdateId, comment.id, newText)
      onCommentUpdated(data.data)
      setEditing(false)
    } catch (err) {
      setEditError(apiError(err, 'Failed to update comment.'))
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      if (isAdmin) {
        await deleteAdminComment(comment.id)
      } else {
        await deleteClientComment(dailyUpdateId, comment.id)
      }
      onCommentDeleted(comment.id)
    } catch (err) {
      // surface error via parent — keep it simple
      console.error(apiError(err, 'Failed to delete comment.'))
    } finally {
      setDeleting(false)
    }
  }

  const handleReply = async (replyText) => {
    if (!replyText) return
    setReplyLoading(true)
    setReplyError(null)
    try {
      const { data } = await replyToComment(comment.id, replyText)
      onCommentUpdated(data.data)
      setReplying(false)
    } catch (err) {
      setReplyError(apiError(err, 'Failed to send reply.'))
    } finally {
      setReplyLoading(false)
    }
  }

  const clientName = (i18n.language === 'ar' ? comment.clientNameAr || comment.clientNameEn : comment.clientNameEn || comment.clientNameAr) || comment.clientFullName || comment.clientName || 'Client'
  const adminName = (i18n.language === 'ar' ? comment.repliedByAdminNameAr || comment.repliedByAdminNameEn : comment.repliedByAdminNameEn || comment.repliedByAdminNameAr) || 'Admin'
  const clientInitial = clientName ? clientName.charAt(0).toUpperCase() : 'C'
  const adminInitial = adminName ? adminName.charAt(0).toUpperCase() : 'A'

  return (
    <div
      ref={cardRef}
      className={`space-y-3 transition-all duration-300 rounded-2xl ${
        isHighlighted
          ? 'p-3.5 bg-warm-brown/5 ring-2 ring-warm-brown/50 shadow-md'
          : 'animate-fade-in'
      }`}
    >
      {/* ── Client bubble ── */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 ring-1 ring-blue-200">
          {clientInitial}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-700">{clientName}</span>
              <span className="text-[11px] text-gray-400">
                {formatRelativeTime(comment.createdAt, i18n.language)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {isClient && (
                <CommentMenu
                  canEdit={canEdit}
                  onEdit={() => setEditing(true)}
                  onDelete={handleDelete}
                  deleting={deleting}
                />
              )}
              {isAdmin && (
                <button
                  type="button"
                  id={`comment-delete-admin-${comment.id}`}
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  aria-label="Delete comment"
                >
                  {deleting ? <Spinner className="w-3.5 h-3.5" /> : <TrashIcon />}
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          {editing ? (
            <div className="mt-2">
              <Alert message={editError} variant="error" onClose={() => setEditError(null)} className="mb-2 text-xs" />
              <CommentTextarea
                initial={comment.clientComment}
                placeholder="Edit your comment…"
                onConfirm={handleEdit}
                onCancel={() => { setEditing(false); setEditError(null) }}
                loading={editLoading}
              />
            </div>
          ) : (
            <p className="mt-1.5 rounded-xl rounded-tl-none border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-gray-700">
              {comment.clientComment}
            </p>
          )}
        </div>
      </div>

      {/* ── Admin reply / Admin reply form ── */}
      {hasReply ? (
        <div className="ml-11 flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
            {adminInitial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-amber-700">{adminName}</span>
              <span className="text-[10px] rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 border border-amber-200">
                Official Reply
              </span>
            </div>
            <p className="mt-1.5 rounded-xl rounded-tl-none border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-gray-700">
              {comment.adminReply}
            </p>
          </div>
        </div>
      ) : (
        isAdmin && (
          <div className="ml-11">
            {!replying ? (
              <button
                type="button"
                id={`comment-reply-btn-${comment.id}`}
                onClick={() => setReplying(true)}
                className="flex items-center gap-1.5 rounded-lg border border-warm-brown/30 bg-warm-brown/10 px-3 py-1.5 text-xs font-medium text-warm-brown transition-all hover:border-warm-brown/50 hover:bg-warm-brown/20 hover:text-[#6B4A33]"
              >
                <ReplyIcon className="w-3.5 h-3.5" />
                Reply
              </button>
            ) : (
              <div className="space-y-2">
                <Alert message={replyError} variant="error" onClose={() => setReplyError(null)} className="text-xs" />
                <CommentTextarea
                  placeholder="Write your official reply…"
                  onConfirm={handleReply}
                  onCancel={() => { setReplying(false); setReplyError(null) }}
                  loading={replyLoading}
                />
              </div>
            )}
          </div>
        )
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────

/**
 * CommentsSection
 *
 * Props:
 *   dailyUpdateId    number | string   — required
 *   userRole         'ADMIN' | 'CLIENT'
 *   updateStatus     string            — must be 'APPROVED' for client to add comments
 *   targetCommentId  string | null     — optional commentId to highlight and scroll to
 */
export default function CommentsSection({ dailyUpdateId, userRole, updateStatus, targetCommentId }) {
  const { t, i18n } = useTranslation()

  const [comments,      setComments]      = useState([])
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(null)
  const [page,          setPage]          = useState(0)
  const [totalPages,    setTotalPages]    = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [highlightedId, setHighlightedId] = useState(targetCommentId || null)
  const commentRefs = useRef({})

  const [addText,    setAddText]    = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError,   setAddError]   = useState(null)
  const [addSuccess, setAddSuccess] = useState(false)

  const isAdmin  = userRole === 'ADMIN'
  const isClient = userRole === 'CLIENT'
  const canAddComment = isClient && updateStatus === 'APPROVED'

  // Auto-scroll to targetCommentId when comments load
  useEffect(() => {
    if (!targetCommentId || comments.length === 0) return

    const target = comments.find(
      (c) => String(c.id || c.commentId) === String(targetCommentId)
    )

    if (target) {
      const cId = String(target.id || target.commentId)
      setHighlightedId(cId)

      setTimeout(() => {
        const el = commentRefs.current[cId]
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 150)

      const timer = setTimeout(() => {
        setHighlightedId(null)
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [comments, targetCommentId])

  // ── Fetch ──
  const fetchComments = useCallback(async () => {
    if (!dailyUpdateId) return
    setLoading(true)
    setError(null)
    try {
      const fetcher = isAdmin ? getAdminComments : getClientComments
      const { data } = await fetcher(dailyUpdateId, page, PAGE_SIZE)
      const page_data = data.data
      setComments(page_data?.content ?? [])
      setTotalPages(page_data?.totalPages ?? 0)
      setTotalElements(page_data?.totalElements ?? 0)
    } catch (err) {
      setError(apiError(err, t('errors.generic')))
    } finally {
      setLoading(false)
    }
  }, [dailyUpdateId, page, isAdmin, t])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  // ── Add comment ──
  const handleAddComment = async () => {
    const trimmed = addText.trim()
    if (!trimmed) return
    setAddLoading(true)
    setAddError(null)
    setAddSuccess(false)
    try {
      const { data } = await addClientComment(dailyUpdateId, trimmed)
      setComments((prev) => [data.data, ...prev])
      setTotalElements((n) => n + 1)
      setAddText('')
      setAddSuccess(true)
      setTimeout(() => setAddSuccess(false), 2500)
    } catch (err) {
      setAddError(apiError(err, 'Failed to add comment.'))
    } finally {
      setAddLoading(false)
    }
  }

  // ── Comment CRUD callbacks ──
  const handleCommentUpdated = (updated) => {
    setComments((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    )
  }

  const handleCommentDeleted = (id) => {
    setComments((prev) => prev.filter((c) => c.id !== id))
    setTotalElements((n) => Math.max(0, n - 1))
  }

  // ── Render ──
  return (
    <section
      id="comments-section"
      aria-label="Comments"
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-5 py-4 sm:px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-warm-brown/20 bg-warm-brown/10 text-warm-brown">
          <ChatBubbleIcon />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Comments</h2>
          <p className="text-[11px] text-gray-500">
            {totalElements} {totalElements === 1 ? 'comment' : 'comments'}
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* ── Add comment (Client only, APPROVED only) ── */}
        {canAddComment && (
          <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">Add a comment</p>
            <Alert message={addError} variant="error" onClose={() => setAddError(null)} className="text-xs" />
            {addSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700 animate-fade-in">
                <CheckCircle className="w-3.5 h-3.5" />
                Comment added successfully.
              </div>
            )}
            <textarea
              id="new-comment-input"
              value={addText}
              onChange={(e) => setAddText(e.target.value)}
              placeholder="Write your comment…"
              rows={3}
              disabled={addLoading}
              className="input-base resize-none text-sm"
            />
            <div className="flex justify-end">
              <button
                type="button"
                id="submit-comment-btn"
                onClick={handleAddComment}
                disabled={addLoading || !addText.trim()}
                className="flex items-center gap-2 rounded-xl bg-warm-brown px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-[#6B4A33] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
              >
                {addLoading && <Spinner className="w-3.5 h-3.5" />}
                Post Comment
              </button>
            </div>
          </div>
        )}

        {/* ── Not approved notice (Client view, non-APPROVED) ── */}
        {isClient && updateStatus !== 'APPROVED' && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            <XCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            Comments are only available on approved daily updates.
          </div>
        )}

        {/* ── Global fetch error ── */}
        <Alert message={error} variant="error" onClose={() => setError(null)} />

        {/* ── Loading skeletons ── */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          /* ── Empty state ── */
          <div className="py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-300">
              <ChatBubbleIcon className="w-6 h-6" />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-500">No comments yet</p>
            <p className="mt-1 text-xs text-gray-400">
              {canAddComment ? 'Be the first to leave a comment.' : 'No comments have been posted.'}
            </p>
          </div>
        ) : (
          /* ── Comment thread ── */
          <div className="space-y-6 divide-y divide-gray-100">
            {comments.map((comment) => {
              const cId = String(comment.id || comment.commentId)
              const isHighlighted = cId === String(highlightedId)

              return (
                <div key={comment.id} className="pt-6 first:pt-0">
                  <CommentCard
                    comment={comment}
                    userRole={userRole}
                    dailyUpdateId={dailyUpdateId}
                    isHighlighted={isHighlighted}
                    cardRef={(el) => {
                      if (el) commentRefs.current[cId] = el
                    }}
                    onCommentUpdated={handleCommentUpdated}
                    onCommentDeleted={handleCommentDeleted}
                  />
                </div>
              )
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-500">
              Page <span className="font-medium text-gray-900">{page + 1}</span> of{' '}
              <span className="font-medium text-gray-900">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <PagerButton disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Previous
              </PagerButton>
              <PagerButton disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                Next
              </PagerButton>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Tiny local helpers ───────────────────────────────────────

function PagerButton({ children, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:border-warm-brown/40 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  )
}
