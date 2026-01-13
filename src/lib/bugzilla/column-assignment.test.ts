import { describe, it, expect } from 'vitest'
import { hasQeVerifyFlag, assignBugToColumn } from './column-assignment'
import { SPRINT_TAG } from './sprint-tag'
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

describe('hasQeVerifyFlag', () => {
  it('should return true when bug has qe-verify+ flag', () => {
    const bug = createBug({
      flags: [{ name: 'qe-verify', status: '+' }],
    })
    expect(hasQeVerifyFlag(bug)).toBe(true)
  })

  it('should return false when bug has qe-verify? flag (request)', () => {
    const bug = createBug({
      flags: [{ name: 'qe-verify', status: '?' }],
    })
    expect(hasQeVerifyFlag(bug)).toBe(false)
  })

  it('should return false when bug has qe-verify- flag (rejected)', () => {
    const bug = createBug({
      flags: [{ name: 'qe-verify', status: '-' }],
    })
    expect(hasQeVerifyFlag(bug)).toBe(false)
  })

  it('should return false when bug has no flags', () => {
    const bug = createBug({})
    expect(hasQeVerifyFlag(bug)).toBe(false)
  })

  it('should return false when bug has empty flags array', () => {
    const bug = createBug({ flags: [] })
    expect(hasQeVerifyFlag(bug)).toBe(false)
  })

  it('should return false when bug has other flags but not qe-verify+', () => {
    const bug = createBug({
      flags: [{ name: 'needinfo', status: '?' }],
    })
    expect(hasQeVerifyFlag(bug)).toBe(false)
  })

  it('should return true when qe-verify+ is among multiple flags', () => {
    const bug = createBug({
      flags: [
        { name: 'needinfo', status: '?' },
        { name: 'qe-verify', status: '+' },
        { name: 'approval-mozilla-beta', status: '?' },
      ],
    })
    expect(hasQeVerifyFlag(bug)).toBe(true)
  })
})

describe('assignBugToColumn', () => {
  it('should assign RESOLVED FIXED with qe-verify+ to in-testing', () => {
    const bug = createBug({
      status: 'RESOLVED',
      resolution: 'FIXED',
      flags: [{ name: 'qe-verify', status: '+' }],
    })
    expect(assignBugToColumn(bug)).toBe('in-testing')
  })

  it('should assign RESOLVED FIXED without qe-verify+ to done', () => {
    const bug = createBug({
      status: 'RESOLVED',
      resolution: 'FIXED',
    })
    expect(assignBugToColumn(bug)).toBe('done')
  })

  it('should assign RESOLVED FIXED with qe-verify? to done (request not granted)', () => {
    const bug = createBug({
      status: 'RESOLVED',
      resolution: 'FIXED',
      flags: [{ name: 'qe-verify', status: '?' }],
    })
    expect(assignBugToColumn(bug)).toBe('done')
  })

  it('should assign RESOLVED WONTFIX to done (not in-testing)', () => {
    const bug = createBug({
      status: 'RESOLVED',
      resolution: 'WONTFIX',
      flags: [{ name: 'qe-verify', status: '+' }],
    })
    expect(assignBugToColumn(bug)).toBe('done')
  })

  it('should assign RESOLVED DUPLICATE to done', () => {
    const bug = createBug({
      status: 'RESOLVED',
      resolution: 'DUPLICATE',
      flags: [{ name: 'qe-verify', status: '+' }],
    })
    expect(assignBugToColumn(bug)).toBe('done')
  })

  it('should assign RESOLVED INVALID to done', () => {
    const bug = createBug({
      status: 'RESOLVED',
      resolution: 'INVALID',
    })
    expect(assignBugToColumn(bug)).toBe('done')
  })

  // Sprint tag logic tests
  it('should assign NEW status without sprint tag to backlog', () => {
    const bug = createBug({ status: 'NEW', whiteboard: '' })
    expect(assignBugToColumn(bug)).toBe('backlog')
  })

  it('should assign UNCONFIRMED status without sprint tag to backlog', () => {
    const bug = createBug({ status: 'UNCONFIRMED', whiteboard: '[other-tag]' })
    expect(assignBugToColumn(bug)).toBe('backlog')
  })

  it('should assign NEW status with sprint tag to todo', () => {
    const bug = createBug({ status: 'NEW', whiteboard: SPRINT_TAG })
    expect(assignBugToColumn(bug)).toBe('todo')
  })

  it('should assign UNCONFIRMED status with sprint tag to todo', () => {
    const bug = createBug({ status: 'UNCONFIRMED', whiteboard: `[other] ${SPRINT_TAG}` })
    expect(assignBugToColumn(bug)).toBe('todo')
  })

  it('should assign NEW with sprint tag among other tags to todo', () => {
    const bug = createBug({ status: 'NEW', whiteboard: `[tag1] ${SPRINT_TAG} [tag2]` })
    expect(assignBugToColumn(bug)).toBe('todo')
  })

  it('should assign ASSIGNED status to in-progress (regardless of whiteboard)', () => {
    const bug = createBug({ status: 'ASSIGNED', whiteboard: '' })
    expect(assignBugToColumn(bug)).toBe('in-progress')
  })

  it('should assign ASSIGNED with sprint tag to in-progress', () => {
    const bug = createBug({ status: 'ASSIGNED', whiteboard: SPRINT_TAG })
    expect(assignBugToColumn(bug)).toBe('in-progress')
  })

  it('should assign IN_PROGRESS status to in-progress', () => {
    const bug = createBug({ status: 'IN_PROGRESS' })
    expect(assignBugToColumn(bug)).toBe('in-progress')
  })

  it('should assign VERIFIED status to done', () => {
    const bug = createBug({ status: 'VERIFIED' })
    expect(assignBugToColumn(bug)).toBe('done')
  })

  it('should assign CLOSED status to done', () => {
    const bug = createBug({ status: 'CLOSED' })
    expect(assignBugToColumn(bug)).toBe('done')
  })
})
