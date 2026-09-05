import { getAdminDailyUpdates } from '@/api/adminDailyUpdateApi'
import { getAdminProject } from '@/api/projectsApi'
import { getAllEngineers } from '@/api/usersApi'
import AdminDailyUpdateEvaluationModal from '@/components/daily-updates/AdminDailyUpdateEvaluationModal'
import ProjectDetailsPageFrame from '@/components/projects/ProjectDetailsPageFrame'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

const PAGE_SIZE = 10

const responseError = (err, fallback) => err?.response?.data?.message ?? fallback

export default function AdminProjectDailyUpdatesPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()

  const [project, setProject] = useState(location.state?.projectSummary ?? null)
  const [projectLoading, setProjectLoading] = useState(true)
  const [projectError, setProjectError] = useState(null)

  const [engineers, setEngineers] = useState([])
  const [filterLoading, setFilterLoading] = useState(false)

  const [updates, setUpdates] = useState([])
  const [updatesLoading, setUpdatesLoading] = useState(false)
  const [updatesError, setUpdatesError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [selectedUpdate, setSelectedUpdate] = useState(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [filters, setFilters] = useState({
    projectItemId: '',
    engineerId: '',
    status: '',
  })

  const fetchProject = useCallback(async () => {
    if (!projectId) return

    setProjectLoading(true)
    setProjectError(null)

    try {
      const { data } = await getAdminProject(projectId)
      setProject(data.data ?? null)
    } catch (err) {
      setProjectError(responseError(err, t('errors.generic')))
      setProject(null)
    } finally {
      setProjectLoading(false)
    }
  }, [projectId, t])

  const fetchEngineers = useCallback(async () => {
    setFilterLoading(true)

    try {
      const { data } = await getAllEngineers(0, 200)
      setEngineers(data.data?.content ?? [])
    } catch (err) {
      setUpdatesError(responseError(err, t('errors.generic')))
    } finally {
      setFilterLoading(false)
    }
  }, [t])

  const fetchUpdates = useCallback(async () => {
    if (!projectId) return

    setUpdatesLoading(true)
    setUpdatesError(null)

    try {
      const { data } = await getAdminDailyUpdates(projectId, page, PAGE_SIZE, {
        projectItemId: filters.projectItemId || undefined,
        engineerId: filters.engineerId || undefined,
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
  }, [filters.engineerId, filters.projectItemId, filters.status, page, projectId, t])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  useEffect(() => {
    fetchEngineers()
  }, [fetchEngineers])

  useEffect(() => {
    fetchUpdates()
  }, [fetchUpdates])

  const projectName = i18n.language === 'ar' ? project?.nameAr : project?.nameEn
  const projectAddress = i18n.language === 'ar' ? project?.addressAr : project?.addressEn
  const projectMeta = project ? [project.clientName, project.engineerName].filter(Boolean).join(' · ') : null
  const projectItems = [...(project?.items ?? [])].sort(
    (left, right) => (left.sequenceOrder ?? 0) - (right.sequenceOrder ?? 0),
  )

  const pendingCount = updates.filter((update) => update.status === 'PENDING').length
  const rejectedCount = updates.filter((update) => update.status === 'REJECTED').length

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
        title={projectLoading ? t('common.loading') : projectName || t('nav.daily_updates')}
        subtitle={projectAddress || t('daily_updates.admin_page_subtitle')}
        metaLine={projectMeta}
        error={projectError}
        success={success}
        onClearError={() => setProjectError(null)}
        onClearSuccess={() => setSuccess(null)}
        backLabel={t('projects.details')}
        onBack={() => navigate(`/admin/projects/${projectId}`, { state: { projectSummary: project } })}
        emptyMessage={t('projects.not_found')}
      >
        <div className="space-y-5">
          <section className="overflow-hidden rounded-3xl border border-surface-border bg-slate-900/40 shadow-xl">
            <div className="bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.12),transparent_35%)] px-5 py-6 sm:px-6">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300/80">
                  {t('nav.daily_updates')}
                </p>
                <h2 className="mt-3 text-2xl font-bold text-white">
                  {t('daily_updates.admin_hero_title')}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {t('daily_updates.admin_hero_copy')}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard label={t('daily_updates.total_updates')} value={totalElements} accent="text-amber-300" />
                <StatCard label={t('daily_updates.pending_on_page')} value={pendingCount} accent="text-cyan-300" />
                <StatCard label={t('daily_updates.rejected_on_page')} value={rejectedCount} accent="text-rose-300" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-surface-border px-5 py-4 xl:grid-cols-[minmax(0,1fr)_220px_220px_auto] sm:px-6">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('daily_updates.filter_item')}
                <select className="input-base mt-2 text-sm" value={filters.projectItemId} onChange={updateFilter('projectItemId')}>
                  <option value="">{t('daily_updates.all_items')}</option>
                  {projectItems.map((item) => (
                    <option key={item.projectItemId} value={item.projectItemId}>
                      {(i18n.language === 'ar' ? item.itemNameAr : item.itemNameEn) || item.itemNameEn || item.itemNameAr}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('daily_updates.filter_engineer')}
                <select
                  className="input-base mt-2 text-sm"
                  value={filters.engineerId}
                  onChange={updateFilter('engineerId')}
                  disabled={filterLoading}
                >
                  <option value="">{t('daily_updates.all_engineers')}</option>
                  {engineers.map((engineer) => (
                    <option key={engineer.userId} value={engineer.userId}>
                      {(i18n.language === 'ar' ? engineer.fullNameAr : engineer.fullNameEn) || engineer.username}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('daily_updates.filter_status')}
                <select className="input-base mt-2 text-sm" value={filters.status} onChange={updateFilter('status')}>
                  <option value="">{t('daily_updates.all_statuses')}</option>
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
                    setFilters({ projectItemId: '', engineerId: '', status: '' })
                    setPage(0)
                  }}
                  disabled={!filters.projectItemId && !filters.engineerId && !filters.status}
                >
                  {t('daily_updates.clear_filters')}
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
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-surface-border bg-slate-950/60 text-amber-300">
                <NotebookIcon className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{t('daily_updates.empty_title')}</h3>
              <p className="mt-2 text-sm text-slate-400">{t('daily_updates.empty_copy')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {updates.map((update) => (
                <AdminDailyUpdateCard
                  key={update.dailyUpdateId}
                  update={update}
                  language={i18n.language}
                  t={t}
                  onEvaluate={() => setSelectedUpdate(update)}
                />
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

      <AdminDailyUpdateEvaluationModal
        isOpen={Boolean(selectedUpdate)}
        onClose={() => setSelectedUpdate(null)}
        update={selectedUpdate}
        onSaved={async () => {
          setSuccess(t('daily_updates.evaluation_success'))
          setSelectedUpdate(null)

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

function AdminDailyUpdateCard({ update, language, t, onEvaluate }) {
  const itemName = language === 'ar' ? update.itemNameAr : update.itemNameEn
  const engineerName = language === 'ar' ? update.engineerNameAr : update.engineerNameEn
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
            <p className="mt-2 text-sm text-slate-400">{itemName || t('daily_updates.unknown_item')}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
              <span>{t('daily_updates.published_by', { name: engineerName || update.engineerUsername || '—' })}</span>
              <span>{formatDate(update.createdAt, language)}</span>
              <span>{t('daily_updates.images_count', { count: update.images?.length ?? 0 })}</span>
              {reviewerName && <span>{t('daily_updates.approved_by', { name: reviewerName })}</span>}
            </div>
          </div>

          <Button type="button" className="w-auto" onClick={onEvaluate}>
            {update.status === 'PENDING' ? t('daily_updates.evaluate') : t('daily_updates.edit_evaluation')}
          </Button>
        </div>

        <p className="rounded-2xl border border-surface-border bg-slate-950/40 px-4 py-3 text-sm leading-6 text-slate-300">
          {update.notes || t('daily_updates.no_notes')}
        </p>

        {update.images?.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {update.images.map((image) => (
              <div key={image.updateImageId} className="overflow-hidden rounded-2xl border border-surface-border bg-slate-950/50">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={image.imageUrl} alt={update.title} className="h-full w-full object-cover" />
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">{t('daily_updates.image_review')}</p>
                  <ImageApprovalPill approved={image.approved} t={t} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-surface-border bg-slate-950/40 px-4 py-4 text-sm text-slate-400">
            {t('daily_updates.no_images')}
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
        {t('daily_updates.pending')}
      </span>
    )
  }

  return approved ? (
    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
      {t('daily_updates.approved')}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-200">
      {t('daily_updates.rejected')}
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