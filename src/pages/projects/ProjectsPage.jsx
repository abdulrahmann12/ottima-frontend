import {
    deleteProject,
    getAdminProjects,
    restoreProject,
} from '@/api/projectsApi'
import { getAllClients, getAllEngineers } from '@/api/usersApi'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import SearchBar from '@/components/admin/SearchBar'
import ProjectTable from '@/components/projects/ProjectTable'
import ProjectWizard from '@/components/projects/ProjectWizard'
import Alert from '@/components/ui/Alert'
import SearchableSelect from '@/components/ui/SearchableSelect'
import useProjectsStore from '@/store/projectsStore'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

const PAGE_SIZE = 10

/**
 * ProjectsPage — Admin-only projects management dashboard.
 *
 * Renders inside AdminLayout (/admin/projects).
 *
 * Features:
 *   - Paginated project list (GET /api/v1/admin/projects)
 *   - 2-step creation wizard via ProjectWizard component
 *   - Dedicated full-page detail route for project management
 *   - Delete project with confirmation
 *   - Refetches list after every mutation
 */
export default function ProjectsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { adminPage, setAdminPage } = useProjectsStore()

  const [projects, setProjects] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingFilters, setLoadingFilters] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [clients, setClients] = useState([])
  const [engineers, setEngineers] = useState([])
  const [filters, setFilters] = useState({
    search: '',
    clientId: '',
    engineerId: '',
    isDeleted: false,
  })

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState(null)

  // ── Fetch project list ──────────────────────────────────
  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await getAdminProjects(adminPage, PAGE_SIZE, {
        search: filters.search,
        clientId: filters.clientId ? Number(filters.clientId) : undefined,
        engineerId: filters.engineerId ? Number(filters.engineerId) : undefined,
        isDeleted: filters.isDeleted,
      })
      const page = data.data
      setProjects(page?.content ?? [])
      setTotalPages(page?.totalPages ?? 0)
      setTotalElements(page?.totalElements ?? 0)
    } catch (err) {
      setError(err?.response?.data?.message ?? t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }, [adminPage, filters, t])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const fetchFilterOptions = useCallback(async () => {
    setLoadingFilters(true)
    try {
      const [clientsResponse, engineersResponse] = await Promise.all([
        getAllClients(0, 200),
        getAllEngineers(0, 200),
      ])
      setClients(clientsResponse.data.data?.content ?? [])
      setEngineers(engineersResponse.data.data?.content ?? [])
    } catch (err) {
      setError(err?.response?.data?.message ?? t('errors.generic'))
    } finally {
      setLoadingFilters(false)
    }
  }, [t])

  useEffect(() => {
    fetchFilterOptions()
  }, [fetchFilterOptions])

  const handleRowClick = (project) => {
    navigate(`/admin/projects/${project.projectId}`)
  }

  const updateFilters = (nextPartial) => {
    setFilters((current) => ({ ...current, ...nextPartial }))
    setAdminPage(0)
  }

  const handleSearchChange = (value) => updateFilters({ search: value })
  const handleClientChange = (e) => updateFilters({ clientId: e.target.value })
  const handleEngineerChange = (e) => updateFilters({ engineerId: e.target.value })
  const handleDeletedToggle = (e) => updateFilters({ isDeleted: e.target.checked })

  const formatUserLabel = (user) => {
    const localizedName = i18n.language === 'ar' ? user.fullNameAr : user.fullNameEn
    return localizedName ? `${localizedName} (${user.username})` : user.username
  }

  // ── Delete project ─────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteProject(deleteTarget.projectId)
      setSuccess(t('projects.delete_success', { defaultValue: 'Project deleted successfully.' }))
      setDeleteTarget(null)
      fetchProjects()
    } catch (err) {
      setError(err?.response?.data?.message ?? t('errors.generic'))
    } finally {
      setDeleting(false)
    }
  }

  // ── Restore project ─────────────────────────────────────
  const handleRestore = async (project) => {
    setRestoreTarget(project)
    setRestoring(true)
    try {
      await restoreProject(project.projectId)
      setSuccess(t('projects.restore_success', { defaultValue: 'Project restored successfully.' }))
      fetchProjects()
    } catch (err) {
      setError(err?.response?.data?.message ?? t('errors.generic'))
    } finally {
      setRestoring(false)
      setRestoreTarget(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Page header ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('projects.title')}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{t('projects.admin_subtitle')}</p>
        </div>
        {/* Only show create wizard when NOT in deleted view */}
        {!filters.isDeleted && (
          <ProjectWizard
            onSuccess={() => {
              setSuccess(t('projects.create_success'))
              fetchProjects()
            }}
          />
        )}
      </div>

      <Alert message={error} variant="error" onClose={() => setError(null)} />
      <Alert message={success} variant="success" onClose={() => setSuccess(null)} />

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-end">
          <div className="w-full">
            <SearchBar
              value={filters.search}
              onChange={handleSearchChange}
              placeholder={t('projects.search_placeholder')}
              className="w-full"
            />
          </div>

          <div>
            <SearchableSelect
              id="projects-filter-client"
              label={t('projects.client_filter')}
              value={filters.clientId}
              onChange={handleClientChange}
              disabled={loadingFilters}
              loading={loadingFilters}
              placeholder={t('projects.all_clients')}
              options={clients.map((client) => ({
                value: client.userId,
                label: formatUserLabel(client),
              }))}
            />
          </div>

          <div>
            <SearchableSelect
              id="projects-filter-engineer"
              label={t('projects.engineer_filter')}
              value={filters.engineerId}
              onChange={handleEngineerChange}
              disabled={loadingFilters}
              loading={loadingFilters}
              placeholder={t('projects.all_engineers')}
              options={engineers.map((engineer) => ({
                value: engineer.userId,
                label: formatUserLabel(engineer),
              }))}
            />
          </div>

          <label className="flex h-[42px] items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors self-end">
            <input
              id="projects-filter-deleted"
              type="checkbox"
              checked={filters.isDeleted}
              onChange={handleDeletedToggle}
              className="h-4 w-4 rounded border-gray-300 text-warm-brown focus:ring-warm-brown/40"
            />
            <span>{t('projects.show_deleted')}</span>
          </label>
        </div>
      </div>

      {/* ── Projects card ──────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Card header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">{t('projects.title')}</p>
            {totalElements > 0 && (
              <p className="mt-0.5 text-xs text-gray-500">{totalElements} {t('projects.total', { defaultValue: 'total' })}</p>
            )}
          </div>
        </div>

        {/* Table */}
        <ProjectTable
          projects={projects}
          loading={loading}
          totalPages={totalPages}
          totalElements={totalElements}
          currentPage={adminPage}
          onPageChange={setAdminPage}
          onRowClick={handleRowClick}
          onDelete={!filters.isDeleted ? (project) => setDeleteTarget(project) : undefined}
          onRestore={filters.isDeleted ? handleRestore : undefined}
          deletingProjectId={deleting ? deleteTarget?.projectId : null}
          restoringProjectId={restoring ? restoreTarget?.projectId : null}
          role="ADMIN"
        />
      </div>

      {/* ── Delete confirmation dialog ───────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={t('projects.delete_project', { defaultValue: 'Delete Project' })}
        message={t('projects.delete_confirm', {
          name: i18n.language === 'ar' ? (deleteTarget?.nameAr || deleteTarget?.nameEn) : (deleteTarget?.nameEn || deleteTarget?.nameAr),
          defaultValue: `Are you sure you want to delete "${deleteTarget?.nameEn}"? This action cannot be undone.`,
        })}
        confirmLabel={deleting ? t('common.loading') : t('projects.delete_project', { defaultValue: 'Delete' })}
      />
    </div>
  )
}

