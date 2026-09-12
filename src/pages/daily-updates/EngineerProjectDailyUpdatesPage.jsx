import { getEngineerDailyUpdates } from '@/api/engineerDailyUpdateApi'
import { getEngineerProject } from '@/api/projectsApi'
import EngineerDailyUpdateFormModal from '@/components/daily-updates/EngineerDailyUpdateFormModal'
import ImageLightboxModal from '@/components/daily-updates/ImageLightboxModal'
import ProjectDetailsPageFrame from '@/components/projects/ProjectDetailsPageFrame'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { optimizeCloudinaryUrl } from '@/utils/imageUtils'
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
  const [previewImage, setPreviewImage] = useState(null)
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
          <section className="rounded-2xl border border-gray-200 bg-white shadow-card">
            <div className="border-b border-gray-200 bg-gradient-to-r from-cream/60 via-white to-gray-50/80 px-5 py-6 sm:px-6 rounded-t-2xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-warm-brown">
                    {t('nav.daily_updates', { defaultValue: 'Daily Updates' })}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900">
                    {t('daily_updates.engineer_hero_title', { defaultValue: 'Capture field progress while it is still fresh.' })}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
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
                  accent="text-warm-brown"
                />
                <StatCard
                  label={t('daily_updates.pending_on_page', { defaultValue: 'Pending on this page' })}
                  value={pendingCount}
                  accent="text-amber-600"
                />
                <StatCard
                  label={t('daily_updates.approved_on_page', { defaultValue: 'Approved on this page' })}
                  value={approvedCount}
                  accent="text-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 bg-gray-50/60 px-5 py-4 md:grid-cols-[minmax(0,1fr)_220px_auto] sm:px-6 items-end rounded-b-2xl">
              <SearchableSelect
                id="filter-engineer-project-item"
                label={t('daily_updates.filter_item', { defaultValue: 'Project item' })}
                value={filters.projectItemId}
                onChange={updateFilter('projectItemId')}
                placeholder={t('daily_updates.all_items', { defaultValue: 'All items' })}
                options={projectItems.map((item) => ({
                  value: item.projectItemId,
                  label: (i18n.language === 'ar' ? item.itemNameAr : item.itemNameEn) || item.itemNameEn || item.itemNameAr,
                }))}
              />

              <SearchableSelect
                id="filter-engineer-status"
                label={t('daily_updates.filter_status', { defaultValue: 'Status' })}
                value={filters.status}
                onChange={updateFilter('status')}
                placeholder={t('daily_updates.all_statuses', { defaultValue: 'All statuses' })}
                options={[
                  { value: 'PENDING', label: 'PENDING' },
                  { value: 'APPROVED', label: 'APPROVED' },
                  { value: 'REJECTED', label: 'REJECTED' },
                ]}
              />

              <div className="flex items-end pb-1">
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
            <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-36 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : updates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-card">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-cream text-warm-brown">
                <NotebookIcon className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                {t('daily_updates.empty_title', { defaultValue: 'No daily updates yet' })}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
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
                <EngineerDailyUpdateCard
                  key={update.dailyUpdateId}
                  update={update}
                  language={i18n.language}
                  t={t}
                  onPreviewImage={(url) => setPreviewImage(url)}
                />
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs text-gray-500">
                    {t('table.page')} <span className="font-semibold text-gray-900">{page + 1}</span> {t('table.of')}{' '}
                    <span className="font-semibold text-gray-900">{totalPages}</span>
                    {totalElements > 0 && <span className="ml-2 text-gray-400">({totalElements})</span>}
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

      <ImageLightboxModal
        isOpen={Boolean(previewImage)}
        src={previewImage}
        alt="Daily Update Image"
        onClose={() => setPreviewImage(null)}
      />
    </>
  )
}

function EngineerDailyUpdateCard({ update, language, t, onPreviewImage }) {
  const itemName = language === 'ar' ? update.itemNameAr : update.itemNameEn
  const reviewerName = language === 'ar' ? update.approvedByAdminNameAr : update.approvedByAdminNameEn

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card transition-all hover:shadow-card-hover">
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="text-lg font-bold text-gray-900">{update.title}</p>
              <StatusPill status={update.status} />
            </div>
            <p className="mt-1.5 text-sm font-medium text-gray-600">{itemName || t('daily_updates.unknown_item', { defaultValue: 'Unlabeled project item' })}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
              <span>{formatDate(update.createdAt, language)}</span>
              <span>·</span>
              <span>{t('daily_updates.images_count', { defaultValue: '{{count}} image(s)', count: update.images?.length ?? 0 })}</span>
              {reviewerName && (
                <>
                  <span>·</span>
                  <span className="text-emerald-700 font-medium">{t('daily_updates.reviewed_by', { defaultValue: 'Reviewed by {{name}}', name: reviewerName })}</span>
                </>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {t('daily_updates.review_state', { defaultValue: 'Review state' })}
            </p>
            <p className="mt-1 font-bold text-gray-900">{update.status}</p>
          </div>
        </div>

        <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm leading-6 text-gray-700">
          {update.notes || t('daily_updates.no_notes', { defaultValue: 'No notes were included with this update.' })}
        </p>

        {update.images?.length > 0 && (
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            {update.images.map((image) => (
              <div
                key={image.updateImageId}
                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm transition-all hover:border-warm-brown/40"
              >
                <div
                  className="aspect-[4/3] overflow-hidden bg-gray-100 cursor-zoom-in"
                  onClick={() => onPreviewImage?.(image.imageUrl)}
                  title="Click to zoom image"
                >
                  <img
                    src={optimizeCloudinaryUrl(image.imageUrl, { width: 600 })}
                    alt={update.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-gray-200 bg-white px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
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
    <div className="rounded-xl border border-gray-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">{label}</p>
      <p className={`mt-2 text-2xl font-extrabold ${accent}`}>{value}</p>
    </div>
  )
}

function PagerButton({ children, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-warm-brown/40 hover:bg-gray-50 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function StatusPill({ status }) {
  const palette = {
    PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
    APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${palette[status] ?? palette.PENDING}`}>
      {status}
    </span>
  )
}

function ImageApprovalPill({ approved, t }) {
  if (approved == null) {
    return (
      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
        {t('daily_updates.pending', { defaultValue: 'Pending' })}
      </span>
    )
  }

  return approved ? (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
      {t('daily_updates.approved', { defaultValue: 'Approved' })}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
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