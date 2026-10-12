import { getEngineerProject } from '@/api/projectsApi'
import ProjectDetailContent from '@/components/projects/ProjectDetailContent'
import ProjectDetailsPageFrame from '@/components/projects/ProjectDetailsPageFrame'
import ProjectNavigationTabs from '@/components/projects/ProjectNavigationTabs'
import ProjectTicketsChat from '@/components/tickets/ProjectTicketsChat'
import ProjectGlobalChat from '@/components/chat/ProjectGlobalChat'
import Button from '@/components/ui/Button'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'

const responseError = (err, fallback) => err?.response?.data?.message ?? fallback

export default function EngineerProjectDetailsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t, i18n } = useTranslation()

  const [project, setProject] = useState(location.state?.projectSummary ?? null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const initialTabParam = searchParams.get('tab')
  const initialTab = initialTabParam === 'tickets' ? 'TICKETS' : (initialTabParam === 'chat' || initialTabParam === 'project_chat') ? 'PROJECT_CHAT' : 'OVERVIEW'
  const [activeViewTab, setActiveViewTab] = useState(initialTab)

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'tickets') {
      setActiveViewTab('TICKETS')
    } else if (tabParam === 'chat' || tabParam === 'project_chat') {
      setActiveViewTab('PROJECT_CHAT')
    } else if (tabParam === 'overview') {
      setActiveViewTab('OVERVIEW')
    }
  }, [searchParams])

  const handleTabChange = (tab) => {
    setActiveViewTab(tab)
    if (tab === 'TICKETS') {
      setSearchParams({ tab: 'tickets' }, { replace: true })
    } else if (tab === 'PROJECT_CHAT') {
      setSearchParams({ tab: 'chat' }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }

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
        {/* Navigation Bar: Tabs + Actions */}
        <ProjectNavigationTabs
          activeTab={activeViewTab}
          onTabChange={handleTabChange}
          dailyUpdatesUrl={`/engineer/projects/${projectId}/daily-updates`}
          project={project}
        />

        {/* Active Tab View */}
        {activeViewTab === 'OVERVIEW' ? (
          <ProjectDetailContent project={project} role="ENGINEER" onRefresh={fetchProject} />
        ) : activeViewTab === 'TICKETS' ? (
          <ProjectTicketsChat projectId={projectId} project={project} />
        ) : (
          <ProjectGlobalChat projectId={projectId} project={project} />
        )}
      </div>
    </ProjectDetailsPageFrame>
  )
}