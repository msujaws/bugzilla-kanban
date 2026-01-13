import { describe, it, expect } from 'vitest'
import { formatAssignee, NOBODY_EMAIL } from './display-utils'

describe('formatAssignee', () => {
  it('should return "unassigned" for nobody@mozilla.org', () => {
    expect(formatAssignee('nobody@mozilla.org')).toBe('unassigned')
  })

  it('should return original email for other addresses', () => {
    expect(formatAssignee('developer@mozilla.org')).toBe('developer@mozilla.org')
  })

  it('should handle empty string', () => {
    expect(formatAssignee('')).toBe('')
  })

  it('should be case insensitive', () => {
    expect(formatAssignee('Nobody@Mozilla.Org')).toBe('unassigned')
    expect(formatAssignee('NOBODY@MOZILLA.ORG')).toBe('unassigned')
  })

  it('should export NOBODY_EMAIL constant', () => {
    expect(NOBODY_EMAIL).toBe('nobody@mozilla.org')
  })
})
