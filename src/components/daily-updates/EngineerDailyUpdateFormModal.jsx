import { createEngineerDailyUpdate } from '@/api/engineerDailyUpdateApi'
import Modal from '@/components/admin/Modal'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Spinner } from '@/components/ui/icons/Globe'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const CLOUDINARY_ENDPOINT = 'https://api.cloudinary.com/v1_1/djhbgtqbg/image/upload'
const CLOUDINARY_UPLOAD_PRESET = 'ottima_daily_updates'

const responseError = (err, fallback) => err?.response?.data?.message ?? err?.message ?? fallback
const cloudinaryError = (response, payload, fallback) =>
  payload?.error?.message ?? response.headers.get('x-cld-error') ?? fallback

function createInitialForm(projectItems, initialProjectItemId) {
  const defaultProjectItemId = initialProjectItemId || (projectItems.length === 1 ? projectItems[0].projectItemId : '')

  return {
    projectItemId: defaultProjectItemId ? String(defaultProjectItemId) : '',
    title: '',
    notes: '',
    uploadedImages: [],
  }
}

export default function EngineerDailyUpdateFormModal({
  isOpen,
  onClose,
  projectId,
  projectItems = [],
  initialProjectItemId = '',
  onCreated,
}) {
  const { t, i18n } = useTranslation()
  const [form, setForm] = useState(() => createInitialForm(projectItems, initialProjectItemId))
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadQueue, setUploadQueue] = useState([])
  const [saving, setSaving] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    setForm(createInitialForm(projectItems, initialProjectItemId))
    setErrors({})
    setError(null)
    setUploading(false)
    setUploadQueue([])
    setDragActive(false)
    setSaving(false)
  }, [initialProjectItemId, isOpen, projectItems])

  const sortedProjectItems = [...projectItems].sort(
    (left, right) => (left.sequenceOrder ?? 0) - (right.sequenceOrder ?? 0),
  )

  const updateField = (key) => (event) => {
    const value = event.target.value
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const closeModal = () => {
    if (saving || uploading) return
    onClose?.()
  }

  const validate = () => {
    const nextErrors = {}

    if (!form.projectItemId) {
      nextErrors.projectItemId = t('common.required')
    }

    if (!form.title.trim()) {
      nextErrors.title = t('common.required')
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const uploadFiles = async (files) => {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'))
    if (!imageFiles.length) return

    setUploading(true)
    setError(null)
    setUploadQueue(imageFiles.map((file) => file.name))

    try {
      const results = await Promise.allSettled(
        imageFiles.map(async (file) => {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

          const response = await fetch(CLOUDINARY_ENDPOINT, {
            method: 'POST',
            body: formData,
          })

          const payload = await response.json().catch(() => ({}))

          if (!response.ok || !payload?.secure_url) {
            throw new Error(cloudinaryError(response, payload, t('errors.generic')))
          }

          return {
            imageUrl: payload.secure_url,
            fileName: file.name,
          }
        }),
      )

      const uploadedImages = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value)

      const failedUploads = results.filter((result) => result.status === 'rejected')

      if (uploadedImages.length) {
        setForm((current) => ({
          ...current,
          uploadedImages: [...current.uploadedImages, ...uploadedImages],
        }))
      }

      if (failedUploads.length) {
        const firstFailureReason = failedUploads
          .map((result) => result.reason?.message)
          .find(Boolean)

        setError(
          [
            t('daily_updates.upload_partial_failure', {
              defaultValue: '{{count}} image upload(s) failed. Successful uploads were kept.',
              count: failedUploads.length,
            }),
            firstFailureReason,
          ]
            .filter(Boolean)
            .join(' '),
        )
      }
    } catch (err) {
      setError(responseError(err, t('errors.generic')))
    } finally {
      setUploading(false)
      setUploadQueue([])
    }
  }

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files ?? [])
    await uploadFiles(files)
    event.target.value = ''
  }

  const handleDrop = async (event) => {
    event.preventDefault()
    setDragActive(false)
    await uploadFiles(Array.from(event.dataTransfer.files ?? []))
  }

  const removeImage = (imageUrl) => {
    setForm((current) => ({
      ...current,
      uploadedImages: current.uploadedImages.filter((image) => image.imageUrl !== imageUrl),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate() || uploading || saving) return

    setSaving(true)
    setError(null)

    try {
      await createEngineerDailyUpdate(projectId, {
        projectItemId: form.projectItemId,
        title: form.title.trim(),
        notes: form.notes.trim() || undefined,
        imageUrls: form.uploadedImages.map((image) => image.imageUrl),
      })

      onCreated?.()
      onClose?.()
    } catch (err) {
      setError(responseError(err, t('errors.generic')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={t('daily_updates.create_title', { defaultValue: 'Create daily update' })}
      size="lg"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Alert message={error} variant="error" onClose={() => setError(null)} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-300">
            {t('daily_updates.project_item', { defaultValue: 'Project item' })}
            <select
              className={`input-base mt-1.5 text-sm ${errors.projectItemId ? 'input-error' : ''}`}
              value={form.projectItemId}
              onChange={updateField('projectItemId')}
              disabled={saving || uploading}
            >
              <option value="">{t('daily_updates.select_project_item', { defaultValue: 'Select an item' })}</option>
              {sortedProjectItems.map((item) => (
                <option key={item.projectItemId} value={item.projectItemId}>
                  {(i18n.language === 'ar' ? item.itemNameAr : item.itemNameEn) || item.itemNameEn || item.itemNameAr}
                </option>
              ))}
            </select>
            {errors.projectItemId && (
              <p className="mt-1.5 text-xs text-red-400">{errors.projectItemId}</p>
            )}
          </label>

          <Input
            id="daily-update-title"
            label={t('daily_updates.update_title', { defaultValue: 'Update title' })}
            value={form.title}
            onChange={updateField('title')}
            error={errors.title}
            maxLength={255}
            disabled={saving || uploading}
            placeholder={t('daily_updates.update_title_placeholder', { defaultValue: 'Summarize what was completed today' })}
          />
        </div>

        <label className="block text-sm font-medium text-slate-300">
          {t('daily_updates.notes', { defaultValue: 'Notes' })}
          <textarea
            className="input-base mt-1.5 min-h-[120px] resize-y"
            value={form.notes}
            onChange={updateField('notes')}
            maxLength={2000}
            disabled={saving || uploading}
            placeholder={t('daily_updates.notes_placeholder', { defaultValue: 'Add any site remarks, blockers, or next steps' })}
          />
        </label>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-slate-300">
              {t('daily_updates.attach_images', { defaultValue: 'Attach progress images' })}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {t('daily_updates.cloudinary_hint', { defaultValue: 'Images upload directly to Cloudinary and only secure URLs are sent to the backend.' })}
            </p>
          </div>

          <label
            htmlFor="daily-update-images"
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
            onDragOver={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDrop={handleDrop}
            className={`block rounded-3xl border border-dashed px-5 py-8 text-center transition-all ${
              dragActive
                ? 'border-brand-400 bg-brand-500/10 shadow-[0_0_0_1px_rgba(96,165,250,0.35)]'
                : 'border-surface-border bg-slate-900/40 hover:border-brand-500/40 hover:bg-slate-900/70'
            } ${saving || uploading ? 'cursor-wait opacity-80' : 'cursor-pointer'}`}
          >
            <input
              id="daily-update-images"
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              disabled={saving || uploading}
              onChange={handleFileChange}
            />

            <div className="mx-auto flex max-w-md flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-500/10 text-brand-300">
                {uploading ? <Spinner className="h-6 w-6" /> : <UploadIcon className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {uploading
                    ? t('daily_updates.uploading_images', { defaultValue: 'Uploading images...' })
                    : t('daily_updates.dropzone_title', { defaultValue: 'Drop images here or click to browse' })}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {t('daily_updates.dropzone_subtitle', { defaultValue: 'PNG, JPG, and WEBP are supported. Multiple files are allowed.' })}
                </p>
              </div>
            </div>
          </label>

          {uploadQueue.length > 0 && (
            <div className="rounded-2xl border border-surface-border bg-slate-900/40 p-3 text-xs text-slate-400">
              <p className="font-medium text-slate-200">
                {t('daily_updates.upload_queue', { defaultValue: 'Uploading now' })}
              </p>
              <p className="mt-1">{uploadQueue.join(' - ')}</p>
            </div>
          )}

          {form.uploadedImages.length > 0 && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {form.uploadedImages.map((image) => (
                <div key={image.imageUrl} className="overflow-hidden rounded-2xl border border-surface-border bg-slate-900/50">
                  <div className="aspect-[4/3] overflow-hidden bg-slate-950/50">
                    <img
                      src={image.imageUrl}
                      alt={image.fileName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <p className="line-clamp-1 text-xs text-slate-400">{image.fileName}</p>
                    <button
                      type="button"
                      onClick={() => removeImage(image.imageUrl)}
                      disabled={saving || uploading}
                      className="text-xs font-medium text-red-300 transition-colors hover:text-red-200 disabled:opacity-40"
                    >
                      {t('daily_updates.remove_image', { defaultValue: 'Remove' })}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-surface-border pt-4">
          <Button type="button" variant="ghost" className="w-auto" onClick={closeModal} disabled={saving || uploading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" className="w-auto" loading={saving} disabled={uploading || projectItems.length === 0}>
            {t('daily_updates.submit_update', { defaultValue: 'Submit update' })}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function UploadIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M7.5 9 12 4.5M12 4.5 16.5 9M12 4.5V16.5" />
    </svg>
  )
}