/* eslint-disable unicorn/no-null */
// Null is required for error state that can be absent

import type { StateCreator } from 'zustand'
import { BugzillaClient } from '@/lib/bugzilla/client'
import { StatusMapper } from '@/lib/bugzilla/status-mapper'
import type { BugUpdate } from '@/lib/bugzilla/types'

const BUGZILLA_BASE_URL = 'https://bugzilla.mozilla.org/rest'
const statusMapper = new StatusMapper()

export interface StagedChange {
  from: string
  to: string
}

export interface ApplyResult {
  successCount: number
  failCount: number
}

export interface StagedSlice {
  // State
  changes: Map<number, StagedChange>
  isApplying: boolean
  applyError: string | null

  // Actions
  stageChange: (bugId: number, fromColumn: string, toColumn: string) => void
  unstageChange: (bugId: number) => void
  clearAllChanges: () => void
  applyChanges: (apiKey: string) => Promise<ApplyResult>
  getChangeCount: () => number
  hasChanges: () => boolean
}

export const createStagedSlice: StateCreator<StagedSlice> = (set, get) => ({
  // Initial state
  changes: new Map(),
  isApplying: false,
  applyError: null,

  // Stage a bug move from one column to another
  stageChange: (bugId: number, fromColumn: string, toColumn: string) => {
    set((state) => {
      const newChanges = new Map(state.changes)

      // If moving back to original column, remove the change
      if (fromColumn === toColumn) {
        newChanges.delete(bugId)
      } else {
        newChanges.set(bugId, { from: fromColumn, to: toColumn })
      }

      return { changes: newChanges }
    })
  },

  // Remove a staged change
  unstageChange: (bugId: number) => {
    set((state) => {
      const newChanges = new Map(state.changes)
      newChanges.delete(bugId)
      return { changes: newChanges }
    })
  },

  // Clear all staged changes
  clearAllChanges: () => {
    set({ changes: new Map(), applyError: null })
  },

  // Apply all staged changes to Bugzilla
  applyChanges: async (apiKey: string): Promise<ApplyResult> => {
    const { changes } = get()

    if (changes.size === 0) {
      return { successCount: 0, failCount: 0 }
    }

    set({ isApplying: true, applyError: null })

    try {
      const client = new BugzillaClient(apiKey, BUGZILLA_BASE_URL)

      // Convert staged changes to bug updates
      const updates: BugUpdate[] = []
      for (const [bugId, change] of changes) {
        const status = statusMapper.columnToStatus(change.to)
        updates.push({ id: bugId, status })
      }

      const result = await client.batchUpdateBugs(updates)

      // Remove successful changes from staged
      const newChanges = new Map(changes)
      for (const successId of result.successful) {
        newChanges.delete(successId)
      }

      // Set error if any failed
      let applyError: string | null = null
      if (result.failed.length > 0) {
        applyError = `${result.failed.length.toString()} bug(s) failed to update`
      }

      set({ changes: newChanges, isApplying: false, applyError })

      return {
        successCount: result.successful.length,
        failCount: result.failed.length,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set({ isApplying: false, applyError: errorMessage })
      return { successCount: 0, failCount: get().changes.size }
    }
  },

  // Get count of staged changes
  getChangeCount: () => {
    return get().changes.size
  },

  // Check if there are any staged changes
  hasChanges: () => {
    return get().changes.size > 0
  },
})
