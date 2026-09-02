/**
 * StatCard — KPI metric card for the admin dashboard
 *
 * Props:
 *   icon      ReactNode  — SVG icon element
 *   label     string     — metric label (translated)
 *   value     number | string
 *   color     'indigo' | 'emerald' | 'amber' | 'red' | 'cyan' | 'violet' | 'slate'
 *   loading   boolean
 */
const COLOR_MAP = {
  indigo: {
    icon:   'bg-brand-900/60 border-brand-700/50 text-brand-400',
    glow:   'hover:shadow-glow-indigo',
    accent: 'text-brand-400',
  },
  emerald: {
    icon:   'bg-emerald-900/60 border-emerald-700/50 text-emerald-400',
    glow:   'hover:shadow-glow-emerald',
    accent: 'text-emerald-400',
  },
  amber: {
    icon:   'bg-amber-900/40 border-amber-700/40 text-amber-400',
    glow:   'hover:shadow-[0_0_20px_rgba(251,191,36,0.2)]',
    accent: 'text-amber-400',
  },
  red: {
    icon:   'bg-red-900/40 border-red-700/40 text-red-400',
    glow:   'hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]',
    accent: 'text-red-400',
  },
  cyan: {
    icon:   'bg-cyan-900/40 border-cyan-700/40 text-cyan-400',
    glow:   'hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]',
    accent: 'text-cyan-400',
  },
  violet: {
    icon:   'bg-violet-900/40 border-violet-700/40 text-violet-400',
    glow:   'hover:shadow-[0_0_20px_rgba(167,139,250,0.2)]',
    accent: 'text-violet-400',
  },
  slate: {
    icon:   'bg-slate-800/60 border-slate-600/40 text-slate-400',
    glow:   '',
    accent: 'text-slate-400',
  },
}

export default function StatCard({ icon, label, value, color = 'indigo', loading = false }) {
  const colors = COLOR_MAP[color] ?? COLOR_MAP.indigo

  return (
    <div
      className={`glass-card p-5 flex items-center gap-4
        transition-all duration-300 cursor-default select-none
        hover:-translate-y-0.5 ${colors.glow}`}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center ${colors.icon}`}>
        {icon}
      </div>

      {/* Value & Label */}
      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="space-y-2">
            <div className="h-7 w-20 bg-slate-700/60 rounded-lg animate-pulse" />
            <div className="h-3.5 w-28 bg-slate-800/60 rounded animate-pulse" />
          </div>
        ) : (
          <>
            <p className={`text-2xl font-bold tabular-nums ${colors.accent}`}>
              {typeof value === 'number' ? value.toLocaleString() : value ?? '—'}
            </p>
            <p className="text-slate-500 text-xs mt-0.5 truncate">{label}</p>
          </>
        )}
      </div>
    </div>
  )
}
