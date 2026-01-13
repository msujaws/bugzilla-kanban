import { describe, it, expect } from 'vitest'
import { sortByPriority, comparePriority } from './sort-by-priority'
import type { BugzillaBug } from './types'

const createBug = (id: number, priority: string): BugzillaBug => ({
  id,
  summary: `Bug ${String(id)}`,
  status: 'NEW',
  assigned_to: 'dev@example.com',
  priority,
  severity: 'normal',
  component: 'Core',
  whiteboard: '[kanban]',
  last_change_time: '2024-01-15T10:00:00Z',
  creation_time: '2024-01-01T00:00:00Z',
})

describe('comparePriority', () => {
  it('should return negative when first priority is higher (P1 vs P2)', () => {
    expect(comparePriority('P1', 'P2')).toBeLessThan(0)
  })

  it('should return positive when first priority is lower (P3 vs P1)', () => {
    expect(comparePriority('P3', 'P1')).toBeGreaterThan(0)
  })

  it('should return zero when priorities are equal', () => {
    expect(comparePriority('P2', 'P2')).toBe(0)
  })

  it('should handle all priority levels correctly', () => {
    expect(comparePriority('P1', 'P5')).toBeLessThan(0)
    expect(comparePriority('P5', 'P1')).toBeGreaterThan(0)
    expect(comparePriority('P2', 'P3')).toBeLessThan(0)
    expect(comparePriority('P4', 'P3')).toBeGreaterThan(0)
  })

  it('should treat unknown priorities as lowest', () => {
    expect(comparePriority('P1', '--')).toBeLessThan(0)
    expect(comparePriority('--', 'P5')).toBeGreaterThan(0)
  })

  it('should handle N/A priority', () => {
    expect(comparePriority('P1', 'N/A')).toBeLessThan(0)
    expect(comparePriority('N/A', 'P1')).toBeGreaterThan(0)
  })

  it('should treat two unknown priorities as equal', () => {
    expect(comparePriority('--', 'N/A')).toBe(0)
    expect(comparePriority('unknown', 'other')).toBe(0)
  })
})

describe('sortByPriority', () => {
  it('should return empty array when given empty array', () => {
    expect(sortByPriority([])).toEqual([])
  })

  it('should return single bug unchanged', () => {
    const bug = createBug(1, 'P3')
    expect(sortByPriority([bug])).toEqual([bug])
  })

  it('should sort bugs by priority with highest (P1) first', () => {
    const p3Bug = createBug(1, 'P3')
    const p1Bug = createBug(2, 'P1')
    const p5Bug = createBug(3, 'P5')

    const sorted = sortByPriority([p3Bug, p1Bug, p5Bug])

    expect(sorted[0].id).toBe(2) // P1
    expect(sorted[1].id).toBe(1) // P3
    expect(sorted[2].id).toBe(3) // P5
  })

  it('should maintain order for bugs with same priority', () => {
    const bug1 = createBug(1, 'P2')
    const bug2 = createBug(2, 'P2')
    const bug3 = createBug(3, 'P2')

    const sorted = sortByPriority([bug1, bug2, bug3])

    // Should maintain original order (stable sort)
    expect(sorted[0].id).toBe(1)
    expect(sorted[1].id).toBe(2)
    expect(sorted[2].id).toBe(3)
  })

  it('should sort all five priority levels correctly', () => {
    const bugs = [
      createBug(5, 'P5'),
      createBug(3, 'P3'),
      createBug(1, 'P1'),
      createBug(4, 'P4'),
      createBug(2, 'P2'),
    ]

    const sorted = sortByPriority(bugs)

    expect(sorted.map((b) => b.priority)).toEqual(['P1', 'P2', 'P3', 'P4', 'P5'])
  })

  it('should place bugs with unknown priority at the end', () => {
    const p1Bug = createBug(1, 'P1')
    const unknownBug = createBug(2, '--')
    const p3Bug = createBug(3, 'P3')

    const sorted = sortByPriority([unknownBug, p1Bug, p3Bug])

    expect(sorted[0].id).toBe(1) // P1
    expect(sorted[1].id).toBe(3) // P3
    expect(sorted[2].id).toBe(2) // -- (unknown)
  })

  it('should not mutate the original array', () => {
    const bugs = [createBug(1, 'P3'), createBug(2, 'P1')]
    const originalOrder = [...bugs]

    sortByPriority(bugs)

    expect(bugs[0].id).toBe(originalOrder[0].id)
    expect(bugs[1].id).toBe(originalOrder[1].id)
  })
})
