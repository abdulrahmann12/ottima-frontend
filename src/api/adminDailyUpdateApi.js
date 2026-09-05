import axiosClient from './axiosClient'

const adminBase = '/api/v1/admin'

export const getAdminDailyUpdates = (projectId, page = 0, size = 10, filters = {}) => {
  const params = { page, size }

  if (filters.projectItemId != null && filters.projectItemId !== '') {
    params.projectItemId = filters.projectItemId
  }

  if (filters.engineerId != null && filters.engineerId !== '') {
    params.engineerId = filters.engineerId
  }

  if (filters.status?.trim()) {
    params.status = filters.status.trim()
  }

  return axiosClient.get(`${adminBase}/projects/${projectId}/daily-updates`, { params })
}

export const evaluateAdminDailyUpdate = (dailyUpdateId, payload) =>
  axiosClient.put(`${adminBase}/daily-updates/${dailyUpdateId}/evaluate`, payload)