import { assignProjectItems, getAdminProject, restoreProject } from '@/api/projectsApi'
import { getAllStandardItems } from '@/api/standardItemsApi'
import Modal from '@/components/admin/Modal'
import ProjectDetailContent from '@/components/projects/ProjectDetailContent'
import ProjectDetailsPageFrame from '@/components/projects/ProjectDetailsPageFrame'
import ProjectItemAssignmentFields from '@/components/projects/ProjectItemAssignmentFields'
import ProjectTicketsChat from '@/components/tickets/ProjectTicketsChat'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

const responseError = (err, fallback) => err?.response?.data?.message ?? fallback

export default function AdminProjectDetailsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState(null)
  const [catalogItems, setCatalogItems] = useState([])
  const [newItems, setNewItems] = useState([])
  const [restoring, setRestoring] = useState(false)

  const fetchProject = useCallback(async () => {
    if (!projectId) return

    setLoading(true)
    setError(null)
    try {
      const { data } = await getAdminProject(projectId)
      setProject(data.data ?? null)
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

  const openAssignModal = async () => {
    setAssignModalOpen(true)
    setAssignError(null)
    setNewItems([])
    setLoadingCatalog(true)

    try {
      const { data } = await getAllStandardItems('', 0, 200)
      setCatalogItems(data.data?.content ?? [])
    } catch (err) {
      setAssignError(responseError(err, t('errors.generic')))
    } finally {
      setLoadingCatalog(false)
    }
  }

  const closeAssignModal = (force = false) => {
    if (assigning && !force) return
    setAssignModalOpen(false)
    setAssignError(null)
    setNewItems([])
  }

  const addSelectedItem = (item) => {
    setNewItems((current) => {
      if (current.some((entry) => String(entry.standardItemId) === String(item.standardItemId))) {
        return current
      }
      return [...current, item]
    })
  }

  const removeSelectedItem = (standardItemId) => {
    setNewItems((current) => current.filter((item) => String(item.standardItemId) !== String(standardItemId)))
  }

  const handleAppendItems = async (e) => {
    e.preventDefault()
    if (!project?.projectId || newItems.length === 0) return

    setAssigning(true)
    setAssignError(null)
    try {
      await assignProjectItems(project.projectId, newItems)
      setSuccess(t('projects.items_appended_success'))
      closeAssignModal(true)
      await fetchProject()
    } catch (err) {
      setAssignError(responseError(err, t('errors.generic')))
    } finally {
      setAssigning(false)
    }
  }

  const handleRestore = async () => {
    setRestoring(true)
    setError(null)
    try {
      await restoreProject(projectId)
      setSuccess(t('projects.restore_success', { defaultValue: 'Project restored successfully.' }))
      await fetchProject()
    } catch (err) {
      setError(responseError(err, t('errors.generic')))
    } finally {
      setRestoring(false)
    }
  }

  const projectName = i18n.language === 'ar' ? project?.nameAr : project?.nameEn
  const projectAddress = i18n.language === 'ar' ? project?.addressAr : project?.addressEn
  const assignedStandardItemIds = project?.items?.map((item) => item.standardItemId).filter(Boolean) ?? []
  const projectMeta = project ? `${project.clientName} · ${project.engineerName}` : null
  const isProjectDeleted = Boolean(project?.deletedAt || project?.deletesAt)

  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'tickets' ? 'TICKETS' : 'OVERVIEW'
  const [activeViewTab, setActiveViewTab] = useState(initialTab)

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'tickets') {
      setActiveViewTab('TICKETS')
    } else if (tabParam === 'overview') {
      setActiveViewTab('OVERVIEW')
    }
  }, [searchParams])

  const handleTabChange = (tab) => {
    setActiveViewTab(tab)
    if (tab === 'TICKETS') {
      setSearchParams({ tab: 'tickets' }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }

  return (
    <>
      <ProjectDetailsPageFrame
        loading={loading}
        project={project}
        title={loading ? t('common.loading') : projectName || t('projects.details')}
        subtitle={projectAddress || t('projects.details_subtitle')}
        metaLine={projectMeta}
        error={error}
        success={success}
        onClearError={() => setError(null)}
        onClearSuccess={() => setSuccess(null)}
        backLabel={t('projects.back_to_projects')}
        onBack={() => navigate('/admin/projects')}
        emptyMessage={t('projects.not_found')}
      >
        <div className="space-y-5">
          {/* Deleted project banner + restore */}
          {isProjectDeleted && (
            <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                {t('projects.deleted_banner', { defaultValue: 'This project has been deleted.' })}
              </div>
              <Button
                type="button"
                className="w-auto"
                loading={restoring}
                onClick={handleRestore}
              >
                {t('projects.restore_action', { defaultValue: 'Restore' })}
              </Button>
            </div>
          )}

          {/* Navigation Bar: Tabs + Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-2 rounded-2xl border border-gray-200 shadow-xs">
            {/* View switcher tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-nowrap pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => handleTabChange('OVERVIEW')}
                className={`min-h-[40px] px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                  activeViewTab === 'OVERVIEW'
                    ? 'bg-warm-brown text-white shadow-xs'
                    : 'text-gray-700 hover:bg-light-blue/40'
                }`}
              >
                📋 {t('projects.tab_overview', { defaultValue: 'Items & Progress' })}
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('TICKETS')}
                className={`min-h-[40px] px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeViewTab === 'TICKETS'
                    ? 'bg-warm-brown text-white shadow-xs'
                    : 'text-gray-700 hover:bg-light-blue/40'
                }`}
              >
                💬 {t('projects.tab_tickets', { defaultValue: 'Tickets (Chat)' })}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                className="w-full sm:w-auto min-h-[40px] py-2 px-4 text-xs font-bold"
                onClick={() => navigate(`/admin/projects/${projectId}/daily-updates`, {
                  state: { projectSummary: project },
                })}
              >
                📷 {t('nav.daily_updates', { defaultValue: 'Daily Updates' })}
              </Button>
            </div>
          </div>

          {/* Active Tab View */}
          {activeViewTab === 'OVERVIEW' ? (
            <ProjectDetailContent
              project={project}
              role="ADMIN"
              onRefresh={fetchProject}
              itemHeaderAction={
                !isProjectDeleted && (
                  <Button type="button" onClick={openAssignModal}>
                    + {t('projects.assign_new_item')}
                  </Button>
                )
              }
            />
          ) : (
            <ProjectTicketsChat
              projectId={projectId}
              project={project}
            />
          )}
        </div>
      </ProjectDetailsPageFrame>

      <Modal
        isOpen={assignModalOpen}
        onClose={closeAssignModal}
        title={t('projects.assign_new_item')}
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleAppendItems}>
          <Alert message={assignError} variant="error" onClose={() => setAssignError(null)} />
          <p className="text-sm text-slate-400">{t('projects.append_items_help')}</p>

          {loadingCatalog ? (
            <p className="py-4 text-center text-sm text-slate-500">{t('common.loading')}</p>
          ) : (
            <ProjectItemAssignmentFields
              catalogItems={catalogItems}
              selectedItems={newItems}
              excludedItemIds={assignedStandardItemIds}
              onAddItem={addSelectedItem}
              onRemoveItem={removeSelectedItem}
              disabled={assigning}
              ids={{
                catalogItem: 'assign-modal-catalog-item',
                budget: 'assign-modal-item-budget',
                weight: 'assign-modal-item-weight',
                sequence: 'assign-modal-item-sequence',
                notes: 'assign-modal-item-notes',
                addButton: 'assign-modal-add-item',
              }}
            />
          )}

          <div className="flex justify-end gap-3 border-t border-surface-border pt-4">
            <Button type="button" variant="ghost" onClick={closeAssignModal} disabled={assigning}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={assigning} disabled={loadingCatalog || newItems.length === 0}>
              {t('projects.assign_and_finish')}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}