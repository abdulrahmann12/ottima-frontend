import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import ProjectTable from '@/components/projects/ProjectTable'
import Alert from '@/components/ui/Alert'
import useProjectsStore from '@/store/projectsStore'
import {
  getEngineerProjects,
  getAssignedEngineerProjects,
} from '@/api/projectsApi'

const PAGE_SIZE = 10

/**
 * EngineerProjectsPage — dual-tab project dashboard for engineers.
 *
 * Tab "assigned" → GET /api/v1/engineer/projects/assigned
 * Tab "all"      → GET /api/v1/engineer/projects
 *
 * Clicking a row navigates to a full-page detail route at /engineer/projects/:id.
 */
export default function EngineerProjectsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { engineerTab, engineerPage, setEngineerTab, setEngineerPage } = useProjectsStore()

  const [projects, setProjects] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // ── Fetch list based on active tab ──────────────────────
  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fetcher = engineerTab === 'assigned' ? getAssignedEngineerProjects : getEngineerProjects
      const { data } = await fetcher(engineerPage, PAGE_SIZE)
      const page = data.data
      setProjects(page?.content ?? [])
      setTotalPages(page?.totalPages ?? 0)
      setTotalElements(page?.totalElements ?? 0)
    } catch (err) {
      setError(err?.response?.data?.message ?? t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }, [engineerTab, engineerPage, t])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleRowClick = (project) => {
    navigate(`/engineer/projects/${project.projectId}`, { state: { projectSummary: project } })
  }

  const handleTabChange = (tab) => {
    setEngineerTab(tab)
    setEngineerPage(0)
  }

  return (
    <div className="space-y-5">
      {/* ── Page header ─────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t('projects.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('projects.engineer_subtitle')}</p>
      </div>

      <Alert message={error} variant="error" onClose={() => setError(null)} />

      {/* ── Card container ──────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-xl">
        {/* ── Tabs ─────────────────────────────────── */}
        <div className="flex border-b border-surface-border">
          <TabBtn
            id="tab-assigned"
            active={engineerTab === 'assigned'}
            onClick={() => handleTabChange('assigned')}
            label={t('projects.my_assigned')}
            count={engineerTab === 'assigned' ? totalElements : undefined}
          />
          <TabBtn
            id="tab-all"
            active={engineerTab === 'all'}
            onClick={() => handleTabChange('all')}
            label={t('projects.all_projects')}
            count={engineerTab === 'all' ? totalElements : undefined}
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
      className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors ${
        active
          ? 'border-b-2 border-brand-500 text-white'
          : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {label}
      {count != null && count > 0 && (
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${active ? 'bg-brand-600/40 text-brand-300' : 'bg-slate-700 text-slate-400'}`}>
          {count}
        </span>
      )}
    </button>
  )
}

