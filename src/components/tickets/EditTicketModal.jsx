import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { updateTicket, TICKET_TYPES } from '@/api/internalTicketApi'
import Modal from '@/components/admin/Modal'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/icons/Globe'
import { compressImageFile, optimizeCloudinaryUrl, getPdfThumbnailUrl, isPdfDocument } from '@/utils/imageUtils'

const CLOUDINARY_ENDPOINT = 'https://api.cloudinary.com/v1_1/djhbgtqbg/image/upload'
const CLOUDINARY_UPLOAD_PRESET = 'ottima_daily_updates'

const apiError = (err, fallback) => err?.response?.data?.message ?? err?.message ?? fallback
const cldError = (res, payload, fallback) =>
  payload?.error?.message ?? res.headers?.get?.('x-cld-error') ?? fallback

export default function EditTicketModal({
  isOpen,
  onClose,
  ticket,
  onUpdated,
}) {
  const { t } = useTranslation()

  const [ticketType, setTicketType]     = useState('INSTRUCTION')
  const [title, setTitle]               = useState('')
  const [description, setDescription]   = useState('')
  const [amount, setAmount]             = useState('')
  const [attachments, setAttachments]   = useState([])

  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [dragActive, setDragActive]   = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!isOpen || !ticket) return
    setTitle(ticket.title || '')
    setDescription(ticket.description || '')
    setAmount(ticket.amount != null ? String(ticket.amount) : '')
    setAttachments(
      (ticket.attachments || []).map((att) => ({
        fileUrl: att.fileUrl,
        fileType: att.fileType,
      }))
    )
    setTicketType(ticket.ticketType || 'INSTRUCTION')
    setError(null)
    setFieldErrors({})
    setSaving(false)
    setUploading(false)
  }, [isOpen, ticket])

  const uploadFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    setError(null)

    const newlyUploaded = []

    for (const rawFile of fileList) {
      try {
        const isPdf = rawFile.type === 'application/pdf' || rawFile.name?.toLowerCase().endsWith('.pdf')
        const file = isPdf ? rawFile : await compressImageFile(rawFile)

        const fd = new FormData()
        fd.append('file', file)
        fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

        const res = await fetch(CLOUDINARY_ENDPOINT, { method: 'POST', body: fd })
        const payload = await res.json().catch(() => ({}))

        if (!res.ok || !payload?.secure_url) {
          throw new Error(cldError(res, payload, 'Upload failed'))
        }

        newlyUploaded.push({
          fileUrl: payload.secure_url,
          fileType: isPdf ? 'PDF' : 'IMAGE',
        })
      } catch (err) {
        setError(err.message || 'Error uploading file')
      }
    }

    setAttachments((prev) => [...prev, ...newlyUploaded])
    setUploading(false)
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length) uploadFiles(files)
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length) uploadFiles(files)
  }

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const validate = () => {
    const errs = {}
    if (!ticketType) errs.ticketType = t('validation.required', { defaultValue: 'Ticket type is required' })
    if (!title.trim()) errs.title = t('validation.required', { defaultValue: 'Title is required' })
    if (ticketType === 'EXPENSE' && (!amount || Number(amount) <= 0)) {
      errs.amount = t('validation.amount_positive', { defaultValue: 'Valid expense amount is required' })
    }
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate() || saving || uploading || !ticket) return

    setSaving(true)
    setError(null)

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      ticketType,
      amount: ticketType === 'EXPENSE' ? Number(amount) : undefined,
      attachments: attachments.length > 0 ? attachments : [],
    }

    try {
      await updateTicket(ticket.ticketId, payload)
      onUpdated?.()
      onClose?.()
    } catch (err) {
      setError(apiError(err, 'Failed to update ticket.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!saving && !uploading) onClose?.() }}
      title={t('tickets.edit_title', { defaultValue: 'Edit Internal Request' })}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <Alert message={error} variant="error" onClose={() => setError(null)} />

        {/* Ticket Type */}
        <div>
          <label className="form-label">
            {t('tickets.type', { defaultValue: 'Request Type' })} <span className="text-red-500">*</span>
          </label>
          <select
            className={`input-base text-sm ${fieldErrors.ticketType ? 'input-error' : ''}`}
            value={ticketType}
            onChange={(e) => {
              setTicketType(e.target.value)
              setFieldErrors((prev) => ({ ...prev, ticketType: undefined }))
            }}
            disabled={saving}
          >
            {TICKET_TYPES.map((tType) => (
              <option key={tType} value={tType}>
                {t(`tickets.types.${tType.toLowerCase()}`, { defaultValue: tType.replace('_', ' ') })}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="form-label">
            {t('tickets.title_label', { defaultValue: 'Subject / Title' })} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={`input-base text-sm ${fieldErrors.title ? 'input-error' : ''}`}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setFieldErrors((prev) => ({ ...prev, title: undefined }))
            }}
            disabled={saving}
            maxLength={255}
          />
          {fieldErrors.title && <p className="mt-1 text-xs text-red-500">{fieldErrors.title}</p>}
        </div>

        {/* Amount (Conditional for EXPENSE) */}
        {ticketType === 'EXPENSE' && (
          <div className="rounded-xl border border-warm-brown/30 bg-warm-brown/5 p-3.5 animate-slide-up">
            <label className="form-label !text-warm-brown font-semibold flex items-center gap-1.5">
              <span>💰</span> {t('tickets.amount_label', { defaultValue: 'Expense Amount (EGP)' })} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className={`input-base bg-white text-sm ${fieldErrors.amount ? 'input-error' : ''}`}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setFieldErrors((prev) => ({ ...prev, amount: undefined }))
              }}
              disabled={saving}
            />
            {fieldErrors.amount && <p className="mt-1 text-xs text-red-500">{fieldErrors.amount}</p>}
          </div>
        )}

        {/* Description */}
        <div>
          <label className="form-label">
            {t('tickets.description_label', { defaultValue: 'Details & Instructions' })}
          </label>
          <textarea
            className="input-base resize-none min-h-[90px] text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={saving}
            rows={3}
          />
        </div>

        {/* Attachments Dropzone */}
        <div className="space-y-2.5">
          <label className="form-label">
            {t('tickets.attachments', { defaultValue: 'Attachments (Images & PDF Invoices)' })}
          </label>

          <label
            htmlFor="edit-ticket-file-input"
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDrop={handleDrop}
            className={`block rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-all ${
              dragActive
                ? 'border-warm-brown bg-warm-brown/10'
                : 'border-gray-200 bg-gray-50/70 hover:bg-light-blue/10 hover:border-warm-brown/60'
            } ${uploading || saving ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}
          >
            <input
              ref={fileRef}
              id="edit-ticket-file-input"
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              disabled={uploading || saving}
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center gap-1.5">
              {uploading ? (
                <Spinner className="w-6 h-6 text-warm-brown" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-warm-brown/10 text-warm-brown flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
              )}
              <p className="text-xs sm:text-sm font-semibold text-gray-800">
                {uploading ? t('tickets.uploading', { defaultValue: 'Uploading files…' }) : t('tickets.drop_files', { defaultValue: 'Click or drag photos & PDFs here' })}
              </p>
            </div>
          </label>

          {attachments.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {attachments.map((att, idx) => {
                const isPdf = isPdfDocument(att.fileUrl, att.fileType)
                return (
                  <div key={idx} className="relative group rounded-xl border border-gray-200 bg-white p-2 flex items-center gap-2 shadow-xs">
                    {isPdf ? (
                      <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-red-200 bg-red-50 flex items-center justify-center shrink-0">
                        <img
                          src={getPdfThumbnailUrl(att.fileUrl, { width: 80 })}
                          alt="PDF Preview"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <span className="absolute bottom-0 right-0 left-0 bg-red-600 text-white font-bold text-[7px] text-center leading-tight">
                          PDF
                        </span>
                      </div>
                    ) : (
                      <img
                        src={optimizeCloudinaryUrl(att.fileUrl, { width: 120, quality: 'auto' })}
                        alt="Attachment"
                        className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-100"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {isPdf ? 'Document.pdf' : 'Image.jpg'}
                      </p>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">{att.fileType || (isPdf ? 'PDF' : 'IMAGE')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      disabled={saving}
                      className="h-6 w-6 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-xs text-gray-500 transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex flex-wrap justify-end gap-2.5 border-t border-gray-200 pt-4">
          <Button
            type="button"
            variant="ghost"
            className="w-auto"
            onClick={() => { if (!saving && !uploading) onClose?.() }}
            disabled={saving || uploading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            className="w-auto px-6"
            loading={saving}
            disabled={uploading}
          >
            {t('common.save_changes', { defaultValue: 'Save Changes' })}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
