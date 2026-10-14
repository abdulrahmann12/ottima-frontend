import {
  DOCUMENT_TYPES,
  PAYMENT_METHODS,
  RECORD_TYPES,
  createFinancialRecord,
  updateFinancialRecord,
} from '@/api/adminFinancialApi'
import Modal from '@/components/admin/Modal'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { Spinner } from '@/components/ui/icons/Globe'
import { compressImageFile, optimizeCloudinaryUrl, getPdfPreviewUrl, isPdfDocument } from '@/utils/imageUtils'
import DocumentViewerModal from '@/components/ui/DocumentViewerModal'
import { useEffect, useRef, useState } from 'react'

// ─── Cloudinary config (same preset / cloud as Daily Updates) ─
const CLOUDINARY_ENDPOINT = 'https://api.cloudinary.com/v1_1/djhbgtqbg/image/upload'
const CLOUDINARY_UPLOAD_PRESET = 'ottima_daily_updates'

const apiError = (err, fallback) => err?.response?.data?.message ?? err?.message ?? fallback
const cldError = (res, payload, fallback) =>
  payload?.error?.message ?? res.headers?.get?.('x-cld-error') ?? fallback

function emptyForm(record = null) {
  const isExpense = record?.recordType === 'EXPENSE'
  // An expense is considered "OTHER" if it has no linked project item or already has an expenseCategory
  const isOther = Boolean(isExpense && (!record?.projectItemId || record?.expenseCategory))

  return {
    expenseType:     isOther ? 'OTHER' : 'ITEM', // 'ITEM' | 'OTHER'
    projectItemId:   record?.projectItemId  ?? '',
    expenseCategory: record?.expenseCategory ?? (isOther ? 'Other' : ''),
    recordType:      record?.recordType     ?? 'DEPOSIT',
    amount:          record?.amount         ?? '',
    paymentMethod:   record?.paymentMethod  ?? 'CASH',
    transactionDate: record?.transactionDate ?? '',
    documentUrl:     record?.documentUrl    ?? '',
    documentType:    record?.documentType   ?? '',
    notes:           record?.notes          ?? '',
  }
}

/**
 * FinancialRecordModal
 *
 * Props:
 *   isOpen      boolean
 *   onClose     () => void
 *   projectId   string
 *   record      FinancialRecordResponse | null   — null = create mode
 *   projectItems Array<{ projectItemId, itemNameAr, itemNameEn }>
 *   onSaved     () => void
 *   language    'en' | 'ar'
 */
