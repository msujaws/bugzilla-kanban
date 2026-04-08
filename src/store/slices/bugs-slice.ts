/* eslint-disable unicorn/no-null */
// Null is required for filter state that can be absent

import type { StateCreator } from 'zustand'
import { BugzillaClient } from '@/lib/bugzilla/client'
import type { BugzillaBug, BugFilters } from '@/lib/bugzilla/types'
import { filterMetaBugs } from '@/lib/bugzilla/meta-filter'
import type { SortOrder } from '@/lib/bugzilla/sort-bugs'
import type { ApiKey } from '@/types/branded'
import { DEFAULT_BUGZILLA_URL } from '@/types/branded'
import {
  getCurrentBetaVersion,
  getBetaStatusField,
  getBetaTrackingField,
} from '@/lib/firefox/beta-version'

const RESOLVED_QUERY_LIMIT = 250

/**
 * Check if a bug is public (not in any security or confidential groups).
 * Bugs with a non-empty groups array are restricted and should be filtered out.
 */
function isPublicBug(bug: BugzillaBug): boolean {
  return !bug.groups || bug.groups.length === 0
}

export interface BugsFilters {
  whiteboardTag: string
  component: string
  sortOrder: SortOrder
}

export interface BugsSlice {
  // State
  bugs: BugzillaBug[]
  isLoading: boolean
  error: string | null
  isTruncated: boolean
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
  isTruncated: false,
  filters: {
    whiteboardTag: '',
    component: '',
    sortOrder: 'priority',
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
      // Include beta tracking flag fields if we know the current beta version
      const betaVersion = getCurrentBetaVersion()
      if (betaVersion !== undefined) {
        bugFilters.extraFields = [
          getBetaStatusField(betaVersion),
          getBetaTrackingField(betaVersion),
        ]
      }

      // Query 1: All open bugs (no limit — there shouldn't be too many)
      const openFilters: BugFilters = {
        ...bugFilters,
        status: ['UNCONFIRMED', 'NEW', 'ASSIGNED', 'REOPENED'],
      }

      // Query 2: Recently resolved/verified/closed bugs, most recent first.
      // Limited to avoid Bugzilla gateway timeouts on large components.
      const resolvedFilters: BugFilters = {
        ...bugFilters,
        status: ['RESOLVED', 'VERIFIED', 'CLOSED'],
        order: 'changeddate DESC',
        limit: RESOLVED_QUERY_LIMIT,
      }

      const [openBugs, resolvedBugs] = await Promise.all([
        client.getBugs(openFilters),
        client.getBugs(resolvedFilters),
      ])

      const isTruncated = resolvedBugs.length >= RESOLVED_QUERY_LIMIT
      // Deduplicate in case a bug appears in both results
      const seenIds = new Set<number>()
      const allBugs: BugzillaBug[] = []
      for (const bug of [...openBugs, ...resolvedBugs]) {
        if (!seenIds.has(bug.id)) {
          seenIds.add(bug.id)
          allBugs.push(bug)
        }
      }
      // Filter out security and confidential bugs (those with non-empty groups)
      const publicBugs = allBugs.filter(isPublicBug)
      // Always filter out meta bugs
      const bugs = filterMetaBugs(publicBugs, true)
      set({ bugs, isLoading: false, error: null, isTruncated })
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
