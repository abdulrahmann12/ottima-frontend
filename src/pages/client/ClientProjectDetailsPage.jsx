import { getClientProject } from '@/api/projectsApi'
import ProjectDetailContent from '@/components/projects/ProjectDetailContent'
import ProjectDetailsPageFrame from '@/components/projects/ProjectDetailsPageFrame'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

const responseError = (err, fallback) => err?.response?.data?.message ?? fallback

export default function ClientProjectDetailsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()

  const [project, setProject] = useState(location.state?.projectSummary ?? null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  const projectName = i18n.language === 'ar' ? project?.nameAr : project?.nameEn
  const projectAddress = i18n.language === 'ar' ? project?.addressAr : project?.addressEn
  const projectMeta = [project?.clientName, project?.engineerName].filter(Boolean).join(' · ')

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
      <ProjectDetailContent
        project={project}
        role="CLIENT"
        onRefresh={fetchProject}
        itemActionRenderer={(item) => (
          <button
            type="button"
            onClick={() => navigate(`/client/items/${item.projectItemId}/daily-updates`, {
              state: {
                projectId: project?.projectId,
                projectNameAr: project?.nameAr,
                projectNameEn: project?.nameEn,
                itemNameAr: item.itemNameAr,
                itemNameEn: item.itemNameEn,
              },
            })}
            className="text-xs font-medium text-cyan-300 transition-colors hover:text-cyan-200"
          >
            {t('nav.daily_updates', { defaultValue: 'Daily Updates' })}
          </button>
        )}
      />
    </ProjectDetailsPageFrame>
  )
}