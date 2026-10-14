import Modal from '@/components/admin/Modal'
import { DailyUpdateStatusPill } from '@/components/daily-updates/DailyUpdatesWorkspace'
import DailyUpdateMediaGallery from '@/components/daily-updates/DailyUpdateMediaGallery'
import Button from '@/components/ui/Button'
import { Spinner } from '@/components/ui/icons/Globe'
import { getDailyUpdateById } from '@/api/dailyUpdateApi'
import { optimizeCloudinaryUrl } from '@/utils/imageUtils'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

export default function DailyUpdateDetailsModal({
  isOpen,
  onClose,
  update: initialUpdate = null,
  dailyUpdateId = null,
}) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'

  const [update, setUpdate] = useState(initialUpdate)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)

  const fetchUpdate = useCallback(async (id) => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await getDailyUpdateById(id)
      const data = res.data?.data || res.data
      setUpdate(data)
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        (isAr ? 'تعذر تحميل تفاصيل التحديث اليومي' : 'Failed to load daily update details')
      )
    } finally {
      setLoading(false)
    }
  }, [isAr])

  useEffect(() => {
    if (!isOpen) {
      setPreviewImage(null)
      setError(null)
      return
    }

    if (initialUpdate && (!dailyUpdateId || initialUpdate.dailyUpdateId === dailyUpdateId)) {
      setUpdate(initialUpdate)
      setLoading(false)
      setError(null)
    } else if (dailyUpdateId) {
      fetchUpdate(dailyUpdateId)
    }
  }, [isOpen, initialUpdate, dailyUpdateId, fetchUpdate])

  if (!isOpen) return null

  const effectiveUpdate = update
  const itemName = isAr ? effectiveUpdate?.itemNameAr : effectiveUpdate?.itemNameEn
  const engineerName = isAr ? effectiveUpdate?.engineerNameAr : effectiveUpdate?.engineerNameEn
  const reviewerName = isAr ? effectiveUpdate?.approvedByAdminNameAr : effectiveUpdate?.approvedByAdminNameEn

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isAr ? 'تفاصيل التحديث اليومي' : 'Daily Update Details'}
        size="lg"
      >
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Spinner className="w-9 h-9 text-warm-brown animate-spin" />
            <p className="text-sm font-semibold text-slate-500">
              {isAr ? 'جاري تحميل تفاصيل التحديث اليومي...' : 'Loading daily update details...'}
            </p>
          </div>
        ) : error ? (
          <div className="py-12 px-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <p className="text-sm font-bold text-rose-700">{error}</p>
            {dailyUpdateId && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="w-auto mx-auto"
                onClick={() => fetchUpdate(dailyUpdateId)}
              >
                {isAr ? 'إعادة المحاولة' : 'Try Again'}
              </Button>
            )}
          </div>
        ) : !effectiveUpdate ? (
          <div className="py-12 text-center text-sm text-slate-400">
            {isAr ? 'لا تتوفر تفاصيل لهذا التحديث.' : 'No update details available.'}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header Card */}
            <div className="rounded-2xl border border-warm-sand/80 bg-gradient-to-br from-cream/40 via-white to-gray-50/70 p-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-warm-brown bg-warm-sand/30 px-2.5 py-0.5 rounded-lg border border-warm-sand/50">
                  {itemName || (isAr ? 'بند المشروع' : 'Project Item')}
                </span>
                <DailyUpdateStatusPill status={effectiveUpdate.status} />
              </div>

              <h3 className="mt-2.5 text-base sm:text-lg font-medium text-slate-900 leading-snug">
                {effectiveUpdate.title}
              </h3>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  👤 {isAr ? `المهندس: ${engineerName || effectiveUpdate.engineerUsername || '—'}` : `Engineer: ${engineerName || effectiveUpdate.engineerUsername || '—'}`}
                </span>
                <span>•</span>
                <span>📅 {formatDate(effectiveUpdate.createdAt, i18n.language)}</span>
                {reviewerName && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      ✓ {isAr ? `الاعتماد: ${reviewerName}` : `Reviewed: ${reviewerName}`}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Overall Rejection Reason Alert if rejected */}
            {effectiveUpdate.status === 'REJECTED' && effectiveUpdate.rejectionReason && (
              <div className="rounded-xl border border-rose-300 bg-rose-50/95 p-4 text-xs sm:text-sm text-rose-900 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <span className="text-base">❌</span>
                  <span>{isAr ? 'سبب الرفض من الإدارة:' : 'Rejection Reason from Admin:'}</span>
                </div>
                <p className="mt-1.5 whitespace-pre-line font-medium text-rose-800 leading-relaxed bg-white/70 p-3 rounded-lg border border-rose-200">
                  {effectiveUpdate.rejectionReason}
                </p>
              </div>
            )}

            {/* Notes Section */}
            <div>
              <p className="text-xs font-light uppercase tracking-wider text-slate-500 mb-1.5">
                📝 {isAr ? 'ملاحظات المهندس' : 'Engineer Notes'}
              </p>
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs sm:text-sm leading-relaxed text-slate-800 shadow-2xs whitespace-pre-wrap">
                {effectiveUpdate.notes || (
                  <span className="text-slate-400 italic">
                    {isAr ? 'لا توجد ملاحظات مرفقة مع هذا التحديث.' : 'No notes were included with this update.'}
                  </span>
                )}
              </div>
            </div>

            {/* Images Section */}
            {effectiveUpdate.images?.length > 0 ? (
              <DailyUpdateMediaGallery
                images={effectiveUpdate.images}
                title={effectiveUpdate.title}
                showApprovalStatus={true}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-xs sm:text-sm text-slate-400">
                {isAr ? 'لا توجد صور مرفقة بهذا التحديث.' : 'No images attached to this update.'}
              </div>
            )}

            {/* Modal Bottom Footer */}
            <div className="flex justify-end border-t border-slate-200 pt-4">
              <Button type="button" variant="ghost" className="w-auto px-5" onClick={onClose}>
                {isAr ? 'إغلاق' : 'Close'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

function ImageApprovalPill({ approved, isAr }) {
  if (approved == null) {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
        {isAr ? 'قيد المراجعة' : 'Pending'}
      </span>
    )
  }

  return approved ? (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
      {isAr ? 'معتمد' : 'Approved'}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
      {isAr ? 'مرفوض' : 'Rejected'}
    </span>
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
