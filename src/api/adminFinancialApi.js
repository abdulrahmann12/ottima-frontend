import axiosClient from './axiosClient'

const adminBase = '/api/v1/admin'

// ─── Enum constants (mirrors Spring Boot enums) ───────────────
export const RECORD_TYPES    = /** @type {const} */ (['DEPOSIT', 'EXPENSE'])
export const PAYMENT_METHODS = /** @type {const} */ (['CASH', 'BANK_TRANSFER', 'INSTAPAY', 'CHEQUE'])
export const DOCUMENT_TYPES  = /** @type {const} */ (['IMAGE', 'PDF'])

// ─── Create ───────────────────────────────────────────────────

/**
 * Create a new financial record for a project.
 *
 * POST /api/v1/admin/projects/{projectId}/financial-records
 *
 * @param {string} projectId
 * @param {{
 *   projectItemId?: string,
 *   recordType: 'DEPOSIT'|'EXPENSE',
 *   amount: number,
 *   paymentMethod: 'CASH'|'BANK_TRANSFER'|'INSTAPAY'|'CHEQUE',
 *   transactionDate: string,   // ISO date "YYYY-MM-DD"
 *   documentUrl?: string,
 *   documentType?: 'IMAGE'|'PDF',
 *   notes?: string
 * }} payload
 */
export const createFinancialRecord = (projectId, payload) =>
  axiosClient.post(`${adminBase}/projects/${projectId}/financial-records`, payload)

// ─── Read ─────────────────────────────────────────────────────

/**
 * Get all financial records for a project (paginated).
 *
 * GET /api/v1/admin/projects/{projectId}/financial-records
 *
 * @param {string} projectId
 * @param {number} page  - Zero-based page index.
 * @param {number} size  - Page size.
 */
export const getAdminFinancialRecords = (projectId, page = 0, size = 10) =>
  axiosClient.get(`${adminBase}/projects/${projectId}/financial-records`, {
    params: { page, size },
  })

/**
 * Get a single financial record by its ID.
 *
 * GET /api/v1/admin/financial-records/{financialRecordId}
 *
 * @param {string} financialRecordId
 */
export const getAdminFinancialRecordById = (financialRecordId) =>
  axiosClient.get(`${adminBase}/financial-records/${financialRecordId}`)

/**
 * Get all records of a given type across all projects (global admin view).
 *
 * GET /api/v1/admin/financial-records/type/{recordType}
 *
 * @param {'DEPOSIT'|'EXPENSE'} recordType
 * @param {number} page
 * @param {number} size
 */
export const getAdminRecordsByType = (recordType, page = 0, size = 10) =>
  axiosClient.get(`${adminBase}/financial-records/type/${recordType}`, {
    params: { page, size },
  })

/**
 * Get records of a given type scoped to one project.
 *
 * GET /api/v1/admin/projects/{projectId}/financial-records/type/{recordType}
 *
 * @param {string} projectId
 * @param {'DEPOSIT'|'EXPENSE'} recordType
 * @param {number} page
 * @param {number} size
 */
export const getAdminRecordsByProjectAndType = (projectId, recordType, page = 0, size = 10) =>
  axiosClient.get(`${adminBase}/projects/${projectId}/financial-records/type/${recordType}`, {
    params: { page, size },
  })

/**
 * Get financial summary for a project (Admin).
 * Tries the dedicated summary endpoint first; if unavailable,
 * aggregates totals from project financial records.
 *
 * @param {string} projectId
 */
export const getAdminFinancialSummary = async (projectId) => {
  try {
    return await axiosClient.get(`${adminBase}/projects/${projectId}/financial-summary`)
  } catch {
    const { data } = await getAdminFinancialRecords(projectId, 0, 100)
    const records = data.data?.content ?? []
    let totalPaidAmount = 0
    let totalPaidCount = 0
    let totalSpentAmount = 0
    let totalSpentCount = 0

    for (const r of records) {
      const amt = Number(r.amount) || 0
      if (r.recordType === 'DEPOSIT') {
        totalPaidAmount += amt
        totalPaidCount++
      } else if (r.recordType === 'EXPENSE') {
        totalSpentAmount += amt
        totalSpentCount++
      }
    }

    return {
      data: {
        data: {
          totalPaidAmount,
          totalPaidCount,
          totalSpentAmount,
          totalSpentCount,
          remainingBalance: totalPaidAmount - totalSpentAmount,
        },
      },
    }
  }
}

// ─── Update ───────────────────────────────────────────────────

/**
 * Update an existing financial record.
 *
 * PUT /api/v1/admin/financial-records/{financialRecordId}
 *
 * Payload shape is identical to CreateFinancialRecordRequest.
 *
 * @param {string} financialRecordId
 * @param {object} payload
 */
export const updateFinancialRecord = (financialRecordId, payload) =>
  axiosClient.put(`${adminBase}/financial-records/${financialRecordId}`, payload)

// ─── Delete ───────────────────────────────────────────────────

/**
 * Permanently delete a financial record.
 *
 * DELETE /api/v1/admin/financial-records/{financialRecordId}
 *
 * @param {string} financialRecordId
 */
export const deleteFinancialRecord = (financialRecordId) =>
  axiosClient.delete(`${adminBase}/financial-records/${financialRecordId}`)
