import {
    deleteProject,
    getAdminProjects,
} from '@/api/projectsApi'
import { getAllClients, getAllEngineers } from '@/api/usersApi'
import SearchBar from '@/components/admin/SearchBar'
import ProjectTable from '@/components/projects/ProjectTable'
import ProjectWizard from '@/components/projects/ProjectWizard'
import Alert from '@/components/ui/Alert'
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
    if (project.deletedAt) return
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

  return (
    <div className="space-y-5">
      {/* ── Page header ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('projects.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('projects.admin_subtitle')}</p>
        </div>
        {/* The wizard renders its own open button and the modal */}
        <ProjectWizard
          onSuccess={() => {
            setSuccess(t('projects.create_success'))
            fetchProjects()
          }}
        />
      </div>

      <Alert message={error} variant="error" onClose={() => setError(null)} />
      <Alert message={success} variant="success" onClose={() => setSuccess(null)} />

      <div className="rounded-2xl border border-surface-border bg-surface-card p-4 shadow-xl">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <SearchBar
            value={filters.search}
            onChange={handleSearchChange}
            placeholder={t('projects.search_placeholder')}
            className="w-full"
          />

          <label className="form-label text-xs text-slate-500">
            {t('projects.client_filter')}
            <select
              id="projects-filter-client"
              className="input-base mt-1.5 text-sm"
              value={filters.clientId}
              onChange={handleClientChange}
              disabled={loadingFilters}
            >
              <option value="">{t('projects.all_clients')}</option>
              {clients.map((client) => (
                <option key={client.userId} value={client.userId}>
                  {formatUserLabel(client)}
                </option>
              ))}
            </select>
          </label>

          <label className="form-label text-xs text-slate-500">
            {t('projects.engineer_filter')}
            <select
              id="projects-filter-engineer"
              className="input-base mt-1.5 text-sm"
              value={filters.engineerId}
              onChange={handleEngineerChange}
              disabled={loadingFilters}
            >
              <option value="">{t('projects.all_engineers')}</option>
              {engineers.map((engineer) => (
                <option key={engineer.userId} value={engineer.userId}>
                  {formatUserLabel(engineer)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-h-11 items-center gap-3 rounded-xl border border-surface-border bg-slate-900/30 px-4 py-2 text-sm text-slate-300">
            <input
              id="projects-filter-deleted"
              type="checkbox"
              checked={filters.isDeleted}
              onChange={handleDeletedToggle}
              className="h-4 w-4 rounded border-surface-border bg-slate-950 text-brand-500 focus:ring-brand-500/40"
            />
            <span>{t('projects.show_deleted')}</span>
          </label>
        </div>
      </div>

      {/* ── Projects card ──────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-xl">
        {/* Card header */}
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-white">{t('projects.title')}</p>
            {totalElements > 0 && (
              <p className="mt-0.5 text-xs text-slate-500">{totalElements} {t('projects.total', { defaultValue: 'projects' })}</p>
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
          onDelete={(project) => setDeleteTarget(project)}
          deletingProjectId={deleting ? deleteTarget?.projectId : null}
          role="ADMIN"
        />
      </div>

      {/* ── Delete confirmation dialog ───────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl sm:w-auto">
            <h3 className="text-base font-semibold text-white">
              {t('projects.delete_project', { defaultValue: 'Delete Project' })}
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              {t('projects.delete_confirm', {
                name: deleteTarget.nameEn,
                defaultValue: `Are you sure you want to delete "${deleteTarget.nameEn}"? This action cannot be undone.`,
              })}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-slate-400 hover:text-white disabled:opacity-40"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="rounded-lg bg-red-600/90 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-40"
              >
                {deleting ? t('common.loading') : t('projects.delete_project', { defaultValue: 'Delete' })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

