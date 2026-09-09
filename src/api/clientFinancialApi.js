import axiosClient from './axiosClient'

// All client financial endpoints are scoped under:
// /api/v1/client/projects/{projectId}/...
const clientProjectBase = (projectId) => `/api/v1/client/projects/${projectId}`

// ─── Summary ─────────────────────────────────────────────────

/**
 * Fetch the financial summary for a project (total paid, total spent, balance).
 *
 * GET /api/v1/client/projects/{projectId}/financial-summary
 *
 * Response data shape: {
 *   totalPaidAmount: BigDecimal,
 *   totalPaidCount: number,
 *   totalSpentAmount: BigDecimal,
 *   totalSpentCount: number,
 *   remainingBalance: BigDecimal
 * }
 *
 * @param {string} projectId
 */
export const getClientFinancialSummary = (projectId) =>
  axiosClient.get(`${clientProjectBase(projectId)}/financial-summary`)

// ─── Invoices Gallery ─────────────────────────────────────────

/**
 * Fetch the invoices gallery for a project (paginated).
 * Returns financial records that have a documentUrl attached (receipts / invoices).
 *
 * GET /api/v1/client/projects/{projectId}/invoices
 *
 * @param {string} projectId
 * @param {number} page  - Zero-based page index.
 * @param {number} size  - Page size (use a larger value, e.g. 20, for a gallery).
 */
export const getClientInvoicesGallery = (projectId, page = 0, size = 20) =>
  axiosClient.get(`${clientProjectBase(projectId)}/invoices`, {
    params: { page, size },
  })

// ─── Financial Records ────────────────────────────────────────

/**
 * Fetch all financial records for a project (paginated).
 *
 * GET /api/v1/client/projects/{projectId}/financial-records
 *
 * @param {string} projectId
 * @param {number} page
 * @param {number} size
 */
export const getClientFinancialRecords = (projectId, page = 0, size = 10) =>
  axiosClient.get(`${clientProjectBase(projectId)}/financial-records`, {
    params: { page, size },
  })

/**
 * Fetch a single financial record by its ID.
 *
 * GET /api/v1/client/projects/{projectId}/financial-records/{financialRecordId}
 *
 * @param {string} projectId
 * @param {string} financialRecordId
 */
export const getClientFinancialRecordById = (projectId, financialRecordId) =>
  axiosClient.get(
    `${clientProjectBase(projectId)}/financial-records/${financialRecordId}`
  )

/**
 * Fetch records filtered by type (DEPOSIT or EXPENSE).
 *
 * GET /api/v1/client/projects/{projectId}/financial-records/type/{recordType}
 *
 * @param {string} projectId
 * @param {'DEPOSIT'|'EXPENSE'} recordType
 * @param {number} page
 * @param {number} size
 */
export const getClientRecordsByType = (projectId, recordType, page = 0, size = 10) =>
  axiosClient.get(
    `${clientProjectBase(projectId)}/financial-records/type/${recordType}`,
    { params: { page, size } }
  )
