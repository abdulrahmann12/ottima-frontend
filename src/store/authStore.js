import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import i18n from '@/i18n/i18n'

/**
 * Helper to synchronize application language with user's preferred language.
 * Sets i18n active language, updates <html> dir and lang attributes, and localStorage.
 */
export function syncLanguageWithUser(preferredLanguage) {
  const lang = (preferredLanguage === 'ar' || preferredLanguage === 'en') ? preferredLanguage : null
  if (!lang) return

  if (i18n.language !== lang) {
    i18n.changeLanguage(lang)
  }
  try {
    localStorage.setItem('i18nextLng', lang)
  } catch {}
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
  document.documentElement.setAttribute('lang', lang)
}

/**
 * OTTIMA Auth Store
 *
 * Persisted to localStorage via zustand/middleware.
 * Stores access/refresh tokens, user profile, role, and auto-syncs preferred language.
 */
const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      role: null,
      user: null,
      isAuthenticated: false,

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),

      setRole: (role) => set({ role }),

      setUser: (user) => {
        if (user?.preferredLanguage) {
          syncLanguageWithUser(user.preferredLanguage)
        }
        set({ user })
      },

      updateUserLanguage: (lang) => {
        if (lang === 'ar' || lang === 'en') {
          syncLanguageWithUser(lang)
          set((state) => ({
            user: state.user ? { ...state.user, preferredLanguage: lang } : null,
          }))
        }
      },

      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          role: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'ottima-auth',
      storage: createJSONStorage(() => localStorage),
      // Persist auth tokens, role, and user profile
      partialize: (state) => ({
        accessToken:     state.accessToken,
        refreshToken:    state.refreshToken,
        role:            state.role,
        user:            state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.user?.preferredLanguage) {
          syncLanguageWithUser(state.user.preferredLanguage)
        }
      },
    }
  )
)

export default useAuthStore
