import { describe, it, expect } from 'vitest'
import { isMetaBug, filterMetaBugs } from './meta-filter'
import type { BugzillaBug } from './types'

const createBug = (overrides: Partial<BugzillaBug>): BugzillaBug => ({
  id: 1,
  summary: 'Test',
  status: 'NEW',
  assigned_to: 'dev@example.com',
  priority: 'P1',
  severity: 'normal',
  component: 'Core',
  whiteboard: '',
  last_change_time: '2024-01-01T00:00:00Z',
  creation_time: '2024-01-01T00:00:00Z',
  ...overrides,
})

describe('isMetaBug', () => {
  it('should return true when bug has meta keyword', () => {
    const bug = createBug({ keywords: ['meta', 'other'] })
    expect(isMetaBug(bug)).toBe(true)
  })

  it('should return true when bug has Meta keyword (case insensitive)', () => {
    const bug = createBug({ keywords: ['Meta'] })
    expect(isMetaBug(bug)).toBe(true)
  })

  it('should return true when whiteboard contains [meta]', () => {
    const bug = createBug({ whiteboard: '[meta] tracking bug' })
    expect(isMetaBug(bug)).toBe(true)
  })

  it('should return true when whiteboard contains [META] (case insensitive)', () => {
    const bug = createBug({ whiteboard: '[META] tracking bug' })
    expect(isMetaBug(bug)).toBe(true)
  })

  it('should return true when whiteboard contains [meta] anywhere', () => {
    const bug = createBug({ whiteboard: 'something [meta] something else' })
    expect(isMetaBug(bug)).toBe(true)
  })

  it('should return false for regular bugs', () => {
    const bug = createBug({ keywords: ['other'], whiteboard: '[kanban]' })
    expect(isMetaBug(bug)).toBe(false)
  })

  it('should return false when no keywords or whiteboard', () => {
    const bug = createBug({})
    expect(isMetaBug(bug)).toBe(false)
  })

  it('should return false when keywords is empty array', () => {
    const bug = createBug({ keywords: [] })
    expect(isMetaBug(bug)).toBe(false)
  })

  it('should return false when whiteboard is empty', () => {
    const bug = createBug({ whiteboard: '' })
    expect(isMetaBug(bug)).toBe(false)
  })
})

describe('filterMetaBugs', () => {
  it('should remove meta bugs when enabled', () => {
    const bugs = [
      createBug({ id: 1, keywords: ['meta'] }),
      createBug({ id: 2 }),
      createBug({ id: 3, whiteboard: '[meta]' }),
    ]
    const filtered = filterMetaBugs(bugs, true)
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe(2)
  })

  it('should keep all bugs when disabled', () => {
    const bugs = [createBug({ id: 1, keywords: ['meta'] }), createBug({ id: 2 })]
    const filtered = filterMetaBugs(bugs, false)
    expect(filtered).toHaveLength(2)
  })

  it('should return empty array when all bugs are meta', () => {
    const bugs = [
      createBug({ id: 1, keywords: ['meta'] }),
      createBug({ id: 2, whiteboard: '[meta]' }),
    ]
    const filtered = filterMetaBugs(bugs, true)
    expect(filtered).toHaveLength(0)
  })

  it('should return all bugs when none are meta', () => {
    const bugs = [createBug({ id: 1 }), createBug({ id: 2 })]
    const filtered = filterMetaBugs(bugs, true)
    expect(filtered).toHaveLength(2)
  })
})
