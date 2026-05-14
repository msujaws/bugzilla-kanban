import { describe, it, expect } from 'vitest'
import {
  formatTargetMilestone,
  getMilestoneCandidatesForCycle,
  matchesCycle,
  MOZILLA_PREFIX_PRODUCTS,
} from './target-milestone'
import { createFirefoxBetaVersion } from '@/types/branded'

describe('target-milestone', () => {
  const v152 = createFirefoxBetaVersion(152)

  describe('MOZILLA_PREFIX_PRODUCTS', () => {
    it('includes Core and Toolkit', () => {
      expect(MOZILLA_PREFIX_PRODUCTS.has('Core')).toBe(true)
      expect(MOZILLA_PREFIX_PRODUCTS.has('Toolkit')).toBe(true)
    })
  })

  describe('formatTargetMilestone', () => {
    it('uses the Firefox prefix for the Firefox product', () => {
      expect(formatTargetMilestone(v152, 'Firefox')).toBe('Firefox 152')
    })

    it('uses the mozilla prefix for Core', () => {
      expect(formatTargetMilestone(v152, 'Core')).toBe('mozilla152')
    })

    it('uses the mozilla prefix for Toolkit', () => {
      expect(formatTargetMilestone(v152, 'Toolkit')).toBe('mozilla152')
    })

    it('defaults to the Firefox prefix when the product is unknown or missing', () => {
      expect(formatTargetMilestone(v152)).toBe('Firefox 152')
      expect(formatTargetMilestone(v152, 'DevTools')).toBe('Firefox 152')
    })
  })

  describe('getMilestoneCandidatesForCycle', () => {
    it('returns the three Mozilla naming forms', () => {
      expect(getMilestoneCandidatesForCycle(v152)).toEqual([
        'Firefox 152',
        'mozilla152',
        '152 Branch',
      ])
    })
  })

  describe('matchesCycle', () => {
    it('accepts any of the three naming forms', () => {
      expect(matchesCycle('Firefox 152', v152)).toBe(true)
      expect(matchesCycle('mozilla152', v152)).toBe(true)
      expect(matchesCycle('152 Branch', v152)).toBe(true)
    })

    it('rejects other cycles', () => {
      expect(matchesCycle('Firefox 153', v152)).toBe(false)
      expect(matchesCycle('mozilla153', v152)).toBe(false)
      expect(matchesCycle('153 Branch', v152)).toBe(false)
    })

    it('rejects undefined, empty, or blank sentinel values', () => {
      expect(matchesCycle(undefined, v152)).toBe(false)
      expect(matchesCycle('', v152)).toBe(false)
      // The blank sentinel is included in queries (for discoverability) but is
      // explicitly NOT a member of any cycle.
      expect(matchesCycle('---', v152)).toBe(false)
    })
  })
})
