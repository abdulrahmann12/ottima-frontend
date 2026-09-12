import {
  getClientFinancialRecords,
  getClientFinancialSummary,
  getClientInvoicesGallery,
} from '@/api/clientFinancialApi'
import Alert from '@/components/ui/Alert'
import FinancialSummaryCards from '@/components/finance/FinancialSummaryCards'
import { optimizeCloudinaryUrl, getPdfThumbnailUrl, isPdfDocument } from '@/utils/imageUtils'
import DocumentViewerModal from '@/components/ui/DocumentViewerModal'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const PAGE_SIZE = 10
const GALLERY_SIZE = 20
const apiErr = (err, fb) => err?.response?.data?.message ?? fb

// ─── Formatters ───────────────────────────────────────────────

function formatMoney(value, language = 'en') {
  if (value == null) return '—'
  const locale = language === 'ar' ? 'ar-EG' : 'en-EG'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(value, language) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

// ─── Summary Cards ────────────────────────────────────────────

function SummarySection({ projectId }) {
  const { t } = useTranslation()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    getClientFinancialSummary(projectId)
      .then(({ data }) => setSummary(data.data))
      .catch((err) => setError(apiErr(err, t('errors.generic', 'Failed to load financial summary.'))))
      .finally(() => setLoading(false))
  }, [projectId, t])

  return (
    <div className="space-y-3">
      <Alert message={error} variant="error" onClose={() => setError(null)} />
      <FinancialSummaryCards summary={summary} loading={loading} />
    </div>
  )
}

// ─── Invoices Gallery ─────────────────────────────────────────

