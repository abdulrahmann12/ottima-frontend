import axiosClient from './axiosClient'

/**
 * Project Global Chat API — Admin & Assigned Engineers Communication Channel
 * 
 * Base endpoint: /api/v1/projects/{projectId}/chat
 */

export const getProjectChatMessages = (projectId, page = 0, size = 50) =>
  axiosClient.get(`/api/v1/projects/${projectId}/chat`, {
    params: { page, size, sort: 'createdAt,asc' },
  })

export const sendProjectChatMessage = (projectId, data) =>
  axiosClient.post(`/api/v1/projects/${projectId}/chat`, data)

export const forwardClientCommentToChat = (projectId, data) =>
  axiosClient.post(`/api/v1/projects/${projectId}/chat/forward-client-comment`, data)
