import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  isPdfDocument,
  optimizeCloudinaryUrl,
  getPdfThumbnailUrl,
} from '@/utils/imageUtils'
import DocumentViewerModal from '@/components/ui/DocumentViewerModal'

/**
 * DailyUpdateMediaGallery
 *
 * Renders photos and PDFs in a horizontal, swipeable, side-by-side gallery (جنب بعض مش تحت بعض)
 * with snap scrolling, navigation buttons, thumbnail generation for PDFs,
 * and seamless full-screen DocumentViewerModal integration.
 *
 * @param {object} props
 * @param {Array} props.images - Array of image/document objects ({ updateImageId, imageUrl, approved, rejectionReason, fileType })
 * @param {string} [props.title] - Daily update title for viewer modal
 * @param {boolean} [props.showApprovalStatus=true] - Whether to show approved/rejected pill
 */
export default function DailyUpdateMediaGallery({
  images = [],
  title = '',
  showApprovalStatus = true,
}) {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'
  const scrollContainerRef = useRef(null)

  const [viewerDoc, setViewerDoc] = useState(null) // { url, title, isPdf }

  if (!images || images.length === 0) return null

  // Scroll left or right in horizontal track
  const handleScroll = (direction) => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const scrollAmount = container.clientWidth * 0.75
    const multiplier = isRtl ? (direction === 'next' ? -1 : 1) : (direction === 'next' ? 1 : -1)

    container.scrollBy({
      left: scrollAmount * multiplier,
      behavior: 'smooth',
    })
  }

  return (
    <div className="mt-4 space-y-2 select-none">
      {/* ── Gallery Header: Count & Carousel Navigation Arrows ── */}
      <div className="flex items-center justify-between px-1 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-gray-700">
          <span className="text-sm">📸</span>
          <span>
            {isRtl
              ? `المرفقات (${images.length} صور / ملفات)`
              : `Attachments (${images.length})`}
          </span>
          <span className="hidden sm:inline-block text-[11px] font-light text-gray-400">
            • {isRtl ? 'اسحب للتنقل أفقياً ↔' : 'Swipe horizontally ↔'}
          </span>
        </div>

        {images.length > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleScroll('prev')}
              aria-label="Previous"
              title={isRtl ? 'السابق' : 'Previous'}
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-[#7D583F] hover:text-white text-gray-600 transition-colors flex items-center justify-center shadow-2xs active:scale-95 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleScroll('next')}
              aria-label="Next"
              title={isRtl ? 'التالي' : 'Next'}
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-[#7D583F] hover:text-white text-gray-600 transition-colors flex items-center justify-center shadow-2xs active:scale-95 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* ── Side-by-Side Horizontal Swipeable Track (جنب بعض مش تحت بعض) ── */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-3 overflow-x-auto pb-2.5 pt-1 px-1 scrollbar-thin snap-x snap-mandatory"
        style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
      >
        {images.map((image, idx) => {
          const isPdf = isPdfDocument(image.imageUrl, image.fileType)
          const thumbnailUrl = isPdf
            ? getPdfThumbnailUrl(image.imageUrl, { width: 500 })
            : optimizeCloudinaryUrl(image.imageUrl, { width: 600 })

          const isRejected = image.approved === false
          const isApproved = image.approved === true

          return (
            <div
              key={image.updateImageId || image.imageUrl || idx}
              onClick={() =>
                setViewerDoc({
                  url: image.imageUrl,
                  title: isPdf
                    ? `${title || 'Document'} - Part ${idx + 1}.pdf`
                    : `${title || 'Image'} - Photo ${idx + 1}`,
                  fileType: isPdf ? 'PDF' : 'IMAGE',
                })
              }
              className="group relative flex flex-col justify-between w-[72vw] sm:w-[260px] max-w-[280px] shrink-0 snap-start overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-xs hover:shadow-md hover:border-[#7D583F]/50 transition-all duration-200 cursor-pointer"
            >
              {/* Media Thumbnail Container */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                <img
                  src={thumbnailUrl}
                  alt={isPdf ? 'PDF document preview' : title || 'Update photo'}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback in case PDF page raster fails
                    if (isPdf) {
                      e.target.style.display = 'none'
                    }
                  }}
                />

                {/* PDF Specific Overlay Graphic (if PDF) */}
                {isPdf && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 flex flex-col justify-between p-3 pointer-events-none">
                    <span className="self-start inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px] tracking-wider shadow-sm uppercase">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                      PDF
                    </span>

                    <div className="flex items-center gap-1.5 text-white text-xs font-medium drop-shadow-md">
                      <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                      <span>{isRtl ? 'عرض مستند PDF' : 'View PDF Document'}</span>
                    </div>
                  </div>
                )}

                {/* Non-PDF Image Hover Zoom Pill */}
                {!isPdf && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-xl bg-black/70 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 backdrop-blur-xs">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
                      </svg>
                      <span>{isRtl ? 'تكبير' : 'Zoom'}</span>
                    </span>
                  </div>
                )}

                {/* Index Pill (e.g. 1 / 4) */}
                <div className="absolute top-2.5 end-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono font-bold shadow-2xs">
                  {idx + 1}/{images.length}
                </div>
              </div>

              {/* Card Footer Bar */}
              <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/70 px-3 py-2 text-[11px]">
                <span className="font-light text-gray-500 truncate">
                  {isPdf ? 'PDF Document' : (isRtl ? 'صورة مرفقة' : 'Attached Photo')}
                </span>

                {showApprovalStatus && (
                  <div>
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px]">
                        ✓ {isRtl ? 'معتمدة' : 'Approved'}
                      </span>
                    ) : isRejected ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200/80 text-[10px]">
                        ✕ {isRtl ? 'مرفوضة' : 'Rejected'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200/80 text-[10px]">
                        ⏳ {isRtl ? 'قيد المراجعة' : 'Pending'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Document / PDF / Image Lightbox Modal ─────────── */}
      {viewerDoc && (
        <DocumentViewerModal
          isOpen={Boolean(viewerDoc)}
          onClose={() => setViewerDoc(null)}
          url={viewerDoc.url}
          title={viewerDoc.title}
          fileType={viewerDoc.fileType}
        />
      )}
    </div>
  )
}
