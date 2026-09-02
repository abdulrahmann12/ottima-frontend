import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * OTTIMA Auth Store
 *
 * Persisted to localStorage via zustand/middleware.
 * Stores access/refresh tokens and the user role.
 *
 * State shape:
 *   accessToken:    string | null
 *   refreshToken:   string | null
 *   role:           'ADMIN' | 'ENGINEER' | 'CLIENT' | null
 *   isAuthenticated: boolean
 *
 * Actions:
 *   setTokens(accessToken, refreshToken)  — set both tokens after login/refresh
 *   setRole(role)                         — set the user role
 *   clearAuth()                           — full logout / token clear
 */
const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      role: null,
      isAuthenticated: false,

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),

      setRole: (role) => set({ role }),

      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          role: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'ottima-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist the token fields — not ephemeral UI state
      partialize: (state) => ({
        accessToken:     state.accessToken,
        refreshToken:    state.refreshToken,
        role:            state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore
