/* eslint-disable unicorn/no-null */
// Null is required for filter state that can be absent

import type { StateCreator } from 'zustand'
import { BugzillaClient } from '@/lib/bugzilla/client'
import type { BugzillaBug, BugFilters } from '@/lib/bugzilla/types'

const BUGZILLA_BASE_URL = 'https://bugzilla.mozilla.org/rest'

export interface BugsFilters {
  whiteboardTag: string | null
  component: string | null
}

export interface BugsSlice {
  // State
  bugs: BugzillaBug[]
  isLoading: boolean
  error: string | null
  filters: BugsFilters
  apiKey: string | null

  // Actions
  fetchBugs: (apiKey: string) => Promise<void>
  refreshBugs: () => Promise<void>
  setFilters: (filters: Partial<BugsFilters>) => void
  clearBugs: () => void
  getBugById: (id: number) => BugzillaBug | undefined
}

export const createBugsSlice: StateCreator<BugsSlice> = (set, get) => ({
  // Initial state
  bugs: [],
  isLoading: false,
  error: null,
  filters: {
    whiteboardTag: null,
    component: null,
  },
  apiKey: null,

  // Fetch bugs from Bugzilla API
  fetchBugs: async (apiKey: string) => {
    set({ isLoading: true, error: null, apiKey })

    try {
      const client = new BugzillaClient(BUGZILLA_BASE_URL, apiKey)
      const { filters } = get()

      const bugFilters: BugFilters = {}
      if (filters.whiteboardTag) {
        bugFilters.whiteboardTag = filters.whiteboardTag
      }
      if (filters.component) {
        bugFilters.component = filters.component
      }

      const bugs = await client.getBugs(bugFilters)
      set({ bugs, isLoading: false, error: null })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set({ bugs: [], isLoading: false, error: errorMessage })
    }
  },

  // Refresh bugs with current filters and stored API key
  refreshBugs: async () => {
    const { apiKey, fetchBugs } = get()

    if (!apiKey) {
      return
    }

    await fetchBugs(apiKey)
  },

  // Update filters
  setFilters: (newFilters: Partial<BugsFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }))
  },

  // Clear all bugs and error
  clearBugs: () => {
    set({ bugs: [], error: null })
  },

  // Get a bug by ID
  getBugById: (id: number) => {
    const { bugs } = get()
    return bugs.find((bug) => bug.id === id)
  },
})
