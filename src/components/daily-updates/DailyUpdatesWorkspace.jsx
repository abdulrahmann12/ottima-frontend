export function DailyUpdatesSelectionCard({
  eyebrow,
  title,
  description,
  label,
  value,
  onChange,
  options,
  placeholder,
  getOptionLabel,
  loading = false,
  loadingLabel = 'Loading...',
  disabled = false,
  summary = [],
  action,
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-surface-border bg-slate-900/40 shadow-xl">
      <div className="bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_44%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.1),transparent_34%)] px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-3 text-2xl font-bold text-white">{title}</h1>
            {description && <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>}
          </div>

          {action ? <div className="flex shrink-0">{action}</div> : null}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
            <select
              className="input-base mt-2 text-sm"
              value={value}
              onChange={onChange}
              disabled={disabled || loading}
            >
              <option value="">{loading ? loadingLabel : placeholder}</option>
              {options.map((option) => (
                <option key={option.projectId} value={option.projectId}>
                  {getOptionLabel(option)}
                </option>
              ))}
            </select>
          </label>

          {summary.length > 0 ? (
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {summary.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-surface-border bg-slate-950/45 px-4 py-3 backdrop-blur-sm"
                >
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function DailyUpdatesFilterPanel({ children, actions }) {
  return (
    <section className="rounded-3xl border border-surface-border bg-surface-card p-5 shadow-xl sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  )
}

export function DailyUpdatesPlaceholder({ title, copy }) {
  return (
    <div className="rounded-3xl border border-dashed border-surface-border bg-slate-900/30 p-10 text-center shadow-xl">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-surface-border bg-slate-950/60 text-cyan-300">
        <NotebookIcon className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-slate-400">{copy}</p>
    </div>
  )
}

export function DailyUpdateStatusPill({ status }) {
  const palette = {
    PENDING: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
    APPROVED: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
    REJECTED: 'border-rose-500/30 bg-rose-500/15 text-rose-300',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${palette[status] ?? 'border-slate-600 bg-slate-800/70 text-slate-300'}`}
    >
      {status ?? 'PENDING'}
    </span>
  )
}

export function formatDailyUpdateDate(value, language) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function NotebookIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 3.75h1.875A1.875 1.875 0 0 1 20.25 5.625v12.75a1.875 1.875 0 0 1-1.875 1.875H5.625A1.875 1.875 0 0 1 3.75 18.375V5.625A1.875 1.875 0 0 1 5.625 3.75H7.5m9 0V2.625m0 1.125v1.125m0-1.125h-9m9 0H7.5m0 0V2.625m0 1.125v1.125m8.25 4.5h-7.5m7.5 3h-7.5m4.5 3h-4.5"
      />
    </svg>
  )
}