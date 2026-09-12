import { resolveCommentContext } from '@/api/clientCommentApi'
import { resolveDailyUpdateContext } from '@/api/clientDailyUpdateApi'

/**
 * NotificationNavigator.js — Intelligent Notification Routing Resolver
 *
 * Resolves exact URL routes and deep-link query parameters for each role (ADMIN, ENGINEER, CLIENT)
 * and ReferenceType ('PROJECT', 'DAILY_UPDATE', 'COMMENT', 'FINANCIAL', 'FINANCIAL_RECORD', 'TICKET', 'USER').
 */

/**
 * Computes synchronous target URL for a notification click
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
          return '/client/projects'

        case 'COMMENT':
          return '/client/projects'

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

/**
 * High-precision async routing resolver with context discovery
 * Resolves accurate parent project/item hierarchy for nested Client views
 */
export async function resolveAndNavigateNotification(notification, userRole, navigate) {
  if (!notification || !navigate) return

  const role = (userRole || 'ADMIN').toUpperCase()
  const refType = (notification.referenceType || '').toUpperCase()
  const refId = notification.referenceId != null ? String(notification.referenceId).trim() : ''

  if (role === 'CLIENT') {
    if (refType === 'COMMENT' && refId) {
      try {
        const res = await resolveCommentContext(refId)
        const ctx = res.data?.data || res.data || {}
        if (ctx.projectItemId) {
          navigate(`/client/items/${ctx.projectItemId}/daily-updates?targetCommentId=${refId}`, {
            state: {
              projectId: ctx.projectId,
              projectNameAr: ctx.projectNameAr,
              projectNameEn: ctx.projectNameEn,
              itemNameAr: ctx.itemNameAr,
              itemNameEn: ctx.itemNameEn,
            },
          })
          return
        }
      } catch (err) {
        console.warn('Could not resolve comment context for client navigation:', err)
      }
      navigate('/client/projects')
      return
    }

    if (refType === 'DAILY_UPDATE' && refId) {
      try {
        const res = await resolveDailyUpdateContext(refId)
        const ctx = res.data?.data || res.data || {}
        if (ctx.projectItemId) {
          navigate(`/client/items/${ctx.projectItemId}/daily-updates?targetUpdateId=${refId}`, {
            state: {
              projectId: ctx.projectId,
              projectNameAr: ctx.projectNameAr,
              projectNameEn: ctx.projectNameEn,
              itemNameAr: ctx.itemNameAr,
              itemNameEn: ctx.itemNameEn,
            },
          })
          return
        }
      } catch (err) {
        console.warn('Could not resolve daily update context for client navigation:', err)
      }
      navigate('/client/projects')
      return
    }
  }

  // Fallback to standard synchronous route computation
  const directRoute = getNotificationRoute(refType, refId, role)
  if (directRoute) {
    navigate(directRoute)
  }
}
