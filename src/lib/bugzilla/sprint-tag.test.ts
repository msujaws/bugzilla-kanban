import { describe, it, expect } from 'vitest'
import { hasSprintTag, addSprintTag, removeSprintTag, SPRINT_TAG } from './sprint-tag'

describe('sprint-tag', () => {
  describe('SPRINT_TAG constant', () => {
    it('should be [bzkanban-sprint]', () => {
      expect(SPRINT_TAG).toBe('[bzkanban-sprint]')
    })
  })

  describe('hasSprintTag', () => {
    it('should return true when whiteboard contains [bzkanban-sprint]', () => {
      expect(hasSprintTag('[bzkanban-sprint]')).toBe(true)
    })

    it('should return true when whiteboard contains sprint tag among other tags', () => {
      expect(hasSprintTag('[other-tag] [bzkanban-sprint] [another-tag]')).toBe(true)
    })

    it('should return false when whiteboard is empty', () => {
      expect(hasSprintTag('')).toBe(false)
    })

    it('should return false when whiteboard has other tags but not sprint', () => {
      expect(hasSprintTag('[kanban] [other-tag]')).toBe(false)
    })

    it('should return false when whiteboard is similar but not exact match', () => {
      expect(hasSprintTag('[bzkanban-sprint-old]')).toBe(false)
      expect(hasSprintTag('[bzkanban-sprints]')).toBe(false)
    })

    it('should handle whitespace variations', () => {
      expect(hasSprintTag('  [bzkanban-sprint]  ')).toBe(true)
      expect(hasSprintTag('[bzkanban-sprint] ')).toBe(true)
    })
  })

  describe('addSprintTag', () => {
    it('should add tag to empty whiteboard', () => {
      expect(addSprintTag('')).toBe('[bzkanban-sprint]')
    })

    it('should append tag to existing whiteboard', () => {
      expect(addSprintTag('[other-tag]')).toBe('[other-tag] [bzkanban-sprint]')
    })

    it('should not duplicate if already present', () => {
      expect(addSprintTag('[bzkanban-sprint]')).toBe('[bzkanban-sprint]')
    })

    it('should not duplicate if already present among other tags', () => {
      expect(addSprintTag('[other] [bzkanban-sprint] [another]')).toBe(
        '[other] [bzkanban-sprint] [another]',
      )
    })

    it('should trim whitespace before adding', () => {
      expect(addSprintTag('  [other-tag]  ')).toBe('[other-tag] [bzkanban-sprint]')
    })
  })

  describe('removeSprintTag', () => {
    it('should remove tag from whiteboard', () => {
      expect(removeSprintTag('[bzkanban-sprint]')).toBe('')
    })

    it('should handle whiteboard with only the sprint tag', () => {
      expect(removeSprintTag('[bzkanban-sprint]')).toBe('')
    })

    it('should preserve other tags', () => {
      expect(removeSprintTag('[other] [bzkanban-sprint] [another]')).toBe('[other] [another]')
    })

    it('should handle tag at the beginning', () => {
      expect(removeSprintTag('[bzkanban-sprint] [other]')).toBe('[other]')
    })

    it('should handle tag at the end', () => {
      expect(removeSprintTag('[other] [bzkanban-sprint]')).toBe('[other]')
    })

    it('should return empty string when removing from empty whiteboard', () => {
      expect(removeSprintTag('')).toBe('')
    })

    it('should return original if tag not present', () => {
      expect(removeSprintTag('[other-tag]')).toBe('[other-tag]')
    })

    it('should normalize whitespace after removal', () => {
      expect(removeSprintTag('[a]  [bzkanban-sprint]  [b]')).toBe('[a] [b]')
    })
  })
})