function GallerySection({ projectId, language }) {
  const { t } = useTranslation()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [active, setActive] = useState(null) // lightbox

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    getClientInvoicesGallery(projectId, 0, GALLERY_SIZE)
      .then(({ data }) => setItems(data.data?.content ?? []))
      .catch((err) => setError(apiErr(err, t('errors.generic', 'Failed to load invoices.'))))
      .finally(() => setLoading(false))
  }, [projectId, t])

  if (!loading && !error && items.length === 0) return null

  return (
    <div className="space-y-3">
      <SectionTitle icon={<GalleryIcon className="w-4 h-4 text-warm-brown" />}>
        {t('finance.receipts_invoices', 'Receipts & Invoices')}
        {!loading && items.length > 0 && (
          <span className="ms-2 rounded-full bg-warm-brown/10 text-warm-brown border border-warm-brown/20 px-2.5 py-0.5 text-[11px] font-bold">
            {items.length}
          </span>
        )}
      </SectionTitle>

      <Alert message={error} variant="error" onClose={() => setError(null)} />

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-gray-100 border border-gray-200" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((record) => {
            const isPdf = isPdfDocument(record.documentUrl)
            const date = formatDate(record.transactionDate, language)
            const itemLabel = (language === 'ar' ? record.itemNameAr : record.itemNameEn) || null
            const isDeposit = record.recordType === 'DEPOSIT'

            return (
              <button
                key={record.financialRecordId}
                type="button"
                onClick={() => setActive(record)}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white text-start shadow-xs transition-all hover:border-warm-brown/50 hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-warm-brown/30 cursor-pointer"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 border-b border-gray-100 flex items-center justify-center">
                  {isPdf ? (
                    <>
                      <img
                        src={getPdfThumbnailUrl(record.documentUrl, { width: 400 })}
                        alt={`Receipt ${date}`}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-red-600 text-white font-bold text-[9px] shadow-xs">
                        PDF
                      </span>
                    </>
                  ) : (
                    <img
                      src={optimizeCloudinaryUrl(record.documentUrl, { width: 400, quality: 'auto' })}
                      alt={`Receipt ${date}`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <span className="text-[11px] font-bold bg-black/60 px-2 py-1 rounded-lg backdrop-blur-xs">
                      {t('common.view', { defaultValue: 'View' })}
                    </span>
                  </div>
                </div>
                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                      isDeposit
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {record.recordType}
                    </span>
                    <span className="text-xs font-bold text-gray-900 tabular-nums">
                      {formatMoney(record.amount)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium">{date}</p>
                  {itemLabel && (
                    <p className="text-[11px] text-gray-600 truncate font-medium">{itemLabel}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={Boolean(active)}
        onClose={() => setActive(null)}
        url={active?.documentUrl}
        title={active ? `${active.recordType} Receipt - ${formatDate(active.transactionDate, language)}` : 'Receipt'}
        fileType={active?.documentType}
      />
    </div>
  )
}

// ─── Transactions Ledger ──────────────────────────────────────

function LedgerSection({ projectId, language }) {
  const { t } = useTranslation()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const fetchRecords = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await getClientFinancialRecords(projectId, page, PAGE_SIZE)
      const pg = data.data
      setRecords(pg?.content ?? [])
      setTotalPages(pg?.totalPages ?? 0)
      setTotalElements(pg?.totalElements ?? 0)
    } catch (err) {
      setError(apiErr(err, t('errors.generic', 'Failed to load transactions.')))
    } finally {
      setLoading(false)
    }
  }, [projectId, page, t])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  return (
    <div className="space-y-3">
      <SectionTitle icon={<LedgerIcon className="w-4 h-4 text-warm-brown" />}>
        {t('finance.transaction_history', 'Transaction History')}
        {!loading && totalElements > 0 && (
          <span className="ms-2 rounded-full bg-warm-brown/10 text-warm-brown border border-warm-brown/20 px-2.5 py-0.5 text-[11px] font-bold">
            {totalElements}
          </span>
        )}
      </SectionTitle>

      <Alert message={error} variant="error" onClose={() => setError(null)} />

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Table head */}
        <div className="hidden grid-cols-[1.2fr_0.8fr_1fr_0.8fr_1fr] gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 sm:grid">
          {['date', 'type', 'amount', 'method', 'item'].map((h) => (
            <span key={h} className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
              {t(`finance.table_${h}`, { defaultValue: h.toUpperCase() })}
            </span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                <div className="h-3.5 w-24 animate-pulse rounded bg-gray-100" />
                <div className="h-3.5 w-16 animate-pulse rounded bg-gray-100" />
                <div className="h-3.5 w-20 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-gray-500 font-medium">
              {t('finance.no_transactions', 'No transactions recorded yet.')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {records.map((rec) => {
              const itemLabel = (language === 'ar' ? rec.itemNameAr : rec.itemNameEn)
              const isDeposit = rec.recordType === 'DEPOSIT'
              return (
                <div
                  key={rec.financialRecordId}
                  className="grid grid-cols-1 gap-x-4 gap-y-1 px-4 py-3.5 transition-colors hover:bg-gray-50/80 sm:grid-cols-[1.2fr_0.8fr_1fr_0.8fr_1fr] sm:items-center"
                >
                  {/* Date */}
                  <p className="text-xs text-gray-800 font-medium">
                    {formatDate(rec.transactionDate, language)}
                  </p>

                  {/* Type badge */}
                  <div>
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isDeposit
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-rose-200 bg-rose-50 text-rose-700'
                      }`}
                    >
                      {rec.recordType}
                    </span>
                  </div>

                  {/* Amount */}
                  <p className={`text-sm font-bold tabular-nums ${isDeposit ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {isDeposit ? '+' : '−'}{formatMoney(rec.amount, language)}
                  </p>

                  {/* Method */}
                  <p className="text-xs text-gray-600 font-medium">
                    {rec.paymentMethod?.replace('_', ' ') ?? '—'}
                  </p>

                  {/* Item */}
                  <p className="text-xs text-gray-600 truncate font-medium">
                    {itemLabel || <span className="text-gray-400 italic">Project-level</span>}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50/60 px-4 py-3">
            <p className="text-xs text-gray-600">
              Page <span className="font-bold text-gray-900">{page + 1}</span> of{' '}
              <span className="font-bold text-gray-900">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              {[
                { label: '← Prev', disabled: page === 0, onClick: () => setPage((p) => p - 1) },
                { label: 'Next →', disabled: page >= totalPages - 1, onClick: () => setPage((p) => p + 1) },
              ].map(({ label, disabled, onClick }) => (
                <button
                  key={label}
                  type="button"
                  disabled={disabled}
                  onClick={onClick}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-xs transition-all hover:bg-gray-50 hover:border-gray-300 disabled:pointer-events-none disabled:opacity-40"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main exported component ──────────────────────────────────

/**
 * ClientFinanceDashboard — reusable read-only finance view.
 */
export default function ClientFinanceDashboard({ projectId, language = 'en' }) {
  if (!projectId) return null

  return (
    <div className="space-y-8">
      <SummarySection projectId={projectId} />
      <GallerySection projectId={projectId} language={language} />
      <LedgerSection projectId={projectId} language={language} />
    </div>
  )
}

// ─── Shared tiny helpers ──────────────────────────────────────

function SectionTitle({ icon, children }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-warm-brown/20 bg-warm-brown/10">
        {icon}
      </span>
      <h2 className="text-sm font-bold text-gray-900 flex items-center">{children}</h2>
    </div>
  )
}

// ── Icons ──────────────────────────────────────────────────────

function GalleryIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  )
}

function LedgerIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  )
}

function PdfBigIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}
