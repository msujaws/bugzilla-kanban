/* eslint-disable unicorn/no-null */
// Null is required for filter state that can be absent

import type { StateCreator } from 'zustand'
import { BugzillaClient } from '@/lib/bugzilla/client'
import type { BugzillaBug, BugFilters } from '@/lib/bugzilla/types'
import type { ApiKey } from '@/types/branded'
import { DEFAULT_BUGZILLA_URL } from '@/types/branded'

export interface BugsFilters {
  whiteboardTag: string
  component: string
}

export interface BugsSlice {
  // State
  bugs: BugzillaBug[]
  isLoading: boolean
  error: string | null
  filters: BugsFilters
  lastApiKey: ApiKey | null

  // Actions
  fetchBugs: (apiKey: ApiKey) => Promise<void>
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
    whiteboardTag: '',
    component: '',
  },
  lastApiKey: null,

  // Fetch bugs from Bugzilla API
  fetchBugs: async (apiKey: ApiKey) => {
    set({ isLoading: true, error: null, lastApiKey: apiKey })

    try {
      const client = new BugzillaClient(apiKey, DEFAULT_BUGZILLA_URL)
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
    const { lastApiKey, fetchBugs } = get()

    if (!lastApiKey) {
      return
    }

    await fetchBugs(lastApiKey)
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
