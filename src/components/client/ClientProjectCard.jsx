import { useTranslation } from 'react-i18next'

const STATUS_CONFIG = {
  COMPLETED: {
    labelAr: 'مكتمل',
    labelEn: 'Completed',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    barClass: 'bg-emerald-500',
    accentClass: 'bg-emerald-500',
  },
  IN_PROGRESS: {
    labelAr: 'قيد التنفيذ',
    labelEn: 'In Progress',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
    barClass: 'bg-[#7D583F]',
    accentClass: 'bg-[#7D583F]',
  },
  ACTIVE: {
    labelAr: 'نشط',
    labelEn: 'Active',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    barClass: 'bg-emerald-500',
    accentClass: 'bg-emerald-500',
  },
  PAUSED: {
    labelAr: 'متوقف مؤقتاً',
    labelEn: 'Paused',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
    barClass: 'bg-amber-500',
    accentClass: 'bg-amber-500',
  },
  DELIVERED: {
    labelAr: 'تم التسليم',
    labelEn: 'Delivered',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200/80',
    barClass: 'bg-teal-500',
    accentClass: 'bg-teal-500',
  },
  CANCELLED: {
    labelAr: 'ملغي',
    labelEn: 'Cancelled',
    badgeClass: 'bg-red-50 text-red-700 border-red-200/80',
    barClass: 'bg-red-500',
    accentClass: 'bg-red-500',
  },
  PENDING: {
    labelAr: 'قيد الانتظار',
    labelEn: 'Pending',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200/80',
    barClass: 'bg-gray-400',
    accentClass: 'bg-gray-400',
  },
  PLANNING: {
    labelAr: 'مرحلة التخطيط',
    labelEn: 'Planning',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
    barClass: 'bg-purple-500',
    accentClass: 'bg-purple-500',
  },
}

export default function ClientProjectCard({ project, onClick }) {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'

  const title = isRtl
    ? project.nameAr || project.nameEn
    : project.nameEn || project.nameAr
  const address = isRtl
    ? project.addressAr || project.addressEn
    : project.addressEn || project.addressAr

  const statusKey = project.overallStatus || 'PENDING'
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.PENDING
  const statusLabel = isRtl ? statusCfg.labelAr : statusCfg.labelEn

  const pct = Math.min(Math.max(Number(project.overallProgressPercentage ?? 0), 0), 100)

  // Format target date
  let formattedDate = null
  if (project.targetCompletionDate) {
    try {
      const d = new Date(project.targetCompletionDate)
      if (!Number.isNaN(d.getTime())) {
        formattedDate = new Intl.DateTimeFormat(isRtl ? 'ar-EG' : 'en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(d)
      } else {
        formattedDate = project.targetCompletionDate
      }
    } catch {
      formattedDate = project.targetCompletionDate
    }
  }

  // Format spent if available
  let formattedSpent = null
  if (project.totalCalculatedSpent != null && Number(project.totalCalculatedSpent) > 0) {
    const formattedNum = new Intl.NumberFormat(isRtl ? 'ar-EG' : 'en-US', {
      maximumFractionDigits: 0,
    }).format(project.totalCalculatedSpent)
    formattedSpent = isRtl ? `${formattedNum} ج.م` : `${formattedNum} EGP`
  }

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col justify-between bg-white rounded-2xl border border-gray-200/90 hover:border-[#7D583F]/60 p-5 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer active:scale-[0.99] overflow-hidden"
    >
      {/* Top Status Accent Bar */}
      <div className={`absolute top-0 inset-x-0 h-1.5 ${statusCfg.accentClass}`} />

      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Header Row: Status Badge & Target Date */}
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-2xs ${statusCfg.badgeClass}`}>
            {statusLabel}
          </span>

          {formattedDate && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/80 text-amber-900 text-[11px] font-semibold border border-amber-200/60 shadow-2xs">
              <svg className="w-3.5 h-3.5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5" />
              </svg>
              <span>{formattedDate}</span>
            </span>
          )}
        </div>

        {/* Project Title & Address */}
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#7D583F] transition-colors leading-snug line-clamp-1">
            {title}
          </h2>
          {address ? (
            <p className="text-xs text-gray-500 truncate mt-1 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <span className="truncate">{address}</span>
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic mt-1">
              {isRtl ? 'لا يوجد عنوان محدد' : 'No address specified'}
            </p>
          )}
        </div>

        {/* Progress Section */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">
              {t('projects.progress', { defaultValue: isRtl ? 'نسبة الإنجاز' : 'Progress' })}
            </span>
            <span className="font-bold text-gray-900 font-mono tabular-nums text-sm">
              {pct}%
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                pct >= 100
                  ? 'bg-emerald-500'
                  : pct >= 40
                  ? 'bg-gradient-to-r from-[#7D583F] to-[#A37B5C]'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Info Grid (Engineers & Spending) */}
        {(project.engineerName || formattedSpent) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-xs">
            {project.engineerName && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#F4EDE4]/50 border border-[#D9C7B8]/40 text-[#7D583F] min-w-0">
                <svg className="w-4 h-4 text-[#7D583F] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 leading-none">
                    {isRtl ? 'المهندس المشرف' : 'Assigned Engineer'}
                  </p>
                  <p className="text-xs font-bold text-gray-900 truncate mt-0.5">
                    {project.engineerName}
                  </p>
                </div>
              </div>
            )}

            {formattedSpent && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-200/60 text-gray-700 min-w-0">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6H2.25m0 0v.75c0 .414.336.75.75.75H3m1.5-1.5h15m-15 0a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15Z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 leading-none">
                    {isRtl ? 'إجمالي المنصرف' : 'Total Spent'}
                  </p>
                  <p className="text-xs font-bold text-gray-900 truncate mt-0.5 font-mono tabular-nums">
                    {formattedSpent}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Action Button */}
      <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold text-[#7D583F] group-hover:text-[#5c402d] transition-colors flex items-center gap-1.5">
          {isRtl ? 'عرض تفاصيل المشروع' : 'View Project Details'}
        </span>
        <div className="w-8 h-8 rounded-full bg-[#F4EDE4] text-[#7D583F] group-hover:bg-[#7D583F] group-hover:text-white flex items-center justify-center transition-all duration-300 transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 shadow-2xs">
          <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>
    </div>
  )
}
