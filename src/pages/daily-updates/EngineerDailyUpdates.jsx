import { getEngineerDailyUpdates } from '@/api/engineerDailyUpdateApi'
import { getAssignedEngineerProjects, getEngineerProject } from '@/api/projectsApi'
import DataTable from '@/components/admin/DataTable'
import {
    DailyUpdateStatusPill,
    DailyUpdatesFilterPanel,
    DailyUpdatesPlaceholder,
    DailyUpdatesSelectionCard,
    formatDailyUpdateDate,
} from '@/components/daily-updates/DailyUpdatesWorkspace'
import EngineerDailyUpdateFormModal from '@/components/daily-updates/EngineerDailyUpdateFormModal'
import DailyUpdateDetailsModal from '@/components/daily-updates/DailyUpdateDetailsModal'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const PAGE_SIZE = 10
const PROJECT_PAGE_SIZE = 200
const EMPTY_FILTERS = {
  projectItemId: '',
  status: '',
}

const responseError = (err, fallback) => err?.response?.data?.message ?? err?.message ?? fallback

export default function EngineerDailyUpdates() {
  const { t, i18n } = useTranslation()

  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectsError, setProjectsError] = useState(null)

  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedProjectLoading, setSelectedProjectLoading] = useState(false)
  const [selectedProjectError, setSelectedProjectError] = useState(null)

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(0)
  const [updates, setUpdates] = useState([])
  const [updatesLoading, setUpdatesLoading] = useState(false)
  const [updatesError, setUpdatesError] = useState(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedUpdateForDetails, setSelectedUpdateForDetails] = useState(null)
  const [success, setSuccess] = useState(null)

  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true)
    setProjectsError(null)

    try {
      const { data } = await getAssignedEngineerProjects(0, PROJECT_PAGE_SIZE)
      setProjects(data.data?.content ?? [])
    } catch (err) {
      setProjectsError(responseError(err, t('errors.generic')))
    } finally {
      setProjectsLoading(false)
    }
  }, [t])

  const fetchSelectedProject = useCallback(async () => {
    if (!selectedProjectId) return

    const projectSummary = projects.find((project) => String(project.projectId) === String(selectedProjectId)) ?? null

    setSelectedProject(projectSummary)
    setSelectedProjectLoading(true)
    setSelectedProjectError(null)

    try {
      const { data } = await getEngineerProject(selectedProjectId)
      setSelectedProject((current) => ({ ...(projectSummary ?? current ?? {}), ...(data.data ?? {}) }))
    } catch (err) {
      setSelectedProjectError(responseError(err, t('errors.generic')))
    } finally {
      setSelectedProjectLoading(false)
    }
  }, [projects, selectedProjectId, t])

  const fetchUpdates = useCallback(async () => {
    if (!selectedProjectId) return

    setUpdatesLoading(true)
    setUpdatesError(null)

    try {
      const { data } = await getEngineerDailyUpdates(selectedProjectId, page, PAGE_SIZE, {
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
  }, [filters.projectItemId, filters.status, page, selectedProjectId, t])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedProject(null)
      setSelectedProjectError(null)
      setUpdates([])
      setTotalPages(0)
      setTotalElements(0)
      return
    }

    fetchSelectedProject()
  }, [fetchSelectedProject, selectedProjectId])

  useEffect(() => {
    if (!selectedProjectId) return
    fetchUpdates()
  }, [fetchUpdates, selectedProjectId])

  const projectItems = [...(selectedProject?.items ?? [])].sort(
    (left, right) => (left.sequenceOrder ?? 0) - (right.sequenceOrder ?? 0),
  )
  const filterDisabled = !selectedProjectId || selectedProjectLoading
  const clearFiltersDisabled = !filters.projectItemId && !filters.status
  const createDisabled = !selectedProjectId || selectedProjectLoading || projectItems.length === 0
  const selectedProjectSummary = selectedProject
    ? [
        { label: t('projects.client'), value: selectedProject.clientName ?? '-' },
        { label: t('projects.status'), value: selectedProject.overallStatus ?? '-' },
      ]
    : []

  const handleProjectChange = (event) => {
    const nextProjectId = event.target.value

    setSelectedProjectId(nextProjectId)
    setModalOpen(false)
    setSuccess(null)
    setFilters(EMPTY_FILTERS)
    setPage(0)
    setUpdates([])
    setTotalPages(0)
    setTotalElements(0)
  }

  const updateFilter = (key) => (event) => {
    const value = event.target.value
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(0)
  }

  const columns = [
    {
      key: 'title',
      header: t('daily_updates.update_title'),
      className: 'min-w-[280px]',
      render: (_, update) => (
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">{update.title}</p>
          <p className="mt-1 truncate text-xs text-gray-500">
            {summarizeText(update.notes, t('daily_updates.no_notes'))}
          </p>
          {update.status === 'REJECTED' && update.rejectionReason && (
            <div className="mt-1.5 flex items-start gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
              <span className="font-bold shrink-0">{t('daily_updates.rejection_reason')}:</span>
              <span className="truncate">{update.rejectionReason}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'projectItem',
      header: t('daily_updates.project_item'),
      render: (_, update) => localizedValue(i18n.language, update.itemNameAr, update.itemNameEn),
    },
    {
      key: 'status',
      header: t('daily_updates.filter_status'),
      render: (value) => <DailyUpdateStatusPill status={value} />,
    },
    {
      key: 'createdAt',
      header: t('daily_updates.submitted_at'),
      render: (value) => formatDailyUpdateDate(value, i18n.language),
    },
    {
      key: 'images',
      header: t('daily_updates.images'),
      render: (_, update) => update.images?.length ?? 0,
    },
    {
      key: 'reviewer',
      header: t('daily_updates.reviewer'),
      render: (_, update) => localizedValue(
        i18n.language,
        update.approvedByAdminNameAr,
        update.approvedByAdminNameEn,
      ),
    },
    {
      key: 'actions',
      header: t('projects.actions', { defaultValue: 'Actions' }),
      headerClass: 'text-center',
      className: 'text-center',
      render: (_, update) => (
        <div className="flex items-center justify-center">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
              bg-white border border-gray-200 text-gray-700 hover:text-warm-brown hover:border-warm-brown/40 hover:bg-warm-brown/5
              shadow-2xs transition-all duration-150 cursor-pointer active:scale-[0.98]"
            onClick={() => setSelectedUpdateForDetails(update)}
          >
            <EyeIcon className="w-3.5 h-3.5 text-warm-brown" />
            <span>{t('daily_updates.view_update', { defaultValue: 'View Details' })}</span>
          </button>
        </div>
      ),
    },
  ]

  /* ── Mobile Card Renderer ───────────────────────────── */
  const renderEngineerUpdateCard = (update) => {
    return (
      <div
        onClick={() => setSelectedUpdateForDetails(update)}
        className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs hover:shadow-md transition-all duration-200 space-y-3 cursor-pointer active:scale-[0.99]"
      >
        {/* Top Header: Icon + Title & Item + Status & Image badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold shrink-0 ${
                update.status === 'APPROVED'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : update.status === 'REJECTED'
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              <NotebookIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-gray-900 font-bold text-sm truncate">
                {update.title}
              </h3>
              <p className="text-gray-500 text-xs truncate">
                {localizedValue(i18n.language, update.itemNameAr, update.itemNameEn)}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <DailyUpdateStatusPill status={update.status} />
            {update.images?.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                <PhotoIcon className="w-3 h-3" />
                <span>{update.images.length}</span>
              </span>
            )}
          </div>
        </div>

        {/* Notes preview if available */}
        {update.notes && (
          <p className="text-xs text-gray-600 bg-gray-50/80 rounded-xl p-2.5 border border-gray-100 break-words line-clamp-3">
            {update.notes}
          </p>
        )}

        {/* Rejection reason if available */}
        {update.status === 'REJECTED' && update.rejectionReason && (
          <div className="flex items-start gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 p-2.5 text-xs text-rose-700">
            <span className="font-bold shrink-0">{t('daily_updates.rejection_reason')}:</span>
            <span className="break-words">{update.rejectionReason}</span>
          </div>
        )}

        {/* Details Grid */}
        <div className="bg-gray-50/80 rounded-xl p-3 space-y-2 text-xs border border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500 font-medium">{t('daily_updates.submitted_at')}</span>
            <span className="text-gray-700">{formatDailyUpdateDate(update.createdAt, i18n.language)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500 font-medium">{t('daily_updates.images')}</span>
            <span className="text-gray-800 font-semibold font-mono">{update.images?.length ?? 0}</span>
          </div>
          {(update.approvedByAdminNameAr || update.approvedByAdminNameEn) && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 font-medium">{t('daily_updates.reviewer')}</span>
              <span className="text-gray-800 font-semibold">
                {localizedValue(i18n.language, update.approvedByAdminNameAr, update.approvedByAdminNameEn)}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setSelectedUpdateForDetails(update)}
            className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold
              bg-white border border-gray-200 text-gray-700 hover:text-warm-brown hover:border-warm-brown/40 hover:bg-warm-brown/5
              shadow-2xs transition-all duration-150 cursor-pointer active:scale-[0.98]"
          >
            <EyeIcon className="w-3.5 h-3.5 text-warm-brown" />
            <span>{t('daily_updates.view_update', { defaultValue: 'View Details' })}</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-5">
        <DailyUpdatesSelectionCard
          eyebrow={t('nav.daily_updates')}
          title={t('nav.daily_updates')}
          description={t('daily_updates.engineer_hero_copy')}
          label={t('daily_updates.select_project')}
          value={selectedProjectId}
          onChange={handleProjectChange}
          options={projects}
          placeholder={t('daily_updates.select_project_placeholder')}
          getOptionLabel={(project) => formatProjectOption(project, i18n.language)}
          loading={projectsLoading}
          loadingLabel={t('common.loading')}
          summary={selectedProjectSummary}
          action={(
            <Button
              type="button"
              className="w-auto"
              onClick={() => setModalOpen(true)}
              disabled={createDisabled}
            >
              + {t('daily_updates.create_title')}
            </Button>
          )}
        />

        <Alert message={projectsError} variant="error" onClose={() => setProjectsError(null)} />
        <Alert message={selectedProjectError} variant="error" onClose={() => setSelectedProjectError(null)} />
        <Alert message={updatesError} variant="error" onClose={() => setUpdatesError(null)} />
        <Alert message={success} variant="success" onClose={() => setSuccess(null)} />

        {!selectedProjectId ? (
          <DailyUpdatesPlaceholder
            title={t('daily_updates.select_project_empty_title')}
            copy={t('daily_updates.select_project_empty_copy')}
          />
        ) : (
          <>
            <DailyUpdatesFilterPanel
              actions={(
                <Button
                  type="button"
                  variant="ghost"
                  className="w-auto"
                  onClick={() => {
                    setFilters(EMPTY_FILTERS)
                    setPage(0)
                  }}
                  disabled={clearFiltersDisabled}
                >
                  {t('daily_updates.clear_filters')}
                </Button>
              )}
            >
              <SearchableSelect
                id="filter-engineer-updates-item"
                label={t('daily_updates.filter_item')}
                value={filters.projectItemId}
                onChange={updateFilter('projectItemId')}
                disabled={filterDisabled}
                placeholder={t('daily_updates.all_items')}
                options={projectItems.map((item) => ({
                  value: item.projectItemId,
                  label: localizedValue(i18n.language, item.itemNameAr, item.itemNameEn),
                }))}
              />

              <SearchableSelect
                id="filter-engineer-updates-status"
                label={t('daily_updates.filter_status')}
                value={filters.status}
                onChange={updateFilter('status')}
                disabled={filterDisabled}
                placeholder={t('daily_updates.all_statuses')}
                options={[
                  { value: 'PENDING', label: 'PENDING' },
                  { value: 'APPROVED', label: 'APPROVED' },
                  { value: 'REJECTED', label: 'REJECTED' },
                ]}
              />
            </DailyUpdatesFilterPanel>

            <div className="md:rounded-2xl md:border md:border-gray-200 md:bg-white md:p-5 md:shadow-card md:sm:p-6">
              <DataTable
                columns={columns}
                data={updates}
                loading={updatesLoading}
                totalPages={totalPages}
                currentPage={page}
                onPageChange={setPage}
                totalElements={totalElements}
                pageSize={PAGE_SIZE}
                emptyMessage={t('daily_updates.empty_copy')}
                keyExtractor={(update) => update.dailyUpdateId}
                renderMobileCard={renderEngineerUpdateCard}
              />
            </div>
          </>
        )}
      </div>

      <EngineerDailyUpdateFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={selectedProjectId}
        projectItems={projectItems}
        onCreated={async () => {
          setSuccess(t('daily_updates.create_success'))
          setModalOpen(false)

          if (page === 0) {
            await fetchUpdates()
            return
          }

          setPage(0)
        }}
      />

      <DailyUpdateDetailsModal
        isOpen={Boolean(selectedUpdateForDetails)}
        onClose={() => setSelectedUpdateForDetails(null)}
        update={selectedUpdateForDetails}
      />
    </>
  )
}

function formatProjectOption(project, language) {
  const name = localizedValue(language, project.nameAr, project.nameEn)
  const address = localizedValue(language, project.addressAr, project.addressEn, '')

  return address ? `${name} - ${address}` : name
}

function localizedValue(language, arabicValue, englishValue, fallback = '-') {
  if (language === 'ar') {
    return arabicValue || englishValue || fallback
  }

  return englishValue || arabicValue || fallback
}

function summarizeText(value, fallback) {
  const resolvedValue = value?.trim()
  if (!resolvedValue) return fallback
  return resolvedValue.length > 120 ? `${resolvedValue.slice(0, 117)}...` : resolvedValue
}

function NotebookIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  )
}

function PhotoIcon({ className = 'w-3 h-3' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  )
}

function EyeIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}