import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { forwardClientCommentToChat } from '@/api/projectChatApi'
import Modal from '@/components/admin/Modal'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/icons/Globe'

export default function ForwardCommentModal({
  isOpen,
  onClose,
  projectId,
  comment,
  onSuccess,
}) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'

  const [extraNote, setExtraNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const commentId = comment?.commentId || comment?.id
  const commentText = comment?.clientComment || comment?.text || comment?.commentText || comment?.content || ''

  const handleForward = async (e) => {
    e.preventDefault()
    if (!projectId || !commentId || submitting) return

    setSubmitting(true)
    setError(null)
    try {
      await forwardClientCommentToChat(projectId, {
        commentId,
        additionalNote: extraNote.trim(),
      })
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to forward comment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isAr ? 'تحويل ملاحظة العميل إلى محادثة المشروع' : 'Forward Client Comment to Project Chat'}
      size="md"
    >
      <form onSubmit={handleForward} className="space-y-4">
        <Alert message={error} variant="error" onClose={() => setError(null)} />

        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs">
          <span className="font-bold text-amber-900 block mb-1">
            📢 {isAr ? 'ملاحظة العميل الأصلية:' : 'Original Client Comment:'}
          </span>
          <p className="text-slate-800 italic bg-white p-2.5 rounded-lg border border-amber-100">
            &ldquo;{commentText}&rdquo;
          </p>
          <p className="text-[11px] font-light text-amber-800 mt-2">
            ℹ️ {isAr
              ? 'سيتم إرسال هذه الملاحظة إلى محادثة المشروع العامة ليراها المهندسون المسؤولون مع الحفاظ على خصوصية باقي تعليقات العميل.'
              : 'This comment will be posted to the Project Global Chat so assigned engineers can take action, while keeping other client feedback private.'}
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {isAr ? 'توجيه / ملاحظة إضافية للمهندس (اختياري):' : 'Admin Note / Instruction to Engineers (Optional):'}
          </label>
          <textarea
            rows={3}
            value={extraNote}
            onChange={(e) => setExtraNote(e.target.value)}
            placeholder={isAr ? 'مثال: يرجى مراجعة هذا البند مع الفني غداً وتصحيحه فوراً...' : 'e.g. Please review this with the on-site supervisor and update the client item...'}
            className="w-full px-3 py-2 text-xs border border-warm-sand rounded-xl focus:outline-hidden focus:ring-2 focus:ring-warm-brown/30 bg-white"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-warm-sand/40">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-xs font-bold"
          >
            {submitting ? <Spinner className="w-4 h-4 animate-spin" /> : (isAr ? 'تحويل للمحادثة' : 'Forward to Chat')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
