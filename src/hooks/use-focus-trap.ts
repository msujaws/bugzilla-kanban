import { useEffect, useRef, type RefObject } from 'react'

/**
 * Selector for focusable elements
 */
const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)]
}

/**
 * Hook to trap focus within a container element.
 * Useful for modal dialogs and other overlay components.
 *
 * @param ref - Reference to the container element
 * @param enabled - Whether the focus trap is active
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, enabled: boolean): void {
  // Store the previously focused element to restore on disable
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled || !ref.current) {
      return
    }

    const container = ref.current

    // Store the currently focused element before trapping
    previousFocusRef.current = document.activeElement as HTMLElement | null

    // Focus the first focusable element in the container
    const focusableElements = getFocusableElements(container)
    if (focusableElements.length > 0) {
      focusableElements[0]?.focus()
    }

    // Handle Tab key to trap focus
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusable = getFocusableElements(container)
      if (focusable.length === 0) return

      const firstElement = focusable[0]
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const lastElement: HTMLElement | undefined = focusable.at(-1)
      if (!firstElement || !lastElement) return

      if (event.shiftKey) {
        // Shift+Tab: wrap from first to last
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab: wrap from last to first
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)

      // Restore focus to previously focused element when trap is disabled
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus()
      }
    }
  }, [enabled, ref])
}
