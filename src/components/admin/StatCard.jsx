import { Link } from 'react-router-dom'

/**
 * StatCard — KPI metric card for the admin dashboard
 *
 * Props:
 *   icon      ReactNode  — SVG icon element
 *   label     string     — metric label (translated)
 *   value     number | string
 *   subtitle  string     — optional helper text
 *   color     'warm-brown' | 'olive' | 'gold' | 'indigo' | 'emerald' | 'amber' | 'red' | 'cyan' | 'violet' | 'slate'
 *   loading   boolean
 *   to        string     — optional navigation target
 */

// Luxury light-theme icon box + accent color map
const COLOR_MAP = {
  'warm-brown': {
    icon:   'bg-warm-brown/10 border-warm-brown/20 text-warm-brown',
    accent: 'text-warm-brown',
    badge:  'bg-warm-brown/10 text-warm-brown border-warm-brown/20',
  },
  olive: {
    icon:   'bg-olive/10 border-olive/20 text-olive',
    accent: 'text-olive',
    badge:  'bg-olive/10 text-olive border-olive/20',
  },
  gold: {
    icon:   'bg-amber-50 border-amber-300 text-amber-700',
    accent: 'text-amber-700',
    badge:  'bg-amber-100 text-amber-800 border-amber-200',
  },
  indigo: {
    icon:   'bg-indigo-50 border-indigo-200 text-indigo-600',
    accent: 'text-indigo-600',
    badge:  'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  emerald: {
    icon:   'bg-emerald-50 border-emerald-200 text-emerald-600',
    accent: 'text-emerald-600',
    badge:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  amber: {
    icon:   'bg-amber-50 border-amber-200 text-amber-600',
    accent: 'text-amber-600',
    badge:  'bg-amber-50 text-amber-700 border-amber-200',
  },
  red: {
    icon:   'bg-red-50 border-red-200 text-red-600',
    accent: 'text-red-600',
    badge:  'bg-red-50 text-red-700 border-red-200',
  },
  cyan: {
    icon:   'bg-cyan-50 border-cyan-200 text-cyan-600',
    accent: 'text-cyan-600',
    badge:  'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  violet: {
    icon:   'bg-violet-50 border-violet-200 text-violet-600',
    accent: 'text-violet-600',
    badge:  'bg-violet-50 text-violet-700 border-violet-200',
  },
  slate: {
    icon:   'bg-gray-100 border-gray-200 text-gray-500',
    accent: 'text-gray-700',
    badge:  'bg-gray-100 text-gray-600 border-gray-200',
  },
}

export default function StatCard({
  icon,
  label,
  value,
  subtitle,
  color = 'warm-brown',
  loading = false,
  to,
}) {
  const colors = COLOR_MAP[color] ?? COLOR_MAP['warm-brown']

  const content = (
    <>
      {/* ── Mobile View (< sm): Sleek, compact horizontal touch card ── */}
      <div
        className={`sm:hidden p-3 rounded-xl bg-white border border-gray-200/90 shadow-xs
          flex items-center justify-between gap-3 transition-all select-none
          ${to ? 'active:scale-[0.99] hover:border-warm-brown/40 cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 shadow-xs ${colors.icon}`}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-800 truncate" title={label}>
              {label}
            </p>
            {subtitle && (
              <p className="text-[10px] text-gray-400 font-light truncate mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ms-2">
          {loading ? (
            <div className="h-5 w-8 bg-gray-200 rounded animate-pulse" />
          ) : (
            <span className={`text-lg font-extrabold tabular-nums tracking-tight ${colors.accent}`}>
              {typeof value === 'number' ? value.toLocaleString() : value ?? '0'}
            </span>
          )}
          {to && (
            <svg className="w-3.5 h-3.5 text-gray-300 rtl:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          )}
        </div>
      </div>

      {/* ── Desktop & Tablet View (>= sm): Luxury Vertical Card ── */}
      <div
        className={`hidden sm:flex flex-col justify-between p-4.5 sm:p-5 rounded-2xl bg-white
          border border-gray-200/90 shadow-xs select-none group min-h-[125px] sm:min-h-[130px]
          transition-all duration-300
          ${to ? 'hover:-translate-y-1 hover:shadow-md hover:border-warm-brown/40 cursor-pointer' : 'cursor-default'}`}
      >
        {/* Top Header: Icon + Subtle Navigation Arrow */}
        <div className="flex items-center justify-between mb-2 sm:mb-2.5">
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-xs ${colors.icon}`}>
            {icon}
          </div>

          {to && (
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 group-hover:text-warm-brown group-hover:bg-warm-brown/5 transition-all">
              <svg className="w-3.5 h-3.5 rtl:rotate-180 transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          )}
        </div>

        {/* Metric Value & Full Label */}
        <div className="flex-1 flex flex-col justify-end min-w-0">
          {loading ? (
            <div className="space-y-1.5 py-1">
              <div className="h-7 w-14 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-3.5 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <p className={`text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight leading-none ${colors.accent}`}>
                {typeof value === 'number' ? value.toLocaleString() : value ?? '0'}
              </p>
              <p
                className="text-gray-600 text-xs sm:text-[13px] font-semibold mt-1.5 leading-snug line-clamp-2"
                title={label}
              >
                {label}
              </p>
              {subtitle && (
                <p className="text-gray-400 text-[11px] font-light truncate mt-0.5">{subtitle}</p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )

  if (to) {
    return <Link to={to} className="block no-underline h-full">{content}</Link>
  }

  return content
}
