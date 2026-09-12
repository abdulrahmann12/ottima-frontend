import { evaluateAdminDailyUpdate } from '@/api/adminDailyUpdateApi'
import Modal from '@/components/admin/Modal'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { optimizeCloudinaryUrl } from '@/utils/imageUtils'
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

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            {t('daily_updates.engineer_name')}
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{engineerName || update.engineerUsername || '—'}</p>
          <p className="mt-1 text-xs text-gray-500">{t('daily_updates.submitted_on', { date: formatDate(update.createdAt, i18n.language) })}</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">{t('daily_updates.evaluation_status')}</p>
          <div className="flex flex-wrap gap-3">
            {['APPROVED', 'REJECTED'].map((status) => {
              const active = form.status === status
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setDecision(status)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                    active
                      ? status === 'APPROVED'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20'
                        : 'border-rose-300 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {status === 'APPROVED' ? t('daily_updates.approve') : t('daily_updates.reject')}
                </button>
              )
            })}
          </div>
          {errors.status && <p className="text-xs text-red-500">{errors.status}</p>}
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

        <label className="block text-sm font-medium text-gray-700">
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
            <p className="text-sm font-medium text-gray-700">{t('daily_updates.attach_images')}</p>
            {update.images?.length > 0 && (
              <p className="text-xs text-gray-500">{t('daily_updates.images_count', { count: update.images.length })}</p>
            )}
          </div>

          {update.images?.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {update.images.map((image) => {
                const verdict = form.imageEvaluations.find((entry) => entry.updateImageId === image.updateImageId)

                return (
                  <div key={image.updateImageId} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                      <img
                        src={optimizeCloudinaryUrl(image.imageUrl, { width: 600 })}
                        alt={update.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="space-y-2.5 border-t border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{t('daily_updates.image_review')}</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setImageDecision(image.updateImageId, true)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                            verdict?.approved
                              ? 'border-emerald-300 bg-emerald-100 text-emerald-800 ring-1 ring-emerald-400'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700'
                          }`}
                        >
                          {t('daily_updates.mark_image_approved')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageDecision(image.updateImageId, false)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                            verdict?.approved === false
                              ? 'border-rose-300 bg-rose-100 text-rose-800 ring-1 ring-rose-400'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-rose-200 hover:bg-rose-50/50 hover:text-rose-700'
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
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-400 text-center">
              {t('daily_updates.no_images')}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-4">
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