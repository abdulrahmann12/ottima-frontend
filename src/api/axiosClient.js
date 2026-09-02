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
 *   On 401 Unauthorized:
 *     1. Calls POST /api/v1/auth/refresh-token with the stored refreshToken.
 *     2. On success: stores new tokens and retries the original request once.
 *     3. On failure: clears the auth store and redirects to /.
 *   All other errors are passed through.
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

    // Only handle 401 once per request (avoid infinite loop)
    if (error.response?.status === 401 && !originalRequest._retry) {
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
        window.location.href = '/'
        return Promise.reject(error)
      }

      try {
        // Use a plain axios call to avoid interceptor recursion
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
        window.location.href = '/'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default axiosClient
