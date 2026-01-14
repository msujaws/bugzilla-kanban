import { describe, it, expect } from 'vitest'
import { getQeVerifyStatus, type QeVerifyStatus } from './qe-verify'
import type { BugzillaFlag } from './types'

describe('getQeVerifyStatus', () => {
  it('should return "unknown" when flags is undefined', () => {
    expect(getQeVerifyStatus()).toBe('unknown')
  })

  it('should return "unknown" when flags is empty array', () => {
    expect(getQeVerifyStatus([])).toBe('unknown')
  })

  it('should return "unknown" when no qe-verify flag exists', () => {
    const flags: BugzillaFlag[] = [{ name: 'needinfo', status: '?' }]
    expect(getQeVerifyStatus(flags)).toBe('unknown')
  })

  it('should return "unknown" when qe-verify has "?" status', () => {
    const flags: BugzillaFlag[] = [{ name: 'qe-verify', status: '?' }]
    expect(getQeVerifyStatus(flags)).toBe('unknown')
  })

  it('should return "minus" when qe-verify has "-" status', () => {
    const flags: BugzillaFlag[] = [{ name: 'qe-verify', status: '-' }]
    expect(getQeVerifyStatus(flags)).toBe('minus')
  })

  it('should return "plus" when qe-verify has "+" status', () => {
    const flags: BugzillaFlag[] = [{ name: 'qe-verify', status: '+' }]
    expect(getQeVerifyStatus(flags)).toBe('plus')
  })

  it('should find qe-verify flag among other flags', () => {
    const flags: BugzillaFlag[] = [
      { name: 'needinfo', status: '?' },
      { name: 'qe-verify', status: '+' },
      { name: 'approval-mozilla-release', status: '-' },
    ]
    expect(getQeVerifyStatus(flags)).toBe('plus')
  })
})

describe('QeVerifyStatus type', () => {
  it('should be a union of "unknown", "minus", and "plus"', () => {
    // Type checking only - these should compile without error
    const unknown: QeVerifyStatus = 'unknown'
    const minus: QeVerifyStatus = 'minus'
    const plus: QeVerifyStatus = 'plus'

    expect([unknown, minus, plus]).toEqual(['unknown', 'minus', 'plus'])
  })
})
