import { ProfileIcon, ProjectsIcon } from '@/components/admin/AdminSidebar'
import RolePortalLayout from '@/pages/shared/RolePortalLayout'
import { useTranslation } from 'react-i18next'

const NAV_ITEMS = [
  {
    key: 'projects',
    to: '/client/projects',
    icon: ProjectsIcon,
  },
  {
    key: 'profile',
    to: '/client/profile',
    icon: ProfileIcon,
  },
]

export default function ClientLayout() {
  const { t } = useTranslation()

  return (
    <RolePortalLayout
      requiredRole="CLIENT"
      loginPath="/login/client"
      navItems={NAV_ITEMS}
      panelSubtitle={t('portal.client')}
      pageTitleResolver={(pathname) => {
        if (pathname.includes('/daily-updates')) return 'nav.daily_updates'
        if (pathname.startsWith('/client/projects')) return 'nav.projects'
        if (pathname.startsWith('/client/profile')) return 'nav.profile'
        return 'nav.projects'
      }}
    />
  )
}

