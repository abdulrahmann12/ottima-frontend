import SearchableSelect from '@/components/ui/SearchableSelect'

export function DailyUpdatesSelectionCard({
  eyebrow,
  title,
  description,
  label,
  value,
  onChange,
  options = [],
  placeholder,
  getOptionLabel,
  loading = false,
  loadingLabel = 'Loading...',
  disabled = false,
  summary = [],
  action,
}) {
  const selectOptions = options.map((option) => ({
    value: option.projectId,
    label: getOptionLabel ? getOptionLabel(option) : option.nameEn || option.nameAr || option.projectId,
  }))

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-card">
      <div className="px-5 py-5 sm:px-6 border-b border-gray-200 bg-gradient-to-r from-cream/60 via-white to-gray-50/80 rounded-t-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-widest text-warm-brown">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-1 text-2xl font-bold text-gray-900">{title}</h1>
            {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
          </div>
          {action ? <div className="flex shrink-0">{action}</div> : null}
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <SearchableSelect
            label={label}
            value={value}
            onChange={onChange}
            disabled={disabled || loading}
            loading={loading}
            loadingLabel={loadingLabel}
            placeholder={placeholder}
            options={selectOptions}
          />

          {summary.length > 0 ? (
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {summary.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <p className="text-[11px] uppercase tracking-widest text-gray-400">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{item.value}</p>
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
    <section className="rounded-2xl border border-gray-200 bg-white shadow-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  )
}

export function DailyUpdatesPlaceholder({ title, copy }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-card">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-cream text-warm-brown">
        <NotebookIcon className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-500">{copy}</p>
    </div>
  )
}

export function DailyUpdateStatusPill({ status }) {
  const palette = {
    PENDING:  'border-amber-200  bg-amber-50  text-amber-700',
    APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    REJECTED: 'border-rose-200   bg-rose-50   text-rose-700',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${palette[status] ?? 'border-gray-200 bg-gray-100 text-gray-600'}`}
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
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M16.5 3.75h1.875A1.875 1.875 0 0 1 20.25 5.625v12.75a1.875 1.875 0 0 1-1.875 1.875H5.625A1.875 1.875 0 0 1 3.75 18.375V5.625A1.875 1.875 0 0 1 5.625 3.75H7.5m9 0V2.625m0 1.125v1.125m0-1.125h-9m9 0H7.5m0 0V2.625m0 1.125v1.125m8.25 4.5h-7.5m7.5 3h-7.5m4.5 3h-4.5" />
    </svg>
  )
}