import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import ProjectTable from '@/components/projects/ProjectTable'
import ProjectDetailModal from '@/components/projects/ProjectDetailModal'
import Alert from '@/components/ui/Alert'
import useProjectsStore from '@/store/projectsStore'
import { getClientProjects, getClientProject } from '@/api/projectsApi'

const PAGE_SIZE = 10

/**
 * ClientProjectsPage — read-only project dashboard for clients.
 *
 * Lists projects via GET /api/v1/client/projects (paginated).
 * Clicking a row fetches full detail via GET /api/v1/client/projects/:id
 * and opens the ProjectDetailModal (client mode) — financial transparency,
 * no mutation controls.
 */
export default function ClientProjectsPage() {
  const { t } = useTranslation()
  const { clientPage, setClientPage } = useProjectsStore()

  const [projects, setProjects] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [selectedProject, setSelectedProject] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // ── Fetch list ──────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await getClientProjects(clientPage, PAGE_SIZE)
      const page = data.data
      setProjects(page?.content ?? [])
      setTotalPages(page?.totalPages ?? 0)
      setTotalElements(page?.totalElements ?? 0)
    } catch (err) {
      setError(err?.response?.data?.message ?? t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }, [clientPage, t])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // ── Open detail view ─────────────────────────────────────
  const handleRowClick = async (project) => {
    setLoadingDetail(true)
    try {
      const { data } = await getClientProject(project.projectId)
      setSelectedProject(data.data ?? project)
    } catch {
      setSelectedProject(project)
    } finally {
      setLoadingDetail(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Page header ─────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t('projects.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('projects.client_subtitle')}</p>
      </div>

      <Alert message={error} variant="error" onClose={() => setError(null)} />

      {loadingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="rounded-2xl bg-surface p-6 text-sm text-slate-400">{t('common.loading')}</div>
        </div>
      )}

      {/* ── Card container ──────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-xl">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-white">{t('projects.title')}</p>
            {totalElements > 0 && (
              <p className="mt-0.5 text-xs text-slate-500">{totalElements} {t('projects.total', { defaultValue: 'projects' })}</p>
            )}
          </div>
        </div>

        {/* Data table */}
        <ProjectTable
          projects={projects}
          loading={loading}
          totalPages={totalPages}
          totalElements={totalElements}
          currentPage={clientPage}
          onPageChange={setClientPage}
          onRowClick={handleRowClick}
          role="CLIENT"
        />
      </div>

      {/* ── Detail modal (read-only) ─────────────────── */}
      <ProjectDetailModal
        project={selectedProject}
        role="CLIENT"
        onClose={() => setSelectedProject(null)}
        onRefresh={() => fetchProjects()}
      />
    </div>
  )
}

