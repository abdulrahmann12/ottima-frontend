import { getClientProject } from '@/api/projectsApi'
import ClientFinanceDashboard from '@/components/client/finance/ClientFinanceDashboard'
import ProjectDetailContent from '@/components/projects/ProjectDetailContent'
import ProjectDetailsPageFrame from '@/components/projects/ProjectDetailsPageFrame'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

const responseError = (err, fallback) => err?.response?.data?.message ?? fallback

const TABS = [
  { key: 'overview',   label: 'Overview' },
  { key: 'financials', label: 'Financials' },
]

export default function ClientProjectDetailsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()

  const [project, setProject] = useState(location.state?.projectSummary ?? null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [tab,     setTab]     = useState('overview')

  const fetchProject = useCallback(async () => {
    if (!projectId) return

    setLoading(true)
    setError(null)
    try {
      const { data } = await getClientProject(projectId)
      setProject((current) => ({ ...(current ?? {}), ...(data.data ?? {}) }))
    } catch (err) {
      setError(responseError(err, t('errors.generic')))
      setProject(null)
    } finally {
      setLoading(false)
    }
  }, [projectId, t])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  const projectName    = i18n.language === 'ar' ? project?.nameAr    : project?.nameEn
  const projectAddress = i18n.language === 'ar' ? project?.addressAr : project?.addressEn
  const projectMeta    = [project?.clientName, project?.engineerName].filter(Boolean).join(' · ')

  return (
    <ProjectDetailsPageFrame
      loading={loading}
      project={project}
      title={loading ? t('common.loading') : projectName || t('projects.details')}
      subtitle={projectAddress || t('projects.client_details_subtitle')}
      metaLine={projectMeta}
      error={error}
      success={null}
      onClearError={() => setError(null)}
      onClearSuccess={() => {}}
      backLabel={t('projects.back_to_projects')}
      onBack={() => navigate('/client/projects')}
      emptyMessage={t('projects.not_found')}
    >
      {/* ── Tab bar ── */}
      {!loading && project && (
        <div className="flex gap-1.5 rounded-2xl border border-gray-200 bg-gray-100/80 p-1.5 mb-6 w-fit shadow-xs">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              id={`project-tab-${key}`}
              onClick={() => setTab(key)}
              className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-warm-brown/30
                ${tab === key
                  ? 'bg-warm-brown text-white shadow-sm'
                  : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
                }`}
            >
              {t(`projects.tab_${key}`, { defaultValue: label })}
            </button>
          ))}
        </div>
      )}

      {/* ── Overview tab ── */}
      {tab === 'overview' && (
        <ProjectDetailContent
          project={project}
          role="CLIENT"
          onRefresh={fetchProject}
          itemActionRenderer={(item) => (
            <button
              type="button"
              onClick={() => navigate(`/client/items/${item.projectItemId}/daily-updates`, {
                state: {
                  projectId:    project?.projectId,
                  projectNameAr: project?.nameAr,
                  projectNameEn: project?.nameEn,
                  itemNameAr:   item.itemNameAr,
                  itemNameEn:   item.itemNameEn,
                },
              })}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-warm-brown hover:text-warm-brown/80 transition-colors"
            >
              <span>{t('nav.daily_updates', { defaultValue: 'Daily Updates' })}</span>
              <span>→</span>
            </button>
          )}
        />
      )}

      {/* ── Financials tab ── */}
      {tab === 'financials' && (
        <ClientFinanceDashboard
          projectId={projectId}
          language={i18n.language}
        />
      )}
    </ProjectDetailsPageFrame>
  )
}