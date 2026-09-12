import axios from 'axios'
import useAuthStore from '@/store/authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

/**
 * Axios instance for all API calls.
 *
 * Request interceptor:
 *   Attaches "Authorization: Bearer <accessToken>" to every request
 *   when an accessToken is present in the store.
 *
 * Response interceptor:
 *   On 401 Unauthorized for authenticated routes:
 *     1. Calls POST /api/v1/auth/refresh-token with the stored refreshToken.
 *     2. On success: stores new tokens and retries the original request once.
 *     3. On failure: clears auth state and rejects the error.
 *   Auth routes (login, forgot-password, etc.) pass 401 directly to the caller
 *   so the UI can display error messages without unwanted page reloads/redirects.
 */

let isRefreshing = false
let failedQueue = []

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  failedQueue = []
}

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// ── Request interceptor ──────────────────────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState()
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor ─────────────────────────────────────
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Auth endpoints (login, forgot password, reset password) should NEVER trigger refresh loops or auto-redirects
    const isAuthEndpoint =
      originalRequest?.url?.includes('/api/v1/auth/login') ||
      originalRequest?.url?.includes('/api/v1/auth/forgot-password') ||
      originalRequest?.url?.includes('/api/v1/auth/reset-password') ||
      originalRequest?.url?.includes('/api/v1/auth/refresh-token')

    // Only handle 401 for authenticated endpoints once per request
    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue subsequent 401s while a refresh is in-flight
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
            return axiosClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const { refreshToken, setTokens, clearAuth } = useAuthStore.getState()

      if (!refreshToken) {
        clearAuth()
        return Promise.reject(error)
      }

      try {
        // Use plain axios call to avoid interceptor recursion
        const { data } = await axios.post(
          `${BASE_URL}/api/v1/auth/refresh-token`,
          { refreshToken }
        )
        const { accessToken: newAccess, refreshToken: newRefresh } = data.data

        setTokens(newAccess, newRefresh)
        processQueue(null, newAccess)

        originalRequest.headers['Authorization'] = `Bearer ${newAccess}`
        return axiosClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearAuth()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default axiosClient
