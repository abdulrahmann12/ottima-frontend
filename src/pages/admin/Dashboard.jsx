import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { getAdminDashboard } from '@/api/adminApi'
import { getAdminProjects } from '@/api/projectsApi'
import { getAllClients, getAllEngineers } from '@/api/usersApi'
import { getAllActivityLogs } from '@/api/adminActivityLogApi'
import StatCard from '@/components/admin/StatCard'
import Alert from '@/components/ui/Alert'
import ProjectWizard from '@/components/projects/ProjectWizard'

/**
 * Executive Admin Dashboard — /admin/dashboard
 *
 * Provides:
 *  - 5 Exact KPIs: Total Projects, Total Active, Total Complete, Total Clients, Total Engineers
 *  - Live Interactive Project Lifecycle Donut Chart with Status Breakdown
 *  - Recent Active Projects Feed
 *  - Live System Activity Stream
 */
export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isRtl = i18n.language === 'ar'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeDonutSegment, setActiveDonutSegment] = useState(null)

  // Live state
  const [dashboardSummary, setDashboardSummary] = useState(null)
  const [allProjects, setAllProjects] = useState([])
  const [totalProjectsCount, setTotalProjectsCount] = useState(0)
  const [totalClientsCount, setTotalClientsCount] = useState(0)
  const [totalEngineersCount, setTotalEngineersCount] = useState(0)
  const [recentActivities, setRecentActivities] = useState([])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [summaryRes, projectsRes, clientsRes, engineersRes, logsRes] = await Promise.all([
        getAdminDashboard().catch(() => ({ data: { data: null } })),
        getAdminProjects(0, 100, { isDeleted: false }).catch(() => ({ data: { data: { content: [], totalElements: 0 } } })),
        getAllClients(0, 10).catch(() => ({ data: { data: { totalElements: 0 } } })),
        getAllEngineers(0, 10).catch(() => ({ data: { data: { totalElements: 0 } } })),
        getAllActivityLogs(0, 5).catch(() => ({ data: { data: { content: [] } } })),
      ])

      const summary = summaryRes.data?.data ?? {}
      const projectsPage = projectsRes.data?.data ?? {}
      const projectsList = projectsPage.content ?? []
      const totalProjects = projectsPage.totalElements ?? projectsList.length ?? summary.totalProjects ?? 0
      const totalClients = clientsRes.data?.data?.totalElements ?? summary.totalClients ?? 0
      const totalEngineers = engineersRes.data?.data?.totalElements ?? summary.totalEngineers ?? 0

      setDashboardSummary(summary)
      setAllProjects(projectsList)
      setTotalProjectsCount(totalProjects)
      setTotalClientsCount(totalClients)
      setTotalEngineersCount(totalEngineers)
      setRecentActivities(logsRes.data?.data?.content ?? [])
    } catch (err) {
      console.error('Dashboard load error', err)
      setError(err?.response?.data?.message ?? t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [t])

  // Compute live project status breakdown from real projects list
  const projectMetrics = useMemo(() => {
    let active = 0
    let completed = 0
    let paused = 0
    let delivered = 0

    if (allProjects.length > 0) {
      allProjects.forEach((p) => {
        const s = String(p.overallStatus || '').toUpperCase()
        if (s === 'ACTIVE' || s === 'IN_PROGRESS') active++
        else if (s === 'COMPLETED') completed++
        else if (s === 'PAUSED') paused++
        else if (s === 'DELIVERED') delivered++
        else active++ // default to active if unknown
      })
    } else if (dashboardSummary) {
      active = dashboardSummary.activeProjects ?? 0
      completed = dashboardSummary.completedProjects ?? 0
      paused = dashboardSummary.pausedProjects ?? 0
      delivered = dashboardSummary.deliveredProjects ?? 0
    }

    const total = totalProjectsCount || (active + completed + paused + delivered) || 0

    return {
      total,
      active,
      completed,
      paused,
      delivered,
      segments: [
        {
          key: 'ACTIVE',
          label: t('dashboard.active_projects', 'Active Projects'),
          count: active,
          color: '#B8860B', // Luxury Gold / Amber
          hoverColor: '#D4AF37',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dotBg: 'bg-amber-500',
        },
        {
          key: 'COMPLETED',
          label: t('dashboard.completed_projects', 'Completed Projects'),
          count: completed,
          color: '#556B2F', // Olive / Forest Green
          hoverColor: '#6B8E23',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dotBg: 'bg-emerald-600',
        },
        {
          key: 'DELIVERED',
          label: t('dashboard.delivered_projects', 'Delivered Projects'),
          count: delivered,
          color: '#7C5C43', // Warm Luxury Brown
          hoverColor: '#936D50',
          bg: 'bg-warm-brown/10 text-warm-brown border-warm-brown/20',
          dotBg: 'bg-warm-brown',
        },
        {
          key: 'PAUSED',
          label: t('dashboard.paused_projects', 'Paused Projects'),
          count: paused,
          color: '#9CA3AF', // Neutral Slate Gray
          hoverColor: '#6B7280',
          bg: 'bg-gray-100 text-gray-700 border-gray-200',
          dotBg: 'bg-gray-400',
        },
      ],
    }
  }, [allProjects, dashboardSummary, totalProjectsCount, t])

  // EXACT 5 KPI CARDS REQUESTED
  const FIVE_KPIS = [
    {
      key: 'total_projects',
      label: t('dashboard.total_projects', 'Total Projects'),
      value: projectMetrics.total,
      color: 'warm-brown',
      to: '/admin/projects',
      icon: <FolderStackIcon />,
    },
    {
      key: 'total_active',
      label: t('dashboard.active_projects', 'Active Projects'),
      value: projectMetrics.active,
      color: 'gold',
      to: '/admin/projects',
      icon: <ProjectActiveIcon />,
    },
    {
      key: 'total_complete',
      label: t('dashboard.completed_projects', 'Completed Projects'),
      value: projectMetrics.completed,
      color: 'emerald',
      to: '/admin/projects',
      icon: <CheckCircleIcon />,
    },
    {
      key: 'total_client',
      label: t('dashboard.total_clients', 'Total Clients'),
      value: totalClientsCount,
      color: 'olive',
      to: '/admin/users',
      icon: <ClientsIcon />,
    },
    {
      key: 'total_engineer',
      label: t('dashboard.total_engineers', 'Total Engineers'),
      value: totalEngineersCount,
      color: 'indigo',
      to: '/admin/users',
      icon: <EngineersIcon />,
    },
  ]

  // Recent 5 projects from list
  const recentProjects = allProjects.slice(0, 5)

  return (
    <div className="animate-slide-up space-y-6 pb-8">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <span>{t('dashboard.title', 'Executive Dashboard')}</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ● Live System
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {t('dashboard.subtitle', 'Real-time project operations, performance KPIs, and system analytics')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <ProjectWizard onSuccess={fetchDashboardData} />
          <Link
            to="/admin/projects"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all"
          >
            {t('dashboard.view_all_projects', 'View All Projects')} →
          </Link>
        </div>
      </div>

      {/* Error banner */}
      <Alert message={error} variant="error" onClose={() => setError(null)} />

      {/* ── EXACT 5 KPI STAT CARDS ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {FIVE_KPIS.map((card) => (
          <StatCard
            key={card.key}
            icon={card.icon}
            label={card.label}
            value={card.value}
            color={card.color}
            loading={loading}
            to={card.to}
          />
        ))}
      </div>

      {/* ── Live Active Project Lifecycle Donut Chart ────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {t('dashboard.project_breakdown_title', 'Project Lifecycle Distribution')}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('dashboard.project_breakdown_desc', 'Breakdown of finishing projects across operational stages')}
            </p>
          </div>
          <Link
            to="/admin/projects"
            className="text-xs font-semibold text-warm-brown hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            {t('dashboard.view_all', 'View All')} →
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Donut Chart Visualization */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center py-4">
            <div className="relative w-52 h-52 flex items-center justify-center">
              <DonutSvg
                segments={projectMetrics.segments}
                total={projectMetrics.total}
                activeSegment={activeDonutSegment}
                onHoverSegment={setActiveDonutSegment}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-4xl font-black text-gray-900 tabular-nums tracking-tight">
                  {projectMetrics.total}
                </span>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-0.5">
                  {t('dashboard.total_projects', 'Projects')}
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Bars & Details */}
          <div className="lg:col-span-7 space-y-3.5">
            {projectMetrics.segments.map((seg) => {
              const percent = projectMetrics.total > 0
                ? Math.round((seg.count / projectMetrics.total) * 100)
                : 0
              const isHovered = activeDonutSegment === seg.key

              return (
                <div
                  key={seg.key}
                  onMouseEnter={() => setActiveDonutSegment(seg.key)}
                  onMouseLeave={() => setActiveDonutSegment(null)}
                  onClick={() => navigate('/admin/projects')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isHovered
                      ? 'bg-gray-50/90 border-warm-brown/40 shadow-sm scale-[1.01]'
                      : 'border-gray-100 bg-gray-50/40 hover:bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="text-sm font-semibold text-gray-800">
                        {seg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 tabular-nums">
                        {seg.count}
                      </span>
                      <span className="text-xs font-semibold text-gray-400 tabular-nums w-12 text-end">
                        ({percent}%)
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Progress Bar */}
                  <div className="h-2 w-full rounded-full bg-gray-200/80 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: seg.color,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom Grid: Recent Projects & Activity Stream ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Active Projects */}
        <div className="lg:col-span-7 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3.5 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {t('dashboard.recent_projects_title', 'Recent Active Projects')}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t('dashboard.recent_projects_desc', 'Latest construction finishing projects and progress')}
                </p>
              </div>
              <Link
                to="/admin/projects"
                className="text-xs font-semibold text-warm-brown hover:underline flex-shrink-0"
              >
                {t('dashboard.view_all', 'View All')} →
              </Link>
            </div>

            {recentProjects.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                {t('dashboard.no_projects', 'No active projects available.')}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentProjects.map((project) => {
                  const pName = isRtl
                    ? (project.nameAr || project.nameEn)
                    : (project.nameEn || project.nameAr)
                  const progress = Number(project.overallProgressPercentage || 0)

                  return (
                    <div
                      key={project.projectId}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-gray-50/80 -mx-3 px-3 rounded-xl transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/projects/${project.projectId}`}
                            className="text-sm font-semibold text-gray-900 hover:text-warm-brown truncate"
                          >
                            {pName}
                          </Link>
                          <StatusPill status={project.overallStatus} t={t} />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {project.clientName ? `Client: ${project.clientName}` : ''}
                          {project.engineerName ? ` • Eng: ${project.engineerName}` : ''}
                        </p>
                      </div>

                      {/* Progress Bar & Target Date */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="w-28 space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-medium text-gray-600">
                            <span>{t('dashboard.progress', 'Progress')}</span>
                            <span className="font-bold text-gray-900">{progress}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-warm-brown to-amber-600 rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <Link
                          to={`/admin/projects/${project.projectId}`}
                          className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:text-warm-brown hover:border-warm-brown/40 hover:bg-white shadow-2xs transition-all"
                        >
                          {t('common.view', 'View')}
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3.5 border-t border-gray-100 text-end">
            <Link
              to="/admin/projects"
              className="text-xs font-semibold text-warm-brown hover:text-warm-brown/80"
            >
              {t('projects.manage_all', 'Manage all projects')} →
            </Link>
          </div>
        </div>

        {/* Right: Live System Activity Stream */}
        <div className="lg:col-span-5 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3.5 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {t('dashboard.recent_activity_title', 'System Activity Stream')}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t('dashboard.recent_activity_desc', 'Live audit trail of administrative events')}
                </p>
              </div>
              <Link
                to="/admin/activity-logs"
                className="text-xs font-semibold text-warm-brown hover:underline flex-shrink-0"
              >
                {t('dashboard.view_all', 'View All')} →
              </Link>
            </div>

            {recentActivities.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                {t('dashboard.no_activity', 'No recent activity logs recorded.')}
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((log) => {
                  const id = log.logId ?? log.id ?? Math.random()
                  const time = formatShortTime(log.createdAt)
                  const actionType = log.actionType ?? 'LOG'

                  return (
                    <div
                      key={id}
                      className="flex items-start gap-3 p-2.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors text-xs"
                    >
                      <ActionBadge action={actionType} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                          {log.userName || log.username || 'System User'}
                          <span className="font-normal text-gray-500 ms-1.5">
                            {log.details || log.entityName || actionType}
                          </span>
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {time} {log.ipAddress ? `• ${log.ipAddress}` : ''}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3.5 border-t border-gray-100 text-end">
            <Link
              to="/admin/activity-logs"
              className="text-xs font-semibold text-warm-brown hover:text-warm-brown/80"
            >
              {t('activity_logs.view_all_logs', 'Open full audit logs')} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Interactive SVG Donut Chart with SVG Segments
 */
function DonutSvg({ segments = [], total = 0, activeSegment, onHoverSegment }) {
  const radius = 68
  const strokeWidth = 20
  const circumference = 2 * Math.PI * radius

  if (!total || total === 0) {
    return (
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 180 180">
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="transparent"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
      </svg>
    )
  }

  let accumulatedLength = 0

  return (
    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 180 180">
      <circle
        cx="90"
        cy="90"
        r={radius}
        fill="transparent"
        stroke="#F3F4F6"
        strokeWidth={strokeWidth}
      />
      {segments.map((seg) => {
        if (seg.count <= 0) return null
        const segLength = (seg.count / total) * circumference
        const offset = -accumulatedLength
        accumulatedLength += segLength

        const isHovered = activeSegment === seg.key

        return (
          <circle
            key={seg.key}
            cx="90"
            cy="90"
            r={radius}
            fill="transparent"
            stroke={seg.color}
            strokeWidth={isHovered ? strokeWidth + 5 : strokeWidth}
            strokeDasharray={`${segLength} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="butt"
            onMouseEnter={() => onHoverSegment?.(seg.key)}
            onMouseLeave={() => onHoverSegment?.(null)}
            className="transition-all duration-300 cursor-pointer"
          />
        )
      })}
    </svg>
  )
}

function StatusPill({ status = '', t }) {
  const map = {
    ACTIVE: 'bg-amber-50 text-amber-800 border-amber-200',
    COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    PAUSED: 'bg-gray-100 text-gray-700 border-gray-200',
    DELIVERED: 'bg-warm-brown/10 text-warm-brown border-warm-brown/20',
  }

  const cls = map[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${cls}`}>
      {t(`projects.status_${status.toLowerCase()}`, { defaultValue: status })}
    </span>
  )
}

function ActionBadge({ action = '' }) {
  const colors = {
    CREATE: 'bg-emerald-100 text-emerald-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
    LOGIN_SUCCESS: 'bg-violet-100 text-violet-800',
    LOGIN_FAILED: 'bg-amber-100 text-amber-800',
  }[action] ?? 'bg-gray-100 text-gray-700'

  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${colors}`}>
      {action.replace('_', ' ')}
    </span>
  )
}

function formatShortTime(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateStr
  }
}

/* ── Inline Icons ────────────────────────────────────────── */
function FolderStackIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25A2.25 2.25 0 0 0 4.5 16.5h15a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
    </svg>
  )
}

function ProjectActiveIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function ClientsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}

function EngineersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l5.653-4.655m5.8-5.8.35-.35A3.12 3.12 0 1 1 17.22 8.4l-.35.35m-5.8 5.8 5.8-5.8" />
    </svg>
  )
}
