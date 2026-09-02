import axiosClient from './axiosClient'

/**
 * Standard Items API — all endpoints at /api/v1/standard-items
 *
 * StandardItemRequest:  { nameAr*, nameEn*, descriptionAr, descriptionEn, defaultSequence }
 * StandardItemResponse: { itemId, nameAr, nameEn, descriptionAr, descriptionEn, defaultSequence, createdAt, updatedAt }
 *
 * List response is Spring Data Page: { content[], totalElements, totalPages, number, size }
 *
 * Role: ADMIN (write), any authenticated user (read)
 */

// GET /api/v1/standard-items?search=&page=0&size=10
export const getAllStandardItems = (search = '', page = 0, size = 10) => {
  const params = { page, size }
  if (search && search.trim()) params.search = search.trim()
  return axiosClient.get('/api/v1/standard-items', { params })
}

// GET /api/v1/standard-items/{itemId}
export const getStandardItemById = (itemId) =>
  axiosClient.get(`/api/v1/standard-items/${itemId}`)

// POST /api/v1/standard-items
export const createStandardItem = (data) =>
  axiosClient.post('/api/v1/standard-items', data)

// PUT /api/v1/standard-items/{itemId}
export const updateStandardItem = (itemId, data) =>
  axiosClient.put(`/api/v1/standard-items/${itemId}`, data)

// DELETE /api/v1/standard-items/{itemId}
export const deleteStandardItem = (itemId) =>
  axiosClient.delete(`/api/v1/standard-items/${itemId}`)
