import { useTranslation } from 'react-i18next'

// ─── Formatters ───────────────────────────────────────────────
function formatMoney(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

// ─── SVGs ─────────────────────────────────────────────────────
function ArrowDownIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  )
}

function ArrowUpIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  )
}

function ScaleIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  )
}

function CoinIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

/**
 * FinancialSummaryCards
 *
 * Displays the 3 distinct modern metric cards:
 * 1. TOTAL PAID: Green text, down-arrow icon
 * 2. TOTAL SPENT: Red text, up-arrow icon
 * 3. BALANCE: Blue text, scale/balance icon
 *
 * @param {{
 *   summary?: {
 *     totalPaidAmount?: number|string,
 *     totalPaidCount?: number,
 *     totalSpentAmount?: number|string,
 *     totalSpentCount?: number,
 *     remainingBalance?: number|string
 *   },
 *   loading?: boolean,
 *   title?: string,
 *   showTitle?: boolean,
 *   className?: string
 * }} props
 */
export default function FinancialSummaryCards({
  summary,
  loading = false,
  title,
  showTitle = true,
  className = '',
}) {
  const { t } = useTranslation()

  const displayTitle = title ?? t('projects.financial_summary', { defaultValue: 'Financial Summary' })

  const cards = [
    {
      key: 'total-paid',
      label: t('finance.total_paid', { defaultValue: 'TOTAL PAID' }),
      amount: summary?.totalPaidAmount ?? 0,
      count: summary?.totalPaidCount,
      textColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      icon: <ArrowDownIcon className="w-5 h-5" />,
    },
    {
      key: 'total-spent',
      label: t('finance.total_spent', { defaultValue: 'TOTAL SPENT' }),
      amount: summary?.totalSpentAmount ?? 0,
      count: summary?.totalSpentCount,
      textColor: 'text-rose-400',
      badgeBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
      icon: <ArrowUpIcon className="w-5 h-5" />,
    },
    {
      key: 'balance',
      label: t('finance.balance', { defaultValue: 'BALANCE' }),
      amount: summary?.remainingBalance ?? 0,
      count: null,
      textColor: 'text-blue-400',
      badgeBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      icon: <ScaleIcon className="w-5 h-5" />,
    },
  ]

  return (
    <div className={`space-y-3 ${className}`}>
      {showTitle && (
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <CoinIcon className="w-4 h-4 text-brand-400" />
          <span>{displayTitle}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-3xl border border-surface-border bg-slate-800/40"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.key}
              className="relative overflow-hidden rounded-3xl border border-surface-border bg-slate-900/60 p-5 shadow-xl transition-all hover:border-slate-700/60"
            >
              <div
                className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border ${card.badgeBg}`}
              >
                {card.icon}
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                {card.label}
              </p>
              <p className={`mt-2 text-2xl font-bold tracking-tight ${card.textColor}`}>
                {formatMoney(card.amount)}
              </p>
              {card.count != null && (
                <p className="mt-1 text-xs text-slate-500">
                  {card.count} {t('finance.transactions', { defaultValue: 'transaction(s)' })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
