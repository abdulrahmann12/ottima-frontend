import { useTranslation } from 'react-i18next'

/**
 * DataTable — reusable paginated table
 *
 * Props:
 *   columns      Array<{ key, header, render?, className? }>
 *   data         Array<object>
 *   loading      boolean
 *   totalPages   number
 *   currentPage  number  (0-indexed)
 *   onPageChange (page: number) => void
 *   totalElements number
 *   pageSize     number
 *   emptyMessage string
 *   keyExtractor (row) => string  (unique key for rows, defaults to row.id)
 */
export default function DataTable({
  columns,
  data,
  loading,
  totalPages = 1,
  currentPage = 0,
  onPageChange,
  totalElements = 0,
  pageSize = 10,
  emptyMessage,
  keyExtractor,
  onRowClick,
}) {
  const { t } = useTranslation()

  const from = totalElements === 0 ? 0 : currentPage * pageSize + 1
  const to   = Math.min((currentPage + 1) * pageSize, totalElements)

  return (
    <div className="flex flex-col gap-4">
      {/* Table wrapper */}
      <div className="overflow-x-auto rounded-xl border border-surface-border">
        <table className="w-full text-sm text-left rtl:text-right">
          {/* Head */}
          <thead className="bg-slate-800/80">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500
                    border-b border-surface-border whitespace-nowrap ${col.headerClass ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-surface-border">
            {loading ? (
              // Skeleton rows
              Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                <tr key={`skel-${i}`} className="bg-surface-card/40">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-slate-700/50 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-14 text-center text-slate-500 text-sm"
                >
                  {emptyMessage ?? t('table.empty')}
                </td>
              </tr>
            ) : (
              data.map((row, i) => {
                const key = keyExtractor ? keyExtractor(row) : row.id ?? i
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`bg-surface-card/20 hover:bg-slate-800/40 transition-colors duration-100 ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-slate-300 align-middle ${col.className ?? ''}`}
                      >
                        {col.render
                          ? col.render(row[col.key], row)
                          : (row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
          {/* Range info */}
          <p className="text-xs text-slate-500 order-2 sm:order-1">
            {!loading && totalElements > 0
              ? t('standard_items.showing', { from, to, total: totalElements })
              : null}
          </p>

          {/* Page controls */}
          <div className="flex items-center gap-1 order-1 sm:order-2">
            {/* Prev */}
            <PageBtn
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0 || loading}
              label={t('table.previous')}
              icon={<ChevLeft />}
            />

            {/* Page pills */}
            {Array.from({ length: totalPages }, (_, i) => i)
              .filter((p) => {
                if (totalPages <= 7) return true
                if (p === 0 || p === totalPages - 1) return true
                if (Math.abs(p - currentPage) <= 1) return true
                return false
              })
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-slate-600 text-sm select-none">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    disabled={loading}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-all duration-150
                      focus:outline-none focus:ring-2 focus:ring-brand-500/40
                      ${p === currentPage
                        ? 'bg-brand-600 text-white shadow-glow-indigo'
                        : 'text-slate-400 hover:bg-slate-700/60 hover:text-slate-200'
                      }`}
                  >
                    {p + 1}
                  </button>
                )
              )}

            {/* Next */}
            <PageBtn
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1 || loading}
              label={t('table.next')}
              icon={<ChevRight />}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function PageBtn({ onClick, disabled, label, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-8 h-8 rounded-lg flex items-center justify-center
        text-slate-400 hover:text-slate-200 hover:bg-slate-700/60
        disabled:opacity-40 disabled:cursor-not-allowed
        transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
    >
      {icon}
    </button>
  )
}

function ChevLeft() {
  return (
    <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  )
}
function ChevRight() {
  return (
    <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  )
}
