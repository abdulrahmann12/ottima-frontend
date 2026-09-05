import Modal from '@/components/admin/Modal'
import { useTranslation } from 'react-i18next'
import ProjectDetailContent from './ProjectDetailContent'

/**
 * ProjectDetailModal — role-aware detail view.
 *
 * Props:
 *   project       — project detail object (null = closed)
 *   role          — 'ADMIN' | 'ENGINEER' | 'CLIENT'
 *   onClose       — () => void
 *   onRefresh     — () => void  (called after any mutation)
 */
export default function ProjectDetailModal({ project, role, onClose, onRefresh }) {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'

  if (!project) return null

  const projectName = isRtl ? project.nameAr : project.nameEn

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={projectName ?? t('projects.details')}
      size="lg"
    >
      <ProjectDetailContent project={project} role={role} onRefresh={onRefresh} />
    </Modal>
  )
}

