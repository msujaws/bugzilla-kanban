import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUrlFilters } from './use-url-filters'

describe('useUrlFilters', () => {
  const originalLocation = window.location
  let replaceStateMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Reset URL to base - avoid spreading class instance
    const mockLocation = {
      search: '',
      pathname: '/',
      href: 'http://localhost:3000/',
      origin: 'http://localhost:3000',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      protocol: 'http:',
      hash: '',
      assign: vi.fn(),
      reload: vi.fn(),
      replace: vi.fn(),
      toString: () => 'http://localhost:3000/',
    }
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    })

    // Mock history.replaceState
    replaceStateMock = vi.fn()
    vi.spyOn(window.history, 'replaceState').mockImplementation(replaceStateMock)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    })
  })

  describe('reading filters from URL', () => {
    it('should return empty filters when URL has no params', () => {
      const { result } = renderHook(() => useUrlFilters())

      expect(result.current.initialFilters).toEqual({
        whiteboardTag: '',
        component: '',
        sortOrder: 'priority',
      })
    })

    it('should read whiteboard tag from URL', () => {
      window.location.search = '?whiteboard=%5Bkanban%5D'

      const { result } = renderHook(() => useUrlFilters())

      expect(result.current.initialFilters.whiteboardTag).toBe('[kanban]')
    })

    it('should read component from URL', () => {
      window.location.search = '?component=Core'

      const { result } = renderHook(() => useUrlFilters())

      expect(result.current.initialFilters.component).toBe('Core')
    })

    it('should read sortOrder from URL', () => {
      window.location.search = '?sort=lastChanged'

      const { result } = renderHook(() => useUrlFilters())

      expect(result.current.initialFilters.sortOrder).toBe('lastChanged')
    })

    it('should read all filters from URL', () => {
      window.location.search = '?whiteboard=%5Bkanban%5D&component=Core&sort=lastChanged'

      const { result } = renderHook(() => useUrlFilters())

      expect(result.current.initialFilters).toEqual({
        whiteboardTag: '[kanban]',
        component: 'Core',
        sortOrder: 'lastChanged',
      })
    })

    it('should ignore invalid sortOrder values', () => {
      window.location.search = '?sort=invalid'

      const { result } = renderHook(() => useUrlFilters())

      expect(result.current.initialFilters.sortOrder).toBe('priority')
    })
  })

  describe('updating URL with filters', () => {
    it('should update URL when filters change', () => {
      const { result } = renderHook(() => useUrlFilters())

      act(() => {
        result.current.updateUrl({
          whiteboardTag: '[kanban]',
          component: '',
          sortOrder: 'priority',
        })
      })

      expect(replaceStateMock).toHaveBeenCalled()
    })

    it('should add whiteboard param to URL', () => {
      const { result } = renderHook(() => useUrlFilters())

      act(() => {
        result.current.updateUrl({
          whiteboardTag: '[kanban]',
          component: '',
          sortOrder: 'priority',
        })
      })

      const call = replaceStateMock.mock.calls[0]
      expect(call[2]).toContain('whiteboard=%5Bkanban%5D')
    })

    it('should add component param to URL', () => {
      const { result } = renderHook(() => useUrlFilters())

      act(() => {
        result.current.updateUrl({
          whiteboardTag: '',
          component: 'Core',
          sortOrder: 'priority',
        })
      })

      const call = replaceStateMock.mock.calls[0]
      expect(call[2]).toContain('component=Core')
    })

    it('should add sort param when not priority', () => {
      const { result } = renderHook(() => useUrlFilters())

      act(() => {
        result.current.updateUrl({
          whiteboardTag: '',
          component: '',
          sortOrder: 'lastChanged',
        })
      })

      const call = replaceStateMock.mock.calls[0]
      expect(call[2]).toContain('sort=lastChanged')
    })

    it('should omit default values from URL', () => {
      const { result } = renderHook(() => useUrlFilters())

      act(() => {
        result.current.updateUrl({
          whiteboardTag: '',
          component: '',
          sortOrder: 'priority',
        })
      })

      const call = replaceStateMock.mock.calls[0]
      // When all defaults, should just be pathname without query string
      expect(call[2]).toBe('/')
    })
  })

  describe('hasUrlFilters', () => {
    it('should return false when no filters in URL', () => {
      const { result } = renderHook(() => useUrlFilters())

      expect(result.current.hasUrlFilters).toBe(false)
    })

    it('should return true when filters exist in URL', () => {
      window.location.search = '?whiteboard=%5Bkanban%5D'

      const { result } = renderHook(() => useUrlFilters())

      expect(result.current.hasUrlFilters).toBe(true)
    })
  })
})
