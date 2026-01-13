import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createNotificationsSlice } from './notifications-slice'
import type { StateCreator } from 'zustand'

describe('NotificationsSlice', () => {
  let setState: ReturnType<typeof vi.fn>
  let getState: ReturnType<typeof vi.fn>
  let slice: ReturnType<typeof createNotificationsSlice>

  beforeEach(() => {
    setState = vi.fn()
    getState = vi.fn()
    // Create the slice with mock zustand functions
    slice = createNotificationsSlice(
      setState as unknown as Parameters<
        StateCreator<ReturnType<typeof createNotificationsSlice>>
      >[0],
      getState as unknown as Parameters<
        StateCreator<ReturnType<typeof createNotificationsSlice>>
      >[1],
      {} as Parameters<StateCreator<ReturnType<typeof createNotificationsSlice>>>[2],
    )
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('initial state', () => {
    it('should have an empty toasts array', () => {
      expect(slice.toasts).toEqual([])
    })
  })

  describe('addToast', () => {
    it('should add a success toast with auto-dismiss', () => {
      slice.addToast('success', 'Boom! Changes applied like a boss 💥')

      expect(setState).toHaveBeenCalled()
      const setStateCall = setState.mock.calls[0]?.[0] as (state: typeof slice) => typeof slice
      const newState = setStateCall({ ...slice })

      expect(newState.toasts).toHaveLength(1)
      expect(newState.toasts[0]).toMatchObject({
        type: 'success',
        message: 'Boom! Changes applied like a boss 💥',
        dismissible: true,
        autoClose: 3000,
      })
      expect(newState.toasts[0]?.id).toBeDefined()
    })

    it('should add an info toast with auto-dismiss', () => {
      slice.addToast('info', "Bugs are loading... they're coming for you! 🐛")

      expect(setState).toHaveBeenCalled()
      const setStateCall = setState.mock.calls[0]?.[0] as (state: typeof slice) => typeof slice
      const newState = setStateCall({ ...slice })

      expect(newState.toasts).toHaveLength(1)
      expect(newState.toasts[0]).toMatchObject({
        type: 'info',
        message: "Bugs are loading... they're coming for you! 🐛",
        dismissible: true,
        autoClose: 3000,
      })
    })

    it('should add an error toast without auto-dismiss', () => {
      slice.addToast('error', "Uh oh, Bugzilla isn't feeling it right now 😅")

      expect(setState).toHaveBeenCalled()
      const setStateCall = setState.mock.calls[0]?.[0] as (state: typeof slice) => typeof slice
      const newState = setStateCall({ ...slice })

      expect(newState.toasts).toHaveLength(1)
      expect(newState.toasts[0]).toMatchObject({
        type: 'error',
        message: "Uh oh, Bugzilla isn't feeling it right now 😅",
        dismissible: true,
        autoClose: undefined, // Error toasts don't auto-dismiss
      })
    })

    it('should generate unique IDs for multiple toasts', () => {
      slice.addToast('success', 'First toast')
      slice.addToast('success', 'Second toast')

      const firstCall = setState.mock.calls[0]?.[0] as (state: typeof slice) => typeof slice
      const secondCall = setState.mock.calls[1]?.[0] as (state: typeof slice) => typeof slice

      const firstState = firstCall({ ...slice })
      const secondState = secondCall({ ...slice, toasts: firstState.toasts })

      const firstId = firstState.toasts[0]?.id
      const secondId = secondState.toasts[1]?.id

      expect(firstId).toBeDefined()
      expect(secondId).toBeDefined()
      expect(firstId).not.toBe(secondId)
    })
  })

  describe('removeToast', () => {
    it('should remove a toast by ID', () => {
      const mockToasts = [
        {
          id: 'toast-1',
          type: 'success' as const,
          message: 'Success',
          dismissible: true,
          autoClose: 3000,
        },
        {
          id: 'toast-2',
          type: 'error' as const,
          message: 'Error',
          dismissible: true,
        },
      ]

      getState.mockReturnValue({ ...slice, toasts: mockToasts })

      slice.removeToast('toast-1')

      expect(setState).toHaveBeenCalled()
      const setStateCall = setState.mock.calls[0]?.[0] as (state: typeof slice) => typeof slice
      const newState = setStateCall({ ...slice, toasts: mockToasts })

      expect(newState.toasts).toHaveLength(1)
      expect(newState.toasts[0]?.id).toBe('toast-2')
    })

    it('should handle removing non-existent toast gracefully', () => {
      const mockToasts = [
        {
          id: 'toast-1',
          type: 'success' as const,
          message: 'Success',
          dismissible: true,
          autoClose: 3000,
        },
      ]

      getState.mockReturnValue({ ...slice, toasts: mockToasts })

      slice.removeToast('non-existent-id')

      expect(setState).toHaveBeenCalled()
      const setStateCall = setState.mock.calls[0]?.[0] as (state: typeof slice) => typeof slice
      const newState = setStateCall({ ...slice, toasts: mockToasts })

      expect(newState.toasts).toHaveLength(1)
      expect(newState.toasts[0]?.id).toBe('toast-1')
    })
  })

  describe('clearAllToasts', () => {
    it('should remove all toasts', () => {
      const mockToasts = [
        {
          id: 'toast-1',
          type: 'success' as const,
          message: 'Success',
          dismissible: true,
          autoClose: 3000,
        },
        {
          id: 'toast-2',
          type: 'error' as const,
          message: 'Error',
          dismissible: true,
        },
      ]

      getState.mockReturnValue({ ...slice, toasts: mockToasts })

      slice.clearAllToasts()

      expect(setState).toHaveBeenCalled()
      const setStateArg = setState.mock.calls[0]?.[0] as
        | typeof slice
        | ((state: typeof slice) => typeof slice)

      // clearAllToasts uses set with an object directly
      const newState =
        typeof setStateArg === 'function'
          ? setStateArg({ ...slice, toasts: mockToasts })
          : setStateArg

      expect(newState.toasts).toEqual([])
    })
  })
})
