import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebouncedCallback } from './use-debounced-callback'

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should not call the callback immediately', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 300))

    result.current()

    expect(callback).not.toHaveBeenCalled()
  })

  it('should call the callback after the delay', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 300))

    result.current()

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should reset the timer on subsequent calls', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 300))

    // First call
    result.current()

    // Wait 200ms
    act(() => {
      vi.advanceTimersByTime(200)
    })

    // Second call - should reset timer
    result.current()

    // Wait another 200ms (400ms total, but only 200ms since last call)
    act(() => {
      vi.advanceTimersByTime(200)
    })

    // Should not have been called yet
    expect(callback).not.toHaveBeenCalled()

    // Wait final 100ms
    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Now should have been called
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should only call the callback once for multiple rapid calls', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 300))

    // Rapid calls
    result.current()
    result.current()
    result.current()
    result.current()

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should pass arguments to the callback', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 300))

    result.current('arg1', 'arg2')

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(callback).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('should use the latest arguments when debouncing', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 300))

    result.current('first')
    result.current('second')
    result.current('third')

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('third')
  })

  it('should cleanup timeout on unmount', () => {
    const callback = vi.fn()
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 300))

    result.current()
    unmount()

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('should return a flush function to call immediately', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 300))

    result.current('test')
    result.current.flush()

    expect(callback).toHaveBeenCalledWith('test')
  })

  it('should return a cancel function to prevent the callback', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 300))

    result.current()
    result.current.cancel()

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(callback).not.toHaveBeenCalled()
  })
})
