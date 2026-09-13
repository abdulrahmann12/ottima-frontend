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
  onRestore,
  deletingProjectId = null,
  restoringProjectId = null,
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
          <div key={i} className="h-14 rounded-xl bg-gray-100" />
        ))}
      </div>
    )
  }

  if (!projects.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 border border-gray-200 text-gray-400">
          <FolderIcon />
        </div>
        <p className="text-sm font-medium text-gray-500">{emptyMessage || t('projects.no_projects')}</p>
      </div>
    )
  }

  return (
    <div>
      {/* ── Desktop View (md+): Standard Table ───────────────── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/60">
              <th className="px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                {t('projects.name')}
              </th>
              {role !== 'CLIENT' && (
                <th className="px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  {t('projects.client')}
                </th>
              )}
              {role === 'ADMIN' && (
                <th className="px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  {t('projects.engineer')}
                </th>
              )}
              <th className="px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                {t('projects.status')}
              </th>
              <th className="px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                {t('projects.progress')}
              </th>
              <th className="px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                {t('projects.target_date')}
              </th>
              {role === 'ADMIN' && (
                <th className="hidden px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-gray-500 xl:table-cell">
                  {t('projects.deleted_at')}
                </th>
              )}
              {role === 'ADMIN' && (onDelete || onRestore) && (
                <th className="px-4 py-3 text-end text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  {t('projects.actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.map((project) => {
              const deletedAt = project.deletedAt ?? project.deletesAt
              const isDeleted = Boolean(deletedAt)
              const rowClickable = Boolean(onRowClick)

              return (
                <tr
                  key={project.projectId}
                  onClick={rowClickable ? () => onRowClick?.(project) : undefined}
                  className={`group transition-colors ${rowClickable ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                >
                  <td className="px-4 py-3.5">
                    <p className={`font-semibold leading-tight transition-colors text-gray-900 ${rowClickable ? 'group-hover:text-warm-brown' : ''}`}>
                      {isRtl ? project.nameAr : project.nameEn}
                    </p>
                    {(project.addressEn || project.addressAr) && (
                      <p className="mt-0.5 text-[11px] leading-tight text-gray-500">
                        {isRtl ? project.addressAr : project.addressEn}
                      </p>
                    )}
                    {isDeleted && (
                      <p className="mt-1 text-[11px] font-medium leading-tight text-red-600 xl:hidden">
                        {t('projects.deleted_at')}: {formatDeletedAt(deletedAt)}
                      </p>
                    )}
                  </td>
                  {role !== 'CLIENT' && (
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-gray-700">{project.clientName ?? '—'}</span>
                    </td>
                  )}
                  {role === 'ADMIN' && (
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-gray-700">{project.engineerName ?? '—'}</span>
                    </td>
                  )}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1">
                      {isDeleted ? <DeletedBadge label={t('projects.deleted')} /> : <StatusBadge status={project.overallStatus} />}
                      {isDeleted && (
                        <span className="text-[11px] text-gray-500">{project.overallStatus ?? '—'}</span>
                      )}
                    </div>
                  </td>
                  <td className="min-w-[140px] px-4 py-3.5">
                    <ProgressBar value={project.overallProgressPercentage} />
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="whitespace-nowrap text-xs text-gray-600">{project.targetCompletionDate ?? '—'}</span>
                  </td>
                  {role === 'ADMIN' && (
                    <td className="hidden px-4 py-3.5 xl:table-cell">
                      <span className={`whitespace-nowrap text-xs ${isDeleted ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {isDeleted ? formatDeletedAt(deletedAt) : '—'}
                      </span>
                    </td>
                  )}
                  {role === 'ADMIN' && (onDelete || onRestore) && (
                    <td className="px-4 py-3.5 text-end">
                      {isDeleted ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRestore?.(project)
                          }}
                          disabled={restoringProjectId === project.projectId}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 hover:text-emerald-800 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
                        >
                          {restoringProjectId === project.projectId ? t('common.loading') : t('projects.restore_action')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete?.(project)
                          }}
                          disabled={deletingProjectId === project.projectId}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 hover:text-red-700 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
                        >
                          {deletingProjectId === project.projectId ? t('common.loading') : t('projects.delete_action')}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile View (<md): Stacked Native Project Cards ──── */}
      <div className="block md:hidden p-3.5 space-y-3">
        {projects.map((project) => {
          const deletedAt = project.deletedAt ?? project.deletesAt
          const isDeleted = Boolean(deletedAt)
          const rowClickable = Boolean(onRowClick)

          return (
            <div
              key={project.projectId}
              onClick={rowClickable ? () => onRowClick?.(project) : undefined}
              className={`bg-white rounded-2xl border border-[#D9C7B8] p-4 shadow-xs space-y-3 transition-all duration-150 ${
                rowClickable ? 'cursor-pointer active:scale-[0.99] active:bg-[#F4EDE4]/30 hover:border-warm-brown/60' : ''
              }`}
            >
              {/* Header: Title + Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-gray-900 leading-snug truncate">
                    {isRtl ? project.nameAr : project.nameEn}
                  </h3>
                  {(project.addressEn || project.addressAr) && (
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">
                      📍 {isRtl ? project.addressAr : project.addressEn}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  {isDeleted ? <DeletedBadge label={t('projects.deleted')} /> : <StatusBadge status={project.overallStatus} />}
                </div>
              </div>

              {/* Progress Bar Section */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 font-medium">{t('projects.progress', { defaultValue: 'Progress' })}</span>
                  <span className="font-bold text-gray-900">{project.overallProgressPercentage ?? 0}%</span>
                </div>
                <ProgressBar value={project.overallProgressPercentage} />
              </div>

              {/* Meta Pills (Client, Engineer, Target Date) */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                {role !== 'CLIENT' && project.clientName && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700">
                    👤 {project.clientName}
                  </span>
                )}
                {role === 'ADMIN' && project.engineerName && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-light-blue/40 text-gray-800">
                    👷 {project.engineerName}
                  </span>
                )}
                {project.targetCompletionDate && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60 ml-auto rtl:mr-auto">
                    📅 {project.targetCompletionDate}
                  </span>
                )}
              </div>

              {/* Admin Actions on Deleted / Active */}
              {role === 'ADMIN' && (onDelete || onRestore) && (
                <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                  {isDeleted ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRestore?.(project)
                      }}
                      disabled={restoringProjectId === project.projectId}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      {restoringProjectId === project.projectId ? t('common.loading') : t('projects.restore_action')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete?.(project)
                      }}
                      disabled={deletingProjectId === project.projectId}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      {deletingProjectId === project.projectId ? t('common.loading') : t('projects.delete_action')}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-500">
            {t('table.page')} <span className="text-gray-900 font-semibold">{currentPage + 1}</span>{' '}
            {t('table.of')} <span className="text-gray-900 font-semibold">{totalPages}</span>
            {totalElements > 0 && (
              <span className="ml-2 text-gray-500">({totalElements})</span>
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
      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-30 shadow-sm"
    >
      {label}
    </button>
  )
}

// ── Shared display primitives (also exported for re-use) ─────
export function StatusBadge({ status }) {
  const palette = {
    ACTIVE:      'bg-emerald-50 text-emerald-700 border-emerald-200',
    PAUSED:      'bg-amber-50 text-amber-700 border-amber-200',
    DELIVERED:   'bg-teal-50 text-teal-700 border-teal-200',
    COMPLETED:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    PENDING:     'bg-gray-100 text-gray-700 border-gray-200',
    IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
    CANCELLED:   'bg-red-50 text-red-700 border-red-200',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${palette[status] ?? palette.PENDING}`}>
      {status ?? 'PENDING'}
    </span>
  )
}

function DeletedBadge({ label }) {
  return (
    <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-700">
      {label}
    </span>
  )
}

export function ProgressBar({ value, className = '' }) {
  const pct = Math.min(Math.max(Number(value ?? 0), 0), 100)
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-warm-brown' : 'bg-amber-500'
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-9 text-end text-[11px] tabular-nums font-mono text-gray-600">{pct.toFixed(0)}%</span>
    </div>
  )
}

function FolderIcon() {
  return (
    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
    </svg>
  )
}

