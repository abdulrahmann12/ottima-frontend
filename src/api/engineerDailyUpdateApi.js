import axiosClient from './axiosClient'

const engineerBase = '/api/v1/engineer/projects'

export const createEngineerDailyUpdate = (projectId, payload) =>
  axiosClient.post(`${engineerBase}/${projectId}/daily-updates`, payload)

export const getEngineerDailyUpdates = (projectId, page = 0, size = 10, filters = {}) => {
  const params = { page, size }

  if (filters.projectItemId != null && filters.projectItemId !== '') {
    params.projectItemId = filters.projectItemId
  }

  if (filters.status?.trim()) {
    params.status = filters.status.trim()
  }

  return axiosClient.get(`${engineerBase}/${projectId}/daily-updates`, { params })
}