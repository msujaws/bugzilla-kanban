import { describe, it, expect, beforeEach, vi } from 'vitest'
import { create } from 'zustand'
import { createStagedSlice } from './staged-slice'
import type { StagedSlice } from './staged-slice'
import { createApiKey } from '@/types/branded'

const testApiKey = createApiKey('test-api-key')

// Mock BugzillaClient
const mockBatchUpdateBugs = vi.fn()

vi.mock('@/lib/bugzilla/client', () => ({
  BugzillaClient: vi.fn().mockImplementation(() => ({
    batchUpdateBugs: mockBatchUpdateBugs,
  })),
}))

// Mock StatusMapper
vi.mock('@/lib/bugzilla/status-mapper', () => ({
  StatusMapper: vi.fn().mockImplementation(() => ({
    columnToStatus: vi.fn((column: string) => {
      const mapping: Record<string, string> = {
        backlog: 'NEW',
        todo: 'ASSIGNED',
        'in-progress': 'IN_PROGRESS',
        'in-review': 'IN_PROGRESS',
        done: 'RESOLVED',
      }
      return mapping[column] ?? 'NEW'
    }),
  })),
}))

describe('StagedSlice', () => {
  let useStore: ReturnType<typeof create<StagedSlice>>

  beforeEach(() => {
    vi.clearAllMocks()
    mockBatchUpdateBugs.mockResolvedValue({ successful: [], failed: [] })

    useStore = create<StagedSlice>()((...args) => ({
      ...createStagedSlice(...args),
    }))
  })

  describe('initial state', () => {
    it('should have empty changes map initially', () => {
      const { changes } = useStore.getState()
      expect(changes.size).toBe(0)
    })

    it('should have isApplying false initially', () => {
      const { isApplying } = useStore.getState()
      expect(isApplying).toBe(false)
    })

    it('should have applyError null initially', () => {
      const { applyError } = useStore.getState()

      expect(applyError).toBeNull()
    })
  })

  describe('stageChange', () => {
    it('should add a new staged change', () => {
      const { stageChange } = useStore.getState()

      stageChange(123, 'backlog', 'todo')

      const { changes } = useStore.getState()
      expect(changes.has(123)).toBe(true)
      expect(changes.get(123)?.status).toEqual({ from: 'backlog', to: 'todo' })
    })

    it('should update existing staged change', () => {
      const { stageChange } = useStore.getState()

      stageChange(123, 'backlog', 'todo')
      stageChange(123, 'backlog', 'in-progress')

      const { changes } = useStore.getState()
      expect(changes.get(123)?.status).toEqual({ from: 'backlog', to: 'in-progress' })
    })

    it('should allow multiple bugs to be staged', () => {
      const { stageChange } = useStore.getState()

      stageChange(1, 'backlog', 'todo')
      stageChange(2, 'todo', 'in-progress')
      stageChange(3, 'in-progress', 'in-review')

      const { changes } = useStore.getState()
      expect(changes.size).toBe(3)
    })

    it('should remove change if moving back to original column', () => {
      const { stageChange } = useStore.getState()

      stageChange(123, 'backlog', 'todo')
      stageChange(123, 'backlog', 'backlog')

      const { changes } = useStore.getState()
      expect(changes.has(123)).toBe(false)
    })
  })

  describe('unstageChange', () => {
    it('should remove a staged change', () => {
      const { stageChange, unstageChange } = useStore.getState()

      stageChange(123, 'backlog', 'todo')
      unstageChange(123)

      const { changes } = useStore.getState()
      expect(changes.has(123)).toBe(false)
    })

    it('should not error when removing non-existent change', () => {
      const { unstageChange } = useStore.getState()

      expect(() => {
        unstageChange(999)
      }).not.toThrow()
    })
  })

  describe('clearAllChanges', () => {
    it('should remove all staged changes', () => {
      const { stageChange, clearAllChanges } = useStore.getState()

      stageChange(1, 'backlog', 'todo')
      stageChange(2, 'todo', 'in-progress')
      stageChange(3, 'in-progress', 'done')

      clearAllChanges()

      const { changes } = useStore.getState()
      expect(changes.size).toBe(0)
    })

    it('should clear apply error', () => {
      useStore.setState({ applyError: 'Some error' })

      const { clearAllChanges } = useStore.getState()
      clearAllChanges()

      expect(useStore.getState().applyError).toBeNull()
    })
  })

  describe('applyChanges', () => {
    it('should set isApplying to true while applying', async () => {
      const { stageChange, applyChanges } = useStore.getState()

      stageChange(123, 'backlog', 'todo')

      // Start apply but don't await
      const promise = applyChanges(testApiKey)

      const { isApplying } = useStore.getState()
      expect(isApplying).toBe(true)

      await promise
    })

    it('should set isApplying to false after applying', async () => {
      const { stageChange, applyChanges } = useStore.getState()

      stageChange(123, 'backlog', 'todo')
      await applyChanges(testApiKey)

      const { isApplying } = useStore.getState()
      expect(isApplying).toBe(false)
    })

    it('should call batchUpdateBugs with correct updates', async () => {
      mockBatchUpdateBugs.mockResolvedValueOnce({
        successful: [123, 456],
        failed: [],
      })

      const { stageChange, applyChanges } = useStore.getState()

      stageChange(123, 'backlog', 'todo')
      stageChange(456, 'todo', 'in-progress')

      await applyChanges(testApiKey)

      expect(mockBatchUpdateBugs).toHaveBeenCalledWith([
        { id: 123, status: 'ASSIGNED' },
        { id: 456, status: 'IN_PROGRESS' },
      ])
    })

    it('should clear changes on successful apply', async () => {
      mockBatchUpdateBugs.mockResolvedValueOnce({
        successful: [123],
        failed: [],
      })

      const { stageChange, applyChanges } = useStore.getState()

      stageChange(123, 'backlog', 'todo')
      await applyChanges(testApiKey)

      const { changes } = useStore.getState()
      expect(changes.size).toBe(0)
    })

    it('should keep failed changes staged', async () => {
      mockBatchUpdateBugs.mockResolvedValueOnce({
        successful: [123],
        failed: [{ id: 456, error: 'Permission denied' }],
      })

      const { stageChange, applyChanges } = useStore.getState()

      stageChange(123, 'backlog', 'todo')
      stageChange(456, 'todo', 'in-progress')

      await applyChanges(testApiKey)

      const { changes } = useStore.getState()
      expect(changes.has(123)).toBe(false)
      expect(changes.has(456)).toBe(true)
    })

    it('should set error when all changes fail', async () => {
      mockBatchUpdateBugs.mockResolvedValueOnce({
        successful: [],
        failed: [{ id: 123, error: 'Permission denied' }],
      })

      const { stageChange, applyChanges } = useStore.getState()

      stageChange(123, 'backlog', 'todo')
      await applyChanges(testApiKey)

      const { applyError } = useStore.getState()
      expect(applyError).toContain('failed')
    })

    it('should return result with success/failure counts', async () => {
      mockBatchUpdateBugs.mockResolvedValueOnce({
        successful: [123],
        failed: [{ id: 456, error: 'Error' }],
      })

      const { stageChange, applyChanges } = useStore.getState()

      stageChange(123, 'backlog', 'todo')
      stageChange(456, 'todo', 'in-progress')

      const result = await applyChanges(testApiKey)

      expect(result.successCount).toBe(1)
      expect(result.failCount).toBe(1)
    })

    it('should not call API when no changes staged', async () => {
      const { applyChanges } = useStore.getState()

      await applyChanges(testApiKey)

      expect(mockBatchUpdateBugs).not.toHaveBeenCalled()
    })

    it('should handle API errors gracefully', async () => {
      mockBatchUpdateBugs.mockRejectedValueOnce(new Error('Network error'))

      const { stageChange, applyChanges } = useStore.getState()

      stageChange(123, 'backlog', 'todo')
      await applyChanges(testApiKey)

      const { applyError, changes } = useStore.getState()
      expect(applyError).toBe('Network error')
      expect(changes.size).toBe(1) // Changes should remain
    })
  })

  describe('getChangeCount', () => {
    it('should return 0 when no changes', () => {
      const { getChangeCount } = useStore.getState()
      expect(getChangeCount()).toBe(0)
    })

    it('should return correct count', () => {
      const { stageChange, getChangeCount } = useStore.getState()

      stageChange(1, 'backlog', 'todo')
      stageChange(2, 'todo', 'in-progress')

      expect(getChangeCount()).toBe(2)
    })
  })

  describe('hasChanges', () => {
    it('should return false when no changes', () => {
      const { hasChanges } = useStore.getState()
      expect(hasChanges()).toBe(false)
    })

    it('should return true when changes exist', () => {
      const { stageChange, hasChanges } = useStore.getState()

      stageChange(123, 'backlog', 'todo')

      expect(hasChanges()).toBe(true)
    })

    it('should return true when only assignee changes exist', () => {
      const { stageAssigneeChange, hasChanges } = useStore.getState()

      stageAssigneeChange(123, 'old@example.com', 'new@example.com')

      expect(hasChanges()).toBe(true)
    })
  })

  describe('stageAssigneeChange', () => {
    it('should add a new assignee change', () => {
      const { stageAssigneeChange } = useStore.getState()

      stageAssigneeChange(123, 'old@example.com', 'new@example.com')

      const { changes } = useStore.getState()
      expect(changes.has(123)).toBe(true)
      expect(changes.get(123)?.assignee).toEqual({
        from: 'old@example.com',
        to: 'new@example.com',
      })
    })

    it('should update existing assignee change', () => {
      const { stageAssigneeChange } = useStore.getState()

      stageAssigneeChange(123, 'old@example.com', 'mid@example.com')
      stageAssigneeChange(123, 'old@example.com', 'new@example.com')

      const { changes } = useStore.getState()
      expect(changes.get(123)?.assignee).toEqual({
        from: 'old@example.com',
        to: 'new@example.com',
      })
    })

    it('should remove assignee change if moving back to original', () => {
      const { stageAssigneeChange } = useStore.getState()

      stageAssigneeChange(123, 'old@example.com', 'new@example.com')
      stageAssigneeChange(123, 'old@example.com', 'old@example.com')

      const { changes } = useStore.getState()
      expect(changes.has(123)).toBe(false)
    })

    it('should preserve status change when adding assignee change', () => {
      const { stageChange, stageAssigneeChange } = useStore.getState()

      stageChange(123, 'backlog', 'todo')
      stageAssigneeChange(123, 'old@example.com', 'new@example.com')

      const { changes } = useStore.getState()
      expect(changes.get(123)?.status).toEqual({ from: 'backlog', to: 'todo' })
      expect(changes.get(123)?.assignee).toEqual({
        from: 'old@example.com',
        to: 'new@example.com',
      })
    })

    it('should preserve assignee change when adding status change', () => {
      const { stageChange, stageAssigneeChange } = useStore.getState()

      stageAssigneeChange(123, 'old@example.com', 'new@example.com')
      stageChange(123, 'backlog', 'todo')

      const { changes } = useStore.getState()
      expect(changes.get(123)?.status).toEqual({ from: 'backlog', to: 'todo' })
      expect(changes.get(123)?.assignee).toEqual({
        from: 'old@example.com',
        to: 'new@example.com',
      })
    })

    it('should only remove assignee change when reverting assignee, keeping status', () => {
      const { stageChange, stageAssigneeChange } = useStore.getState()

      stageChange(123, 'backlog', 'todo')
      stageAssigneeChange(123, 'old@example.com', 'new@example.com')
      stageAssigneeChange(123, 'old@example.com', 'old@example.com')

      const { changes } = useStore.getState()
      expect(changes.has(123)).toBe(true)
      expect(changes.get(123)?.status).toEqual({ from: 'backlog', to: 'todo' })
      expect(changes.get(123)?.assignee).toBeUndefined()
    })
  })

  describe('applyChanges with assignee', () => {
    it('should include assignee in API call when only assignee changed', async () => {
      mockBatchUpdateBugs.mockResolvedValueOnce({
        successful: [123],
        failed: [],
      })

      const { stageAssigneeChange, applyChanges } = useStore.getState()

      stageAssigneeChange(123, 'old@example.com', 'new@example.com')
      await applyChanges(testApiKey)

      expect(mockBatchUpdateBugs).toHaveBeenCalledWith([
        { id: 123, assigned_to: 'new@example.com' },
      ])
    })

    it('should include both status and assignee in API call', async () => {
      mockBatchUpdateBugs.mockResolvedValueOnce({
        successful: [123],
        failed: [],
      })

      const { stageChange, stageAssigneeChange, applyChanges } = useStore.getState()

      stageChange(123, 'backlog', 'todo')
      stageAssigneeChange(123, 'old@example.com', 'new@example.com')
      await applyChanges(testApiKey)

      expect(mockBatchUpdateBugs).toHaveBeenCalledWith([
        { id: 123, status: 'ASSIGNED', assigned_to: 'new@example.com' },
      ])
    })

    it('should include both status and assignee when assignee changed first then column', async () => {
      mockBatchUpdateBugs.mockResolvedValueOnce({
        successful: [123],
        failed: [],
      })

      const { stageChange, stageAssigneeChange, applyChanges } = useStore.getState()

      // User first changes assignee, then drags to new column
      stageAssigneeChange(123, 'old@example.com', 'new@example.com')
      stageChange(123, 'backlog', 'todo')
      await applyChanges(testApiKey)

      expect(mockBatchUpdateBugs).toHaveBeenCalledWith([
        { id: 123, status: 'ASSIGNED', assigned_to: 'new@example.com' },
      ])
    })
  })

  describe('applyChanges with resolution', () => {
    it('should include resolution FIXED when moving to done column', async () => {
      mockBatchUpdateBugs.mockResolvedValueOnce({
        successful: [123],
        failed: [],
      })

      const { stageChange, applyChanges } = useStore.getState()

      stageChange(123, 'in-progress', 'done')
      await applyChanges(testApiKey)

      expect(mockBatchUpdateBugs).toHaveBeenCalledWith([
        { id: 123, status: 'RESOLVED', resolution: 'FIXED' },
      ])
    })

    it('should not include resolution when moving to non-done column', async () => {
      mockBatchUpdateBugs.mockResolvedValueOnce({
        successful: [123],
        failed: [],
      })

      const { stageChange, applyChanges } = useStore.getState()

      stageChange(123, 'backlog', 'in-progress')
      await applyChanges(testApiKey)

      expect(mockBatchUpdateBugs).toHaveBeenCalledWith([{ id: 123, status: 'IN_PROGRESS' }])
    })
  })

  describe('getChangeCount with mixed changes', () => {
    it('should count bugs with only assignee changes', () => {
      const { stageAssigneeChange, getChangeCount } = useStore.getState()

      stageAssigneeChange(1, 'a@x.com', 'b@x.com')
      stageAssigneeChange(2, 'c@x.com', 'd@x.com')

      expect(getChangeCount()).toBe(2)
    })

    it('should count bug once when it has both status and assignee changes', () => {
      const { stageChange, stageAssigneeChange, getChangeCount } = useStore.getState()

      stageChange(123, 'backlog', 'todo')
      stageAssigneeChange(123, 'a@x.com', 'b@x.com')

      expect(getChangeCount()).toBe(1)
    })
  })

  describe('stageWhiteboardChange', () => {
    it('should add a new whiteboard change', () => {
      const { stageWhiteboardChange } = useStore.getState()

      stageWhiteboardChange(123, '[old-tag]', '[old-tag] [bzkanban-sprint]')

      const { changes } = useStore.getState()
      expect(changes.has(123)).toBe(true)
      expect(changes.get(123)?.whiteboard).toEqual({
        from: '[old-tag]',
        to: '[old-tag] [bzkanban-sprint]',
      })
    })

    it('should update existing whiteboard change', () => {
      const { stageWhiteboardChange } = useStore.getState()

      stageWhiteboardChange(123, '', '[bzkanban-sprint]')
      stageWhiteboardChange(123, '', '[bzkanban-sprint] [other]')

      const { changes } = useStore.getState()
      expect(changes.get(123)?.whiteboard).toEqual({
        from: '',
        to: '[bzkanban-sprint] [other]',
      })
    })

    it('should remove whiteboard change if reverting to original', () => {
      const { stageWhiteboardChange } = useStore.getState()

      stageWhiteboardChange(123, '[tag]', '[tag] [bzkanban-sprint]')
      stageWhiteboardChange(123, '[tag]', '[tag]')

      const { changes } = useStore.getState()
      expect(changes.has(123)).toBe(false)
    })

    it('should preserve other changes when adding whiteboard change', () => {
      const { stageChange, stageWhiteboardChange } = useStore.getState()

      stageChange(123, 'backlog', 'todo')
      stageWhiteboardChange(123, '', '[bzkanban-sprint]')

      const { changes } = useStore.getState()
      expect(changes.get(123)?.status).toEqual({ from: 'backlog', to: 'todo' })
      expect(changes.get(123)?.whiteboard).toEqual({ from: '', to: '[bzkanban-sprint]' })
    })

    it('should only remove whiteboard when reverting, keeping other changes', () => {
      const { stageChange, stageWhiteboardChange } = useStore.getState()

      stageChange(123, 'backlog', 'todo')
      stageWhiteboardChange(123, '', '[bzkanban-sprint]')
      stageWhiteboardChange(123, '', '')

      const { changes } = useStore.getState()
      expect(changes.has(123)).toBe(true)
      expect(changes.get(123)?.status).toEqual({ from: 'backlog', to: 'todo' })
      expect(changes.get(123)?.whiteboard).toBeUndefined()
    })
  })

  describe('stagePointsChange', () => {
    it('should add a new points change', () => {
      const { stagePointsChange } = useStore.getState()

      stagePointsChange(123, 3, 5)

      const { changes } = useStore.getState()
      expect(changes.has(123)).toBe(true)
      expect(changes.get(123)?.points).toEqual({ from: 3, to: 5 })
    })

    it('should handle string points values', () => {
      const { stagePointsChange } = useStore.getState()

      stagePointsChange(123, '?', '5')

      const { changes } = useStore.getState()
      expect(changes.get(123)?.points).toEqual({ from: '?', to: '5' })
    })

    it('should handle undefined to value', () => {
      const { stagePointsChange } = useStore.getState()

      stagePointsChange(123, undefined, 3)

      const { changes } = useStore.getState()
      expect(changes.get(123)?.points).toEqual({ from: undefined, to: 3 })
    })

    it('should remove points change if reverting to original', () => {
      const { stagePointsChange } = useStore.getState()

      stagePointsChange(123, 3, 5)
      stagePointsChange(123, 3, 3)

      const { changes } = useStore.getState()
      expect(changes.has(123)).toBe(false)
    })

    it('should preserve other changes when adding points change', () => {
      const { stageAssigneeChange, stagePointsChange } = useStore.getState()

      stageAssigneeChange(123, 'a@x.com', 'b@x.com')
      stagePointsChange(123, 1, 5)

      const { changes } = useStore.getState()
      expect(changes.get(123)?.assignee).toEqual({ from: 'a@x.com', to: 'b@x.com' })
      expect(changes.get(123)?.points).toEqual({ from: 1, to: 5 })
    })
  })

  describe('stagePriorityChange', () => {
    it('should add a new priority change', () => {
      const { stagePriorityChange } = useStore.getState()

      stagePriorityChange(123, 'P3', 'P1')

      const { changes } = useStore.getState()
      expect(changes.has(123)).toBe(true)
      expect(changes.get(123)?.priority).toEqual({ from: 'P3', to: 'P1' })
    })

    it('should remove priority change if reverting to original', () => {
      const { stagePriorityChange } = useStore.getState()

      stagePriorityChange(123, 'P3', 'P1')
      stagePriorityChange(123, 'P3', 'P3')

      const { changes } = useStore.getState()
      expect(changes.has(123)).toBe(false)
    })

    it('should preserve other changes when adding priority change', () => {
      const { stageChange, stagePriorityChange } = useStore.getState()

      stageChange(123, 'backlog', 'todo')
      stagePriorityChange(123, 'P5', 'P2')

      const { changes } = useStore.getState()
      expect(changes.get(123)?.status).toEqual({ from: 'backlog', to: 'todo' })
      expect(changes.get(123)?.priority).toEqual({ from: 'P5', to: 'P2' })
    })
  })

  describe('applyChanges with new fields', () => {
    it('should include whiteboard in API call', async () => {
      mockBatchUpdateBugs.mockResolvedValueOnce({
        successful: [123],
        failed: [],
      })

      const { stageWhiteboardChange, applyChanges } = useStore.getState()

      stageWhiteboardChange(123, '[old]', '[old] [bzkanban-sprint]')
      await applyChanges(testApiKey)

      expect(mockBatchUpdateBugs).toHaveBeenCalledWith([
        { id: 123, whiteboard: '[old] [bzkanban-sprint]' },
      ])
    })

    it('should include cf_fx_points in API call', async () => {
      mockBatchUpdateBugs.mockResolvedValueOnce({
        successful: [123],
        failed: [],
      })

      const { stagePointsChange, applyChanges } = useStore.getState()

      stagePointsChange(123, 3, 8)
      await applyChanges(testApiKey)

      expect(mockBatchUpdateBugs).toHaveBeenCalledWith([{ id: 123, cf_fx_points: 8 }])
    })

    it('should include priority in API call', async () => {
      mockBatchUpdateBugs.mockResolvedValueOnce({
        successful: [123],
        failed: [],
      })

      const { stagePriorityChange, applyChanges } = useStore.getState()

      stagePriorityChange(123, 'P3', 'P1')
      await applyChanges(testApiKey)

      expect(mockBatchUpdateBugs).toHaveBeenCalledWith([{ id: 123, priority: 'P1' }])
    })

    it('should include all new fields together', async () => {
      mockBatchUpdateBugs.mockResolvedValueOnce({
        successful: [123],
        failed: [],
      })

      const { stageWhiteboardChange, stagePointsChange, stagePriorityChange, applyChanges } =
        useStore.getState()

      stageWhiteboardChange(123, '', '[sprint]')
      stagePointsChange(123, 1, 5)
      stagePriorityChange(123, 'P3', 'P2')
      await applyChanges(testApiKey)

      expect(mockBatchUpdateBugs).toHaveBeenCalledWith([
        { id: 123, whiteboard: '[sprint]', cf_fx_points: 5, priority: 'P2' },
      ])
    })

    it('should include all fields when combined with status and assignee', async () => {
      mockBatchUpdateBugs.mockResolvedValueOnce({
        successful: [123],
        failed: [],
      })

      const {
        stageChange,
        stageAssigneeChange,
        stageWhiteboardChange,
        stagePointsChange,
        stagePriorityChange,
        applyChanges,
      } = useStore.getState()

      stageChange(123, 'backlog', 'todo')
      stageAssigneeChange(123, 'a@x.com', 'b@x.com')
      stageWhiteboardChange(123, '', '[sprint]')
      stagePointsChange(123, 1, 5)
      stagePriorityChange(123, 'P3', 'P2')
      await applyChanges(testApiKey)

      expect(mockBatchUpdateBugs).toHaveBeenCalledWith([
        {
          id: 123,
          status: 'ASSIGNED',
          assigned_to: 'b@x.com',
          whiteboard: '[sprint]',
          cf_fx_points: 5,
          priority: 'P2',
        },
      ])
    })
  })

  describe('stageQeVerifyChange', () => {
    it('should add a new qe-verify change', () => {
      const { stageQeVerifyChange } = useStore.getState()

      stageQeVerifyChange(123, 'unknown', 'plus')

      const { changes } = useStore.getState()
      expect(changes.has(123)).toBe(true)
      expect(changes.get(123)?.qeVerify).toEqual({ from: 'unknown', to: 'plus' })
    })

    it('should update existing qe-verify change', () => {
      const { stageQeVerifyChange } = useStore.getState()

      stageQeVerifyChange(123, 'unknown', 'minus')
      stageQeVerifyChange(123, 'unknown', 'plus')

      const { changes } = useStore.getState()
      expect(changes.get(123)?.qeVerify).toEqual({ from: 'unknown', to: 'plus' })
    })

    it('should remove qe-verify change if reverting to original', () => {
      const { stageQeVerifyChange } = useStore.getState()

      stageQeVerifyChange(123, 'unknown', 'plus')
      stageQeVerifyChange(123, 'unknown', 'unknown')

      const { changes } = useStore.getState()
      expect(changes.has(123)).toBe(false)
    })

    it('should preserve other changes when adding qe-verify change', () => {
      const { stageChange, stageQeVerifyChange } = useStore.getState()

      stageChange(123, 'backlog', 'todo')
      stageQeVerifyChange(123, 'unknown', 'minus')

      const { changes } = useStore.getState()
      expect(changes.get(123)?.status).toEqual({ from: 'backlog', to: 'todo' })
      expect(changes.get(123)?.qeVerify).toEqual({ from: 'unknown', to: 'minus' })
    })

    it('should only remove qe-verify change when reverting, keeping other changes', () => {
      const { stagePriorityChange, stageQeVerifyChange } = useStore.getState()

      stagePriorityChange(123, 'P3', 'P1')
      stageQeVerifyChange(123, 'unknown', 'plus')
      stageQeVerifyChange(123, 'unknown', 'unknown')

      const { changes } = useStore.getState()
      expect(changes.has(123)).toBe(true)
      expect(changes.get(123)?.priority).toEqual({ from: 'P3', to: 'P1' })
      expect(changes.get(123)?.qeVerify).toBeUndefined()
    })
  })

  describe('applyChanges with qe-verify', () => {
    it('should include flags in API call for qe-verify plus', async () => {
      mockBatchUpdateBugs.mockResolvedValueOnce({
        successful: [123],
        failed: [],
      })

      const { stageQeVerifyChange, applyChanges } = useStore.getState()

      stageQeVerifyChange(123, 'unknown', 'plus')
      await applyChanges(testApiKey)

      expect(mockBatchUpdateBugs).toHaveBeenCalledWith([
        { id: 123, flags: [{ name: 'qe-verify', status: '+' }] },
      ])
    })

    it('should include flags in API call for qe-verify minus', async () => {
      mockBatchUpdateBugs.mockResolvedValueOnce({
        successful: [123],
        failed: [],
      })

      const { stageQeVerifyChange, applyChanges } = useStore.getState()

      stageQeVerifyChange(123, 'plus', 'minus')
      await applyChanges(testApiKey)

      expect(mockBatchUpdateBugs).toHaveBeenCalledWith([
        { id: 123, flags: [{ name: 'qe-verify', status: '-' }] },
      ])
    })

    it('should include flags with X status when removing qe-verify flag', async () => {
      mockBatchUpdateBugs.mockResolvedValueOnce({
        successful: [123],
        failed: [],
      })

      const { stageQeVerifyChange, applyChanges } = useStore.getState()

      stageQeVerifyChange(123, 'plus', 'unknown')
      await applyChanges(testApiKey)

      expect(mockBatchUpdateBugs).toHaveBeenCalledWith([
        { id: 123, flags: [{ name: 'qe-verify', status: 'X' }] },
      ])
    })

    it('should include qe-verify with other field changes', async () => {
      mockBatchUpdateBugs.mockResolvedValueOnce({
        successful: [123],
        failed: [],
      })

      const { stagePriorityChange, stageQeVerifyChange, applyChanges } = useStore.getState()

      stagePriorityChange(123, 'P3', 'P1')
      stageQeVerifyChange(123, 'unknown', 'plus')
      await applyChanges(testApiKey)

      expect(mockBatchUpdateBugs).toHaveBeenCalledWith([
        { id: 123, priority: 'P1', flags: [{ name: 'qe-verify', status: '+' }] },
      ])
    })
  })
})
