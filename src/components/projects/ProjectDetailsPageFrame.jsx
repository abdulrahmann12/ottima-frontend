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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="min-h-[36px] flex items-center text-xs sm:text-sm font-semibold text-warm-brown transition-colors hover:text-brand-600 cursor-pointer"
          >
            ← {backLabel}
          </button>
          <h1 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 leading-tight">
            {title}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            {subtitle}
          </p>
          {metaLine && (
            <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
              {metaLine.split(' · ').map((token, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide ${
                    i === 0
                      ? 'border-amber-300 bg-amber-50 text-amber-700'
                      : 'border-teal-300 bg-teal-50 text-teal-700'
                  }`}
                >
                  {token}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <Alert message={error} variant="error" onClose={onClearError} />
      <Alert message={success} variant="success" onClose={onClearSuccess} />

      {loading && (
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      )}

      {!loading && !project && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 text-center shadow-sm">
          <p className="text-xs sm:text-sm text-gray-500">{error || emptyMessage}</p>
        </div>
      )}

      {!loading && project && (
        <div className="rounded-2xl border border-gray-200 bg-white p-3.5 sm:p-5 lg:p-6 shadow-sm">
          {children}
        </div>
      )}
    </div>
  )
}