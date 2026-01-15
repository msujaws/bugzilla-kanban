import { describe, it, expect } from 'vitest'
import { getBoardAssignees, type Assignee } from './use-board-assignees'
import type { BugzillaBug } from '@/lib/bugzilla/types'

const createBug = (
  id: number,
  assignedTo: string,
  assignedToDetail?: { email: string; name: string; real_name: string },
  overrides?: Partial<BugzillaBug>,
): BugzillaBug => ({
  id,
  summary: `Bug ${id.toString()}`,
  status: 'NEW',
  assigned_to: assignedTo,
  assigned_to_detail: assignedToDetail,
  priority: 'P3',
  severity: 'normal',
  component: 'General',
  whiteboard: '',
  last_change_time: '2024-01-01T00:00:00Z',
  creation_time: '2024-01-01T00:00:00Z',
  ...overrides,
})

// Helper to get a recent date (within 2 weeks)
const getRecentDate = () => {
  const date = new Date()
  date.setDate(date.getDate() - 7) // 1 week ago
  return date.toISOString()
}

// Helper to get an old date (more than 2 weeks ago)
const getOldDate = () => {
  const date = new Date()
  date.setDate(date.getDate() - 30) // 30 days ago
  return date.toISOString()
}

describe('getBoardAssignees', () => {
  it('should return empty array for empty bugs list', () => {
    const result = getBoardAssignees([])
    expect(result).toEqual([])
  })

  it('should extract unique assignees from bugs', () => {
    const bugs = [
      createBug(1, 'alice@example.com'),
      createBug(2, 'bob@example.com'),
      createBug(3, 'alice@example.com'),
    ]

    const result = getBoardAssignees(bugs)

    expect(result).toHaveLength(2)
    expect(result.map((a) => a.email)).toContain('alice@example.com')
    expect(result.map((a) => a.email)).toContain('bob@example.com')
  })

  it('should sort assignees by frequency (most common first)', () => {
    const bugs = [
      createBug(1, 'alice@example.com'),
      createBug(2, 'bob@example.com'),
      createBug(3, 'alice@example.com'),
      createBug(4, 'alice@example.com'),
      createBug(5, 'bob@example.com'),
    ]

    const result = getBoardAssignees(bugs)

    expect(result[0].email).toBe('alice@example.com')
    expect(result[0].count).toBe(3)
    expect(result[1].email).toBe('bob@example.com')
    expect(result[1].count).toBe(2)
  })

  it('should use real_name from assigned_to_detail when available', () => {
    const bugs = [
      createBug(1, 'alice@example.com', {
        email: 'alice@example.com',
        name: 'alice',
        real_name: 'Alice Johnson',
      }),
    ]

    const result = getBoardAssignees(bugs)

    expect(result[0].displayName).toBe('Alice Johnson')
  })

  it('should fall back to email when no real_name available', () => {
    const bugs = [createBug(1, 'alice@example.com')]

    const result = getBoardAssignees(bugs)

    expect(result[0].displayName).toBe('alice@example.com')
  })

  it('should fall back to email when real_name is empty', () => {
    const bugs = [
      createBug(1, 'alice@example.com', {
        email: 'alice@example.com',
        name: 'alice',
        real_name: '',
      }),
    ]

    const result = getBoardAssignees(bugs)

    expect(result[0].displayName).toBe('alice@example.com')
  })

  it('should include count for each assignee', () => {
    const bugs = [
      createBug(1, 'alice@example.com'),
      createBug(2, 'alice@example.com'),
      createBug(3, 'bob@example.com'),
    ]

    const result = getBoardAssignees(bugs)

    const alice = result.find((a) => a.email === 'alice@example.com')
    const bob = result.find((a) => a.email === 'bob@example.com')

    expect(alice?.count).toBe(2)
    expect(bob?.count).toBe(1)
  })

  it('should handle single bug', () => {
    const bugs = [createBug(1, 'solo@example.com')]

    const result = getBoardAssignees(bugs)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      email: 'solo@example.com',
      displayName: 'solo@example.com',
      count: 1,
    })
  })

  it('should use first available real_name for an assignee', () => {
    const bugs = [
      createBug(1, 'alice@example.com', {
        email: 'alice@example.com',
        name: 'alice',
        real_name: 'Alice Johnson',
      }),
      createBug(2, 'alice@example.com'), // No detail
    ]

    const result = getBoardAssignees(bugs)

    expect(result[0].displayName).toBe('Alice Johnson')
  })

  it('should return assignees with correct Assignee type', () => {
    const bugs = [createBug(1, 'test@example.com')]

    const result = getBoardAssignees(bugs)

    const assignee: Assignee = result[0]
    expect(assignee).toHaveProperty('email')
    expect(assignee).toHaveProperty('displayName')
    expect(assignee).toHaveProperty('count')
  })

  describe('done column filtering', () => {
    it('should exclude done bugs with non-FIXED resolution from count', () => {
      const bugs = [
        createBug(1, 'alice@example.com'), // NEW - should count
        createBug(2, 'alice@example.com', undefined, {
          status: 'RESOLVED',
          resolution: 'WONTFIX',
          last_change_time: getRecentDate(),
        }), // RESOLVED but WONTFIX - should NOT count
      ]

      const result = getBoardAssignees(bugs)
      const alice = result.find((a) => a.email === 'alice@example.com')

      expect(alice?.count).toBe(1) // Only the NEW bug
    })

    it('should exclude done bugs older than 2 weeks from count', () => {
      const bugs = [
        createBug(1, 'alice@example.com'), // NEW - should count
        createBug(2, 'alice@example.com', undefined, {
          status: 'RESOLVED',
          resolution: 'FIXED',
          last_change_time: getOldDate(),
        }), // FIXED but old - should NOT count
      ]

      const result = getBoardAssignees(bugs)
      const alice = result.find((a) => a.email === 'alice@example.com')

      expect(alice?.count).toBe(1) // Only the NEW bug
    })

    it('should include recent done bugs with FIXED resolution in count', () => {
      const bugs = [
        createBug(1, 'alice@example.com'), // NEW - should count
        createBug(2, 'alice@example.com', undefined, {
          status: 'RESOLVED',
          resolution: 'FIXED',
          last_change_time: getRecentDate(),
        }), // FIXED and recent - should count
      ]

      const result = getBoardAssignees(bugs)
      const alice = result.find((a) => a.email === 'alice@example.com')

      expect(alice?.count).toBe(2) // Both bugs
    })

    it('should handle VERIFIED and CLOSED statuses the same as RESOLVED', () => {
      const bugs = [
        createBug(1, 'alice@example.com', undefined, {
          status: 'VERIFIED',
          resolution: 'INVALID',
          last_change_time: getRecentDate(),
        }), // VERIFIED but INVALID - should NOT count
        createBug(2, 'alice@example.com', undefined, {
          status: 'CLOSED',
          resolution: 'DUPLICATE',
          last_change_time: getRecentDate(),
        }), // CLOSED but DUPLICATE - should NOT count
        createBug(3, 'alice@example.com', undefined, {
          status: 'VERIFIED',
          resolution: 'FIXED',
          last_change_time: getRecentDate(),
        }), // VERIFIED + FIXED + recent - should count
      ]

      const result = getBoardAssignees(bugs)
      const alice = result.find((a) => a.email === 'alice@example.com')

      expect(alice?.count).toBe(1) // Only the VERIFIED+FIXED bug
    })

    it('should not filter non-done bugs regardless of age', () => {
      const bugs = [
        createBug(1, 'alice@example.com', undefined, {
          status: 'NEW',
          last_change_time: getOldDate(),
        }), // OLD but NEW status - should count
        createBug(2, 'alice@example.com', undefined, {
          status: 'ASSIGNED',
          last_change_time: getOldDate(),
        }), // OLD but ASSIGNED - should count
      ]

      const result = getBoardAssignees(bugs)
      const alice = result.find((a) => a.email === 'alice@example.com')

      expect(alice?.count).toBe(2) // Both bugs count
    })
  })
})
