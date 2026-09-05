import { getEngineerProject } from '@/api/projectsApi'
import ProjectDetailContent from '@/components/projects/ProjectDetailContent'
import ProjectDetailsPageFrame from '@/components/projects/ProjectDetailsPageFrame'
import Button from '@/components/ui/Button'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

const responseError = (err, fallback) => err?.response?.data?.message ?? fallback

export default function EngineerProjectDetailsPage() {
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
      const { data } = await getEngineerProject(projectId)
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
      subtitle={projectAddress || t('projects.engineer_details_subtitle')}
      metaLine={projectMeta}
      error={error}
      success={null}
      onClearError={() => setError(null)}
      onClearSuccess={() => {}}
      backLabel={t('projects.back_to_projects')}
      onBack={() => navigate('/engineer/projects')}
      emptyMessage={t('projects.not_found')}
    >
      <div className="space-y-5">
        <div className="flex justify-end">
          <Button
            type="button"
            className="w-auto"
            onClick={() => navigate(`/engineer/projects/${projectId}/daily-updates`, {
              state: { projectSummary: project },
            })}
          >
            {t('nav.daily_updates', { defaultValue: 'Daily Updates' })}
          </Button>
        </div>

        <ProjectDetailContent project={project} role="ENGINEER" onRefresh={fetchProject} />
      </div>
    </ProjectDetailsPageFrame>
  )
}