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
  headerAction,
  children,
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="group min-h-[36px] inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-warm-brown transition-colors hover:text-warm-brown/80 cursor-pointer"
          >
            <svg
              className="w-4 h-4 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1 rtl:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            <span>{backLabel}</span>
          </button>
          <h1 className="mt-1 text-2xl sm:text-3xl font-medium text-gray-900 tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 font-light">
              <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <span>{subtitle}</span>
            </p>
          )}
          {metaLine && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
              {metaLine.split(' · ').map((token, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold tracking-wide ${
                    i === 0
                      ? 'border-amber-300/80 bg-amber-50 text-amber-800'
                      : 'border-teal-300/80 bg-teal-50 text-teal-800'
                  }`}
                >
                  {i === 0 ? (
                    <svg className="w-3 h-3 shrink-0 opacity-75" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 shrink-0 opacity-75" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.048.58.024 1.193-.14 1.743" />
                    </svg>
                  )}
                  <span>{token}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        {headerAction && (
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            {headerAction}
          </div>
        )}
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