import { describe, it, expect } from 'vitest'
import {
  getCurrentNightlyVersion,
  getNightlyVersionOptions,
  getIterationOptions,
  parseIterationVersion,
} from './nightly-version'
import { createFirefoxBetaVersion } from '@/types/branded'

describe('nightly-version', () => {
  describe('getCurrentNightlyVersion', () => {
    it('returns Beta + 1 for a date in the 150 beta cycle', () => {
      // 2026-04-06 is in Beta 150 → Nightly 151
      const version = getCurrentNightlyVersion(new Date('2026-04-06'))
      expect(version).toBe(151)
    })

    it('returns Beta + 1 for a date in the 152 beta cycle', () => {
      // 2026-05-20 is in Beta 152 → Nightly 153
      const version = getCurrentNightlyVersion(new Date('2026-05-20'))
      expect(version).toBe(153)
    })

    it('returns undefined when the date is outside the known schedule', () => {
      expect(getCurrentNightlyVersion(new Date('2025-01-01'))).toBeUndefined()
      expect(getCurrentNightlyVersion(new Date('2028-01-01'))).toBeUndefined()
    })
  })

  describe('getNightlyVersionOptions', () => {
    it('spans from the earliest known Nightly through current + 2', () => {
      // Earliest Beta in the schedule is 149 → earliest Nightly is 150.
      // Current Nightly 152 → upper bound = 154.
      const options = getNightlyVersionOptions(createFirefoxBetaVersion(152))
      expect(options).toEqual([150, 151, 152, 153, 154])
    })

    it('extends the upper bound when a future version is selected', () => {
      const options = getNightlyVersionOptions(
        createFirefoxBetaVersion(152),
        createFirefoxBetaVersion(158),
      )
      expect(options.at(-1)).toBe(158)
      expect(options[0]).toBe(150)
    })

    it('falls back to the earliest known when current Nightly is unknown', () => {
      const options = getNightlyVersionOptions()
      expect(options[0]).toBe(150)
    })
  })

  describe('getIterationOptions', () => {
    it('returns three iteration strings (.1, .2, .3) for the version', () => {
      expect(getIterationOptions(createFirefoxBetaVersion(152))).toEqual([
        '152.1',
        '152.2',
        '152.3',
      ])
    })
  })

  describe('parseIterationVersion', () => {
    it('extracts the integer version from a valid iteration string', () => {
      expect(parseIterationVersion('152.1')).toBe(152)
      expect(parseIterationVersion('150.0')).toBe(150)
    })

    it('returns undefined for an unparseable string', () => {
      expect(parseIterationVersion('garbage')).toBeUndefined()
      expect(parseIterationVersion('')).toBeUndefined()
    })
  })
})
