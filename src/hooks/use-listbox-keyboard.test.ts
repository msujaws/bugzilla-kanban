import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useListboxKeyboard } from './use-listbox-keyboard'

describe('useListboxKeyboard', () => {
  const mockOptions = [
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' },
    { value: 'opt3', label: 'Option 3' },
  ]

  const defaultProps = {
    options: mockOptions,
    isOpen: true,
    onSelect: vi.fn(),
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('focus management', () => {
    it('should initialize focusedIndex to 0 when no current value', () => {
      const { result } = renderHook(() => useListboxKeyboard(defaultProps))

      expect(result.current.focusedIndex).toBe(0)
    })

    it('should initialize focusedIndex to current value index', () => {
      const { result } = renderHook(() =>
        useListboxKeyboard({ ...defaultProps, currentValue: 'opt2' }),
      )

      expect(result.current.focusedIndex).toBe(1)
    })

    it('should reset focusedIndex when picker opens', () => {
      const { result, rerender } = renderHook(
        ({ isOpen, currentValue }) => useListboxKeyboard({ ...defaultProps, isOpen, currentValue }),
        { initialProps: { isOpen: false, currentValue: 'opt2' } },
      )

      // Open the picker
      rerender({ isOpen: true, currentValue: 'opt2' })

      expect(result.current.focusedIndex).toBe(1)
    })
  })

  describe('keyboard navigation', () => {
    it('should move focus down with ArrowDown', () => {
      const { result } = renderHook(() => useListboxKeyboard(defaultProps))

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowDown',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent)
      })

      expect(result.current.focusedIndex).toBe(1)
    })

    it('should move focus up with ArrowUp', () => {
      const { result } = renderHook(() =>
        useListboxKeyboard({ ...defaultProps, currentValue: 'opt2' }),
      )

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowUp',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent)
      })

      expect(result.current.focusedIndex).toBe(0)
    })

    it('should wrap to first item when pressing ArrowDown at last item', () => {
      const { result } = renderHook(() =>
        useListboxKeyboard({ ...defaultProps, currentValue: 'opt3' }),
      )

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowDown',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent)
      })

      expect(result.current.focusedIndex).toBe(0)
    })

    it('should wrap to last item when pressing ArrowUp at first item', () => {
      const { result } = renderHook(() => useListboxKeyboard(defaultProps))

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowUp',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent)
      })

      expect(result.current.focusedIndex).toBe(2)
    })

    it('should move to first item with Home key', () => {
      const { result } = renderHook(() =>
        useListboxKeyboard({ ...defaultProps, currentValue: 'opt3' }),
      )

      act(() => {
        result.current.handleKeyDown({
          key: 'Home',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent)
      })

      expect(result.current.focusedIndex).toBe(0)
    })

    it('should move to last item with End key', () => {
      const { result } = renderHook(() => useListboxKeyboard(defaultProps))

      act(() => {
        result.current.handleKeyDown({
          key: 'End',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent)
      })

      expect(result.current.focusedIndex).toBe(2)
    })

    it('should call preventDefault for navigation keys', () => {
      const { result } = renderHook(() => useListboxKeyboard(defaultProps))
      const preventDefault = vi.fn()

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowDown',
          preventDefault,
        } as unknown as React.KeyboardEvent)
      })

      expect(preventDefault).toHaveBeenCalled()
    })
  })

  describe('selection', () => {
    it('should call onSelect with focused option value on Enter', () => {
      const onSelect = vi.fn()
      const { result } = renderHook(() =>
        useListboxKeyboard({ ...defaultProps, onSelect, currentValue: 'opt2' }),
      )

      act(() => {
        result.current.handleKeyDown({
          key: 'Enter',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent)
      })

      expect(onSelect).toHaveBeenCalledWith('opt2')
    })

    it('should call onSelect with first option when Enter pressed at index 0', () => {
      const onSelect = vi.fn()
      const { result } = renderHook(() => useListboxKeyboard({ ...defaultProps, onSelect }))

      act(() => {
        result.current.handleKeyDown({
          key: 'Enter',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent)
      })

      expect(onSelect).toHaveBeenCalledWith('opt1')
    })
  })

  describe('closing', () => {
    it('should call onClose on Escape', () => {
      const onClose = vi.fn()
      const { result } = renderHook(() => useListboxKeyboard({ ...defaultProps, onClose }))

      act(() => {
        result.current.handleKeyDown({
          key: 'Escape',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent)
      })

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('option props', () => {
    it('should return unique id for each option', () => {
      const { result } = renderHook(() => useListboxKeyboard(defaultProps))

      const id0 = result.current.getOptionId(0)
      const id1 = result.current.getOptionId(1)
      const id2 = result.current.getOptionId(2)

      expect(id0).not.toBe(id1)
      expect(id1).not.toBe(id2)
      expect(id0).toMatch(/option-0$/)
      expect(id1).toMatch(/option-1$/)
    })
  })

  describe('listbox props', () => {
    it('should return aria-activedescendant pointing to focused option', () => {
      const { result } = renderHook(() =>
        useListboxKeyboard({ ...defaultProps, currentValue: 'opt2' }),
      )

      const listboxProps = result.current.listboxProps
      expect(listboxProps['aria-activedescendant']).toBe(result.current.getOptionId(1))
    })

    it('should return tabIndex 0 for keyboard focus', () => {
      const { result } = renderHook(() => useListboxKeyboard(defaultProps))

      expect(result.current.listboxProps.tabIndex).toBe(0)
    })
  })

  describe('when closed', () => {
    it('should not respond to keyboard events when isOpen is false', () => {
      const onSelect = vi.fn()
      const { result } = renderHook(() =>
        useListboxKeyboard({ ...defaultProps, isOpen: false, onSelect }),
      )

      act(() => {
        result.current.handleKeyDown({
          key: 'Enter',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent)
      })

      expect(onSelect).not.toHaveBeenCalled()
    })
  })
})
