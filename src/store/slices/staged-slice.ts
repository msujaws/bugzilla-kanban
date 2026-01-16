/* eslint-disable unicorn/no-null */
// Null is required for error state that can be absent

import type { StateCreator } from 'zustand'
import { BugzillaClient } from '@/lib/bugzilla/client'
import { StatusMapper } from '@/lib/bugzilla/status-mapper'
import type { BugUpdate } from '@/lib/bugzilla/types'
import type { QeVerifyStatus } from '@/lib/bugzilla/qe-verify'
import type { ApiKey } from '@/types/branded'
import { DEFAULT_BUGZILLA_URL } from '@/types/branded'

const statusMapper = new StatusMapper()

export interface StagedChange {
  status?: { from: string; to: string }
  assignee?: { from: string; to: string }
  whiteboard?: { from: string; to: string }
  points?: { from: number | string | undefined; to: number | string | undefined }
  priority?: { from: string; to: string }
  severity?: { from: string; to: string }
  qeVerify?: { from: QeVerifyStatus; to: QeVerifyStatus }
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
  stageAssigneeChange: (bugId: number, fromAssignee: string, toAssignee: string) => void
  stageWhiteboardChange: (bugId: number, fromWhiteboard: string, toWhiteboard: string) => void
  stagePointsChange: (
    bugId: number,
    fromPoints: number | string | undefined,
    toPoints: number | string | undefined,
  ) => void
  stagePriorityChange: (bugId: number, fromPriority: string, toPriority: string) => void
  stageSeverityChange: (bugId: number, fromSeverity: string, toSeverity: string) => void
  stageQeVerifyChange: (bugId: number, fromStatus: QeVerifyStatus, toStatus: QeVerifyStatus) => void
  unstageChange: (bugId: number) => void
  clearAllChanges: () => void
  applyChanges: (apiKey: ApiKey) => Promise<ApplyResult>
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
      const existing = newChanges.get(bugId)

      // Preserve the original column from any existing staged change
      const originalColumn = existing?.status?.from ?? fromColumn

      // If moving back to original column, remove the status change
      if (originalColumn === toColumn) {
        if (existing) {
          const { status: _removed, ...rest } = existing
          // Check if there are other changes remaining
          if (Object.keys(rest).length > 0) {
            newChanges.set(bugId, rest)
          } else {
            newChanges.delete(bugId)
          }
        }
      } else {
        // Add/update status change, preserve other changes if exist
        newChanges.set(bugId, {
          ...existing,
          status: { from: originalColumn, to: toColumn },
        })
      }

