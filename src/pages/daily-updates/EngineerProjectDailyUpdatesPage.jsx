import { getEngineerDailyUpdates } from '@/api/engineerDailyUpdateApi'
import { getEngineerProject } from '@/api/projectsApi'
import EngineerDailyUpdateFormModal from '@/components/daily-updates/EngineerDailyUpdateFormModal'
import ProjectDetailsPageFrame from '@/components/projects/ProjectDetailsPageFrame'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

const PAGE_SIZE = 10

const responseError = (err, fallback) => err?.response?.data?.message ?? fallback

export default function EngineerProjectDailyUpdatesPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()

  const [project, setProject] = useState(location.state?.projectSummary ?? null)
  const [projectLoading, setProjectLoading] = useState(true)
  const [projectError, setProjectError] = useState(null)

  const [updates, setUpdates] = useState([])
  const [updatesLoading, setUpdatesLoading] = useState(false)
  const [updatesError, setUpdatesError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [filters, setFilters] = useState({
    projectItemId: '',
    status: '',
  })

  const fetchProject = useCallback(async () => {
    if (!projectId) return

    setProjectLoading(true)
    setProjectError(null)

    try {
      const { data } = await getEngineerProject(projectId)
      setProject((current) => ({ ...(current ?? {}), ...(data.data ?? {}) }))
    } catch (err) {
      setProjectError(responseError(err, t('errors.generic')))
      setProject(null)
    } finally {
      setProjectLoading(false)
    }
  }, [projectId, t])

  const fetchUpdates = useCallback(async () => {
    if (!projectId) return

    setUpdatesLoading(true)
    setUpdatesError(null)

    try {
      const { data } = await getEngineerDailyUpdates(projectId, page, PAGE_SIZE, {
        projectItemId: filters.projectItemId || undefined,
        status: filters.status || undefined,
      })

      const updatesPage = data.data
      setUpdates(updatesPage?.content ?? [])
      setTotalPages(updatesPage?.totalPages ?? 0)
      setTotalElements(updatesPage?.totalElements ?? 0)
    } catch (err) {
      setUpdatesError(responseError(err, t('errors.generic')))
    } finally {
      setUpdatesLoading(false)
    }
  }, [filters.projectItemId, filters.status, page, projectId, t])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  useEffect(() => {
    fetchUpdates()
  }, [fetchUpdates])

  const projectName = i18n.language === 'ar' ? project?.nameAr : project?.nameEn
  const projectAddress = i18n.language === 'ar' ? project?.addressAr : project?.addressEn
  const projectItems = [...(project?.items ?? [])].sort(
    (left, right) => (left.sequenceOrder ?? 0) - (right.sequenceOrder ?? 0),
  )

  const pendingCount = updates.filter((update) => update.status === 'PENDING').length
  const approvedCount = updates.filter((update) => update.status === 'APPROVED').length

  const updateFilter = (key) => (event) => {
    const value = event.target.value
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(0)
  }

  return (
    <>
      <ProjectDetailsPageFrame
        loading={projectLoading}
        project={project}
        title={projectLoading ? t('common.loading') : projectName || t('nav.daily_updates', { defaultValue: 'Daily Updates' })}
        subtitle={projectAddress || t('daily_updates.engineer_page_subtitle', { defaultValue: 'Publish progress updates, upload site photos directly to Cloudinary, and track review decisions.' })}
        metaLine={project?.engineerName ?? null}
        error={projectError}
        success={success}
        onClearError={() => setProjectError(null)}
        onClearSuccess={() => setSuccess(null)}
        backLabel={t('projects.details', { defaultValue: 'Project Details' })}
        onBack={() => navigate(`/engineer/projects/${projectId}`, { state: { projectSummary: project } })}
        emptyMessage={t('projects.not_found')}
      >
        <div className="space-y-5">
          <section className="overflow-hidden rounded-3xl border border-surface-border bg-slate-900/40 shadow-xl">
            <div className="bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_35%)] px-5 py-6 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                    {t('nav.daily_updates', { defaultValue: 'Daily Updates' })}
                  </p>
                  <h2 className="mt-3 text-2xl font-bold text-white">
                    {t('daily_updates.engineer_hero_title', { defaultValue: 'Capture field progress while it is still fresh.' })}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {t('daily_updates.engineer_hero_copy', { defaultValue: 'Upload site photos straight to Cloudinary, attach notes for a specific project item, and keep a clean approval trail for every submission.' })}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="button" className="w-auto" onClick={() => setModalOpen(true)} disabled={!projectItems.length}>
                    {t('daily_updates.create_title', { defaultValue: 'Create daily update' })}
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard
                  label={t('daily_updates.total_updates', { defaultValue: 'Total updates' })}
                  value={totalElements}
                  accent="text-cyan-300"
                />
                <StatCard
                  label={t('daily_updates.pending_on_page', { defaultValue: 'Pending on this page' })}
                  value={pendingCount}
                  accent="text-amber-300"
                />
                <StatCard
                  label={t('daily_updates.approved_on_page', { defaultValue: 'Approved on this page' })}
                  value={approvedCount}
                  accent="text-emerald-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-surface-border px-5 py-4 md:grid-cols-[minmax(0,1fr)_220px_auto] sm:px-6">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('daily_updates.filter_item', { defaultValue: 'Project item' })}
                <select
                  className="input-base mt-2 text-sm"
                  value={filters.projectItemId}
                  onChange={updateFilter('projectItemId')}
                >
                  <option value="">{t('daily_updates.all_items', { defaultValue: 'All items' })}</option>
                  {projectItems.map((item) => (
                    <option key={item.projectItemId} value={item.projectItemId}>
                      {(i18n.language === 'ar' ? item.itemNameAr : item.itemNameEn) || item.itemNameEn || item.itemNameAr}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('daily_updates.filter_status', { defaultValue: 'Status' })}
                <select
                  className="input-base mt-2 text-sm"
                  value={filters.status}
                  onChange={updateFilter('status')}
                >
                  <option value="">{t('daily_updates.all_statuses', { defaultValue: 'All statuses' })}</option>
                  {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-auto"
                  onClick={() => {
                    setFilters({ projectItemId: '', status: '' })
                    setPage(0)
                  }}
                  disabled={!filters.projectItemId && !filters.status}
                >
                  {t('daily_updates.clear_filters', { defaultValue: 'Clear filters' })}
                </Button>
              </div>
            </div>
          </section>

          <Alert message={updatesError} variant="error" onClose={() => setUpdatesError(null)} />

          {updatesLoading ? (
            <div className="space-y-3 rounded-3xl border border-surface-border bg-slate-900/40 p-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-36 animate-pulse rounded-2xl bg-slate-800/60" />
              ))}
            </div>
          ) : updates.length === 0 ? (
            <div className="rounded-3xl border border-surface-border bg-slate-900/40 p-10 text-center shadow-xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-surface-border bg-slate-950/60 text-cyan-300">
                <NotebookIcon className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">
                {t('daily_updates.empty_title', { defaultValue: 'No daily updates yet' })}
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                {t('daily_updates.empty_copy', { defaultValue: 'Create the first update for this project to start the review timeline.' })}
              </p>
              <div className="mt-5">
                <Button type="button" className="w-auto" onClick={() => setModalOpen(true)} disabled={!projectItems.length}>
                  {t('daily_updates.create_title', { defaultValue: 'Create daily update' })}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {updates.map((update) => (
                <EngineerDailyUpdateCard key={update.dailyUpdateId} update={update} language={i18n.language} t={t} />
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-between rounded-2xl border border-surface-border bg-slate-900/40 px-4 py-3">
                  <p className="text-xs text-slate-500">
                    {t('table.page')} <span className="font-medium text-slate-200">{page + 1}</span> {t('table.of')} <span className="font-medium text-slate-200">{totalPages}</span>
                    {totalElements > 0 && <span className="ml-2 text-slate-600">({totalElements})</span>}
                  </p>
                  <div className="flex gap-2">
                    <PagerButton disabled={page === 0} onClick={() => setPage((current) => current - 1)}>
                      {t('table.previous')}
                    </PagerButton>
                    <PagerButton disabled={page >= totalPages - 1} onClick={() => setPage((current) => current + 1)}>
                      {t('table.next')}
                    </PagerButton>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ProjectDetailsPageFrame>

      <EngineerDailyUpdateFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={projectId}
        projectItems={projectItems}
        onCreated={async () => {
          setSuccess(t('daily_updates.create_success', { defaultValue: 'Daily update submitted successfully.' }))
          if (page === 0) {
            await fetchUpdates()
            return
          }

          setPage(0)
        }}
      />
    </>
  )
}

function EngineerDailyUpdateCard({ update, language, t }) {
  const itemName = language === 'ar' ? update.itemNameAr : update.itemNameEn
  const reviewerName = language === 'ar' ? update.approvedByAdminNameAr : update.approvedByAdminNameEn

  return (
    <article className="overflow-hidden rounded-3xl border border-surface-border bg-slate-900/40 shadow-xl">
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold text-white">{update.title}</p>
              <StatusPill status={update.status} />
            </div>
            <p className="mt-2 text-sm text-slate-400">{itemName || t('daily_updates.unknown_item', { defaultValue: 'Unlabeled project item' })}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
              <span>{formatDate(update.createdAt, language)}</span>
              <span>{t('daily_updates.images_count', { defaultValue: '{{count}} image(s)', count: update.images?.length ?? 0 })}</span>
              {reviewerName && <span>{t('daily_updates.reviewed_by', { defaultValue: 'Reviewed by {{name}}', name: reviewerName })}</span>}
            </div>
          </div>

          <div className="rounded-2xl border border-surface-border bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">
              {t('daily_updates.review_state', { defaultValue: 'Review state' })}
            </p>
            <p className="mt-1 font-semibold text-white">{update.status}</p>
          </div>
        </div>

        <p className="rounded-2xl border border-surface-border bg-slate-950/40 px-4 py-3 text-sm leading-6 text-slate-300">
          {update.notes || t('daily_updates.no_notes', { defaultValue: 'No notes were included with this update.' })}
        </p>

        {update.images?.length > 0 && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {update.images.map((image) => (
              <div key={image.updateImageId} className="overflow-hidden rounded-2xl border border-surface-border bg-slate-950/50">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={image.imageUrl} alt={update.title} className="h-full w-full object-cover" />
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">
                    {t('daily_updates.image_review', { defaultValue: 'Image review' })}
                  </p>
                  <ImageApprovalPill approved={image.approved} t={t} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-slate-950/45 px-4 py-4 backdrop-blur-sm">
      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  )
}

function PagerButton({ children, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-surface-border px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-brand-500/60 hover:text-white disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function StatusPill({ status }) {
  const palette = {
    PENDING: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    APPROVED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    REJECTED: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${palette[status] ?? palette.PENDING}`}>
      {status}
    </span>
  )
}

function ImageApprovalPill({ approved, t }) {
  if (approved == null) {
    return (
      <span className="inline-flex items-center rounded-full border border-slate-600 bg-slate-800/80 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
        {t('daily_updates.pending', { defaultValue: 'Pending' })}
      </span>
    )
  }

  return approved ? (
    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
      {t('daily_updates.approved', { defaultValue: 'Approved' })}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-200">
      {t('daily_updates.rejected', { defaultValue: 'Rejected' })}
    </span>
  )
}

function formatDate(value, language) {
  if (!value) return '—'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

function NotebookIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 21V5.25A2.25 2.25 0 0 0 17.25 3H6.75A2.25 2.25 0 0 0 4.5 5.25V21m15 0h-15m15 0h1.125c.621 0 1.125-.504 1.125-1.125V7.5c0-.621-.504-1.125-1.125-1.125H19.5M4.5 21H3.375A1.125 1.125 0 0 1 2.25 19.875V7.5c0-.621.504-1.125 1.125-1.125H4.5m9 1.5h-3m3 3h-3m3 3h-3" />
    </svg>
  )
}