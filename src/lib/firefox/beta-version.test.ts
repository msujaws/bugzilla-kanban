import { describe, it, expect } from 'vitest'
import {
  getCurrentBetaVersion,
  getBetaStatusField,
  getBetaTrackingField,
  getBetaStatusDisplayName,
  getBetaTrackingDisplayName,
} from './beta-version'
import { createFirefoxBetaVersion } from '@/types/branded'

describe('beta-version', () => {
  describe('getCurrentBetaVersion', () => {
    it('should return 150 for a date in the 150 beta cycle', () => {
      const version = getCurrentBetaVersion(new Date('2026-04-06'))
      expect(version).toBe(150)
    })

    it('should return 150 on the start date of the cycle', () => {
      const version = getCurrentBetaVersion(new Date('2026-03-24'))
      expect(version).toBe(150)
    })

    it('should return 151 on the boundary date (start of next cycle)', () => {
      const version = getCurrentBetaVersion(new Date('2026-04-21'))
      expect(version).toBe(151)
    })

    it('should return 152 for a date in the 152 beta cycle', () => {
      const version = getCurrentBetaVersion(new Date('2026-05-20'))
      expect(version).toBe(152)
    })

    it('should return undefined for a date before the schedule', () => {
      const version = getCurrentBetaVersion(new Date('2025-01-01'))
      expect(version).toBeUndefined()
    })

    it('should return undefined for a date after the schedule', () => {
      const version = getCurrentBetaVersion(new Date('2028-01-01'))
      expect(version).toBeUndefined()
    })

    it('should return the last day of a cycle correctly', () => {
      // Day before 151 starts
      const version = getCurrentBetaVersion(new Date('2026-04-20'))
      expect(version).toBe(150)
    })
  })

  describe('getBetaStatusField', () => {
    it('should return the cf_status_firefox field name', () => {
      const version = createFirefoxBetaVersion(150)
      expect(getBetaStatusField(version)).toBe('cf_status_firefox150')
    })
  })

  describe('getBetaTrackingField', () => {
    it('should return the cf_tracking_firefox field name', () => {
      const version = createFirefoxBetaVersion(150)
      expect(getBetaTrackingField(version)).toBe('cf_tracking_firefox150')
    })
  })

  describe('getBetaStatusDisplayName', () => {
    it('should return the human-readable status flag name', () => {
      const version = createFirefoxBetaVersion(150)
      expect(getBetaStatusDisplayName(version)).toBe('status-firefox-150')
    })
  })

  describe('getBetaTrackingDisplayName', () => {
    it('should return the human-readable tracking flag name', () => {
      const version = createFirefoxBetaVersion(150)
      expect(getBetaTrackingDisplayName(version)).toBe('tracking-firefox-150')
    })
  })
})
