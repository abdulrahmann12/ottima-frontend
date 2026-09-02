import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getAdminDashboard } from '@/api/adminApi'
import StatCard from '@/components/admin/StatCard'
import Alert from '@/components/ui/Alert'

/**
 * Dashboard — /admin/dashboard
 *
 * Fetches DashboardSummaryResponse on mount and renders 7 KPI StatCards.
 * DashboardSummaryResponse:
 *   { totalActiveUsers, totalDeactivatedUsers, totalClients,
 *     totalEngineers, totalAdmins, activeProjects, completedProjects }
 */
export default function Dashboard() {
  const { t } = useTranslation()
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getAdminDashboard()
      .then(({ data: res }) => {
        if (!cancelled) setStats(res.data)
      })
      .catch((err) => {
        if (!cancelled)
          setError(err.response?.data?.message ?? t('errors.generic'))
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [t])

  const CARDS = stats ? [
    { key: 'total_active_users',      value: stats.totalActiveUsers,      color: 'indigo',  icon: <UsersIcon /> },
    { key: 'total_deactivated_users', value: stats.totalDeactivatedUsers,  color: 'red',     icon: <UserOffIcon /> },
    { key: 'total_admins',            value: stats.totalAdmins,            color: 'violet',  icon: <ShieldIcon /> },
    { key: 'total_engineers',         value: stats.totalEngineers,         color: 'cyan',    icon: <WrenchIcon /> },
    { key: 'total_clients',           value: stats.totalClients,           color: 'emerald', icon: <ClientIcon /> },
    { key: 'active_projects',         value: stats.activeProjects,         color: 'amber',   icon: <FolderIcon /> },
    { key: 'completed_projects',      value: stats.completedProjects,      color: 'slate',   icon: <CheckIcon /> },
  ] : Array.from({ length: 7 }, (_, i) => ({ key: `skel-${i}`, value: 0, color: 'slate', icon: null }))

  return (
    <div className="animate-slide-up space-y-6">
      {/* Page heading */}
      <div>
        <h2 className="text-xl font-bold text-white">{t('dashboard.title')}</h2>
        <p className="text-slate-500 text-sm mt-0.5">{t('dashboard.subtitle')}</p>
      </div>

      {/* Error */}
      <Alert message={error} variant="error" onClose={() => setError(null)} />

      {/* Stat cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {CARDS.map(({ key, value, color, icon }) => (
          <StatCard
            key={key}
            icon={icon}
            label={t(`dashboard.${key}`)}
            value={value}
            color={color}
            loading={loading}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Inline icons ──────────────────────────────────────── */
function UsersIcon()  { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg> }
function UserOffIcon(){ return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" /></svg> }
function ShieldIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg> }
function WrenchIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l5.653-4.655m5.8-5.8.35-.35A3.12 3.12 0 1 1 17.22 8.4l-.35.35m-5.8 5.8 5.8-5.8" /></svg> }
function ClientIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg> }
function FolderIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25A2.25 2.25 0 0 0 4.5 16.5h15a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg> }
function CheckIcon()  { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg> }
