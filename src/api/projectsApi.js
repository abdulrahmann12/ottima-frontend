import axiosClient from './axiosClient'

const adminBase = '/api/v1/admin/projects'
const engineerBase = '/api/v1/engineer/projects'
const clientBase = '/api/v1/client/projects'

export const getAdminProjects = (page = 0, size = 10, filters = {}) => {
  const params = { page, size }

  if (filters.search?.trim()) params.search = filters.search.trim()
  if (filters.clientId != null && filters.clientId !== '') params.clientId = filters.clientId
  if (filters.engineerId != null && filters.engineerId !== '') params.engineerId = filters.engineerId
  if (typeof filters.isDeleted === 'boolean') params.isDeleted = filters.isDeleted

  return axiosClient.get(adminBase, { params })
}

export const getAdminProject = (projectId) => axiosClient.get(`${adminBase}/${projectId}`)
export const createProject = (payload) => axiosClient.post(adminBase, payload)
export const updateProject = (projectId, payload) => axiosClient.put(`${adminBase}/${projectId}`, payload)
export const deleteProject = (projectId) => axiosClient.delete(`${adminBase}/${projectId}`)
export const changeProjectStatus = (projectId, status) =>
  axiosClient.patch(`${adminBase}/${projectId}/status`, null, { params: { status } })
export const assignProjectItems = (projectId, items) =>
  axiosClient.post(`${adminBase}/${projectId}/items`, { items })
export const updateProjectItem = (projectId, itemId, payload) =>
  axiosClient.put(`${adminBase}/${projectId}/items/${itemId}`, payload)
export const removeProjectItem = (projectId, itemId) =>
  axiosClient.delete(`${adminBase}/${projectId}/items/${itemId}`)
export const updateAdminItemProgress = (projectId, itemId, payload) =>
  axiosClient.put(`${adminBase}/${projectId}/items/${itemId}/progress`, payload)

export const getEngineerProjects = (page = 0, size = 10) =>
  axiosClient.get(engineerBase, { params: { page, size } })
export const getAssignedEngineerProjects = (page = 0, size = 10) =>
  axiosClient.get(`${engineerBase}/assigned`, { params: { page, size } })
export const getEngineerProject = (projectId) => axiosClient.get(`${engineerBase}/${projectId}`)
export const updateEngineerItemProgress = (projectId, itemId, payload) =>
  axiosClient.put(`${engineerBase}/${projectId}/items/${itemId}/progress`, payload)

export const getClientProjects = (page = 0, size = 10) =>
  axiosClient.get(clientBase, { params: { page, size } })
export const getClientProject = (projectId) => axiosClient.get(`${clientBase}/${projectId}`)
