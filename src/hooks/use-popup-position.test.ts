import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePopupPosition } from './use-popup-position'

describe('usePopupPosition', () => {
  const originalInnerWidth = window.innerWidth
  const originalInnerHeight = window.innerHeight

  beforeEach(() => {
    // Set viewport to 1000x800
    Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, writable: true })
  })

  it('returns the original position when popup fits within viewport', () => {
    const { result } = renderHook(() =>
      usePopupPosition({
        anchorPosition: { x: 100, y: 100 },
        popupWidth: 200,
        popupHeight: 300,
      }),
    )

    expect(result.current).toEqual({ x: 100, y: 100 })
  })

  it('returns undefined when anchorPosition is undefined', () => {
    const { result } = renderHook(() =>
      usePopupPosition({
        anchorPosition: undefined,
        popupWidth: 200,
        popupHeight: 300,
      }),
    )

    expect(result.current).toBeUndefined()
  })

  it('adjusts position when popup would overflow on the right', () => {
    // Popup at x=900 with width 200 would extend to 1100 (past 1000 viewport)
    const { result } = renderHook(() =>
      usePopupPosition({
        anchorPosition: { x: 900, y: 100 },
        popupWidth: 200,
        popupHeight: 300,
      }),
    )

    // Should be moved left so right edge is at viewport width - padding
    // 1000 - 8 (padding) - 200 (width) = 792
    expect(result.current?.x).toBe(792)
    expect(result.current?.y).toBe(100)
  })

  it('adjusts position when popup would overflow on the bottom', () => {
    // Popup at y=600 with height 300 would extend to 900 (past 800 viewport)
    const { result } = renderHook(() =>
      usePopupPosition({
        anchorPosition: { x: 100, y: 600 },
        popupWidth: 200,
        popupHeight: 300,
      }),
    )

    // Should be moved up so bottom edge is at viewport height - padding
    // 800 - 8 (padding) - 300 (height) = 492
    expect(result.current?.x).toBe(100)
    expect(result.current?.y).toBe(492)
  })

  it('adjusts position when popup would overflow on both right and bottom', () => {
    const { result } = renderHook(() =>
      usePopupPosition({
        anchorPosition: { x: 900, y: 600 },
        popupWidth: 200,
        popupHeight: 300,
      }),
    )

    expect(result.current?.x).toBe(792)
    expect(result.current?.y).toBe(492)
  })

  it('adjusts position when popup would overflow on the left', () => {
    // Popup at x=-50 would start before viewport
    const { result } = renderHook(() =>
      usePopupPosition({
        anchorPosition: { x: -50, y: 100 },
        popupWidth: 200,
        popupHeight: 300,
      }),
    )

    // Should be moved right so left edge is at padding
    expect(result.current?.x).toBe(8)
    expect(result.current?.y).toBe(100)
  })

  it('adjusts position when popup would overflow on the top', () => {
    // Popup at y=-50 would start before viewport
    const { result } = renderHook(() =>
      usePopupPosition({
        anchorPosition: { x: 100, y: -50 },
        popupWidth: 200,
        popupHeight: 300,
      }),
    )

    // Should be moved down so top edge is at padding
    expect(result.current?.x).toBe(100)
    expect(result.current?.y).toBe(8)
  })

  it('uses custom padding when provided', () => {
    const { result } = renderHook(() =>
      usePopupPosition({
        anchorPosition: { x: 900, y: 100 },
        popupWidth: 200,
        popupHeight: 300,
        padding: 20,
      }),
    )

    // 1000 - 20 (padding) - 200 (width) = 780
    expect(result.current?.x).toBe(780)
  })

  it('handles case where popup is larger than viewport', () => {
    // Very large popup
    const { result } = renderHook(() =>
      usePopupPosition({
        anchorPosition: { x: 500, y: 400 },
        popupWidth: 1200,
        popupHeight: 1000,
      }),
    )

    // Should position at minimum padding from edges
    expect(result.current?.x).toBe(8)
    expect(result.current?.y).toBe(8)
  })

  it('updates when anchor position changes', () => {
    const { result, rerender } = renderHook(
      ({ anchorPosition }) =>
        usePopupPosition({
          anchorPosition,
          popupWidth: 200,
          popupHeight: 300,
        }),
      { initialProps: { anchorPosition: { x: 100, y: 100 } } },
    )

    expect(result.current).toEqual({ x: 100, y: 100 })

    rerender({ anchorPosition: { x: 900, y: 100 } })

    expect(result.current?.x).toBe(792)
  })
})