      return { changes: newChanges }
    })
  },

  // Stage an assignee change for a bug
  stageAssigneeChange: (bugId: number, fromAssignee: string, toAssignee: string) => {
    set((state) => {
      const newChanges = new Map(state.changes)
      const existing = newChanges.get(bugId)

      // If moving back to original assignee, remove the assignee change
      if (fromAssignee === toAssignee) {
        if (existing?.status) {
          // Keep status change, remove assignee
          newChanges.set(bugId, { status: existing.status })
        } else {
          // No other changes, remove the bug entry
          newChanges.delete(bugId)
        }
      } else {
        // Add/update assignee change, preserve status if exists
        newChanges.set(bugId, {
          ...existing,
          assignee: { from: fromAssignee, to: toAssignee },
        })
      }

      return { changes: newChanges }
    })
  },

  // Stage a whiteboard change for a bug
  stageWhiteboardChange: (bugId: number, fromWhiteboard: string, toWhiteboard: string) => {
    set((state) => {
      const newChanges = new Map(state.changes)
      const existing = newChanges.get(bugId)

      // If moving back to original whiteboard, remove the whiteboard change
      if (fromWhiteboard === toWhiteboard) {
        if (existing) {
          const { whiteboard: _removed, ...rest } = existing
          // Check if there are other changes remaining
          if (Object.keys(rest).length > 0) {
            newChanges.set(bugId, rest)
          } else {
            newChanges.delete(bugId)
          }
        }
      } else {
        // Add/update whiteboard change, preserve other changes
        newChanges.set(bugId, {
          ...existing,
          whiteboard: { from: fromWhiteboard, to: toWhiteboard },
        })
      }

      return { changes: newChanges }
    })
  },

  // Stage a points change for a bug
  stagePointsChange: (
    bugId: number,
    fromPoints: number | string | undefined,
    toPoints: number | string | undefined,
  ) => {
    set((state) => {
      const newChanges = new Map(state.changes)
      const existing = newChanges.get(bugId)

      // If moving back to original points, remove the points change
      if (fromPoints === toPoints) {
        if (existing) {
          const { points: _removed, ...rest } = existing
          // Check if there are other changes remaining
          if (Object.keys(rest).length > 0) {
            newChanges.set(bugId, rest)
          } else {
            newChanges.delete(bugId)
          }
        }
      } else {
        // Add/update points change, preserve other changes
        newChanges.set(bugId, {
          ...existing,
          points: { from: fromPoints, to: toPoints },
        })
      }

      return { changes: newChanges }
    })
  },

  // Stage a priority change for a bug
  stagePriorityChange: (bugId: number, fromPriority: string, toPriority: string) => {
    set((state) => {
      const newChanges = new Map(state.changes)
      const existing = newChanges.get(bugId)

      // If moving back to original priority, remove the priority change
      if (fromPriority === toPriority) {
        if (existing) {
          const { priority: _removed, ...rest } = existing
          // Check if there are other changes remaining
          if (Object.keys(rest).length > 0) {
            newChanges.set(bugId, rest)
          } else {
            newChanges.delete(bugId)
          }
        }
      } else {
        // Add/update priority change, preserve other changes
        newChanges.set(bugId, {
          ...existing,
          priority: { from: fromPriority, to: toPriority },
        })
      }

      return { changes: newChanges }
    })
  },

  // Stage a severity change for a bug
  stageSeverityChange: (bugId: number, fromSeverity: string, toSeverity: string) => {
    set((state) => {
      const newChanges = new Map(state.changes)
      const existing = newChanges.get(bugId)

      // If moving back to original severity, remove the severity change
      if (fromSeverity === toSeverity) {
        if (existing) {
          const { severity: _removed, ...rest } = existing
          // Check if there are other changes remaining
          if (Object.keys(rest).length > 0) {
            newChanges.set(bugId, rest)
          } else {
            newChanges.delete(bugId)
          }
        }
      } else {
        // Add/update severity change, preserve other changes
        newChanges.set(bugId, {
          ...existing,
          severity: { from: fromSeverity, to: toSeverity },
        })
      }

      return { changes: newChanges }
    })
  },

  // Stage a qe-verify change for a bug
  stageQeVerifyChange: (bugId: number, fromStatus: QeVerifyStatus, toStatus: QeVerifyStatus) => {
    set((state) => {
      const newChanges = new Map(state.changes)
      const existing = newChanges.get(bugId)

      // If moving back to original status, remove the qeVerify change
      if (fromStatus === toStatus) {
        if (existing) {
          const { qeVerify: _removed, ...rest } = existing
          // Check if there are other changes remaining
          if (Object.keys(rest).length > 0) {
            newChanges.set(bugId, rest)
          } else {
            newChanges.delete(bugId)
          }
        }
      } else {
        // Add/update qeVerify change, preserve other changes
        newChanges.set(bugId, {
          ...existing,
          qeVerify: { from: fromStatus, to: toStatus },
        })
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
  applyChanges: async (apiKey: ApiKey): Promise<ApplyResult> => {
    const { changes } = get()

    if (changes.size === 0) {
      return { successCount: 0, failCount: 0 }
    }

    set({ isApplying: true, applyError: null })

    try {
      const client = new BugzillaClient(apiKey, DEFAULT_BUGZILLA_URL)

      // Convert staged changes to bug updates
      const updates: BugUpdate[] = []
      for (const [bugId, change] of changes) {
        const update: BugUpdate = { id: bugId }

        if (change.status) {
          update.status = statusMapper.columnToStatus(change.status.to)
          // RESOLVED status requires a resolution
          if (update.status === 'RESOLVED') {
            update.resolution = 'FIXED'
          }
        }

        if (change.assignee) {
          update.assigned_to = change.assignee.to
        }

        if (change.whiteboard) {
          update.whiteboard = change.whiteboard.to
        }

        if (change.points) {
          update.cf_fx_points = change.points.to
        }

        if (change.priority) {
          update.priority = change.priority.to
        }

        if (change.severity) {
          update.severity = change.severity.to
        }

        if (change.qeVerify) {
          // Convert QeVerifyStatus to flag status
          // plus -> '+', minus -> '-', unknown -> 'X' (remove flag)
          const flagStatus =
            change.qeVerify.to === 'plus' ? '+' : change.qeVerify.to === 'minus' ? '-' : 'X'
          update.flags = [{ name: 'qe-verify', status: flagStatus }]
        }

        updates.push(update)
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
