import { useTranslation } from 'react-i18next'

/**
 * UserBadge — status and role badges for User tables
 *
 * Props:
 *   active    boolean  — status of user
 *   roleName  string   — 'ADMIN' | 'ENGINEER' | 'CLIENT' | custom role
 *   type      'status' | 'role'
 */
export default function UserBadge({ active, roleName, type = 'status' }) {
  const { t } = useTranslation()

  if (type === 'status') {
    return active ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        bg-emerald-900/40 text-emerald-400 border border-emerald-700/40">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        {t('users.active')}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        bg-red-900/40 text-red-400 border border-red-700/40">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        {t('users.deactivated')}
      </span>
    )
  }

  // Type === 'role'
  const roleStyles = {
    ADMIN:    'bg-purple-900/40 text-purple-300 border-purple-700/40',
    ENGINEER: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/40',
    CLIENT:   'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
  }
  const cls = roleStyles[roleName] ?? 'bg-slate-800 text-slate-300 border-slate-700'

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${cls}`}>
      {roleName}
    </span>
  )
}
