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
        'in-review': 'RESOLVED',
        done: 'VERIFIED',
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
      expect(changes.get(123)).toEqual({ from: 'backlog', to: 'todo' })
    })

    it('should update existing staged change', () => {
      const { stageChange } = useStore.getState()

      stageChange(123, 'backlog', 'todo')
      stageChange(123, 'backlog', 'in-progress')

      const { changes } = useStore.getState()
      expect(changes.get(123)).toEqual({ from: 'backlog', to: 'in-progress' })
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
  })
})
