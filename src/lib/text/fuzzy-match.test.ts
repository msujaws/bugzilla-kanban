import { describe, it, expect } from 'vitest'
import { fuzzyMatch, levenshteinDistance } from './fuzzy-match'

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0)
  })

  it('returns 1 for a single substitution', () => {
    expect(levenshteinDistance('cat', 'bat')).toBe(1)
  })

  it('returns 1 for a single insertion', () => {
    expect(levenshteinDistance('cat', 'cats')).toBe(1)
  })

  it('returns 1 for a single deletion', () => {
    expect(levenshteinDistance('cats', 'cat')).toBe(1)
  })

  it('returns length when comparing to empty', () => {
    expect(levenshteinDistance('hello', '')).toBe(5)
    expect(levenshteinDistance('', 'hello')).toBe(5)
  })
})

describe('fuzzyMatch', () => {
  it('returns true when the query is a substring', () => {
    expect(fuzzyMatch('Fix telemetry pings on shutdown', 'telemetry')).toBe(true)
  })

  it('is case insensitive', () => {
    expect(fuzzyMatch('Fix Telemetry pings', 'TELEMETRY')).toBe(true)
  })

  it('tolerates a single-character typo', () => {
    // "telmetry" → "telemetry" (one missing letter)
    expect(fuzzyMatch('Fix telemetry pings on shutdown', 'telmetry')).toBe(true)
  })

  it('returns false for a query with no resemblance', () => {
    expect(fuzzyMatch('Fix telemetry pings on shutdown', 'zebra')).toBe(false)
  })

  it('requires all whitespace-separated tokens to match', () => {
    expect(fuzzyMatch('Update the bookmarks toolbar', 'bookmarks toolbar')).toBe(true)
    expect(fuzzyMatch('Update the bookmarks toolbar', 'bookmarks zebra')).toBe(false)
  })

  it('returns true for an empty query', () => {
    expect(fuzzyMatch('anything', '')).toBe(true)
  })

  it('handles short tokens conservatively (no fuzz for 1-2 char queries)', () => {
    // "ab" should not fuzzy-match "xy" just because they're short.
    expect(fuzzyMatch('xy zebra', 'ab')).toBe(false)
  })
})
