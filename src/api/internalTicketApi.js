import axiosClient from './axiosClient'

/**
 * Internal Tickets API — Admin & Engineer Internal Communication
 *
 * Base endpoint: /api/v1/internal-tickets
 * Strictly accessible by ADMIN and ENGINEER roles.
 */

export const TICKET_TYPES = ['EXPENSE', 'MEASUREMENT', 'INSTRUCTION', 'SITE_REPORT']
export const TICKET_STATUSES = ['PENDING', 'VIEWED', 'APPROVED', 'REJECTED']

/**
 * Create a new internal ticket under a specific project
 * POST /api/v1/internal-tickets/projects/{projectId}
 */
export const createTicket = (projectId, data) =>
  axiosClient.post(`/api/v1/internal-tickets/projects/${projectId}`, data)

/**
 * Update an existing internal ticket
 * PUT /api/v1/internal-tickets/{ticketId}
 */
export const updateTicket = (ticketId, data) =>
  axiosClient.put(`/api/v1/internal-tickets/${ticketId}`, data)

/**
 * Update ticket status (Approve, Reject, View)
 * PATCH /api/v1/internal-tickets/{ticketId}/status
 * @param {string} ticketId
 * @param {string} status ('PENDING' | 'VIEWED' | 'APPROVED' | 'REJECTED')
 */
export const updateTicketStatus = (ticketId, status) =>
  axiosClient.patch(`/api/v1/internal-tickets/${ticketId}/status`, { status })

/**
 * Delete a ticket
 * DELETE /api/v1/internal-tickets/{ticketId}
 */
export const deleteTicket = (ticketId) =>
  axiosClient.delete(`/api/v1/internal-tickets/${ticketId}`)

/**
 * Get ticket details by ID
 * GET /api/v1/internal-tickets/{ticketId}
 */
export const getTicketById = (ticketId) =>
  axiosClient.get(`/api/v1/internal-tickets/${ticketId}`)

/**
 * Get tickets for a specific project
 * GET /api/v1/internal-tickets/projects/{projectId}?page=0&size=100
 */
export const getTicketsByProject = (projectId, page = 0, size = 100) =>
  axiosClient.get(`/api/v1/internal-tickets/projects/${projectId}`, {
    params: { page, size, sort: 'createdAt,asc' },
  })

/**
 * Get my inbox (tickets where logged in user is receiver)
 * GET /api/v1/internal-tickets/my-inbox
 */
export const getMyInbox = (page = 0, size = 20) =>
  axiosClient.get('/api/v1/internal-tickets/my-inbox', {
    params: { page, size, sort: 'createdAt,desc' },
  })

/**
 * Get my sent requests (tickets where logged in user is sender)
 * GET /api/v1/internal-tickets/my-sent
 */
export const getMySentRequests = (page = 0, size = 20) =>
  axiosClient.get('/api/v1/internal-tickets/my-sent', {
    params: { page, size, sort: 'createdAt,desc' },
  })

/**
 * Get all tickets for a specific user (Admin only)
 * GET /api/v1/internal-tickets/users/{userId}
 */
export const getAllTicketsForSpecificUser = (userId, page = 0, size = 20) =>
  axiosClient.get(`/api/v1/internal-tickets/users/${userId}`, {
    params: { page, size, sort: 'createdAt,desc' },
  })
