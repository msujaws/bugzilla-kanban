import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFocusTrap } from './use-focus-trap'

describe('useFocusTrap', () => {
  let container: HTMLDivElement
  let firstButton: HTMLButtonElement
  let middleInput: HTMLInputElement
  let lastButton: HTMLButtonElement

  beforeEach(() => {
    // Create a container with focusable elements
    container = document.createElement('div')
    firstButton = document.createElement('button')
    firstButton.textContent = 'First'
    middleInput = document.createElement('input')
    middleInput.type = 'text'
    lastButton = document.createElement('button')
    lastButton.textContent = 'Last'

    container.append(firstButton, middleInput, lastButton)
    document.body.append(container)
  })

  afterEach(() => {
    container.remove()
    vi.restoreAllMocks()
  })

  it('should trap Tab key to cycle within container', () => {
    const ref = { current: container }
    renderHook(() => useFocusTrap(ref, true))

    // Focus the last button
    lastButton.focus()
    expect(document.activeElement).toBe(lastButton)

    // Press Tab - should wrap to first focusable element
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    })

    act(() => {
      container.dispatchEvent(tabEvent)
    })

    expect(document.activeElement).toBe(firstButton)
  })

  it('should trap Shift+Tab to cycle backward within container', () => {
    const ref = { current: container }
    renderHook(() => useFocusTrap(ref, true))

    // Focus the first button
    firstButton.focus()
    expect(document.activeElement).toBe(firstButton)

    // Press Shift+Tab - should wrap to last focusable element
    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })

    act(() => {
      container.dispatchEvent(shiftTabEvent)
    })

    expect(document.activeElement).toBe(lastButton)
  })

  it('should not trap focus when disabled', () => {
    const ref = { current: container }
    renderHook(() => useFocusTrap(ref, false))

    // Focus the last button
    lastButton.focus()

    // Press Tab - should not be prevented
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    })

    act(() => {
      container.dispatchEvent(tabEvent)
    })

    // Focus should not be changed by the hook (browser default behavior)
    expect(tabEvent.defaultPrevented).toBe(false)
  })

  it('should focus first element when trap is enabled', () => {
    const ref = { current: container }

    // Initially focus something outside
    document.body.focus()

    renderHook(() => useFocusTrap(ref, true))

    expect(document.activeElement).toBe(firstButton)
  })

  it('should restore focus to previous element when trap is disabled', () => {
    // Create an element to restore focus to
    const outsideButton = document.createElement('button')
    outsideButton.textContent = 'Outside'
    document.body.append(outsideButton)
    outsideButton.focus()

    const ref = { current: container }

    const { rerender } = renderHook(({ enabled }) => useFocusTrap(ref, enabled), {
      initialProps: { enabled: true },
    })

    // Focus should now be inside the container
    expect(container.contains(document.activeElement)).toBe(true)

    // Disable the trap
    rerender({ enabled: false })

    // Focus should be restored to the outside button
    expect(document.activeElement).toBe(outsideButton)

    outsideButton.remove()
  })

  it('should handle container with no focusable elements', () => {
    const emptyContainer = document.createElement('div')
    emptyContainer.textContent = 'No focusable elements'
    document.body.append(emptyContainer)

    const ref = { current: emptyContainer }

    // Should not throw
    expect(() => {
      renderHook(() => useFocusTrap(ref, true))
    }).not.toThrow()

    emptyContainer.remove()
  })
})
