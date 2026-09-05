import { useTranslation } from 'react-i18next'

/**
 * ProjectTable — shared across Admin, Engineer, and Client dashboards.
 *
 * Props:
 *   projects     — project summary array
 *   loading      — boolean
 *   totalPages   — number
 *   totalElements— number
 *   currentPage  — 0-indexed
 *   pageSize     — rows per page
 *   onPageChange — (page) => void
 *   onRowClick   — (project) => void
 *   role         — 'ADMIN' | 'ENGINEER' | 'CLIENT'
 *   emptyMessage — optional override string
 */
export default function ProjectTable({
  projects = [],
  loading = false,
  totalPages = 0,
  totalElements = 0,
  currentPage = 0,
  onPageChange,
  onRowClick,
  onDelete,
  deletingProjectId = null,
  role = 'ADMIN',
  emptyMessage,
}) {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'
  const locale = isRtl ? 'ar-EG' : 'en-US'

  const formatDeletedAt = (value) => {
    if (!value) return '—'
    const parsedDate = new Date(value)
    if (Number.isNaN(parsedDate.getTime())) return value
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(parsedDate)
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-800/60" />
        ))}
      </div>
    )
  }

  if (!projects.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 border border-surface-border">
          <FolderIcon />
        </div>
        <p className="text-sm font-medium text-slate-400">{emptyMessage || t('projects.no_projects')}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {t('projects.name')}
              </th>
              {role !== 'CLIENT' && (
                <th className="hidden px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:table-cell">
                  {t('projects.client')}
                </th>
              )}
              {role === 'ADMIN' && (
                <th className="hidden px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-slate-500 md:table-cell">
                  {t('projects.engineer')}
                </th>
              )}
              <th className="px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {t('projects.status')}
              </th>
              <th className="hidden px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:table-cell">
                {t('projects.progress')}
              </th>
              <th className="hidden px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-slate-500 lg:table-cell">
                {t('projects.target_date')}
              </th>
              {role === 'ADMIN' && (
                <th className="hidden px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-slate-500 xl:table-cell">
                  {t('projects.deleted_at')}
                </th>
              )}
              {role === 'ADMIN' && onDelete && (
                <th className="px-4 py-3 text-end text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {t('projects.actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {projects.map((project) => {
              const deletedAt = project.deletedAt ?? project.deletesAt
              const isDeleted = Boolean(deletedAt)
              const rowClickable = Boolean(onRowClick) && !(role === 'ADMIN' && isDeleted)

              return (
                <tr
                  key={project.projectId}
                  onClick={rowClickable ? () => onRowClick?.(project) : undefined}
                  className={`group transition-colors ${rowClickable ? 'cursor-pointer hover:bg-slate-800/40' : ''} ${isDeleted ? 'bg-rose-950/10 opacity-70' : ''}`}
                >
                  <td className="px-4 py-3.5">
                    <p className={`font-semibold leading-tight transition-colors ${isDeleted ? 'text-slate-300' : 'text-white'} ${rowClickable ? 'group-hover:text-brand-300' : ''}`}>
                      {isRtl ? project.nameAr : project.nameEn}
                    </p>
                    {(project.addressEn || project.addressAr) && (
                      <p className="mt-0.5 text-[11px] leading-tight text-slate-500">
                        {isRtl ? project.addressAr : project.addressEn}
                      </p>
                    )}
                    {isDeleted && (
                      <p className="mt-1 text-[11px] font-medium leading-tight text-rose-300 xl:hidden">
                        {t('projects.deleted_at')}: {formatDeletedAt(deletedAt)}
                      </p>
                    )}
                  </td>
                  {role !== 'CLIENT' && (
                    <td className="hidden px-4 py-3.5 sm:table-cell">
                      <span className="text-xs text-slate-400">{project.clientName ?? '—'}</span>
                    </td>
                  )}
                  {role === 'ADMIN' && (
                    <td className="hidden px-4 py-3.5 md:table-cell">
                      <span className="text-xs text-slate-400">{project.engineerName ?? '—'}</span>
                    </td>
                  )}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1">
                      {isDeleted ? <DeletedBadge label={t('projects.deleted')} /> : <StatusBadge status={project.overallStatus} />}
                      {isDeleted && (
                        <span className="text-[11px] text-slate-500">{project.overallStatus ?? '—'}</span>
                      )}
                    </div>
                  </td>
                  <td className="hidden min-w-[140px] px-4 py-3.5 sm:table-cell">
                    <ProgressBar value={project.overallProgressPercentage} />
                  </td>
                  <td className="hidden px-4 py-3.5 lg:table-cell">
                    <span className="whitespace-nowrap text-xs text-slate-500">{project.targetCompletionDate ?? '—'}</span>
                  </td>
                  {role === 'ADMIN' && (
                    <td className="hidden px-4 py-3.5 xl:table-cell">
                      <span className={`whitespace-nowrap text-xs ${isDeleted ? 'text-rose-200' : 'text-slate-600'}`}>
                        {isDeleted ? formatDeletedAt(deletedAt) : '—'}
                      </span>
                    </td>
                  )}
                  {role === 'ADMIN' && onDelete && (
                    <td className="px-4 py-3.5 text-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(project)
                        }}
                        disabled={isDeleted || deletingProjectId === project.projectId}
                        className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-900/30 disabled:pointer-events-none disabled:opacity-30"
                      >
                        {deletingProjectId === project.projectId ? t('common.loading') : t('projects.delete_action')}
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-surface-border px-4 py-3">
          <p className="text-xs text-slate-500">
            {t('table.page')} <span className="text-slate-300 font-medium">{currentPage + 1}</span>{' '}
            {t('table.of')} <span className="text-slate-300 font-medium">{totalPages}</span>
            {totalElements > 0 && (
              <span className="ml-2 text-slate-600">({totalElements})</span>
            )}
          </p>
          <div className="flex gap-2">
            <PaginationBtn
              disabled={currentPage === 0}
              onClick={() => onPageChange?.(currentPage - 1)}
              label={t('table.previous')}
            />
            <PaginationBtn
              disabled={currentPage >= totalPages - 1}
              onClick={() => onPageChange?.(currentPage + 1)}
              label={t('table.next')}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function PaginationBtn({ disabled, onClick, label }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-surface-border px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-brand-500/60 hover:text-white disabled:pointer-events-none disabled:opacity-30"
    >
      {label}
    </button>
  )
}

// ── Shared display primitives (also exported for re-use) ─────
export function StatusBadge({ status }) {
  const palette = {
    ACTIVE:      'bg-emerald-900/40 text-emerald-400 border-emerald-700/40',
    PAUSED:      'bg-amber-900/40 text-amber-400 border-amber-700/40',
    DELIVERED:   'bg-cyan-900/40 text-cyan-400 border-cyan-700/40',
    COMPLETED:   'bg-emerald-900/40 text-emerald-400 border-emerald-700/40',
    PENDING:     'bg-slate-700/60 text-slate-300 border-slate-600',
    IN_PROGRESS: 'bg-blue-900/40 text-blue-400 border-blue-700/40',
    CANCELLED:   'bg-red-900/40 text-red-400 border-red-700/40',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${palette[status] ?? palette.PENDING}`}>
      {status ?? 'PENDING'}
    </span>
  )
}

function DeletedBadge({ label }) {
  return (
    <span className="inline-flex items-center rounded-full border border-rose-700/40 bg-rose-900/40 px-2.5 py-0.5 text-[11px] font-semibold text-rose-300">
      {label}
    </span>
  )
}

export function ProgressBar({ value, className = '' }) {
  const pct = Math.min(Math.max(Number(value ?? 0), 0), 100)
  const color = pct >= 80 ? 'bg-emerald-400' : pct >= 40 ? 'bg-brand-400' : 'bg-cyan-400'
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-9 text-end text-[11px] tabular-nums text-slate-500">{pct.toFixed(0)}%</span>
    </div>
  )
}

function FolderIcon() {
  return (
    <svg className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
    </svg>
  )
}

