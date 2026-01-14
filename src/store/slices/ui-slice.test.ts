import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createUISlice } from './ui-slice'
import type { StateCreator } from 'zustand'

describe('UISlice', () => {
  let setState: ReturnType<typeof vi.fn>
  let getState: ReturnType<typeof vi.fn>
  let slice: ReturnType<typeof createUISlice>

  beforeEach(() => {
    setState = vi.fn()
    getState = vi.fn()
    // Create the slice with mock zustand functions
    slice = createUISlice(
      setState as unknown as Parameters<StateCreator<ReturnType<typeof createUISlice>>>[0],
      getState as unknown as Parameters<StateCreator<ReturnType<typeof createUISlice>>>[1],
      {} as Parameters<StateCreator<ReturnType<typeof createUISlice>>>[2],
    )
  })

  describe('initial state', () => {
    it('should have null assignee filter by default', () => {
      expect(slice.assigneeFilter).toBeNull()
    })
  })

  describe('setAssigneeFilter', () => {
    it('should set assignee filter to an email', () => {
      slice.setAssigneeFilter('dev@mozilla.com')

      expect(setState).toHaveBeenCalledWith({ assigneeFilter: 'dev@mozilla.com' })
    })

    it('should clear assignee filter when set to null', () => {
      slice.setAssigneeFilter(null)

      expect(setState).toHaveBeenCalledWith({ assigneeFilter: null })
    })
  })
})
