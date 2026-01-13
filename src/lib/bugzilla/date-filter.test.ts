import { describe, it, expect, vi, afterEach } from 'vitest'
import { isWithinTwoWeeks, filterRecentBugs } from './date-filter'
import type { BugzillaBug } from './types'

const createBug = (id: number, lastChangeTime: string): BugzillaBug => ({
  id,
  summary: `Bug ${String(id)}`,
  status: 'RESOLVED',
  assigned_to: 'dev@example.com',
  priority: 'P3',
  severity: 'normal',
  component: 'Core',
  whiteboard: '[kanban]',
  last_change_time: lastChangeTime,
  creation_time: '2024-01-01T00:00:00Z',
})

describe('isWithinTwoWeeks', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return true for dates within the past 2 weeks', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))

    // 1 day ago
    expect(isWithinTwoWeeks('2024-01-14T12:00:00Z')).toBe(true)
    // 7 days ago
    expect(isWithinTwoWeeks('2024-01-08T12:00:00Z')).toBe(true)
    // 13 days ago (just within 2 weeks)
    expect(isWithinTwoWeeks('2024-01-02T12:00:00Z')).toBe(true)
  })

  it('should return false for dates older than 2 weeks', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))

    // 15 days ago
    expect(isWithinTwoWeeks('2023-12-31T12:00:00Z')).toBe(false)
    // 30 days ago
    expect(isWithinTwoWeeks('2023-12-16T12:00:00Z')).toBe(false)
    // Way in the past
    expect(isWithinTwoWeeks('2023-01-01T12:00:00Z')).toBe(false)
  })

  it('should return true for exactly 14 days ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))

    // Exactly 14 days ago should be included
    expect(isWithinTwoWeeks('2024-01-01T12:00:00Z')).toBe(true)
  })

  it('should return true for future dates', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))

    // Future date (edge case - should still work)
    expect(isWithinTwoWeeks('2024-01-16T12:00:00Z')).toBe(true)
  })
})

describe('filterRecentBugs', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return empty array when given empty array', () => {
    expect(filterRecentBugs([])).toEqual([])
  })

  it('should filter out bugs older than 2 weeks', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))

    const bugs = [
      createBug(1, '2024-01-14T12:00:00Z'), // 1 day ago - keep
      createBug(2, '2023-12-25T12:00:00Z'), // 21 days ago - filter out
      createBug(3, '2024-01-08T12:00:00Z'), // 7 days ago - keep
    ]

    const filtered = filterRecentBugs(bugs)

    expect(filtered).toHaveLength(2)
    expect(filtered.map((b) => b.id)).toEqual([1, 3])
  })

  it('should keep all bugs when all are recent', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))

    const bugs = [createBug(1, '2024-01-14T12:00:00Z'), createBug(2, '2024-01-13T12:00:00Z')]

    const filtered = filterRecentBugs(bugs)

    expect(filtered).toHaveLength(2)
  })

  it('should filter all bugs when all are old', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))

    const bugs = [createBug(1, '2023-12-01T12:00:00Z'), createBug(2, '2023-11-15T12:00:00Z')]

    const filtered = filterRecentBugs(bugs)

    expect(filtered).toHaveLength(0)
  })

  it('should not mutate the original array', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))

    const bugs = [createBug(1, '2024-01-14T12:00:00Z'), createBug(2, '2023-12-01T12:00:00Z')]
    const originalLength = bugs.length

    filterRecentBugs(bugs)

    expect(bugs).toHaveLength(originalLength)
  })
})