export default function FinancialRecordModal({
  isOpen,
  onClose,
  projectId,
  record = null,
  projectItems = [],
  onSaved,
  language = 'en',
}) {
  const isEdit = Boolean(record)

  const [form, setForm]           = useState(() => emptyForm(record))
  const [errors, setErrors]       = useState({})
  const [error, setError]         = useState(null)
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [docPreview, setDocPreview] = useState(record?.documentUrl ?? null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const fileRef = useRef(null)

  // Reset when modal opens / record changes
  useEffect(() => {
    if (!isOpen) return
    const initial = emptyForm(record)
    // If creating a new EXPENSE and no items exist, default to OTHER
    if (!record && initial.recordType === 'EXPENSE' && projectItems.length === 0) {
      initial.expenseType = 'OTHER'
      initial.expenseCategory = 'Other'
    }
    setForm(initial)
    setErrors({})
    setError(null)
    setSaving(false)
    setUploading(false)
    setDragActive(false)
    setDocPreview(record?.documentUrl ?? null)
  }, [isOpen, record, projectItems.length])

  const set = (key) => (e) => {
    const val = e?.target ? e.target.value : e
    setForm((f) => {
      const updated = { ...f, [key]: val }
      // When switching back to DEPOSIT, clear projectItemId & expenseCategory (deposits are project-level)
      if (key === 'recordType' && val === 'DEPOSIT') {
        updated.projectItemId = ''
        updated.expenseCategory = ''
        updated.expenseType = 'ITEM'
      } else if (key === 'recordType' && val === 'EXPENSE') {
        if (projectItems.length === 0) {
          updated.expenseType = 'OTHER'
          if (!updated.expenseCategory) updated.expenseCategory = 'Other'
        }
      }
      return updated
    })
    setErrors((prev) => ({ ...prev, [key]: undefined, projectItemId: undefined }))
  }

  const handleExpenseTypeChange = (type) => {
    setForm((f) => ({
      ...f,
      expenseType: type,
      projectItemId: type === 'OTHER' ? '' : f.projectItemId,
      expenseCategory: type === 'OTHER' ? (f.expenseCategory || 'Other') : '',
    }))
    setErrors((prev) => ({ ...prev, projectItemId: undefined }))
  }

  const handleProjectItemChange = (e) => {
    const val = e?.target ? e.target.value : e
    if (val === '__OTHER__') {
      setForm((f) => ({
        ...f,
        expenseType: 'OTHER',
        projectItemId: '',
        expenseCategory: f.expenseCategory || 'Other',
      }))
    } else {
      setForm((f) => ({
        ...f,
        expenseType: 'ITEM',
        projectItemId: val,
        expenseCategory: '',
      }))
    }
    setErrors((prev) => ({ ...prev, projectItemId: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.recordType)      e.recordType      = 'Required'
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Must be a positive number'
    if (!form.paymentMethod)   e.paymentMethod   = 'Required'
    if (!form.transactionDate) e.transactionDate = 'Required'

    // Expense validation: required to pick a project item ONLY if in 'ITEM' mode
    if (form.recordType === 'EXPENSE' && form.expenseType === 'ITEM') {
      if (!form.projectItemId || form.projectItemId === '__OTHER__') {
        e.projectItemId = language === 'ar'
          ? 'يرجى اختيار بند المشروع أو التبديل لخيار "أخرى"'
          : 'Select the project item this expense belongs to or choose Other'
      }
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Fast Cloudinary upload with client-side compression ──────
  const uploadDocument = async (rawFile) => {
    setUploading(true)
    setError(null)
    try {
      // Compress image client-side to make upload blazing fast (under 1s) and prevent browser UI freeze
      const file = await compressImageFile(rawFile)

      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

      const res = await fetch(CLOUDINARY_ENDPOINT, { method: 'POST', body: fd })
      const payload = await res.json().catch(() => ({}))

      if (!res.ok || !payload?.secure_url) {
        throw new Error(cldError(res, payload, 'Upload failed'))
      }

      const url = payload.secure_url
      // Auto-detect documentType from MIME
      const autoType = file.type === 'application/pdf' ? 'PDF' : 'IMAGE'
      setForm((f) => ({ ...f, documentUrl: url, documentType: autoType }))
      setDocPreview(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (file) await uploadDocument(file)
    e.target.value = ''
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await uploadDocument(file)
  }

  const clearDocument = () => {
    setForm((f) => ({ ...f, documentUrl: '', documentType: '' }))
    setDocPreview(null)
  }

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate() || saving || uploading) return

    setSaving(true)
    setError(null)

    const isExpense = form.recordType === 'EXPENSE'
    const isOtherExpense = isExpense && (form.expenseType === 'OTHER' || form.projectItemId === '__OTHER__' || !form.projectItemId)

    const payload = {
      projectItemId:   (isExpense && !isOtherExpense && form.projectItemId) ? form.projectItemId : null,
      expenseCategory: (isExpense && isOtherExpense) ? (form.expenseCategory?.trim() || 'Other') : null,
      recordType:      form.recordType,
      amount:          Number(form.amount),
      paymentMethod:   form.paymentMethod,
      transactionDate: form.transactionDate,
      documentUrl:     form.documentUrl     || undefined,
      documentType:    form.documentType    || undefined,
      notes:           form.notes.trim()    || undefined,
    }

    try {
      if (isEdit) {
        await updateFinancialRecord(record.financialRecordId, payload)
      } else {
        await createFinancialRecord(projectId, payload)
      }
      onSaved?.()
      onClose?.()
    } catch (err) {
      setError(apiError(err, 'Failed to save record.'))
    } finally {
      setSaving(false)
    }
  }

  const isDocImage = docPreview && !docPreview.toLowerCase().endsWith('.pdf')

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!saving && !uploading) onClose?.() }}
      title={isEdit ? 'Edit Financial Record' : 'New Financial Record'}
      size="lg"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Alert message={error} variant="error" onClose={() => setError(null)} />

        {/* Row 1 — type + amount */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Record Type" error={errors.recordType} required>
            <select
              className={`input-base text-sm ${errors.recordType ? 'input-error' : ''}`}
              value={form.recordType}
              onChange={set('recordType')}
              disabled={saving}
            >
              {RECORD_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>

          <Field label="Amount" error={errors.amount} required>
            <input
              id="fin-amount"
              type="number"
              min="0.01"
              step="0.01"
              className={`input-base text-sm ${errors.amount ? 'input-error' : ''}`}
              value={form.amount}
              onChange={set('amount')}
              placeholder="e.g. 5000.00"
              disabled={saving}
            />
          </Field>
        </div>

        {/* Row 2 — payment method + date */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Payment Method" error={errors.paymentMethod} required>
            <select
              className={`input-base text-sm ${errors.paymentMethod ? 'input-error' : ''}`}
              value={form.paymentMethod}
              onChange={set('paymentMethod')}
              disabled={saving}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m.replace('_', ' ')}</option>
              ))}
            </select>
          </Field>

          <Field label="Transaction Date" error={errors.transactionDate} required>
            <input
              id="fin-date"
              type="date"
              className={`input-base text-sm ${errors.transactionDate ? 'input-error' : ''}`}
              value={form.transactionDate}
              onChange={set('transactionDate')}
              disabled={saving}
            />
          </Field>
        </div>

        {/* Row 3 — Expense Target: Project Item or Other option */}
        {form.recordType === 'EXPENSE' && (
          <div className="space-y-3 rounded-2xl border border-gray-200/90 bg-gray-50/60 p-3.5 transition-all">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <span>{language === 'ar' ? 'بند المصروف' : 'Expense Allocation'}</span>
                <span className="text-red-500 font-bold">*</span>
              </label>

              {/* Segmented Pill Selector */}
              <div className="inline-flex rounded-xl bg-gray-200/80 p-0.5 text-xs font-semibold shadow-inner">
                <button
                  type="button"
                  onClick={() => handleExpenseTypeChange('ITEM')}
                  disabled={saving || projectItems.length === 0}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                    form.expenseType === 'ITEM'
                      ? 'bg-white text-gray-900 shadow-xs font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  } ${projectItems.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span>📋</span>
                  <span>{language === 'ar' ? 'بند من المشروع' : 'Project Item'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExpenseTypeChange('OTHER')}
                  disabled={saving}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    form.expenseType === 'OTHER'
                      ? 'bg-warm-brown text-white shadow-xs font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>🏷️</span>
                  <span>{language === 'ar' ? 'أخرى (مصروفات عامة)' : 'Other'}</span>
                </button>
              </div>
            </div>

            {form.expenseType === 'ITEM' ? (
              <div>
                {projectItems.length === 0 ? (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800 font-medium">
                    <p className="font-medium">
                      {language === 'ar' ? '⚠ لا توجد بنود لهذا المشروع حتى الآن.' : '⚠ No items found for this project.'}
                    </p>
                    <p className="mt-1 text-amber-700 font-light">
                      {language === 'ar'
                        ? 'يمكنك تسجيل هذا المصروف كـ "أخرى" (مصروفات عامة).'
                        : 'You can record this as an "Other" general expense.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleExpenseTypeChange('OTHER')}
                      className="mt-2 inline-flex items-center gap-1 font-bold text-warm-brown hover:underline cursor-pointer"
                    >
                      {language === 'ar' ? 'التبديل إلى خيار "أخرى" ←' : 'Switch to Other Option →'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <SearchableSelect
                      id="fin-project-item"
                      required
                      error={errors.projectItemId}
                      value={form.projectItemId}
                      onChange={handleProjectItemChange}
                      disabled={saving}
                      placeholder={language === 'ar' ? '— اختر بند المشروع أو خيار أخرى —' : '— Select project item or Other option —'}
                      options={[
                        {
                          value: '__OTHER__',
                          label: language === 'ar' ? '🏷️ أخرى (مصروفات عامة)' : '🏷️ Other (General Expense)',
                          sublabel: language === 'ar' ? 'تسجيل المصروف كـ أخرى بدون ربطه ببند محدد' : 'Save as Other (Item ID will be null)',
                        },
                        ...[...projectItems]
                          .sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0))
                          .map((item) => ({
                            value: item.projectItemId,
                            label: (language === 'ar' ? item.itemNameAr : item.itemNameEn) || item.itemNameEn || item.itemNameAr,
                          })),
                      ]}
                    />
                    <p className="mt-1.5 text-[11px] text-gray-500">
                      {language === 'ar'
                        ? 'اختر البند الذي يتبع له هذا المصروف، أو حدد "أخرى" للمصروفات العامة.'
                        : 'Choose the project item or select "Other" for general unlinked expenses.'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-warm-brown/20 bg-warm-brown/5 p-3.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-warm-brown/20 text-sm">
                      🏷️
                    </span>
                    <div>
                      <p className="text-xs font-bold text-gray-800">
                        {language === 'ar' ? 'مصروف عام (أخرى)' : 'Other General Expense'}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {language === 'ar'
                          ? 'سيتم الحفظ كـ أخرى وبدون ربطه ببند محدد (project_item_id = null)'
                          : 'Will save in database as "Other" and project item ID will be null'}
                      </p>
                    </div>
                  </div>
                  {projectItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleExpenseTypeChange('ITEM')}
                      className="text-xs font-semibold text-warm-brown hover:underline cursor-pointer"
                    >
                      {language === 'ar' ? 'ربط ببند محدد؟' : 'Link to item?'}
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {language === 'ar' ? 'تصنيف / مسمى المصروف (اختياري)' : 'Category / Label (optional)'}
                  </label>
                  <input
                    type="text"
                    className="input-base text-sm bg-white"
                    value={form.expenseCategory}
                    onChange={set('expenseCategory')}
                    placeholder="Other"
                    disabled={saving}
                  />
                  <p className="mt-1 text-[11px] text-gray-500">
                    {language === 'ar'
                      ? 'القيمة المحفوظة في قاعدة البيانات (الافتراضي: Other).'
                      : 'Saved in database as other (default: Other).'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Document upload (drag & drop) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Receipt / Document <span className="text-gray-400 font-normal">(optional)</span>
          </label>

          {docPreview ? (
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/70 p-3 shadow-sm transition-all">
              {isDocImage ? (
                <div
                  onClick={() => setViewerOpen(true)}
                  className="rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center p-1 cursor-pointer group"
                >
                  <img
                    src={optimizeCloudinaryUrl(docPreview, { width: 800, quality: 'auto' })}
                    alt="Document preview"
                    className="w-full max-h-56 object-contain rounded-lg group-hover:scale-102 transition-transform"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div
                  onClick={() => setViewerOpen(true)}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-warm-brown/50 hover:bg-warm-brown/5 transition-all group"
                >
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-red-200 bg-red-50 flex items-center justify-center shrink-0">
                    <img
                      src={getPdfPreviewUrl(docPreview, { page: 1, width: 150 })}
                      alt="PDF Preview"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute bottom-0 right-0 left-0 bg-red-600 text-white font-bold text-[8px] text-center leading-tight">
                      PDF
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-800 truncate group-hover:text-warm-brown">
                      Document.pdf
                    </p>
                    <span className="text-[11px] text-warm-brown font-semibold flex items-center gap-1 mt-0.5">
                      View Document →
                    </span>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={clearDocument}
                disabled={saving}
                className="absolute top-5 right-5 h-8 w-8 rounded-full bg-white/95 border border-gray-300 shadow-sm
                  flex items-center justify-center text-gray-500 hover:text-red-600 hover:border-red-300 transition-colors"
                aria-label="Remove document"
              >
                ✕
              </button>

              {/* docType override */}
              <div className="mt-3 pt-2.5 border-t border-gray-200 flex items-center justify-between gap-3 text-xs">
                <span className="text-gray-600 font-medium">Document Type:</span>
                <select
                  className="input-base py-1 px-3 text-xs w-auto bg-white border-gray-200"
                  value={form.documentType}
                  onChange={set('documentType')}
                  disabled={saving}
                >
                  <option value="">Auto-detect</option>
                  {DOCUMENT_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <label
              htmlFor="fin-doc-file"
              onDragEnter={() => setDragActive(true)}
              onDragLeave={() => setDragActive(false)}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
              onDrop={handleDrop}
              className={`block rounded-2xl border-2 border-dashed px-5 py-7 text-center transition-all ${
                dragActive
                  ? 'border-warm-brown bg-warm-brown/5 shadow-inner'
                  : 'border-gray-300 bg-gray-50/70 hover:bg-light-blue/10 hover:border-warm-brown/60'
              } ${saving || uploading ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}
            >
              <input
                ref={fileRef}
                id="fin-doc-file"
                type="file"
                className="hidden"
                accept="image/*,application/pdf"
                disabled={saving || uploading}
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center gap-2">
                {uploading ? (
                  <Spinner className="w-8 h-8 text-warm-brown" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-warm-brown/10 text-warm-brown flex items-center justify-center mb-1">
                    <UploadIcon className="w-6 h-6" />
                  </div>
                )}
                <p className="text-sm font-medium text-gray-800">
                  {uploading ? 'Compressing & uploading...' : 'Drop receipt here or click to browse'}
                </p>
                <p className="text-xs font-light text-gray-500">Supports images (JPG, PNG, WEBP) & PDF documents</p>
              </div>
            </label>
          )}
        </div>

        {/* Notes */}
        <Field label="Notes (optional)">
          <textarea
            className="input-base resize-none min-h-[80px] text-sm"
            value={form.notes}
            onChange={set('notes')}
            maxLength={500}
            placeholder="Any remarks about this transaction…"
            disabled={saving}
          />
        </Field>

        {/* Footer */}
        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-4">
          <Button
            type="button"
            variant="ghost"
            className="w-auto"
            onClick={() => { if (!saving && !uploading) onClose?.() }}
            disabled={saving || uploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-auto px-6"
            loading={saving}
            disabled={uploading}
          >
            {isEdit ? 'Save Changes' : 'Create Record'}
          </Button>
        </div>
      </form>
    </Modal>

    {/* ── Document Viewer Modal ── */}
    <DocumentViewerModal
      isOpen={viewerOpen}
      onClose={() => setViewerOpen(false)}
      url={docPreview}
      title="Financial Document Receipt"
      fileType={form.documentType}
    />
    </>
  )
}

// ─── Field component ──────────────────────────────────────────

function Field({ label, error, required, children }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}{required && <span className="ml-1 text-red-500 font-semibold">*</span>}
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1.5 text-xs text-red-500 animate-fade-in">{error}</p>}
    </label>
  )
}

function UploadIcon({ className = 'w-6 h-6' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M7.5 9 12 4.5M12 4.5 16.5 9M12 4.5V16.5" />
    </svg>
  )
}

function PdfIcon({ className = 'w-6 h-6' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}
