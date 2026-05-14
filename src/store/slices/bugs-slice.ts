/* eslint-disable unicorn/no-null */
// Null is required for filter state that can be absent

import type { StateCreator } from 'zustand'
import { BugzillaClient } from '@/lib/bugzilla/client'
import type { BugzillaBug, BugFilters } from '@/lib/bugzilla/types'
import { filterMetaBugs } from '@/lib/bugzilla/meta-filter'
import { hasSprintTag } from '@/lib/bugzilla/sprint-tag'
import type { SortOrder } from '@/lib/bugzilla/sort-bugs'
import type { ApiKey } from '@/types/branded'
import { DEFAULT_BUGZILLA_URL } from '@/types/branded'
import {
  getCurrentBetaVersion,
  getBetaStatusField,
  getBetaTrackingField,
} from '@/lib/firefox/beta-version'
import {
  getCurrentNightlyVersion,
  UNSCHEDULED,
  isCycleVersion,
  type NightlyCycleFilter,
} from '@/lib/firefox/nightly-version'
import { BLANK_MILESTONE, getMilestoneCandidatesForCycle } from '@/lib/bugzilla/target-milestone'

const RESOLVED_QUERY_LIMIT = 1000

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
  /**
   * Selected Nightly cycle filter. Used to scope the target_milestone filter.
   * A FirefoxBetaVersion narrows to that cycle, `ALL_RELEASES` clears the filter,
   * and `UNSCHEDULED` shows only bugs with a blank milestone.
   */
  nightlyVersion?: NightlyCycleFilter
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
    nightlyVersion: getCurrentNightlyVersion(),
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
      if (isCycleVersion(filters.nightlyVersion)) {
        bugFilters.targetMilestones = getMilestoneCandidatesForCycle(filters.nightlyVersion)
      } else if (filters.nightlyVersion === UNSCHEDULED) {
        bugFilters.targetMilestones = [BLANK_MILESTONE]
      }
      // ALL_RELEASES (or undefined) — no target_milestone filter.
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

      // Query 3: Backlog bugs — NEW/UNCONFIRMED, never filtered by cycle so the
      // backlog surfaces work from every release.
      // We drop targetMilestones from the base filters for this query.
      const { targetMilestones: _milestonesForBacklog, ...baseFiltersWithoutMilestone } = bugFilters
      const backlogFilters: BugFilters = {
        ...baseFiltersWithoutMilestone,
        status: ['UNCONFIRMED', 'NEW'],
      }

      const [openBugs, resolvedBugs, backlogQueryBugs] = await Promise.all([
        client.getBugs(openFilters),
        client.getBugs(resolvedFilters),
        client.getBugs(backlogFilters),
      ])

      // Only keep bugs from the backlog query that would actually land in the
      // backlog column (no sprint tag). Bugs that would land in TODO from
      // other cycles must not pollute the current cycle's columns.
      const extraBacklogBugs = backlogQueryBugs.filter((bug) => !hasSprintTag(bug.whiteboard))

      const isTruncated = resolvedBugs.length >= RESOLVED_QUERY_LIMIT
      // Deduplicate in case a bug appears in multiple result sets
      const seenIds = new Set<number>()
      const allBugs: BugzillaBug[] = []
      for (const bug of [...openBugs, ...resolvedBugs, ...extraBacklogBugs]) {
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
