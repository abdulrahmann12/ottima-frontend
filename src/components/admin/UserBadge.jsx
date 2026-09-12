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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
        bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {t('users.active')}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
        bg-red-50 text-red-700 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        {t('users.deactivated')}
      </span>
    )
  }

  // Type === 'role'
  const roleStyles = {
    ADMIN:    'bg-purple-50 text-purple-700 border-purple-200',
    ENGINEER: 'bg-sky-50 text-sky-700 border-sky-200',
    CLIENT:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  }
  const cls = roleStyles[roleName] ?? 'bg-gray-100 text-gray-700 border-gray-200'

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${cls}`}>
      {roleName}
    </span>
  )
}
