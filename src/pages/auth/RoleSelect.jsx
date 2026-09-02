import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthLayout from '@/components/auth/AuthLayout'

const roles = [
  {
    key: 'admin',
    path: '/login/admin',
    icon: AdminIcon,
    gradient: 'from-brand-600 to-brand-800',
    borderColor: 'border-brand-500/40',
    hoverBorder: 'hover:border-brand-500',
    glowClass: 'hover:shadow-glow-indigo',
  },
  {
    key: 'engineer',
    path: '/login/engineer',
    icon: EngineerIcon,
    gradient: 'from-cyan-600 to-cyan-900',
    borderColor: 'border-cyan-700/40',
    hoverBorder: 'hover:border-cyan-500',
    glowClass: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]',
  },
  {
    key: 'client',
    path: '/login/client',
    icon: ClientIcon,
    gradient: 'from-emerald-600 to-emerald-900',
    borderColor: 'border-emerald-700/40',
    hoverBorder: 'hover:border-emerald-500',
    glowClass: 'hover:shadow-glow-emerald',
  },
]

export default function RoleSelect() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <AuthLayout>
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-2">
          {t('role.select_title')}
        </h2>
        <p className="text-slate-400 text-sm">
          {t('role.select_subtitle')}
        </p>
      </div>

      {/* Role cards */}
      <div className="flex flex-col gap-4">
        {roles.map(({ key, path, icon: Icon, gradient, borderColor, hoverBorder, glowClass }) => (
          <button
            key={key}
            id={`role-card-${key}`}
            onClick={() => navigate(path)}
            className={`group w-full glass-card p-5
              flex items-center gap-5 text-left
              border ${borderColor} ${hoverBorder} ${glowClass}
              transition-all duration-300 cursor-pointer
              hover:translate-y-[-2px] active:translate-y-0`}
          >
            {/* Icon container */}
            <div className={`flex-shrink-0 w-14 h-14 rounded-xl
              bg-gradient-to-br ${gradient}
              flex items-center justify-center
              shadow-md transition-transform duration-300 group-hover:scale-105`}>
              <Icon className="w-7 h-7 text-white" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-base">
                {t(`role.${key}`)}
              </p>
              <p className="text-slate-500 text-sm mt-0.5 truncate">
                {t(`role.${key}_desc`)}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 text-slate-600 group-hover:text-slate-300
              transition-all duration-200 group-hover:translate-x-1 rtl:group-hover:translate-x-[-4px]">
              <ChevronRight className="w-5 h-5 rtl:rotate-180" />
            </div>
          </button>
        ))}
      </div>
    </AuthLayout>
  )
}

/* ── Inline Icons ─────────────────────────────────────────────── */

function AdminIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  )
}

function EngineerIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l5.653-4.655m5.8-5.8.35-.35A3.12 3.12 0 1 1 17.22 8.4l-.35.35m-5.8 5.8 5.8-5.8" />
    </svg>
  )
}

function ClientIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}

function ChevronRight({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  )
}
