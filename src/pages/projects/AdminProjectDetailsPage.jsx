import { assignProjectItems, getAdminProject } from '@/api/projectsApi'
import { getAllStandardItems } from '@/api/standardItemsApi'
import Modal from '@/components/admin/Modal'
import ProjectDetailContent from '@/components/projects/ProjectDetailContent'
import ProjectDetailsPageFrame from '@/components/projects/ProjectDetailsPageFrame'
import ProjectItemAssignmentFields from '@/components/projects/ProjectItemAssignmentFields'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

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

  const projectName = i18n.language === 'ar' ? project?.nameAr : project?.nameEn
  const projectAddress = i18n.language === 'ar' ? project?.addressAr : project?.addressEn
  const assignedStandardItemIds = project?.items?.map((item) => item.standardItemId).filter(Boolean) ?? []
  const projectMeta = project ? `${project.clientName} · ${project.engineerName}` : null

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
        <ProjectDetailContent
          project={project}
          role="ADMIN"
          onRefresh={fetchProject}
          itemHeaderAction={
            <Button type="button" onClick={openAssignModal}>
              + {t('projects.assign_new_item')}
            </Button>
          }
        />
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