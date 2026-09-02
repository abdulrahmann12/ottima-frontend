import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * UI Store — persisted UI preferences
 *
 * State:
 *   sidebarCollapsed  boolean  — desktop sidebar icon-only mode
 *
 * Actions:
 *   toggleSidebar()
 *   setSidebarCollapsed(val)
 */
const useUIStore = create(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),
    }),
    {
      name: 'ottima-ui',
    }
  )
)

export default useUIStore
