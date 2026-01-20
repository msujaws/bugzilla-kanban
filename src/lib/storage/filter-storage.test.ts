import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveFilters, getFilters, clearFilters, hasFilters } from './filter-storage'
import type { SortOrder } from '@/lib/bugzilla/sort-bugs'

interface StoredFilters {
  whiteboardTag: string
  component: string
  sortOrder: SortOrder
}

describe('filter-storage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('saveFilters', () => {
    it('should save filters to localStorage', () => {
      const filters: StoredFilters = {
        whiteboardTag: 'sprint-42',
        component: 'General',
        sortOrder: 'priority',
      }

      saveFilters(filters)

      const stored = localStorage.getItem('bugzilla_filters')
      expect(stored).toBeDefined()
      expect(JSON.parse(stored ?? '')).toEqual(filters)
    })

    it('should overwrite existing filters', () => {
      const filters1: StoredFilters = {
        whiteboardTag: 'sprint-42',
        component: 'General',
        sortOrder: 'priority',
      }
      const filters2: StoredFilters = {
        whiteboardTag: 'sprint-43',
        component: 'Security',
        sortOrder: 'lastChanged',
      }

      saveFilters(filters1)
      saveFilters(filters2)

      const stored = localStorage.getItem('bugzilla_filters')
      expect(JSON.parse(stored ?? '')).toEqual(filters2)
    })
  })

  describe('getFilters', () => {
    it('should return undefined when no filters are stored', () => {
      const filters = getFilters()
      expect(filters).toBeUndefined()
    })

    it('should return stored filters', () => {
      const expected: StoredFilters = {
        whiteboardTag: 'sprint-42',
        component: 'General',
        sortOrder: 'priority',
      }
      localStorage.setItem('bugzilla_filters', JSON.stringify(expected))

      const filters = getFilters()
      expect(filters).toEqual(expected)
    })

    it('should return undefined for invalid JSON', () => {
      localStorage.setItem('bugzilla_filters', 'not-valid-json')

      const filters = getFilters()
      expect(filters).toBeUndefined()
    })

    it('should return undefined for malformed filter objects', () => {
      localStorage.setItem('bugzilla_filters', JSON.stringify({ foo: 'bar' }))

      const filters = getFilters()
      expect(filters).toBeUndefined()
    })
  })

  describe('clearFilters', () => {
    it('should remove filters from localStorage', () => {
      localStorage.setItem('bugzilla_filters', JSON.stringify({ whiteboardTag: 'test' }))

      clearFilters()

      expect(localStorage.getItem('bugzilla_filters')).toBeNull()
    })

    it('should not throw when no filters exist', () => {
      expect(() => clearFilters()).not.toThrow()
    })
  })

  describe('hasFilters', () => {
    it('should return false when no filters are stored', () => {
      expect(hasFilters()).toBe(false)
    })

    it('should return true when filters are stored', () => {
      const filters: StoredFilters = {
        whiteboardTag: 'sprint-42',
        component: 'General',
        sortOrder: 'priority',
      }
      localStorage.setItem('bugzilla_filters', JSON.stringify(filters))

      expect(hasFilters()).toBe(true)
    })

    it('should return false for invalid stored data', () => {
      localStorage.setItem('bugzilla_filters', 'not-valid-json')

      expect(hasFilters()).toBe(false)
    })
  })
})
