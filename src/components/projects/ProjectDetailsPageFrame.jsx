import Alert from '@/components/ui/Alert'

export default function ProjectDetailsPageFrame({
  loading,
  project,
  title,
  subtitle,
  metaLine,
  error,
  success,
  onClearError,
  onClearSuccess,
  backLabel,
  onBack,
  emptyMessage,
  children,
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-brand-300 transition-colors hover:text-brand-200"
          >
            ← {backLabel}
          </button>
          <h1 className="mt-3 text-3xl font-bold text-white">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {subtitle}
          </p>
          {metaLine && (
            <p className="mt-2 text-xs uppercase tracking-wider text-slate-500">
              {metaLine}
            </p>
          )}
        </div>
      </div>

      <Alert message={error} variant="error" onClose={onClearError} />
      <Alert message={success} variant="success" onClose={onClearSuccess} />

      {loading && (
        <div className="space-y-3 rounded-2xl border border-surface-border bg-surface-card p-6 shadow-xl">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-xl bg-slate-800/60" />
          ))}
        </div>
      )}

      {!loading && !project && !error && (
        <div className="rounded-2xl border border-surface-border bg-surface-card p-8 text-center shadow-xl">
          <p className="text-sm text-slate-400">{emptyMessage}</p>
        </div>
      )}

      {!loading && project && (
        <div className="rounded-2xl border border-surface-border bg-surface-card p-6 shadow-xl">
          {children}
        </div>
      )}
    </div>
  )
}