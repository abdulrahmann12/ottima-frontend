import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import ProjectTable from '@/components/projects/ProjectTable'
import Alert from '@/components/ui/Alert'
import useProjectsStore from '@/store/projectsStore'
import { getAssignedEngineerProjects } from '@/api/projectsApi'

const PAGE_SIZE = 10

/**
 * EngineerProjectsPage — project dashboard for engineers displaying assigned projects.
 *
 * GET /api/v1/engineer/projects/assigned
 *
 * Clicking a row navigates to a full-page detail route at /engineer/projects/:id.
 */
export default function EngineerProjectsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { engineerPage, setEngineerPage } = useProjectsStore()

  const [projects, setProjects] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // ── Fetch assigned projects ──────────────────────────────
  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await getAssignedEngineerProjects(engineerPage, PAGE_SIZE)
      const page = data.data
      setProjects(page?.content ?? [])
      setTotalPages(page?.totalPages ?? 0)
      setTotalElements(page?.totalElements ?? 0)
    } catch (err) {
      setError(err?.response?.data?.message ?? t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }, [engineerPage, t])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleRowClick = (project) => {
    navigate(`/engineer/projects/${project.projectId}`, { state: { projectSummary: project } })
  }

  return (
    <div className="space-y-5 animate-slide-up">
      {/* ── Page header ─────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('projects.title')}</h1>
        <p className="mt-1 text-sm text-gray-600">{t('projects.engineer_subtitle')}</p>
      </div>

      <Alert message={error} variant="error" onClose={() => setError(null)} />

      {/* ── Card container ──────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card">
        {/* ── Tabs (Only My Assigned) ──────────────────────── */}
        <div className="flex border-b border-gray-200 bg-gray-50/50 px-2 pt-1.5">
          <TabBtn
            id="tab-assigned"
            active
            label={t('projects.my_assigned')}
            count={totalElements}
          />
        </div>

        {/* ── Data table ───────────────────────────── */}
        <ProjectTable
          projects={projects}
          loading={loading}
          totalPages={totalPages}
          totalElements={totalElements}
          currentPage={engineerPage}
          onPageChange={setEngineerPage}
          onRowClick={handleRowClick}
          role="ENGINEER"
        />
      </div>
    </div>
  )
}

function TabBtn({ id, active, onClick, label, count }) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all ${
        active
          ? 'border-b-2 border-warm-brown text-warm-brown bg-white rounded-t-xl shadow-sm'
          : 'text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-t-xl'
      }`}
    >
      <span>{label}</span>
      {count != null && count > 0 && (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums transition-colors ${
            active ? 'bg-warm-brown/10 text-warm-brown' : 'bg-gray-200 text-gray-700'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

