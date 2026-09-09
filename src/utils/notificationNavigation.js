/**
 * getNotificationRoute — Dynamic Navigation Helper
 *
 * Maps referenceType, referenceId, and userRole to exact React Router paths.
 *
 * @param {string} referenceType ReferenceType enum ('PROJECT', 'DAILY_UPDATE', 'COMMENT', 'TICKET', 'FINANCIAL_RECORD', etc.)
 * @param {string|number} referenceId Target entity UUID / ID
 * @param {string} userRole Current user role ('ADMIN', 'ENGINEER', 'CLIENT')
 * @returns {string} Target route URL for navigate()
 */
export function getNotificationRoute(referenceType, referenceId, userRole) {
  const role = (userRole || 'ADMIN').toLowerCase()
  const refType = (referenceType || '').toUpperCase()

  // Base prefix: /admin, /engineer, or /client
  const basePrefix = `/${role}`

  switch (refType) {
    case 'PROJECT':
      return referenceId ? `${basePrefix}/projects/${referenceId}` : `${basePrefix}/projects`

    case 'DAILY_UPDATE':
      if (role === 'client') {
        return referenceId ? `/client/items/${referenceId}/daily-updates` : '/client/projects'
      }
      return referenceId ? `${basePrefix}/daily-updates?highlight=${referenceId}` : `${basePrefix}/daily-updates`

    case 'COMMENT':
      if (role === 'client') {
        return referenceId ? `/client/items/${referenceId}/daily-updates` : '/client/projects'
      }
      return referenceId ? `${basePrefix}/daily-updates?highlight=${referenceId}` : `${basePrefix}/daily-updates`

    case 'TICKET':
      return referenceId ? `${basePrefix}/projects?ticketId=${referenceId}` : `${basePrefix}/projects`

    case 'FINANCIAL_RECORD':
    case 'FINANCIAL':
    case 'FINANCE':
      return `${basePrefix}/finance`

    case 'USER':
      return role === 'admin' ? '/admin/users' : `/${role}/profile`

    default:
      if (role === 'admin') return '/admin/dashboard'
      if (role === 'engineer') return '/engineer/projects'
      if (role === 'client') return '/client/projects'
      return '/'
  }
}
