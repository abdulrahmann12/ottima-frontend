import { assignProjectItems, getAdminProject } from '@/api/projectsApi'
import { getAllStandardItems } from '@/api/standardItemsApi'
import Modal from '@/components/admin/Modal'
import ProjectDetailContent from '@/components/projects/ProjectDetailContent'
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/admin/projects')}
            className="text-sm font-medium text-brand-300 transition-colors hover:text-brand-200"
          >
            ← {t('projects.back_to_projects')}
          </button>
          <h1 className="mt-3 text-3xl font-bold text-white">
            {loading ? t('common.loading') : projectName || t('projects.details')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {projectAddress || t('projects.details_subtitle')}
          </p>
          {project && (
            <p className="mt-2 text-xs uppercase tracking-wider text-slate-500">
              {project.clientName} · {project.engineerName}
            </p>
          )}
        </div>
      </div>

      <Alert message={error} variant="error" onClose={() => setError(null)} />
      <Alert message={success} variant="success" onClose={() => setSuccess(null)} />

      {loading && (
        <div className="space-y-3 rounded-2xl border border-surface-border bg-surface-card p-6 shadow-xl">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-xl bg-slate-800/60" />
          ))}
        </div>
      )}

      {!loading && !project && !error && (
        <div className="rounded-2xl border border-surface-border bg-surface-card p-8 text-center shadow-xl">
          <p className="text-sm text-slate-400">{t('projects.not_found')}</p>
        </div>
      )}

      {!loading && project && (
        <div className="rounded-2xl border border-surface-border bg-surface-card p-6 shadow-xl">
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
        </div>
      )}

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
    </div>
  )
}