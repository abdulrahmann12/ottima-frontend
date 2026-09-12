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
    <div
      className={`glass-card p-4.5 sm:p-5 flex items-center justify-between gap-3 sm:gap-4
        transition-all duration-300 select-none group border border-gray-200/90
        ${to ? 'hover:-translate-y-1 hover:shadow-card-hover hover:border-warm-brown/40 cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Icon */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center transition-transform group-hover:scale-105 ${colors.icon}`}>
          {icon}
        </div>

        {/* Value & Label */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-2">
              <div className="h-6 w-16 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-3.5 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <p className={`text-2xl sm:text-[26px] font-bold tabular-nums tracking-tight leading-none ${colors.accent}`}>
                {typeof value === 'number' ? value.toLocaleString() : value ?? '0'}
              </p>
              <p className="text-gray-600 text-xs sm:text-sm font-medium mt-1 truncate">{label}</p>
              {subtitle && (
                <p className="text-gray-400 text-[11px] truncate mt-0.5">{subtitle}</p>
              )}
            </>
          )}
        </div>
      </div>

      {to && (
        <div className="text-gray-300 group-hover:text-warm-brown group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-all flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      )}
    </div>
  )

  if (to) {
    return <Link to={to} className="block no-underline">{content}</Link>
  }

  return content
}
