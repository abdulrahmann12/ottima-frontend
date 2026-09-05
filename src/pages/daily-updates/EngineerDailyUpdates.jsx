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
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
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
          <p className="font-semibold text-white">{update.title}</p>
          <p className="mt-1 truncate text-xs text-slate-400">
            {summarizeText(update.notes, t('daily_updates.no_notes'))}
          </p>
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
  ]

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
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('daily_updates.filter_item')}
                <select
                  className="input-base mt-2 text-sm"
                  value={filters.projectItemId}
                  onChange={updateFilter('projectItemId')}
                  disabled={filterDisabled}
                >
                  <option value="">{t('daily_updates.all_items')}</option>
                  {projectItems.map((item) => (
                    <option key={item.projectItemId} value={item.projectItemId}>
                      {localizedValue(i18n.language, item.itemNameAr, item.itemNameEn)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('daily_updates.filter_status')}
                <select
                  className="input-base mt-2 text-sm"
                  value={filters.status}
                  onChange={updateFilter('status')}
                  disabled={filterDisabled}
                >
                  <option value="">{t('daily_updates.all_statuses')}</option>
                  {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </DailyUpdatesFilterPanel>

            <div className="rounded-3xl border border-surface-border bg-surface-card p-5 shadow-xl sm:p-6">
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