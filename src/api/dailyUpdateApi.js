import axiosClient from './axiosClient'

export const getDailyUpdateById = (dailyUpdateId) =>
  axiosClient.get(`/api/v1/daily-updates/${dailyUpdateId}`)
