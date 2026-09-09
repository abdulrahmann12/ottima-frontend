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
import { Spinner } from '@/components/ui/icons/Globe'
import { useEffect, useRef, useState } from 'react'

// ─── Cloudinary config (same preset / cloud as Daily Updates) ─
const CLOUDINARY_ENDPOINT = 'https://api.cloudinary.com/v1_1/djhbgtqbg/image/upload'
const CLOUDINARY_UPLOAD_PRESET = 'ottima_daily_updates'

const apiError = (err, fallback) => err?.response?.data?.message ?? err?.message ?? fallback
const cldError = (res, payload, fallback) =>
  payload?.error?.message ?? res.headers?.get?.('x-cld-error') ?? fallback

function emptyForm(record = null) {
  return {
    projectItemId:   record?.projectItemId  ?? '',
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

  const [form,     setForm]     = useState(() => emptyForm(record))
  const [errors,   setErrors]   = useState({})
  const [error,    setError]    = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [docPreview, setDocPreview] = useState(record?.documentUrl ?? null)
  const fileRef = useRef(null)

  // Reset when modal opens / record changes
  useEffect(() => {
    if (!isOpen) return
    const initial = emptyForm(record)
    setForm(initial)
    setErrors({})
    setError(null)
    setSaving(false)
    setUploading(false)
    setDragActive(false)
    setDocPreview(record?.documentUrl ?? null)
  }, [isOpen, record])

  const set = (key) => (e) => {
    const val = e.target.value
    setForm((f) => {
      const updated = { ...f, [key]: val }
      // When switching back to DEPOSIT, clear projectItemId (deposits are project-level)
      if (key === 'recordType' && val === 'DEPOSIT') {
        updated.projectItemId = ''
      }
      return updated
    })
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.recordType)      e.recordType      = 'Required'
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Must be a positive number'
    if (!form.paymentMethod)   e.paymentMethod   = 'Required'
    if (!form.transactionDate) e.transactionDate = 'Required'
    // projectItemId is required for EXPENSE records
    if (form.recordType === 'EXPENSE' && !form.projectItemId) {
      e.projectItemId = 'Select the project item this expense belongs to'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Cloudinary upload (single file — doc/receipt/image) ──────
  const uploadDocument = async (file) => {
    setUploading(true)
    setError(null)
    try {
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
    const payload = {
      projectItemId:   (isExpense && form.projectItemId) ? form.projectItemId : null,
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

        {/* Row 3 — project item: REQUIRED for EXPENSE, hidden for DEPOSIT */}
        {form.recordType === 'EXPENSE' && (
          <Field
            label="Project Item"
            error={errors.projectItemId}
            required
          >
            {projectItems.length === 0 ? (
              <p className="mt-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-300">
                ⚠ No items found for this project. Please add project items first.
              </p>
            ) : (
              <select
                id="fin-project-item"
                className={`input-base text-sm ${errors.projectItemId ? 'input-error' : ''}`}
                value={form.projectItemId}
                onChange={set('projectItemId')}
                disabled={saving}
              >
                <option value="">— Select the item this expense belongs to —</option>
                {[...projectItems]
                  .sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0))
                  .map((item) => (
                    <option key={item.projectItemId} value={item.projectItemId}>
                      {(language === 'ar' ? item.itemNameAr : item.itemNameEn) || item.itemNameEn || item.itemNameAr}
                    </option>
                  ))}
              </select>
            )}
          </Field>
        )}

        {/* Document upload (drag & drop) */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-300">Receipt / Document <span className="text-slate-500 font-normal">(optional)</span></p>

          {docPreview ? (
            <div className="relative overflow-hidden rounded-2xl border border-surface-border bg-slate-900/50">
              {isDocImage ? (
                <img src={docPreview} alt="Document preview" className="w-full max-h-52 object-contain" />
              ) : (
                <div className="flex items-center gap-3 px-4 py-4">
                  <PdfIcon className="w-8 h-8 flex-shrink-0 text-red-400" />
                  <a
                    href={docPreview}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-brand-300 hover:text-brand-200 truncate underline"
                  >
                    View PDF document
                  </a>
                </div>
              )}
              <button
                type="button"
                onClick={clearDocument}
                disabled={saving}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-slate-900/80 border border-surface-border
                  flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
                aria-label="Remove document"
              >
                ✕
              </button>

              {/* docType override */}
              <div className="border-t border-surface-border px-4 py-2.5 flex items-center gap-3">
                <p className="text-xs text-slate-500">Type:</p>
                <select
                  className="input-base py-1 text-xs"
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
              className={`block rounded-2xl border border-dashed px-5 py-7 text-center transition-all
                ${dragActive
                  ? 'border-brand-400 bg-brand-500/10'
                  : 'border-surface-border bg-slate-900/40 hover:border-brand-500/40'
                }
                ${saving || uploading ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}
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
                {uploading
                  ? <Spinner className="w-7 h-7 text-brand-300" />
                  : <UploadIcon className="w-7 h-7 text-slate-500" />
                }
                <p className="text-sm font-medium text-slate-300">
                  {uploading ? 'Uploading...' : 'Drop receipt here or click to browse'}
                </p>
                <p className="text-xs text-slate-500">Images (JPG, PNG, WEBP) or PDF</p>
              </div>
            </label>
          )}
        </div>

        {/* Notes */}
        <Field label="Notes (optional)">
          <textarea
            className="input-base resize-none min-h-[80px]"
            value={form.notes}
            onChange={set('notes')}
            maxLength={500}
            placeholder="Any remarks about this transaction…"
            disabled={saving}
          />
        </Field>

        {/* Footer */}
        <div className="flex flex-wrap justify-end gap-3 border-t border-surface-border pt-4">
          <Button
            type="button"
            variant="ghost"
            className="w-auto"
            onClick={() => { if (!saving && !uploading) onClose?.() }}
            disabled={saving || uploading}
          >
            Cancel
          </Button>
          <Button type="submit" className="w-auto" loading={saving} disabled={uploading}>
            {isEdit ? 'Save Changes' : 'Create Record'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Tiny helpers ─────────────────────────────────────────────

function Field({ label, error, required, children }) {
  return (
    <label className="block text-sm font-medium text-slate-300">
      {label}{required && <span className="ml-1 text-red-400">*</span>}
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  )
}

function UploadIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M7.5 9 12 4.5M12 4.5 16.5 9M12 4.5V16.5" />
    </svg>
  )
}

function PdfIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}
