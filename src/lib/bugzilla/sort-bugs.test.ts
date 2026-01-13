import { describe, it, expect } from 'vitest'
import { sortBugs, type SortOrder } from './sort-bugs'
import type { BugzillaBug } from './types'

const createBug = (id: number, priority: string, lastChangeTime: string): BugzillaBug => ({
  id,
  summary: `Bug ${String(id)}`,
  status: 'NEW',
  assigned_to: 'dev@example.com',
  priority,
  severity: 'normal',
  component: 'Core',
  whiteboard: '[kanban]',
  last_change_time: lastChangeTime,
  creation_time: '2024-01-01T00:00:00Z',
})

describe('sortBugs', () => {
  describe('priority sort', () => {
    it('should sort bugs by priority with highest (P1) first', () => {
      const bugs = [
        createBug(1, 'P3', '2024-01-01T00:00:00Z'),
        createBug(2, 'P1', '2024-01-01T00:00:00Z'),
        createBug(3, 'P5', '2024-01-01T00:00:00Z'),
      ]

      const sorted = sortBugs(bugs, 'priority')

      expect(sorted[0].id).toBe(2) // P1
      expect(sorted[1].id).toBe(1) // P3
      expect(sorted[2].id).toBe(3) // P5
    })

    it('should place unknown priorities at the end', () => {
      const bugs = [
        createBug(1, '--', '2024-01-01T00:00:00Z'),
        createBug(2, 'P2', '2024-01-01T00:00:00Z'),
      ]

      const sorted = sortBugs(bugs, 'priority')

      expect(sorted[0].id).toBe(2) // P2
      expect(sorted[1].id).toBe(1) // --
    })
  })

  describe('lastChanged sort', () => {
    it('should sort bugs by last_change_time with most recent first', () => {
      const bugs = [
        createBug(1, 'P1', '2024-01-10T00:00:00Z'),
        createBug(2, 'P1', '2024-01-15T00:00:00Z'),
        createBug(3, 'P1', '2024-01-05T00:00:00Z'),
      ]

      const sorted = sortBugs(bugs, 'lastChanged')

      expect(sorted[0].id).toBe(2) // Jan 15 (most recent)
      expect(sorted[1].id).toBe(1) // Jan 10
      expect(sorted[2].id).toBe(3) // Jan 5 (oldest)
    })

    it('should handle ISO date strings correctly', () => {
      const bugs = [
        createBug(1, 'P1', '2024-01-15T12:00:00Z'),
        createBug(2, 'P1', '2024-01-15T10:00:00Z'),
        createBug(3, 'P1', '2024-01-15T14:00:00Z'),
      ]

      const sorted = sortBugs(bugs, 'lastChanged')

      expect(sorted[0].id).toBe(3) // 14:00
      expect(sorted[1].id).toBe(1) // 12:00
      expect(sorted[2].id).toBe(2) // 10:00
    })
  })

  describe('common behavior', () => {
    it('should return empty array when given empty array', () => {
      expect(sortBugs([], 'priority')).toEqual([])
      expect(sortBugs([], 'lastChanged')).toEqual([])
    })

    it('should return single bug unchanged', () => {
      const bug = createBug(1, 'P3', '2024-01-01T00:00:00Z')
      expect(sortBugs([bug], 'priority')).toEqual([bug])
      expect(sortBugs([bug], 'lastChanged')).toEqual([bug])
    })

    it('should not mutate the original array', () => {
      const bugs = [
        createBug(1, 'P3', '2024-01-01T00:00:00Z'),
        createBug(2, 'P1', '2024-01-15T00:00:00Z'),
      ]
      const originalOrder = [...bugs]

      sortBugs(bugs, 'priority')
      sortBugs(bugs, 'lastChanged')

      expect(bugs[0].id).toBe(originalOrder[0].id)
      expect(bugs[1].id).toBe(originalOrder[1].id)
    })
  })
})
