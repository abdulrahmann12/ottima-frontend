import {
  getClientFinancialRecords,
  getClientFinancialSummary,
  getClientInvoicesGallery,
} from '@/api/clientFinancialApi'
import Alert from '@/components/ui/Alert'
import FinancialSummaryCards from '@/components/finance/FinancialSummaryCards'
import { Spinner } from '@/components/ui/icons/Globe'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const PAGE_SIZE = 10
const GALLERY_SIZE = 20
const apiErr = (err, fb) => err?.response?.data?.message ?? fb

// ─── Formatters ───────────────────────────────────────────────

function formatMoney(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
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
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    getClientFinancialSummary(projectId)
      .then(({ data }) => setSummary(data.data))
      .catch((err) => setError(apiErr(err, 'Failed to load financial summary.')))
      .finally(() => setLoading(false))
  }, [projectId])

  return (
    <div className="space-y-3">
      <Alert message={error} variant="error" onClose={() => setError(null)} />
      <FinancialSummaryCards summary={summary} loading={loading} />
    </div>
  )
}

// ─── Invoices Gallery ─────────────────────────────────────────

function GallerySection({ projectId, language }) {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [active,  setActive]  = useState(null)   // lightbox

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    getClientInvoicesGallery(projectId, 0, GALLERY_SIZE)
      .then(({ data }) => setItems(data.data?.content ?? []))
      .catch((err) => setError(apiErr(err, 'Failed to load invoices.')))
      .finally(() => setLoading(false))
  }, [projectId])

  if (!loading && !error && items.length === 0) return null

  return (
    <div className="space-y-3">
      <SectionTitle icon={<GalleryIcon className="w-4 h-4" />}>
        Receipts & Invoices
        {!loading && items.length > 0 && (
          <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
            {items.length}
          </span>
        )}
      </SectionTitle>

      <Alert message={error} variant="error" onClose={() => setError(null)} />

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-slate-800/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((record) => {
            const isPdf = record.documentUrl?.toLowerCase().endsWith('.pdf')
            const date  = formatDate(record.transactionDate, language)
            const itemLabel = (language === 'ar' ? record.itemNameAr : record.itemNameEn) || null

            return (
              <button
                key={record.financialRecordId}
                type="button"
                onClick={() => setActive(record)}
                className="group relative overflow-hidden rounded-2xl border border-surface-border bg-slate-900/50
                  text-left transition-all hover:border-brand-500/40 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.3)]
                  focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                {isPdf ? (
                  <div className="aspect-[4/3] flex flex-col items-center justify-center bg-slate-800/60">
                    <PdfBigIcon className="w-10 h-10 text-red-400" />
                    <p className="mt-1 text-[10px] text-slate-500">PDF</p>
                  </div>
                ) : (
                  <div className="aspect-[4/3] overflow-hidden bg-slate-950/50">
                    <img
                      src={record.documentUrl}
                      alt={`Receipt ${date}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="px-3 py-2.5 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-semibold ${record.recordType === 'DEPOSIT' ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {record.recordType}
                    </span>
                    <span className="text-[10px] font-medium text-slate-300">{formatMoney(record.amount)}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">{date}</p>
                  {itemLabel && (
                    <p className="text-[10px] text-slate-600 truncate">{itemLabel}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Lightbox */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setActive(null)}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-surface-border bg-slate-900 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-border px-5 py-3">
              <div>
                <p className={`text-xs font-semibold ${active.recordType === 'DEPOSIT' ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {active.recordType} · {formatMoney(active.amount)}
                </p>
                <p className="text-[11px] text-slate-500">{formatDate(active.transactionDate, language)}</p>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-700/60 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            {active.documentUrl?.toLowerCase().endsWith('.pdf') ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <PdfBigIcon className="w-14 h-14 text-red-400" />
                <a
                  href={active.documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500"
                >
                  Open PDF
                </a>
              </div>
            ) : (
              <img
                src={active.documentUrl}
                alt="Receipt"
                className="w-full max-h-[70dvh] object-contain"
              />
            )}

            {active.notes && (
              <div className="border-t border-surface-border px-5 py-3">
                <p className="text-xs text-slate-400">{active.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Transactions Ledger ──────────────────────────────────────

function LedgerSection({ projectId, language }) {
  const [records,       setRecords]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [page,          setPage]          = useState(0)
  const [totalPages,    setTotalPages]    = useState(0)
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
      setError(apiErr(err, 'Failed to load transactions.'))
    } finally {
      setLoading(false)
    }
  }, [projectId, page])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  return (
    <div className="space-y-3">
      <SectionTitle icon={<LedgerIcon className="w-4 h-4" />}>
        Transaction History
        {!loading && totalElements > 0 && (
          <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
            {totalElements}
          </span>
        )}
      </SectionTitle>

      <Alert message={error} variant="error" onClose={() => setError(null)} />

      <div className="overflow-hidden rounded-2xl border border-surface-border">
        {/* Table head */}
        <div className="hidden grid-cols-[1.2fr_0.8fr_1fr_0.8fr_1fr] gap-4 border-b border-surface-border bg-slate-800/80 px-4 py-2.5 sm:grid">
          {['Date', 'Type', 'Amount', 'Method', 'Item'].map((h) => (
            <p key={h} className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{h}</p>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="divide-y divide-surface-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="h-3.5 w-24 animate-pulse rounded bg-slate-700/50" />
                <div className="h-3.5 w-16 animate-pulse rounded bg-slate-700/50" />
                <div className="h-3.5 w-20 animate-pulse rounded bg-slate-700/50" />
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-slate-500">No transactions found.</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {records.map((rec) => {
              const itemLabel = (language === 'ar' ? rec.itemNameAr : rec.itemNameEn)
              const isDeposit = rec.recordType === 'DEPOSIT'
              return (
                <div
                  key={rec.financialRecordId}
                  className="grid grid-cols-1 gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-slate-800/30
                    sm:grid-cols-[1.2fr_0.8fr_1fr_0.8fr_1fr] sm:items-center"
                >
                  {/* Date */}
                  <p className="text-xs text-slate-300 font-medium">
                    {formatDate(rec.transactionDate, language)}
                  </p>

                  {/* Type badge */}
                  <span className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold
                    ${isDeposit ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/30 bg-rose-500/10 text-rose-300'}`}>
                    {rec.recordType}
                  </span>

                  {/* Amount */}
                  <p className={`text-sm font-bold ${isDeposit ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {isDeposit ? '+' : '−'}{formatMoney(rec.amount)}
                  </p>

                  {/* Method */}
                  <p className="text-xs text-slate-500">
                    {rec.paymentMethod?.replace('_', ' ') ?? '—'}
                  </p>

                  {/* Item */}
                  <p className="text-xs text-slate-500 truncate">
                    {itemLabel || <em className="text-slate-700">Project-level</em>}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-surface-border px-4 py-3">
            <p className="text-xs text-slate-500">
              Page <span className="font-medium text-slate-200">{page + 1}</span> of{' '}
              <span className="font-medium text-slate-200">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              {[
                { label: '← Prev', disabled: page === 0,             onClick: () => setPage((p) => p - 1) },
                { label: 'Next →', disabled: page >= totalPages - 1, onClick: () => setPage((p) => p + 1) },
              ].map(({ label, disabled, onClick }) => (
                <button
                  key={label}
                  type="button"
                  disabled={disabled}
                  onClick={onClick}
                  className="rounded-lg border border-surface-border px-3 py-1.5 text-xs text-slate-400
                    transition-colors hover:border-brand-500/50 hover:text-white
                    disabled:pointer-events-none disabled:opacity-30"
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
 *
 * Props:
 *   projectId   string  — required
 *   language    string  — 'en' | 'ar'  (for localized names)
 */
export default function ClientFinanceDashboard({ projectId, language = 'en' }) {
  if (!projectId) return null

  return (
    <div className="space-y-8">
      <SummarySection projectId={projectId} />
      <GallerySection projectId={projectId} language={language} />
      <LedgerSection  projectId={projectId} language={language} />
    </div>
  )
}

// ─── Shared tiny helpers ──────────────────────────────────────

function SectionTitle({ icon, children }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-border bg-slate-800/60 text-slate-400">
        {icon}
      </span>
      <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">{children}</h2>
    </div>
  )
}

// ── Icons ──────────────────────────────────────────────────────

function ArrowDownIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
    </svg>
  )
}
function ArrowUpIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
    </svg>
  )
}
function ScaleIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
    </svg>
  )
}
function CoinIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}
function GalleryIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  )
}
function LedgerIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
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
