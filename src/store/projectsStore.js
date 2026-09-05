import { create } from 'zustand'

/**
 * Projects Module Store — centralises complex UI state across all 3 role dashboards.
 *
 * Wizard (Admin Create):
 *   wizardOpen       — modal visibility
 *   wizardStep       — 1 (metadata form) | 2 (assign items form)
 *   createdProjectId — set after Step 1 POST succeeds; used for Step 2 POST
 *   selectedItems    — accumulated item DTOs for Step 2
 *
 * Engineer:
 *   engineerTab      — 'all' (GET /engineer/projects) | 'assigned' (GET /engineer/projects/assigned)
 *
 * Pagination (per role):
 *   adminPage / engineerPage / clientPage — 0-indexed current page
 */
const useProjectsStore = create((set, get) => ({
  // ── Wizard ────────────────────────────────────────────────
  wizardOpen: false,
  wizardStep: 1,
  createdProjectId: null,
  selectedItems: [],

  openWizard: () =>
    set({ wizardOpen: true, wizardStep: 1, createdProjectId: null, selectedItems: [] }),
  closeWizard: () =>
    set({ wizardOpen: false, wizardStep: 1, createdProjectId: null, selectedItems: [] }),
  advanceToStep2: (projectId) => set({ createdProjectId: projectId, wizardStep: 2 }),

  addSelectedItem: (item) => {
    const current = get().selectedItems
    if (current.some((i) => i.standardItemId === item.standardItemId)) return
    set({ selectedItems: [...current, item] })
  },
  removeSelectedItem: (standardItemId) =>
    set({ selectedItems: get().selectedItems.filter((i) => i.standardItemId !== standardItemId) }),

  // ── Engineer tab ──────────────────────────────────────────
  engineerTab: 'assigned',
  setEngineerTab: (tab) => set({ engineerTab: tab, engineerPage: 0 }),

  // ── Pagination ────────────────────────────────────────────
  adminPage: 0,
  engineerPage: 0,
  clientPage: 0,
  setAdminPage: (page) => set({ adminPage: page }),
  setEngineerPage: (page) => set({ engineerPage: page }),
  setClientPage: (page) => set({ clientPage: page }),
}))

export default useProjectsStore
