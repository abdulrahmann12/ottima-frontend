import { deleteAdminComment, getAdminComments, replyToComment, resolveCommentContext } from '@/api/adminCommentApi'
import { getAdminDailyUpdates } from '@/api/adminDailyUpdateApi'
import { getAdminProjects } from '@/api/projectsApi'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import Modal from '@/components/admin/Modal'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

const PAGE_SIZE = 10

export default function AdminCommentsPage() {
  const { t, i18n } = useTranslation()

  // Cascading Selection State
  const [projects, setProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState('')

  const [dailyUpdates, setDailyUpdates] = useState([])
  const [loadingUpdates, setLoadingUpdates] = useState(false)
  const [selectedDailyUpdateId, setSelectedDailyUpdateId] = useState('')

  // Comments List & Pagination State
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // Reply Modal State
  const [replyModalOpen, setReplyModalOpen] = useState(false)
  const [activeComment, setActiveComment] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // URL Search Parameters & Deep-Linking Resolution
  const [searchParams] = useSearchParams()
  const targetCommentId = searchParams.get('targetCommentId') || searchParams.get('autoSelectId')
  const [highlightedCommentId, setHighlightedCommentId] = useState(null)
  const commentRefs = useRef({})

  // Resolve targetCommentId -> parent { projectId, dailyUpdateId } on mount
  useEffect(() => {
    if (!targetCommentId || selectedDailyUpdateId) return

    let active = true

    const resolveContext = async () => {
      try {
        // Attempt 1: Call API service to resolve parent IDs directly
        const res = await resolveCommentContext(targetCommentId)
        const contextData = res.data?.data || res.data || {}
        if (contextData.projectId && contextData.dailyUpdateId && active) {
          setSelectedProjectId(String(contextData.projectId))
          setSelectedDailyUpdateId(String(contextData.dailyUpdateId))
          return
        }
      } catch {
        // Fallback Strategy: Search across projects & updates if backend endpoint is unavailable
      }

      if (projects.length === 0) return
      for (const proj of projects) {
        const pId = proj.projectId || proj.id
        try {
          const updateRes = await getAdminDailyUpdates(pId, 0, 50)
          const updatesList = updateRes.data?.data?.content || updateRes.data?.content || []
          for (const upd of updatesList) {
            const uId = upd.dailyUpdateId || upd.id
            const commentRes = await getAdminComments(uId, 0, 50)
            const commentsList = commentRes.data?.data?.content || commentRes.data?.content || []
            const found = commentsList.find(
              (c) => String(c.commentId || c.id) === String(targetCommentId)
            )
            if (found && active) {
              setSelectedProjectId(String(pId))
              setSelectedDailyUpdateId(String(uId))
              return
            }
          }
        } catch {
          // Ignore and check next
        }
      }
    }

    resolveContext()

    return () => {
      active = false
    }
  }, [targetCommentId, projects, selectedDailyUpdateId])

  // Auto-scroll and visual highlight effect when comments finish loading
  useEffect(() => {
    if (!targetCommentId || comments.length === 0) return

    const matchedComment = comments.find(
      (c) => String(c.commentId || c.id) === String(targetCommentId)
    )

    if (matchedComment) {
      const cId = String(matchedComment.commentId || matchedComment.id)
      setHighlightedCommentId(cId)

      // Smooth scroll target comment card into view
      setTimeout(() => {
        const targetElement = commentRefs.current[cId]
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 150)

      // Remove glowing highlight after 4 seconds
      const timer = setTimeout(() => {
        setHighlightedCommentId(null)
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [comments, targetCommentId])

  // Step 1: Fetch Admin Projects on Mount
  useEffect(() => {
    let isMounted = true
    setLoadingProjects(true)
    getAdminProjects(0, 100)
      .then((res) => {
        if (!isMounted) return
        const list = res.data?.data?.content || res.data?.content || res.data?.data || []
        setProjects(Array.isArray(list) ? list : [])
      })
      .catch((err) => {
        if (isMounted) setError(err?.response?.data?.message || t('errors.generic'))
      })
      .finally(() => {
        if (isMounted) setLoadingProjects(false)
      })

    return () => {
      isMounted = false
    }
  }, [t])

  // Step 2: Fetch Daily Updates when a Project is selected
  useEffect(() => {
    if (!selectedProjectId) {
      setDailyUpdates([])
      setSelectedDailyUpdateId('')
      setComments([])
      return
    }

    let isMounted = true
    setLoadingUpdates(true)
    setSelectedDailyUpdateId('')
    setComments([])
    setError(null)

    getAdminDailyUpdates(selectedProjectId, 0, 100)
      .then((res) => {
        if (!isMounted) return
        const list = res.data?.data?.content || res.data?.content || res.data?.data || []
        setDailyUpdates(Array.isArray(list) ? list : [])
      })
      .catch((err) => {
        if (isMounted) setError(err?.response?.data?.message || t('errors.generic'))
      })
      .finally(() => {
        if (isMounted) setLoadingUpdates(false)
      })

    return () => {
      isMounted = false
    }
  }, [selectedProjectId, t])

  // Step 3: Fetch Comments when a Daily Update is selected
  const fetchComments = useCallback(async () => {
    if (!selectedDailyUpdateId) {
      setComments([])
      return
    }

    setLoadingComments(true)
    setError(null)
    try {
      const res = await getAdminComments(selectedDailyUpdateId, page, PAGE_SIZE)
      const pageData = res.data?.data || res.data || {}
      const list = pageData.content || (Array.isArray(pageData) ? pageData : [])
      setComments(list)
      setTotalPages(pageData.totalPages ?? 1)
      setTotalElements(pageData.totalElements ?? list.length)
    } catch (err) {
      setError(err?.response?.data?.message || t('errors.generic'))
      setComments([])
    } finally {
      setLoadingComments(false)
    }
  }, [selectedDailyUpdateId, page, t])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  // Handle Project Change
  const handleProjectChange = (e) => {
    setSelectedProjectId(e.target.value)
    setPage(0)
  }

  // Handle Daily Update Change
  const handleDailyUpdateChange = (e) => {
    setSelectedDailyUpdateId(e.target.value)
    setPage(0)
  }

  // Open Reply Modal
  const handleOpenReply = (comment) => {
    setActiveComment(comment)
    setReplyText(comment.adminReply || comment.reply || '')
    setReplyModalOpen(true)
  }

  // Submit Admin Reply
  const handleSaveReply = async (e) => {
    e.preventDefault()
    if (!activeComment || !replyText.trim()) return

    const commentId = activeComment.commentId || activeComment.id
    setSubmittingReply(true)
    setError(null)
    try {
      await replyToComment(commentId, replyText.trim())
      setSuccessMsg(t('common.success', 'Reply saved successfully'))
      setReplyModalOpen(false)
      setActiveComment(null)
      setReplyText('')
      fetchComments()
    } catch (err) {
      setError(err?.response?.data?.message || t('errors.generic'))
    } finally {
      setSubmittingReply(false)
    }
  }

  // Open Delete Confirmation
  const handleOpenDelete = (comment) => {
    setCommentToDelete(comment)
    setDeleteDialogOpen(true)
  }

  // Confirm Comment Deletion
  const handleConfirmDelete = async () => {
    if (!commentToDelete) return
    const commentId = commentToDelete.commentId || commentToDelete.id

    setDeleting(true)
    setError(null)
    try {
      await deleteAdminComment(commentId)
      setSuccessMsg(t('common.success', 'Comment deleted successfully'))
      setDeleteDialogOpen(false)
      setCommentToDelete(null)
      fetchComments()
    } catch (err) {
      setError(err?.response?.data?.message || t('errors.generic'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-card border border-surface-border p-5 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            {t('comments.title', 'Comments Management')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('comments.subtitle', 'Manage and reply to client comments on project daily updates')}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert variant="success" onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {/* Cascading Selection Dropdowns */}
      <div className="bg-surface-card border border-surface-border p-5 rounded-2xl space-y-4 shadow-sm">
        <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
          </svg>
          Cascading Selection
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Step 1: Select Project Dropdown */}
          <div className="space-y-1.5">
            <label htmlFor="project-select" className="text-xs font-semibold text-slate-300 block">
              1. {t('comments.select_project', 'Select Project')} <span className="text-rose-400">*</span>
            </label>
            <select
              id="project-select"
              value={selectedProjectId}
              onChange={handleProjectChange}
              disabled={loadingProjects}
              className="w-full bg-slate-900 border border-surface-border rounded-xl text-xs text-slate-200 px-3.5 py-2.5
                focus:outline-none focus:ring-2 focus:ring-brand-500/40 cursor-pointer disabled:opacity-50"
            >
              <option value="">{t('comments.select_project_placeholder', '-- Choose a Project --')}</option>
              {projects.map((p) => {
                const id = p.projectId || p.id
                const name = i18n.language === 'ar' ? p.nameAr || p.nameEn : p.nameEn || p.nameAr
                const client = p.client?.fullNameEn || p.client?.username ? ` (${p.client.fullNameEn || p.client.username})` : ''
                return (
                  <option key={id} value={id}>
                    {name}{client}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Step 2: Select Daily Update Dropdown */}
          <div className="space-y-1.5">
            <label htmlFor="update-select" className="text-xs font-semibold text-slate-300 block">
              2. {t('comments.select_update', 'Select Daily Update')} <span className="text-rose-400">*</span>
            </label>
            <select
              id="update-select"
              value={selectedDailyUpdateId}
              onChange={handleDailyUpdateChange}
              disabled={!selectedProjectId || loadingUpdates}
              className="w-full bg-slate-900 border border-surface-border rounded-xl text-xs text-slate-200 px-3.5 py-2.5
                focus:outline-none focus:ring-2 focus:ring-brand-500/40 cursor-pointer disabled:opacity-50"
            >
              <option value="">
                {!selectedProjectId
                  ? '-- Select Project First --'
                  : loadingUpdates
                  ? '-- Loading Updates... --'
                  : t('comments.select_update_placeholder', '-- Choose a Daily Update --')}
              </option>
              {dailyUpdates.map((u) => {
                const id = u.dailyUpdateId || u.id
                const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Update'
                const statusStr = u.status ? ` [${u.status}]` : ''
                const itemName = u.projectItem?.standardItem?.nameEn || u.projectItem?.standardItem?.nameAr ? ` - ${u.projectItem.standardItem.nameEn || u.projectItem.standardItem.nameAr}` : ''
                return (
                  <option key={id} value={id}>
                    {dateStr}{itemName}{statusStr}
                  </option>
                )
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Step 3: Comments Section */}
      {!selectedDailyUpdateId ? (
        <div className="p-12 text-center bg-surface-card/60 border border-surface-border rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-brand-950/80 border border-brand-800/40 flex items-center justify-center text-brand-400 mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-white">
            {t('comments.select_prompt', 'Please select a Project and Daily Update to view comments.')}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Comments are organized per daily update to maintain clear audit context.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 1-.978-.35c-.412-.207-.63-.64-.537-1.077.067-.306.27-.604.53-.878A7.72 7.72 0 0 0 4.5 14.5c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
              Comments ({totalElements})
            </h2>
          </div>

          {loadingComments ? (
            <div className="p-12 text-center bg-surface-card/40 rounded-2xl border border-surface-border">
              <div className="inline-block w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs text-slate-400">{t('table.loading', 'Loading comments...')}</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="p-12 text-center bg-surface-card border border-surface-border rounded-2xl text-slate-500 text-xs italic">
              {t('comments.empty', 'No comments recorded for this daily update.')}
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => {
                const commentId = comment.commentId || comment.id
                const authorName = comment.clientName || comment.username || comment.client?.fullNameEn || comment.client?.fullNameAr || 'Client'
                const hasReply = Boolean(comment.adminReply || comment.reply)
                const isHighlighted = String(commentId) === String(highlightedCommentId)

                return (
                  <div
                    key={commentId}
                    ref={(el) => {
                      if (el) commentRefs.current[String(commentId)] = el
                    }}
                    className={`bg-surface-card border rounded-2xl p-5 space-y-4 shadow-sm transition-all duration-500 ${
                      isHighlighted
                        ? 'border-brand-500 ring-2 ring-brand-500/60 bg-brand-950/40 shadow-glow-indigo animate-pulse'
                        : 'border-surface-border hover:border-slate-700'
                    }`}
                  >
                    {/* Header: Author + Date + Actions */}
                    <div className="flex items-start justify-between gap-4 border-b border-surface-border/60 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-900/60 border border-brand-700/50 flex items-center justify-center text-xs font-bold text-brand-300">
                          {authorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{authorName}</p>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenReply(comment)}
                          className="text-xs py-1 px-3 flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                          </svg>
                          {hasReply ? t('comments.edit_reply', 'Edit Reply') : t('comments.reply_button', 'Reply')}
                        </Button>

                        <button
                          type="button"
                          onClick={() => handleOpenDelete(comment)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                          title={t('comments.delete_button', 'Delete')}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Client Comment Content */}
                    <div className="bg-slate-900/60 rounded-xl p-3.5 border border-surface-border/40">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                        Client Comment
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">
                        {comment.text || comment.commentText || comment.content || '—'}
                      </p>
                    </div>

                    {/* Admin Reply Section (if reply exists) */}
                    {hasReply && (
                      <div className="bg-brand-950/30 border border-brand-800/40 rounded-xl p-3.5 ms-4 border-s-4 border-s-brand-500 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                            {t('comments.admin_reply', 'Admin Reply')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-sans">
                          {comment.adminReply || comment.reply}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Reply Modal */}
      <Modal
        isOpen={replyModalOpen}
        onClose={() => {
          setReplyModalOpen(false)
          setActiveComment(null)
        }}
        title={t('comments.reply_modal_title', 'Reply to Client Comment')}
        size="md"
      >
        {activeComment && (
          <form onSubmit={handleSaveReply} className="space-y-4">
            {/* Context snippet */}
            <div className="bg-slate-900 p-3 rounded-xl border border-surface-border text-xs">
              <span className="text-slate-500 font-semibold block mb-0.5">Original Comment:</span>
              <p className="text-slate-300 italic line-clamp-2">
                "{activeComment.text || activeComment.commentText || activeComment.content}"
              </p>
            </div>

            {/* Reply Textarea */}
            <div className="space-y-1.5">
              <label htmlFor="admin-reply-input" className="text-xs font-semibold text-slate-300 block">
                {t('comments.reply_label', 'Your Official Reply')} <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="admin-reply-input"
                rows={4}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t('comments.reply_placeholder', 'Type your official response to the client...')}
                className="w-full bg-slate-900 border border-surface-border rounded-xl p-3 text-xs text-slate-200
                  focus:outline-none focus:ring-2 focus:ring-brand-500/40 leading-relaxed scrollbar-thin"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setReplyModalOpen(false)
                  setActiveComment(null)
                }}
                disabled={submittingReply}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submittingReply || !replyText.trim()}
              >
                {submittingReply ? t('comments.submitting_reply', 'Saving...') : t('common.submit', 'Save Reply')}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setCommentToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title={t('comments.confirm_delete_title', 'Delete Comment')}
        message={t('comments.confirm_delete_message', 'Are you sure you want to delete this comment? This action cannot be undone.')}
        loading={deleting}
        confirmLabel={t('comments.delete_button', 'Delete')}
      />
    </div>
  )
}
