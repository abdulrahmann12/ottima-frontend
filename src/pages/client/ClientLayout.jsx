import { FinanceIcon, ProfileIcon, ProjectsIcon } from '@/components/admin/AdminSidebar'
import CustomerGuideModal from '@/components/client/CustomerGuideModal'
import RolePortalLayout from '@/pages/shared/RolePortalLayout'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const NAV_ITEMS = [
  {
    key: 'projects',
    to: '/client/projects',
    icon: ProjectsIcon,
  },
  {
    key: 'finance',
    to: '/client/finance',
    icon: FinanceIcon,
  },
  {
    key: 'profile',
    to: '/client/profile',
    icon: ProfileIcon,
  },
]

export default function ClientLayout() {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  const [guideOpen, setGuideOpen] = useState(false)

  useEffect(() => {
    const hasSeen = localStorage.getItem('ottima_client_guide_seen')
    if (!hasSeen) {
      setGuideOpen(true)
      localStorage.setItem('ottima_client_guide_seen', 'true')
    }
  }, [])

  return (
    <>
      <RolePortalLayout
        requiredRole="CLIENT"
        loginPath="/login/client"
        navItems={NAV_ITEMS}
        panelSubtitle={t('portal.client')}
        pageTitleResolver={(pathname) => {
          if (pathname.includes('/daily-updates')) return 'nav.daily_updates'
          if (pathname.startsWith('/client/finance')) return 'nav.finance'
          if (pathname.startsWith('/client/projects')) return 'nav.projects'
          if (pathname.startsWith('/client/profile')) return 'nav.profile'
          return 'nav.projects'
        }}
      />

      {/* Floating Customer Guide Trigger */}
      <button
        type="button"
        onClick={() => setGuideOpen(true)}
        className="fixed z-40 flex items-center justify-center gap-2 w-11 h-11 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 text-sm font-bold text-white transition-all shadow-xl bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 end-4 sm:end-6 bg-gradient-to-r from-amber-700 to-amber-900 rounded-full hover:scale-105 active:scale-95 shadow-amber-900/30 cursor-pointer"
        title={isArabic ? 'دليل استخدام المنصة' : 'Platform User Guide'}
      >
        <span className="text-base">📖</span>
        <span className="hidden sm:inline">
          {isArabic ? 'دليل العميل' : 'User Guide'}
        </span>
      </button>

      <CustomerGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
      />
    </>
  )
}


