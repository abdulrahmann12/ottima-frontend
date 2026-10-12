import { getAdminDailyUpdates } from '@/api/adminDailyUpdateApi'
import { getAdminProject, getAdminProjects } from '@/api/projectsApi'
import { getAllEngineers } from '@/api/usersApi'
import DataTable from '@/components/admin/DataTable'
import AdminDailyUpdateEvaluationModal from '@/components/daily-updates/AdminDailyUpdateEvaluationModal'
import {
    DailyUpdateStatusPill,
    DailyUpdatesFilterPanel,
    DailyUpdatesPlaceholder,
    DailyUpdatesSelectionCard,
    formatDailyUpdateDate,
} from '@/components/daily-updates/DailyUpdatesWorkspace'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

const PAGE_SIZE = 10
const PROJECT_PAGE_SIZE = 200
const FILTER_PAGE_SIZE = 200
const EMPTY_FILTERS = {
  projectItemId: '',
  engineerId: '',
  status: '',
}

const responseError = (err, fallback) => err?.response?.data?.message ?? err?.message ?? fallback

export default function AdminDailyUpdates() {
  const { t, i18n } = useTranslation()

  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectsError, setProjectsError] = useState(null)

  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedProjectLoading, setSelectedProjectLoading] = useState(false)
  const [selectedProjectError, setSelectedProjectError] = useState(null)

  const [engineers, setEngineers] = useState([])
  const [engineersLoading, setEngineersLoading] = useState(false)

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(0)
  const [updates, setUpdates] = useState([])
  const [updatesLoading, setUpdatesLoading] = useState(false)
  const [updatesError, setUpdatesError] = useState(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [selectedUpdate, setSelectedUpdate] = useState(null)
  const [success, setSuccess] = useState(null)

  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true)
    setProjectsError(null)

    try {
      const { data } = await getAdminProjects(0, PROJECT_PAGE_SIZE, { isDeleted: false })
      setProjects(data.data?.content ?? [])
    } catch (err) {
      setProjectsError(responseError(err, t('errors.generic')))
    } finally {
      setProjectsLoading(false)
    }
  }, [t])

  const fetchEngineers = useCallback(async () => {
    setEngineersLoading(true)

    try {
      const { data } = await getAllEngineers(0, FILTER_PAGE_SIZE)
      setEngineers(data.data?.content ?? [])
    } catch (err) {
      setUpdatesError(responseError(err, t('errors.generic')))
    } finally {
      setEngineersLoading(false)
    }
  }, [t])

  const fetchSelectedProject = useCallback(async () => {
    if (!selectedProjectId) return

    const projectSummary = projects.find((project) => String(project.projectId) === String(selectedProjectId)) ?? null

    setSelectedProject(projectSummary)
    setSelectedProjectLoading(true)
    setSelectedProjectError(null)

    try {
      const { data } = await getAdminProject(selectedProjectId)
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
      const { data } = await getAdminDailyUpdates(selectedProjectId, page, PAGE_SIZE, {
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
  }, [filters.engineerId, filters.projectItemId, filters.status, page, selectedProjectId, t])

  const [searchParams] = useSearchParams()
  const targetUpdateId = searchParams.get('targetUpdateId') || searchParams.get('autoSelectId')

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    fetchEngineers()
  }, [fetchEngineers])

  // Auto-find project when deep-linked via targetUpdateId query param
  useEffect(() => {
    if (!targetUpdateId || projects.length === 0 || selectedProjectId) return

    let active = true
    const resolveTargetProject = async () => {
      for (const proj of projects) {
        try {
          const { data } = await getAdminDailyUpdates(proj.projectId, 0, 50)
          const found = data.data?.content?.find(
            (item) => String(item.dailyUpdateId) === String(targetUpdateId) || String(item.id) === String(targetUpdateId)
          )
          if (found && active) {
            setSelectedProjectId(String(proj.projectId))
            setSelectedUpdate(found)
            break
          }
        } catch {
          // Check next project if error
        }
      }
    }

    resolveTargetProject()

    return () => {
      active = false
    }
  }, [projects, targetUpdateId, selectedProjectId])

  // Auto-open modal when update list loads if targetUpdateId is present
  useEffect(() => {
    if (!targetUpdateId || updates.length === 0) return

    const match = updates.find(
      (item) => String(item.dailyUpdateId) === String(targetUpdateId) || String(item.id) === String(targetUpdateId)
    )
    if (match) {
      setSelectedUpdate(match)
    }
  }, [updates, targetUpdateId])

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
  const clearFiltersDisabled = !filters.projectItemId && !filters.engineerId && !filters.status
  const selectedProjectSummary = selectedProject
    ? [
        { label: t('projects.client'), value: selectedProject.clientName ?? '-' },
        { label: t('projects.engineers', 'Engineers'), value: selectedProject.engineerName ?? '-' },
      ]
    : []

  const handleProjectChange = (event) => {
    const nextProjectId = event.target.value

    setSelectedProjectId(nextProjectId)
    setSelectedUpdate(null)
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
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-gray-900">{update.title}</p>
            <DailyUpdateStatusPill status={update.status} />
          </div>
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
      key: 'engineer',
      header: t('daily_updates.engineer_name', 'Engineers'),
      render: (_, update) => (
        <div>
          <p>{localizedValue(i18n.language, update.engineerNameAr, update.engineerNameEn)}</p>
          <p className="text-xs text-slate-500">{update.engineerUsername ?? '-'}</p>
        </div>
      ),
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
      key: 'actions',
      header: t('projects.actions'),
      headerClass: 'text-center',
      className: 'text-center',
      render: (_, update) => (
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => setSelectedUpdate(update)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
              update.status === 'PENDING'
                ? 'bg-warm-brown hover:bg-[#6B4A33] text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-700 hover:text-warm-brown hover:border-warm-brown/40 hover:bg-warm-brown/5 shadow-2xs'
            }`}
          >
            {update.status === 'PENDING' ? (
              <>
                <CheckCircleIcon className="w-3.5 h-3.5" />
                <span>{t('daily_updates.evaluate')}</span>
              </>
            ) : (
              <>
                <EditIcon className="w-3.5 h-3.5 text-warm-brown" />
                <span>{t('daily_updates.edit_evaluation')}</span>
              </>
            )}
          </button>
        </div>
      ),
    },
  ]

  /* ── Mobile Card Renderer ───────────────────────────── */
  const renderUpdateCard = (update) => {
    return (
      <div
        className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs hover:shadow-md transition-all duration-200 space-y-3"
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
            <span className="text-gray-500 font-medium">{t('daily_updates.engineer_name', 'Engineers')}</span>
            <span className="text-gray-800 font-semibold text-right">
              {localizedValue(i18n.language, update.engineerNameAr, update.engineerNameEn)}
              {update.engineerUsername && (
                <span className="text-gray-400 font-mono text-[11px] ms-1">(@{update.engineerUsername})</span>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500 font-medium">{t('daily_updates.submitted_at')}</span>
            <span className="text-gray-700">{formatDailyUpdateDate(update.createdAt, i18n.language)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500 font-medium">{t('daily_updates.images')}</span>
            <span className="text-gray-800 font-semibold font-mono">{update.images?.length ?? 0}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setSelectedUpdate(update)}
            className={`inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
              update.status === 'PENDING'
                ? 'bg-warm-brown hover:bg-[#6B4A33] text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-700 hover:text-warm-brown hover:border-warm-brown/40 hover:bg-warm-brown/5 shadow-2xs'
            }`}
          >
            {update.status === 'PENDING' ? (
              <>
                <CheckCircleIcon className="w-3.5 h-3.5" />
                <span>{t('daily_updates.evaluate')}</span>
              </>
            ) : (
              <>
                <EditIcon className="w-3.5 h-3.5 text-warm-brown" />
                <span>{t('daily_updates.edit_evaluation')}</span>
              </>
            )}
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
          description={t('daily_updates.admin_hero_copy')}
          label={t('daily_updates.select_project')}
          value={selectedProjectId}
          onChange={handleProjectChange}
          options={projects}
          placeholder={t('daily_updates.select_project_placeholder')}
          getOptionLabel={(project) => formatProjectOption(project, i18n.language)}
          loading={projectsLoading}
          loadingLabel={t('common.loading')}
          summary={selectedProjectSummary}
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
                id="filter-admin-updates-item"
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
                id="filter-admin-updates-engineer"
                label={t('daily_updates.filter_engineer')}
                value={filters.engineerId}
                onChange={updateFilter('engineerId')}
                disabled={filterDisabled || engineersLoading}
                loading={engineersLoading}
                placeholder={t('daily_updates.all_engineers')}
                options={engineers.map((engineer) => ({
                  value: engineer.userId,
                  label: formatUserOption(engineer, i18n.language),
                }))}
              />

              <SearchableSelect
                id="filter-admin-updates-status"
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
                renderMobileCard={renderUpdateCard}
              />
            </div>
          </>
        )}
      </div>

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

function formatProjectOption(project, language) {
  const name = localizedValue(language, project.nameAr, project.nameEn)
  const address = localizedValue(language, project.addressAr, project.addressEn, '')

  return address ? `${name} - ${address}` : name
}

function formatUserOption(user, language) {
  const name = localizedValue(language, user.fullNameAr, user.fullNameEn, user.username ?? '-')
  return user.username ? `${name} (${user.username})` : name
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

function EditIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
    </svg>
  )
}

function CheckCircleIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
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
