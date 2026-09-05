import { evaluateAdminDailyUpdate } from '@/api/adminDailyUpdateApi'
import Modal from '@/components/admin/Modal'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const responseError = (err, fallback) => err?.response?.data?.message ?? err?.message ?? fallback

function buildInitialForm(update) {
  const resolvedStatus = update?.status === 'APPROVED' || update?.status === 'REJECTED'
    ? update.status
    : 'APPROVED'

  return {
    status: resolvedStatus,
    title: update?.title ?? '',
    notes: update?.notes ?? '',
    imageEvaluations: (update?.images ?? []).map((image) => ({
      updateImageId: image.updateImageId,
      approved: image.approved ?? resolvedStatus !== 'REJECTED',
    })),
  }
}

export default function AdminDailyUpdateEvaluationModal({
  isOpen,
  onClose,
  update,
  onSaved,
}) {
  const { t, i18n } = useTranslation()
  const [form, setForm] = useState(() => buildInitialForm(update))
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen || !update) return

    setForm(buildInitialForm(update))
    setErrors({})
    setError(null)
    setSaving(false)
  }, [isOpen, update])

  if (!update) return null

  const closeModal = () => {
    if (saving) return
    onClose?.()
  }

  const updateField = (key) => (event) => {
    const value = event.target.value
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const setDecision = (status) => {
    setForm((current) => ({ ...current, status }))
    setErrors((current) => ({ ...current, status: undefined }))
  }

  const setImageDecision = (updateImageId, approved) => {
    setForm((current) => ({
      ...current,
      imageEvaluations: current.imageEvaluations.map((image) => (
        image.updateImageId === updateImageId ? { ...image, approved } : image
      )),
    }))
  }

  const validate = () => {
    const nextErrors = {}

    if (!form.title.trim()) {
      nextErrors.title = t('common.required')
    }

    if (!form.status) {
      nextErrors.status = t('common.required')
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate() || saving) return

    setSaving(true)
    setError(null)

    try {
      await evaluateAdminDailyUpdate(update.dailyUpdateId, {
        status: form.status,
        title: form.title.trim(),
        notes: form.notes.trim() || undefined,
        imageEvaluations: form.imageEvaluations,
      })

      await onSaved?.()
      onClose?.()
    } catch (err) {
      setError(responseError(err, t('errors.generic')))
    } finally {
      setSaving(false)
    }
  }

  const engineerName = i18n.language === 'ar' ? update.engineerNameAr : update.engineerNameEn

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={t('daily_updates.evaluation_title')}
      size="lg"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Alert message={error} variant="error" onClose={() => setError(null)} />

        <div className="rounded-2xl border border-surface-border bg-slate-900/50 p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">
            {t('daily_updates.engineer_name')}
          </p>
          <p className="mt-1 text-sm font-semibold text-white">{engineerName || update.engineerUsername || '—'}</p>
          <p className="mt-1 text-xs text-slate-500">{t('daily_updates.submitted_on', { date: formatDate(update.createdAt, i18n.language) })}</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-300">{t('daily_updates.evaluation_status')}</p>
          <div className="flex flex-wrap gap-3">
            {['APPROVED', 'REJECTED'].map((status) => {
              const active = form.status === status
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setDecision(status)}
                  className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? status === 'APPROVED'
                        ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                        : 'border-rose-400/40 bg-rose-500/10 text-rose-200'
                      : 'border-surface-border bg-slate-900/40 text-slate-400 hover:text-white'
                  }`}
                >
                  {status === 'APPROVED' ? t('daily_updates.approve') : t('daily_updates.reject')}
                </button>
              )
            })}
          </div>
          {errors.status && <p className="text-xs text-red-400">{errors.status}</p>}
        </div>

        <Input
          id="admin-daily-update-title"
          label={t('daily_updates.update_title')}
          value={form.title}
          onChange={updateField('title')}
          error={errors.title}
          maxLength={255}
          disabled={saving}
        />

        <label className="block text-sm font-medium text-slate-300">
          {t('daily_updates.notes')}
          <textarea
            className="input-base mt-1.5 min-h-[120px] resize-y"
            value={form.notes}
            onChange={updateField('notes')}
            maxLength={2000}
            disabled={saving}
          />
        </label>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-300">{t('daily_updates.attach_images')}</p>
            {update.images?.length > 0 && (
              <p className="text-xs text-slate-500">{t('daily_updates.images_count', { count: update.images.length })}</p>
            )}
          </div>

          {update.images?.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {update.images.map((image) => {
                const verdict = form.imageEvaluations.find((entry) => entry.updateImageId === image.updateImageId)

                return (
                  <div key={image.updateImageId} className="overflow-hidden rounded-3xl border border-surface-border bg-slate-900/40">
                    <div className="aspect-[4/3] overflow-hidden bg-slate-950/50">
                      <img src={image.imageUrl} alt={update.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="space-y-3 px-4 py-4">
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">{t('daily_updates.image_review')}</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setImageDecision(image.updateImageId, true)}
                          className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                            verdict?.approved
                              ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                              : 'border-surface-border bg-slate-950/40 text-slate-400 hover:text-white'
                          }`}
                        >
                          {t('daily_updates.mark_image_approved')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageDecision(image.updateImageId, false)}
                          className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                            verdict?.approved === false
                              ? 'border-rose-400/40 bg-rose-500/10 text-rose-200'
                              : 'border-surface-border bg-slate-950/40 text-slate-400 hover:text-white'
                          }`}
                        >
                          {t('daily_updates.mark_image_rejected')}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-surface-border bg-slate-900/40 px-4 py-5 text-sm text-slate-400">
              {t('daily_updates.no_images')}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-surface-border pt-4">
          <Button type="button" variant="ghost" className="w-auto" onClick={closeModal} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" className="w-auto" loading={saving}>
            {t('daily_updates.save_evaluation')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function formatDate(value, language) {
  if (!value) return '—'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}