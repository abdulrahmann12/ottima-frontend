/**
 * NotificationNavigator.js — Intelligent Notification Routing Resolver
 *
 * Resolves exact URL routes and deep-link query parameters for each role (ADMIN, ENGINEER, CLIENT)
 * and ReferenceType ('PROJECT', 'DAILY_UPDATE', 'COMMENT', 'FINANCIAL', 'FINANCIAL_RECORD', 'TICKET', 'USER').
 */

/**
 * Computes the target URL for a notification click
 *
 * @param {string} referenceType Backend ReferenceType enum
 * @param {string|number} referenceId Target entity UUID / ID
 * @param {string} userRole Current user role ('ADMIN', 'ENGINEER', 'CLIENT')
 * @returns {string} Target path for React Router navigate()
 */
export function getNotificationRoute(referenceType, referenceId, userRole) {
  const role = (userRole || 'ADMIN').toUpperCase()
  const refType = (referenceType || '').toUpperCase()
  const refId = referenceId != null ? String(referenceId).trim() : ''

  switch (role) {
    case 'ADMIN':
      switch (refType) {
        case 'PROJECT':
          return refId ? `/admin/projects/${refId}` : '/admin/projects'

        case 'DAILY_UPDATE':
          return refId ? `/admin/daily-updates?targetUpdateId=${refId}` : '/admin/daily-updates'

        case 'COMMENT':
          return refId ? `/admin/comments?targetCommentId=${refId}` : '/admin/comments'

        case 'FINANCIAL':
        case 'FINANCIAL_RECORD':
        case 'FINANCE':
          return refId ? `/admin/finance?targetRecordId=${refId}` : '/admin/finance'

        case 'TICKET':
          return refId ? `/admin/projects?targetTicketId=${refId}` : '/admin/projects'

        case 'USER':
          return refId ? `/admin/users?targetUserId=${refId}` : '/admin/users'

        default:
          return '/admin/dashboard'
      }

    case 'ENGINEER':
      switch (refType) {
        case 'PROJECT':
          return refId ? `/engineer/projects/${refId}` : '/engineer/projects'

        case 'DAILY_UPDATE':
          return refId ? `/engineer/daily-updates?targetUpdateId=${refId}` : '/engineer/daily-updates'

        case 'COMMENT':
          return refId ? `/engineer/daily-updates?targetCommentId=${refId}` : '/engineer/daily-updates'

        case 'FINANCIAL':
        case 'FINANCIAL_RECORD':
        case 'FINANCE':
          return '/engineer/projects'

        case 'TICKET':
          return refId ? `/engineer/projects?targetTicketId=${refId}` : '/engineer/projects'

        case 'USER':
          return '/engineer/profile'

        default:
          return '/engineer/projects'
      }

    case 'CLIENT':
      switch (refType) {
        case 'PROJECT':
          return refId ? `/client/projects/${refId}` : '/client/projects'

        case 'DAILY_UPDATE':
          return refId ? `/client/items/${refId}/daily-updates` : '/client/projects'

        case 'COMMENT':
          return refId ? `/client/items/${refId}/daily-updates` : '/client/projects'

        case 'FINANCIAL':
        case 'FINANCIAL_RECORD':
        case 'FINANCE':
          return refId ? `/client/finance?targetRecordId=${refId}` : '/client/finance'

        case 'TICKET':
          return refId ? `/client/projects?targetTicketId=${refId}` : '/client/projects'

        case 'USER':
          return '/client/profile'

        default:
          return '/client/projects'
      }

    default:
      return '/'
  }
}
