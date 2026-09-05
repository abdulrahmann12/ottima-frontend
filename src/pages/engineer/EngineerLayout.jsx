import { DailyUpdatesIcon, ProfileIcon, ProjectsIcon } from '@/components/admin/AdminSidebar'
import RolePortalLayout from '@/pages/shared/RolePortalLayout'
import { useTranslation } from 'react-i18next'

const NAV_ITEMS = [
  {
    key: 'projects',
    to: '/engineer/projects',
    icon: ProjectsIcon,
  },
  {
    key: 'daily_updates',
    to: '/engineer/daily-updates',
    icon: DailyUpdatesIcon,
  },
  {
    key: 'profile',
    to: '/engineer/profile',
    icon: ProfileIcon,
  },
]

export default function EngineerLayout() {
  const { t } = useTranslation()

  return (
    <RolePortalLayout
      requiredRole="ENGINEER"
      loginPath="/login/engineer"
      navItems={NAV_ITEMS}
      panelSubtitle={t('portal.engineer')}
      pageTitleResolver={(pathname) => {
        if (pathname.includes('/daily-updates')) return 'nav.daily_updates'
        if (pathname.startsWith('/engineer/projects')) return 'nav.projects'
        if (pathname.startsWith('/engineer/profile')) return 'nav.profile'
        return 'nav.projects'
      }}
    />
  )
}

