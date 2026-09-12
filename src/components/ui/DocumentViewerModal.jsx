import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  isPdfDocument,
  getPdfPreviewUrl,
  optimizeCloudinaryUrl,
  downloadDocumentFile,
} from '@/utils/imageUtils'
import { Spinner } from '@/components/ui/icons/Globe'

/**
 * DocumentViewerModal
 *
 * Full-featured in-app viewer for PDF attachments and images.
 * Rendered directly into document.body via React Portal to guarantee
 * it sits above all sidebars, headers, and CSS transform containers.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {() => void} props.onClose - Close callback
 * @param {string} props.url - File URL (PDF or image)
 * @param {string} [props.title] - Document title / filename
 * @param {string} [props.fileType] - 'PDF' | 'IMAGE' | auto-detected
 */
export default function DocumentViewerModal({
  isOpen,
  onClose,
  url,
  title = 'Document',
  fileType = '',
}) {
  const { t } = useTranslation()
  const isPdf = isPdfDocument(url, fileType)

  const [page, setPage] = useState(1)
  const [maxPages, setMaxPages] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(true)
  const [zoom, setZoom] = useState(100) // 50 to 250%
  const [rotation, setRotation] = useState(0) // 0, 90, 180, 270
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Reset state when opening a new document
  useEffect(() => {
    if (!isOpen || !url) return
    setPage(1)
    setMaxPages(1)
    setHasNextPage(true)
    setZoom(100)
    setRotation(0)
    setLoading(true)
    setPageError(false)
    setDownloading(false)
  }, [isOpen, url])

  // Prevent background page scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Current page preview URL
  const currentMediaUrl = isPdf
    ? getPdfPreviewUrl(url, { page, width: 1800, quality: 'auto' })
    : optimizeCloudinaryUrl(url, { width: 1800, quality: 'auto' })

  // Probe next page to check if multi-page PDF has a next page
  useEffect(() => {
    if (!isPdf || !url || !url.includes('res.cloudinary.com')) {
      setHasNextPage(false)
      return
    }

    const nextUrl = getPdfPreviewUrl(url, { page: page + 1, width: 300 })
    const img = new Image()
    img.onload = () => {
      setHasNextPage(true)
      setMaxPages((prev) => Math.max(prev, page + 1))
    }
    img.onerror = () => {
      setHasNextPage(false)
      setMaxPages((prev) => Math.max(prev, page))
    }
    img.src = nextUrl
  }, [isPdf, url, page])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      } else if (e.key === 'ArrowRight' && isPdf && hasNextPage) {
        setPage((p) => p + 1)
      } else if (e.key === 'ArrowLeft' && isPdf && page > 1) {
        setPage((p) => p - 1)
      } else if (e.key === '+' || e.key === '=') {
        setZoom((z) => Math.min(250, z + 25))
      } else if (e.key === '-') {
        setZoom((z) => Math.max(50, z - 25))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isPdf, page, hasNextPage, onClose])

  const handleDownload = async () => {
    if (downloading) return
    setDownloading(true)
    try {
      const fileName = title.toLowerCase().endsWith('.pdf') || !isPdf ? title : `${title}.pdf`
      await downloadDocumentFile(url, fileName, maxPages)
    } finally {
      setDownloading(false)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center; background: #fff; }
            img { max-width: 100%; max-height: 100vh; object-fit: contain; }
            @media print {
              body { margin: 0; }
              img { max-width: 100%; page-break-after: always; }
            }
          </style>
        </head>
        <body>
          <img src="${currentMediaUrl}" onload="window.print(); window.close();" />
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360)
  }

  if (!isOpen || !url) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex flex-col w-full max-w-5xl h-[92vh] rounded-3xl bg-white border border-[#D9C7B8] shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top Header Toolbar ─────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3.5 bg-white border-b border-gray-200 shrink-0 z-20">
          
          {/* Document Title & Type */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
              isPdf ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-warm-brown/10 text-warm-brown border border-warm-brown/20'
            }`}>
              {isPdf ? 'PDF' : 'IMG'}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                {title || (isPdf ? 'Document.pdf' : 'Image.jpg')}
              </h3>
              <p className="text-[10px] text-gray-500">
                {isPdf ? t('document_viewer.pdf_doc', { defaultValue: 'PDF Document' }) : t('document_viewer.image_doc', { defaultValue: 'Image Attachment' })}
              </p>
            </div>
          </div>

          {/* Controls: Zoom, Rotate, Print, Download, Close */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            
            {/* Zoom Controls */}
            <div className="flex items-center bg-gray-100/90 rounded-xl p-0.5 border border-gray-200 text-gray-700">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(50, z - 25))}
                disabled={zoom <= 50}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:text-black transition-colors disabled:opacity-40 text-xs font-bold cursor-pointer"
                title={t('document_viewer.zoom_out', { defaultValue: 'Zoom Out (-)' })}
              >
                −
              </button>
              <button
                type="button"
                onClick={() => setZoom(100)}
                className="px-2 h-7 text-[11px] font-bold hover:bg-white rounded-lg transition-colors cursor-pointer"
                title={t('document_viewer.reset_zoom', { defaultValue: 'Reset Zoom' })}
              >
                {zoom}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(250, z + 25))}
                disabled={zoom >= 250}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:text-black transition-colors disabled:opacity-40 text-xs font-bold cursor-pointer"
                title={t('document_viewer.zoom_in', { defaultValue: 'Zoom In (+)' })}
              >
                +
              </button>
            </div>

            {/* Rotate Button */}
            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-warm-brown hover:bg-warm-brown/5 transition-all shadow-xs cursor-pointer"
              title={t('document_viewer.rotate', { defaultValue: 'Rotate 90°' })}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-warm-brown hover:bg-warm-brown/5 transition-all shadow-xs cursor-pointer"
              title={t('document_viewer.print', { defaultValue: 'Print Document' })}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
              </svg>
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="px-3 py-1.5 rounded-xl bg-warm-brown hover:bg-[#6B4A33] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {downloading ? (
                <>
                  <Spinner className="w-3.5 h-3.5 text-white" />
                  <span>{t('document_viewer.downloading', { defaultValue: 'Saving…' })}</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M7.5 12 12 16.5m0 0L16.5 12M12 16.5V3" />
                  </svg>
                  <span>{t('document_viewer.download', { defaultValue: 'Download' })}</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 transition-colors ml-1 cursor-pointer"
              aria-label={t('common.close', { defaultValue: 'Close' })}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Document View Area ─────────────────────────────── */}
        <div className="relative flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-[#F7F3EE]">
          
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#F7F3EE]/80 backdrop-blur-xs gap-3">
              <Spinner className="w-9 h-9 text-warm-brown" />
              <p className="text-xs font-semibold text-gray-700">
                {t('document_viewer.rendering_page', { defaultValue: 'Rendering document preview…' })}
              </p>
            </div>
          )}

          {pageError ? (
            <div className="text-center p-8 bg-white rounded-2xl border border-red-200 max-w-md shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">
                {t('document_viewer.page_not_found', { defaultValue: 'Failed to load document page' })}
              </h4>
              <p className="text-xs text-gray-500 mb-4">
                {t('document_viewer.page_error_desc', { defaultValue: 'The requested page could not be retrieved.' })}
              </p>
              <button
                type="button"
                onClick={() => setPage(1)}
                className="px-4 py-2 rounded-xl bg-warm-brown text-white text-xs font-bold cursor-pointer"
              >
                {t('document_viewer.return_page_1', { defaultValue: 'Back to Page 1' })}
              </button>
            </div>
          ) : (
            <div
              className="transition-transform duration-200 ease-out origin-center select-none"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              }}
            >
              <img
                src={currentMediaUrl}
                alt={`${title} - Page ${page}`}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false)
                  setPageError(true)
                }}
                className="max-h-[calc(92vh-140px)] max-w-[85vw] object-contain rounded-xl shadow-xl border border-gray-300 bg-white"
              />
            </div>
          )}
        </div>

        {/* ── Bottom Footer: Page Pagination for PDFs ────────── */}
        {isPdf && (
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 bg-white border-t border-gray-200 shrink-0 z-20">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => {
                setLoading(true)
                setPageError(false)
                setPage((p) => Math.max(1, p - 1))
              }}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-xs transition-all disabled:opacity-30 flex items-center gap-1.5 cursor-pointer"
            >
              <span>←</span>
              <span>{t('document_viewer.prev_page', { defaultValue: 'Previous Page' })}</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-[#FAF7F2] border border-[#D9C7B8] text-xs font-bold text-gray-800">
                {t('document_viewer.page_indicator', { defaultValue: 'Page {{page}}', page })}
              </span>
            </div>

            <button
              type="button"
              disabled={!hasNextPage || loading}
              onClick={() => {
                setLoading(true)
                setPageError(false)
                setPage((p) => p + 1)
              }}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-xs transition-all disabled:opacity-30 flex items-center gap-1.5 cursor-pointer"
            >
              <span>{t('document_viewer.next_page', { defaultValue: 'Next Page' })}</span>
              <span>→</span>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
