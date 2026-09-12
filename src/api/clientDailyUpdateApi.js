import axiosClient from './axiosClient'

const clientBase = '/api/v1/client/items'

export const getClientDailyUpdates = (projectItemId, page = 0, size = 10) =>
  axiosClient.get(`${clientBase}/${projectItemId}/daily-updates`, {
    params: { page, size },
  })

/**
 * Resolve projectItemId and projectId context for a dailyUpdateId (client view).
 * @param {number|string} dailyUpdateId
 */
export const resolveDailyUpdateContext = (dailyUpdateId) =>
  axiosClient.get(`/api/v1/client/daily-updates/${dailyUpdateId}/context`)