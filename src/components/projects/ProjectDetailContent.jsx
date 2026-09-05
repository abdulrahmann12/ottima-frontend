import {
    changeProjectStatus,
    removeProjectItem,
    updateAdminItemProgress,
    updateEngineerItemProgress,
    updateProject,
    updateProjectItem,
} from '@/api/projectsApi'
import { getAllEngineers } from '@/api/usersApi'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ProgressBar, StatusBadge } from './ProjectTable'

const fmt = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
const responseError = (err, fallback) => err?.response?.data?.message ?? fallback

const PROJECT_STATUSES = ['ACTIVE', 'PAUSED', 'DELIVERED', 'COMPLETED']

export default function ProjectDetailContent({
  project,
  role,
  onRefresh,
  itemHeaderAction = null,
  itemActionRenderer = null,
}) {
  const { t, i18n } = useTranslation()
  const isAdmin = role === 'ADMIN'
  const isEngineer = role === 'ENGINEER'
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [engineers, setEngineers] = useState([])
  const [editForm, setEditForm] = useState({})

  if (!project) return null

  const mutate = async (fn, msg) => {
    setSaving(true)
    setError(null)
    try {
      await fn()
      await Promise.resolve(onRefresh?.())
      setSuccess(msg)
    } catch (err) {
      setError(responseError(err, t('errors.generic')))
    } finally {
      setSaving(false)
    }
  }

  const startEdit = async () => {
    try {
      const { data } = await getAllEngineers(0, 100)
      setEngineers(data.data?.content ?? [])
    } catch (err) {
      setError(responseError(err, t('errors.generic')))
      return
    }

    setEditForm({
      nameAr: project.nameAr ?? '',
      nameEn: project.nameEn ?? '',
      addressAr: project.addressAr ?? '',
      addressEn: project.addressEn ?? '',
      estimatedBudget: String(project.estimatedBudget ?? ''),
      engineerId: String(project.engineerId ?? ''),
      startDate: project.startDate ?? '',
      targetCompletionDate: project.targetCompletionDate ?? '',
    })
    setEditMode(true)
  }

  const field = (key) => (e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))

  const submitEdit = (e) => {
    e.preventDefault()
    mutate(
      () => updateProject(project.projectId, {
        ...editForm,
        engineerId: Number(editForm.engineerId),
        estimatedBudget: Number(editForm.estimatedBudget),
        overallStatus: project.overallStatus,
      }),
      t('projects.update_success'),
    ).then(() => setEditMode(false))
  }

  const sortedItems = [...(project.items ?? [])].sort(
    (a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0),
  )

  return (
    <div className="space-y-5">
      <Alert message={error} variant="error" onClose={() => setError(null)} />
      <Alert message={success} variant="success" onClose={() => setSuccess(null)} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label={t('projects.progress')} value={`${fmt(project.overallProgressPercentage)}%`} />
        {!isEngineer && <MetricCard label={t('projects.budget')} value={fmt(project.estimatedBudget)} />}
        {!isEngineer && <MetricCard label={t('projects.spent')} value={fmt(project.totalCalculatedSpent)} />}
        <MetricCard label={t('projects.status')} value={<StatusBadge status={project.overallStatus} />} />
        {isEngineer && (
          <MetricCard label={t('projects.items_count')} value={project.items?.length ?? 0} />
        )}
      </div>

      {role === 'CLIENT' && (
        <div className="space-y-3 rounded-xl border border-surface-border bg-slate-800/30 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t('projects.financial_summary')}
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FinancialRow label={t('projects.budget')} value={fmt(project.estimatedBudget)} />
            <FinancialRow label={t('projects.spent')} value={fmt(project.totalCalculatedSpent)} highlight />
            <FinancialRow
              label={t('projects.remaining_budget')}
              value={fmt((project.estimatedBudget ?? 0) - (project.totalCalculatedSpent ?? 0))}
            />
          </div>
          <div className="pt-1">
            <p className="mb-1.5 text-[11px] text-slate-500">{t('projects.progress')}</p>
            <ProgressBar value={project.overallProgressPercentage} />
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" onClick={startEdit} disabled={saving}>
            {t('projects.edit')}
          </Button>
          {PROJECT_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              disabled={saving || status === project.overallStatus}
              onClick={() => mutate(() => changeProjectStatus(project.projectId, status), t('projects.status_updated'))}
              className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-brand-500/60 hover:text-white disabled:pointer-events-none disabled:opacity-30"
            >
              {t(`projects.status_${status.toLowerCase()}`, { defaultValue: status })}
            </button>
          ))}
        </div>
      )}

      {isAdmin && editMode && (
        <form className="grid grid-cols-1 gap-3 rounded-xl border border-surface-border bg-slate-800/20 p-4 sm:grid-cols-2" onSubmit={submitEdit}>
          <Input id="edit-name-ar" label={t('projects.name_ar')} value={editForm.nameAr} onChange={field('nameAr')} required dir="rtl" />
          <Input id="edit-name-en" label={t('projects.name_en')} value={editForm.nameEn} onChange={field('nameEn')} required />
          <Input id="edit-address-ar" label={t('projects.address_ar')} value={editForm.addressAr} onChange={field('addressAr')} dir="rtl" />
          <Input id="edit-address-en" label={t('projects.address_en')} value={editForm.addressEn} onChange={field('addressEn')} />
          <Input id="edit-budget" label={t('projects.budget')} type="number" min="0" step="0.01" value={editForm.estimatedBudget} onChange={field('estimatedBudget')} required />
          <label className="form-label">
            {t('projects.engineer')}
            <select className="input-base mt-1.5 text-sm" value={editForm.engineerId} onChange={field('engineerId')} required>
              <option value="">{project.engineerName}</option>
              {engineers.map((engineer) => (
                <option key={engineer.userId} value={engineer.userId}>
                  {engineer.fullNameEn} ({engineer.username})
                </option>
              ))}
            </select>
          </label>
          <Input id="edit-start" label={t('projects.start_date')} type="date" value={editForm.startDate} onChange={field('startDate')} required />
          <Input id="edit-target" label={t('projects.target_date')} type="date" value={editForm.targetCompletionDate} onChange={field('targetCompletionDate')} required />
          <div className="col-span-full flex justify-end gap-2 border-t border-surface-border pt-3">
            <Button type="button" variant="ghost" onClick={() => setEditMode(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={saving}>
              {t('common.submit')}
            </Button>
          </div>
        </form>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-white">{t('projects.items')}</h3>
          {itemHeaderAction}
        </div>
        <div className="space-y-3">
          {sortedItems.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-500">{t('projects.no_items')}</p>
          )}
          {sortedItems.map((item) => (
            <ProjectItemCard
              key={item.projectItemId}
              item={item}
              projectId={project.projectId}
              isAdmin={isAdmin}
              isEngineer={isEngineer}
              saving={saving}
              t={t}
              i18n={i18n}
              onMutate={mutate}
              itemActionRenderer={itemActionRenderer}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function ProjectItemCard({ item, projectId, isAdmin, isEngineer, saving, t, i18n, onMutate, itemActionRenderer }) {
  const [showItemEdit, setShowItemEdit] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const name = i18n.language === 'ar' ? item.itemNameAr : item.itemNameEn

  const submitItemConfig = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    onMutate(
      () => updateProjectItem(projectId, item.projectItemId, {
        budget: Number(fd.get('budget')),
        weightPercentage: Number(fd.get('weightPercentage')),
        sequenceOrder: Number(fd.get('sequenceOrder')),
        generalNotes: fd.get('generalNotes') || undefined,
      }),
      t('projects.item_updated'),
    )
  }

  const submitProgress = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = {
      completionPercentage: Number(fd.get('completionPercentage')),
      status: fd.get('status'),
    }
    const updater = isAdmin ? updateAdminItemProgress : updateEngineerItemProgress
    onMutate(() => updater(projectId, item.projectItemId, payload), t('projects.progress_updated'))
  }

  return (
    <article className="rounded-xl border border-surface-border bg-slate-800/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-100">{name}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {t('projects.sequence')}: {item.sequenceOrder ?? '—'} · {t('projects.weight')}: {item.weightPercentage ?? 0}%
          </p>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <div className="mt-3">
        <ProgressBar value={item.completionPercentage} />
      </div>

      {!isEngineer && item.calculatedSpent != null && (
        <p className="mt-2 text-xs text-slate-500">
          {t('projects.spent')}: <span className="text-slate-400">{fmt(item.calculatedSpent)}</span>
        </p>
      )}

      {itemActionRenderer && (
        <div className="mt-3 flex border-t border-surface-border/50 pt-3">
          {itemActionRenderer(item)}
        </div>
      )}

      {isAdmin && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-surface-border/50 pt-3">
          <button
            type="button"
            onClick={() => {
              setShowItemEdit(!showItemEdit)
              setShowProgress(false)
            }}
            className="text-xs text-brand-400 transition-colors hover:text-brand-300"
          >
            {showItemEdit ? t('common.cancel') : t('projects.edit_item')}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowProgress(!showProgress)
              setShowItemEdit(false)
            }}
            className="text-xs text-cyan-400 transition-colors hover:text-cyan-300"
          >
            {showProgress ? t('common.cancel') : t('projects.update_progress')}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onMutate(() => removeProjectItem(projectId, item.projectItemId), t('projects.item_removed'))}
            className="text-xs text-red-400 transition-colors hover:text-red-300 disabled:opacity-30"
          >
            {t('projects.remove')}
          </button>
        </div>
      )}

      {isAdmin && showItemEdit && (
        <form className="mt-3 grid grid-cols-2 gap-2 border-t border-surface-border/50 pt-3 sm:grid-cols-4" onSubmit={submitItemConfig}>
          <MiniInput name="budget" label={t('projects.item_budget')} type="number" min="0" step="0.01" defaultValue={item.budget} />
          <MiniInput name="weightPercentage" label={t('projects.weight')} type="number" min="0" max="100" step="0.01" defaultValue={item.weightPercentage} />
          <MiniInput name="sequenceOrder" label={t('projects.sequence')} type="number" min="1" defaultValue={item.sequenceOrder} />
          <MiniInput name="generalNotes" label={t('projects.notes')} defaultValue={item.generalNotes} />
          <div className="col-span-full flex justify-end">
            <Button type="submit" loading={saving}>
              {t('projects.save_item')}
            </Button>
          </div>
        </form>
      )}

      {(isAdmin || isEngineer) && showProgress && (
        <form className="mt-3 flex flex-wrap items-end gap-3 border-t border-surface-border/50 pt-3" onSubmit={submitProgress}>
          <MiniInput name="completionPercentage" label={`${t('projects.progress')} %`} type="number" min="0" max="100" step="0.01" defaultValue={item.completionPercentage} />
          <label className="text-xs text-slate-500">
            {t('projects.status')}
            <select name="status" defaultValue={item.status ?? 'PENDING'} className="input-base mt-1 block min-w-[130px] text-sm">
              {['PENDING', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" loading={saving}>
            {t('projects.update_progress')}
          </Button>
        </form>
      )}

      {isEngineer && !showProgress && (
        <div className="mt-3 flex border-t border-surface-border/50 pt-3">
          <button
            type="button"
            onClick={() => setShowProgress(true)}
            className="text-xs font-medium text-brand-400 transition-colors hover:text-brand-300"
          >
            {t('projects.update_progress')}
          </button>
        </div>
      )}
    </article>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-xl border border-surface-border bg-slate-800/30 p-3">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-bold text-white">{value}</div>
    </div>
  )
}

function FinancialRow({ label, value, highlight = false }) {
  return (
    <div>
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className={`mt-0.5 text-base font-bold ${highlight ? 'text-amber-400' : 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}

function MiniInput({ label, ...props }) {
  return (
    <label className="text-xs text-slate-500">
      {label}
      <input className="input-base mt-1 block w-full text-sm" {...props} />
    </label>
  )
}