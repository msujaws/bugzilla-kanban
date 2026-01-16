import { useState, useEffect, useId, useCallback, useRef } from 'react'

export interface ListboxOption<T> {
  value: T
  label: string
}

export interface UseListboxKeyboardOptions<T> {
  options: readonly ListboxOption<T>[]
  isOpen: boolean
  onSelect: (value: T) => void
  onClose: () => void
  currentValue?: T
}

export interface UseListboxKeyboardReturn {
  focusedIndex: number
  handleKeyDown: (event: React.KeyboardEvent) => void
  getOptionId: (index: number) => string
  listboxProps: {
    'aria-activedescendant': string
    tabIndex: number
    onKeyDown: (event: React.KeyboardEvent) => void
  }
}

/**
 * Hook to provide keyboard navigation for listbox components.
 * Implements WAI-ARIA listbox keyboard interaction pattern.
 *
 * @param options - Configuration options for the listbox
 * @returns Object with focusedIndex, handleKeyDown, getOptionId, and listboxProps
 */
export function useListboxKeyboard<T>({
  options,
  isOpen,
  onSelect,
  onClose,
  currentValue,
}: UseListboxKeyboardOptions<T>): UseListboxKeyboardReturn {
  const baseId = useId()

  // Find the index of the current value, defaulting to 0
  const findCurrentIndex = useCallback(() => {
    if (currentValue === undefined) return 0
    const index = options.findIndex((opt) => opt.value === currentValue)
    return index === -1 ? 0 : index
  }, [options, currentValue])

  const [focusedIndex, setFocusedIndex] = useState(findCurrentIndex)

  // Use a ref to track focusedIndex for the document-level listener
  const focusedIndexRef = useRef(focusedIndex)
  focusedIndexRef.current = focusedIndex

  // Track previous isOpen state to detect open transitions
  const wasOpenRef = useRef(isOpen)

  // Reset focused index only when picker transitions from closed to open
  useEffect(() => {
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = isOpen

    // Only reset when transitioning from closed to open
    if (isOpen && !wasOpen) {
      setFocusedIndex(findCurrentIndex())
    }
  }, [isOpen, findCurrentIndex])

  const getOptionId = useCallback(
    (index: number) => `${baseId}-option-${index.toString()}`,
    [baseId],
  )

  // Scroll focused option into view when focusedIndex changes
  useEffect(() => {
    if (!isOpen) return

    const optionId = getOptionId(focusedIndex)
    const element = document.querySelector(`#${CSS.escape(optionId)}`)
    if (element) {
      element.scrollIntoView({ block: 'nearest' })
    }
  }, [isOpen, focusedIndex, getOptionId])

  // Document-level keyboard handler for when picker is open
  useEffect(() => {
    if (!isOpen) return

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault()
          setFocusedIndex((previous) => (previous >= options.length - 1 ? 0 : previous + 1))
          break
        }
        case 'ArrowUp': {
          event.preventDefault()
          setFocusedIndex((previous) => (previous <= 0 ? options.length - 1 : previous - 1))
          break
        }
        case 'Home': {
          event.preventDefault()
          setFocusedIndex(0)
          break
        }
        case 'End': {
          event.preventDefault()
          setFocusedIndex(options.length - 1)
          break
        }
        case 'Enter': {
          event.preventDefault()
          const option = options[focusedIndexRef.current]
          if (option) {
            onSelect(option.value)
          }
          break
        }
        case 'Escape': {
          event.preventDefault()
          onClose()
          break
        }
      }
    }

    document.addEventListener('keydown', handleDocumentKeyDown)
    return () => {
      document.removeEventListener('keydown', handleDocumentKeyDown)
    }
  }, [isOpen, options, onSelect, onClose])

  // React event handler (for direct element interaction)
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault()
          setFocusedIndex((previous) => (previous >= options.length - 1 ? 0 : previous + 1))
          break
        }
        case 'ArrowUp': {
          event.preventDefault()
          setFocusedIndex((previous) => (previous <= 0 ? options.length - 1 : previous - 1))
          break
        }
        case 'Home': {
          event.preventDefault()
          setFocusedIndex(0)
          break
        }
        case 'End': {
          event.preventDefault()
          setFocusedIndex(options.length - 1)
          break
        }
        case 'Enter': {
          event.preventDefault()
          const option = options[focusedIndex]
          if (option) {
            onSelect(option.value)
          }
          break
        }
        case 'Escape': {
          event.preventDefault()
          onClose()
          break
        }
      }
    },
    [isOpen, options, focusedIndex, onSelect, onClose],
  )

  const listboxProps = {
    'aria-activedescendant': getOptionId(focusedIndex),
    tabIndex: 0,
    onKeyDown: handleKeyDown,
  }

  return {
    focusedIndex,
    handleKeyDown,
    getOptionId,
    listboxProps,
  }
}
