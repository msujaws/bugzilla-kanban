import { describe, it, expect, beforeEach } from 'vitest'
import { StatusMapper } from './status-mapper'

describe('StatusMapper', () => {
  let mapper: StatusMapper

  beforeEach(() => {
    mapper = new StatusMapper()
  })

  describe('statusToColumn', () => {
    it('should map NEW to backlog', () => {
      expect(mapper.statusToColumn('NEW')).toBe('backlog')
    })

    it('should map UNCONFIRMED to backlog', () => {
      expect(mapper.statusToColumn('UNCONFIRMED')).toBe('backlog')
    })

    it('should map ASSIGNED to todo', () => {
      expect(mapper.statusToColumn('ASSIGNED')).toBe('todo')
    })

    it('should map IN_PROGRESS to in-progress', () => {
      expect(mapper.statusToColumn('IN_PROGRESS')).toBe('in-progress')
    })

    it('should map RESOLVED to done', () => {
      expect(mapper.statusToColumn('RESOLVED')).toBe('done')
    })

    it('should map VERIFIED to done', () => {
      expect(mapper.statusToColumn('VERIFIED')).toBe('done')
    })

    it('should map CLOSED to done', () => {
      expect(mapper.statusToColumn('CLOSED')).toBe('done')
    })

    it('should handle case-insensitive status', () => {
      expect(mapper.statusToColumn('new')).toBe('backlog')
      expect(mapper.statusToColumn('New')).toBe('backlog')
      expect(mapper.statusToColumn('ASSIGNED')).toBe('todo')
    })

    it('should return backlog for unknown status', () => {
      expect(mapper.statusToColumn('UNKNOWN_STATUS')).toBe('backlog')
    })
  })

  describe('columnToStatus', () => {
    it('should map backlog to NEW', () => {
      expect(mapper.columnToStatus('backlog')).toBe('NEW')
    })

    it('should map todo to ASSIGNED', () => {
      expect(mapper.columnToStatus('todo')).toBe('ASSIGNED')
    })

    it('should map in-progress to IN_PROGRESS', () => {
      expect(mapper.columnToStatus('in-progress')).toBe('IN_PROGRESS')
    })

    it('should map done to RESOLVED', () => {
      expect(mapper.columnToStatus('done')).toBe('RESOLVED')
    })

    it('should throw error for unknown column', () => {
      expect(() => mapper.columnToStatus('unknown-column')).toThrow(
        'Unknown column: unknown-column',
      )
    })
  })

  describe('getAvailableColumns', () => {
    it('should return all available columns', () => {
      const columns = mapper.getAvailableColumns()

      expect(columns).toEqual(['backlog', 'todo', 'in-progress', 'done'])
    })

    it('should return a new array each time', () => {
      const columns1 = mapper.getAvailableColumns()
      const columns2 = mapper.getAvailableColumns()

      expect(columns1).toEqual(columns2)
      expect(columns1).not.toBe(columns2) // Different array instances
    })
  })

  describe('getStatusesForColumn', () => {
    it('should return all statuses for backlog column', () => {
      const statuses = mapper.getStatusesForColumn('backlog')

      expect(statuses).toEqual(['UNCONFIRMED', 'NEW'])
    })

    it('should return all statuses for todo column', () => {
      const statuses = mapper.getStatusesForColumn('todo')

      expect(statuses).toEqual(['ASSIGNED'])
    })

    it('should return all statuses for in-progress column', () => {
      const statuses = mapper.getStatusesForColumn('in-progress')

      expect(statuses).toEqual(['IN_PROGRESS'])
    })

    it('should return all statuses for done column', () => {
      const statuses = mapper.getStatusesForColumn('done')

      expect(statuses).toEqual(['RESOLVED', 'VERIFIED', 'CLOSED'])
    })

    it('should return empty array for unknown column', () => {
      const statuses = mapper.getStatusesForColumn('unknown-column')

      expect(statuses).toEqual([])
    })
  })

  describe('isValidColumn', () => {
    it('should return true for valid columns', () => {
      expect(mapper.isValidColumn('backlog')).toBe(true)
      expect(mapper.isValidColumn('todo')).toBe(true)
      expect(mapper.isValidColumn('in-progress')).toBe(true)
      expect(mapper.isValidColumn('done')).toBe(true)
    })

    it('should return false for invalid columns', () => {
      expect(mapper.isValidColumn('invalid')).toBe(false)
      expect(mapper.isValidColumn('')).toBe(false)
      expect(mapper.isValidColumn('BACKLOG')).toBe(false) // Case-sensitive
    })
  })
})
