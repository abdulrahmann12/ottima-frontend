import { assignProjectItems, createProject } from '@/api/projectsApi'
import { getAllStandardItems } from '@/api/standardItemsApi'
import { getAllClients, getAllEngineers } from '@/api/usersApi'
import Modal from '@/components/admin/Modal'
import ProjectItemAssignmentFields from '@/components/projects/ProjectItemAssignmentFields'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import SearchableSelect from '@/components/ui/SearchableSelect'
import useProjectsStore from '@/store/projectsStore'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const responseError = (err, fallback) => err?.response?.data?.message ?? fallback

const EMPTY_PROJECT_FORM = {
  clientId: '', engineerId: '', nameAr: '', nameEn: '',
  addressAr: '', addressEn: '', estimatedBudget: '',
  startDate: '', targetCompletionDate: '',
}

/**
 * ProjectWizard — Admin-only 2-step project creation wizard.
 *
 * Step 1: Metadata form → POST /api/v1/admin/projects
 * Step 2: Item assignment → POST /api/v1/admin/projects/:id/items
 *
 * Cannot skip steps. The wizard enforces sequential completion.
 *
 * Props:
 *   onSuccess — () => void  (called when wizard finishes successfully)
 */
export default function ProjectWizard({ onSuccess }) {
  const { t, i18n } = useTranslation()
  const { wizardOpen, wizardStep, createdProjectId, selectedItems, openWizard, closeWizard, advanceToStep2, addSelectedItem, removeSelectedItem } = useProjectsStore()

  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState([])
  const [engineers, setEngineers] = useState([])
  const [catalogItems, setCatalogItems] = useState([])
  const [projectForm, setProjectForm] = useState(EMPTY_PROJECT_FORM)
  const [loadingLists, setLoadingLists] = useState(false)

  // Load reference data when wizard opens
  useEffect(() => {
    if (!wizardOpen) return
    setLoadingLists(true)
    setError(null)
    Promise.all([
      getAllClients(0, 200),
      getAllEngineers(0, 200),
      getAllStandardItems('', 0, 200),
    ])
      .then(([c, e, s]) => {
        setClients(c.data.data?.content ?? [])
        setEngineers(e.data.data?.content ?? [])
        setCatalogItems(s.data.data?.content ?? [])
      })
      .catch((err) => setError(responseError(err, t('errors.generic'))))
      .finally(() => setLoadingLists(false))
  }, [wizardOpen, t])

  const handleOpen = () => {
    setProjectForm(EMPTY_PROJECT_FORM)
    setError(null)
    openWizard()
  }

  // ── Step 1 submit ──────────────────────────────────────────
  const handleStep1Submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { data } = await createProject({
        ...projectForm,
        clientId: Number(projectForm.clientId),
        engineerId: Number(projectForm.engineerId),
        estimatedBudget: Number(projectForm.estimatedBudget),
      })
      // Store projectId from response and advance to step 2
      advanceToStep2(data.data?.projectId ?? data.data?.id)
    } catch (err) {
      setError(responseError(err, t('errors.generic')))
    } finally {
      setSaving(false)
    }
  }

  // ── Step 2 submit ──────────────────────────────────────────
  const handleStep2Submit = async (e) => {
    e.preventDefault()
    if (!createdProjectId || selectedItems.length === 0) return
    setSaving(true)
    setError(null)
    try {
      // Exact payload shape from Postman: { items: [...] }
      await assignProjectItems(createdProjectId, selectedItems)
      closeWizard()
      onSuccess?.()
    } catch (err) {
      setError(responseError(err, t('errors.generic')))
    } finally {
      setSaving(false)
    }
  }

  const fieldP = (k) => (val) => {
    const value = typeof val === 'object' && val !== null && 'target' in val ? val.target.value : val
    setProjectForm((p) => ({ ...p, [k]: value }))
  }

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        id="btn-create-project"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-xl bg-warm-brown hover:bg-[#6B4A33] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-warm-brown/50 active:scale-[0.98]"
      >
        <PlusIcon />
        {t('projects.create')}
      </button>

      <Modal
        isOpen={wizardOpen}
        onClose={() => !saving && closeWizard()}
        title={t('projects.create')}
        size="lg"
      >
        {/* ── Step indicator ──────────────────────────── */}
        <WizardStepIndicator step={wizardStep} t={t} />

        <Alert message={error} variant="error" onClose={() => setError(null)} />

        {loadingLists && (
          <p className="py-4 text-center text-sm text-gray-500">{t('common.loading')}</p>
        )}

        {/* ════════════════ STEP 1 ════════════════════ */}
        {wizardStep === 1 && !loadingLists && (
          <form id="wizard-step1-form" onSubmit={handleStep1Submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Client */}
              <SearchableSelect
                id="step1-client"
                label={t('projects.client')}
                required
                value={projectForm.clientId}
                onChange={fieldP('clientId')}
                placeholder={t('projects.select_client')}
                options={clients.map((u) => ({
                  value: u.userId,
                  label: (i18n.language === 'ar' ? (u.fullNameAr || u.fullNameEn) : (u.fullNameEn || u.fullNameAr)) || u.username,
                  sublabel: u.username ? `@${u.username}` : undefined,
                }))}
              />

              {/* Engineer */}
              <SearchableSelect
                id="step1-engineer"
                label={t('projects.engineer')}
                required
                value={projectForm.engineerId}
                onChange={fieldP('engineerId')}
                placeholder={t('projects.select_engineer')}
                options={engineers.map((u) => ({
                  value: u.userId,
                  label: (i18n.language === 'ar' ? (u.fullNameAr || u.fullNameEn) : (u.fullNameEn || u.fullNameAr)) || u.username,
                  sublabel: u.username ? `@${u.username}` : undefined,
                }))}
              />

              <Input id="step1-name-ar" label={`${t('projects.name_ar')} *`} value={projectForm.nameAr} onChange={fieldP('nameAr')} required dir="rtl" />
              <Input id="step1-name-en" label={`${t('projects.name_en')} *`} value={projectForm.nameEn} onChange={fieldP('nameEn')} required />
              <Input id="step1-address-ar" label={t('projects.address_ar')} value={projectForm.addressAr} onChange={fieldP('addressAr')} dir="rtl" />
              <Input id="step1-address-en" label={t('projects.address_en')} value={projectForm.addressEn} onChange={fieldP('addressEn')} />
              <Input id="step1-budget" label={`${t('projects.budget')} *`} type="number" min="0" step="0.01" value={projectForm.estimatedBudget} onChange={fieldP('estimatedBudget')} required />
              <Input id="step1-start" label={`${t('projects.start_date')} *`} type="date" value={projectForm.startDate} onChange={fieldP('startDate')} required />
              <Input id="step1-target" label={`${t('projects.target_date')} *`} type="date" value={projectForm.targetCompletionDate} onChange={fieldP('targetCompletionDate')} required />
            </div>
            <div className="flex justify-end border-t border-gray-200 pt-4">
              <Button id="step1-submit" type="submit" loading={saving}>
                {t('projects.continue')} →
              </Button>
            </div>
          </form>
        )}

        {/* ════════════════ STEP 2 ════════════════════ */}
        {wizardStep === 2 && (
          <div className="space-y-4">
            <ProjectItemAssignmentFields
              catalogItems={catalogItems}
              selectedItems={selectedItems}
              onAddItem={addSelectedItem}
              onRemoveItem={removeSelectedItem}
            />
            <div className="flex justify-between border-t border-gray-200 pt-4">
              <Button variant="ghost" onClick={closeWizard} disabled={saving}>
                {t('projects.skip_assignment')}
              </Button>
              <Button id="step2-submit" onClick={handleStep2Submit} loading={saving}>
                {t('common.finish')} ✓
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

// ── Step indicator ───────────────────────────────────────────
function WizardStepIndicator({ step, t }) {
  const steps = [
    { n: 1, label: t('projects.metadata') },
    { n: 2, label: t('projects.assign_items') },
  ]
  return (
    <div className="mb-6 flex items-center">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          {/* Step bubble */}
          <div className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                step > s.n
                  ? 'bg-emerald-600 text-white'
                  : step === s.n
                  ? 'bg-warm-brown text-white ring-2 ring-warm-brown/30'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step > s.n ? '✓' : s.n}
            </span>
            <span
              className={`text-xs font-medium ${
                step >= s.n ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {s.label}
            </span>
          </div>
          {/* Connector */}
          {i < steps.length - 1 && (
            <div className={`mx-3 h-px flex-1 w-12 transition-all ${step > 1 ? 'bg-emerald-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M12 5v14m7-7H5" />
    </svg>
  )
}

