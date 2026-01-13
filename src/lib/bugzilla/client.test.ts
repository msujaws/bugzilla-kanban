import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { BugzillaClient } from './client'
import type { BugzillaBug } from './types'
import { createApiKey, createBugId } from '@/types/branded'

describe('BugzillaClient', () => {
  let client: BugzillaClient
  const mockApiKey = createApiKey('test-api-key-123')
  const baseUrl = '/api/bugzilla' // Using proxy URL

  beforeEach(() => {
    client = new BugzillaClient(mockApiKey)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getBugs', () => {
    it('should fetch bugs with whiteboard tag filter', async () => {
      const mockBugs: BugzillaBug[] = [
        {
          id: 123_456,
          summary: 'Test bug',
          status: 'NEW',
          assigned_to: 'test@mozilla.com',
          priority: 'P1',
          severity: 'S1',
          component: 'General',
          whiteboard: '[kanban]',
          last_change_time: '2026-01-12T00:00:00Z',
          creation_time: '2026-01-01T00:00:00Z',
        },
      ]

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ bugs: mockBugs }),
      })

      const result = await client.getBugs({ whiteboardTag: 'kanban' })

      expect(result).toEqual(mockBugs)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${baseUrl}/bug`),
        expect.objectContaining({
          headers: {
            'X-BUGZILLA-API-KEY': mockApiKey,
            'Content-Type': 'application/json',
          },
        }),
      )
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('whiteboard=kanban'),
        expect.anything(),
      )
    })

    it('should fetch bugs with component filter', async () => {
      const mockBugs: BugzillaBug[] = []

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ bugs: mockBugs }),
      })

      await client.getBugs({ component: 'Frontend' })

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('component=Frontend'),
        expect.anything(),
      )
    })

    it('should fetch bugs with status filter', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ bugs: [] }),
      })

      await client.getBugs({ status: ['NEW', 'ASSIGNED'] })

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('status=NEW'), expect.anything())
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=ASSIGNED'),
        expect.anything(),
      )
    })

    it('should combine multiple filters', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ bugs: [] }),
      })

      await client.getBugs({
        whiteboardTag: 'kanban',
        component: 'Frontend',
        status: ['NEW'],
      })

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('whiteboard=kanban'),
        expect.anything(),
      )
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('component=Frontend'),
        expect.anything(),
      )
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('status=NEW'), expect.anything())
    })

    it('should throw error on 401 Unauthorized', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            error: true,
            message: 'Invalid API key',
            code: 401,
          }),
      })

      await expect(client.getBugs({ whiteboardTag: 'kanban' })).rejects.toThrow(
        'Unauthorized: Invalid API key',
      )
    })

    it('should throw error on 404 Not Found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({
            error: true,
            message: 'Not found',
            code: 404,
          }),
      })

      await expect(client.getBugs({ whiteboardTag: 'kanban' })).rejects.toThrow('Not Found')
    })

    it('should throw error on 500 Server Error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            error: true,
            message: 'Internal server error',
            code: 500,
          }),
      })

      await expect(client.getBugs({ whiteboardTag: 'kanban' })).rejects.toThrow(
        'Internal server error',
      )
    })

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(client.getBugs({ whiteboardTag: 'kanban' })).rejects.toThrow('Network error')
    })

    it('should handle timeout', async () => {
      // Mock AbortController
      const mockAbort = vi.fn()
      const mockController = {
        signal: {} as AbortSignal,
        abort: mockAbort,
      }

      vi.spyOn(global, 'AbortController').mockImplementation(
        () => mockController as AbortController,
      )

      global.fetch = vi.fn().mockImplementation(() => {
        const error = new Error('The operation was aborted')
        error.name = 'AbortError'
        return Promise.reject(error)
      })

      await expect(client.getBugs({ whiteboardTag: 'kanban' })).rejects.toThrow(
        'Request timeout after 30 seconds',
      )
    })
  })

  describe('updateBug', () => {
    it('should update bug status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ bugs: [{ id: 123_456, changes: {} }] }),
      })

      const bugId = createBugId(123_456)
      await client.updateBug(bugId, { status: 'ASSIGNED' })

      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/bug/123456`,
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'X-BUGZILLA-API-KEY': mockApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'ASSIGNED' }),
        }),
      )
    })

    it('should throw error on failed update', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: true,
            message: 'Invalid status',
            code: 400,
          }),
      })

      const bugId = createBugId(123_456)
      await expect(client.updateBug(bugId, { status: 'INVALID' })).rejects.toThrow()
    })
  })

  describe('batchUpdateBugs', () => {
    it('should update multiple bugs', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ bugs: [{ id: 1, changes: {} }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ bugs: [{ id: 2, changes: {} }] }),
        })

      const updates = [
        { id: 1, status: 'ASSIGNED' },
        { id: 2, status: 'IN_PROGRESS' },
      ]

      const result = await client.batchUpdateBugs(updates)

      expect(result.successful).toEqual([1, 2])
      expect(result.failed).toEqual([])
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('should handle partial failures', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ bugs: [{ id: 1, changes: {} }] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: true, message: 'Invalid status', code: 400 }),
        })

      const updates = [
        { id: 1, status: 'ASSIGNED' },
        { id: 2, status: 'INVALID' },
      ]

      const result = await client.batchUpdateBugs(updates)

      expect(result.successful).toEqual([1])
      expect(result.failed).toHaveLength(1)
      expect(result.failed[0]?.id).toBe(2)
    })

    it('should return empty arrays for empty input', async () => {
      const result = await client.batchUpdateBugs([])

      expect(result.successful).toEqual([])
      expect(result.failed).toEqual([])
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should send assigned_to when updating assignee', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ bugs: [{ id: 1, changes: {} }] }),
      })

      const updates = [{ id: 1, assigned_to: 'newuser@mozilla.com' }]

      await client.batchUpdateBugs(updates)

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ assigned_to: 'newuser@mozilla.com' }),
        }),
      )
    })

    it('should send both status and assigned_to when both are provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ bugs: [{ id: 1, changes: {} }] }),
      })

      const updates = [{ id: 1, status: 'ASSIGNED', assigned_to: 'newuser@mozilla.com' }]

      await client.batchUpdateBugs(updates)

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ status: 'ASSIGNED', assigned_to: 'newuser@mozilla.com' }),
        }),
      )
    })

    it('should send resolution when provided with RESOLVED status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ bugs: [{ id: 1, changes: {} }] }),
      })

      const updates = [{ id: 1, status: 'RESOLVED', resolution: 'FIXED' }]

      await client.batchUpdateBugs(updates)

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ status: 'RESOLVED', resolution: 'FIXED' }),
        }),
      )
    })

    it('should send whiteboard when provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ bugs: [{ id: 1, changes: {} }] }),
      })

      const updates = [{ id: 1, whiteboard: '[bzkanban-sprint] [other-tag]' }]

      await client.batchUpdateBugs(updates)

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ whiteboard: '[bzkanban-sprint] [other-tag]' }),
        }),
      )
    })

    it('should send cf_fx_points when provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ bugs: [{ id: 1, changes: {} }] }),
      })

      const updates = [{ id: 1, cf_fx_points: 5 }]

      await client.batchUpdateBugs(updates)

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ cf_fx_points: 5 }),
        }),
      )
    })

    it('should send cf_fx_points as string when provided as string', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ bugs: [{ id: 1, changes: {} }] }),
      })

      const updates = [{ id: 1, cf_fx_points: '?' }]

      await client.batchUpdateBugs(updates)

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ cf_fx_points: '?' }),
        }),
      )
    })

    it('should send priority when provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ bugs: [{ id: 1, changes: {} }] }),
      })

      const updates = [{ id: 1, priority: 'P1' }]

      await client.batchUpdateBugs(updates)

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ priority: 'P1' }),
        }),
      )
    })

    it('should send multiple new fields together', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ bugs: [{ id: 1, changes: {} }] }),
      })

      const updates = [{ id: 1, whiteboard: '[sprint]', cf_fx_points: 3, priority: 'P2' }]

      await client.batchUpdateBugs(updates)

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ whiteboard: '[sprint]', cf_fx_points: 3, priority: 'P2' }),
        }),
      )
    })
  })
})
