import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthLayout from '@/components/auth/AuthLayout'

const roles = [
  {
    key: 'admin',
    path: '/login/admin',
    icon: AdminIcon,
    bgIcon: 'bg-warm-brown text-white',
    hoverBorder: 'hover:border-warm-brown',
  },
  {
    key: 'engineer',
    path: '/login/engineer',
    icon: EngineerIcon,
    bgIcon: 'bg-[#4A5D4E] text-white',
    hoverBorder: 'hover:border-[#4A5D4E]',
  },
  {
    key: 'client',
    path: '/login/client',
    icon: ClientIcon,
    bgIcon: 'bg-[#8C6D53] text-white',
    hoverBorder: 'hover:border-[#8C6D53]',
  },
]

export default function RoleSelect() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <AuthLayout>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
          {t('role.select_title')}
        </h2>
        <p className="text-gray-600 text-sm">
          {t('role.select_subtitle')}
        </p>
      </div>

      {/* Role cards */}
      <div className="flex flex-col gap-3.5">
        {roles.map(({ key, path, icon: Icon, bgIcon, hoverBorder }) => (
          <button
            key={key}
            id={`role-card-${key}`}
            onClick={() => navigate(path)}
            className={`group w-full p-4 sm:p-5 rounded-2xl
              bg-cream/40 hover:bg-light-blue/20 border border-gray-200
              flex items-center gap-4 sm:gap-5 text-left rtl:text-right
              ${hoverBorder}
              transition-all duration-200 cursor-pointer
              hover:shadow-sm hover:translate-y-[-1px] active:translate-y-0`}
          >
            {/* Icon container */}
            <div className={`flex-shrink-0 w-12 h-12 sm:w-13 sm:h-13 rounded-xl
              ${bgIcon}
              flex items-center justify-center
              shadow-sm transition-transform duration-200 group-hover:scale-105`}>
              <Icon className="w-6 h-6" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 font-bold text-base group-hover:text-warm-brown transition-colors">
                {t(`role.${key}`)}
              </p>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5 truncate">
                {t(`role.${key}_desc`)}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 text-gray-400 group-hover:text-warm-brown
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

