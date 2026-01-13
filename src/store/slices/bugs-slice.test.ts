import { describe, it, expect, beforeEach, vi } from 'vitest'
import { create } from 'zustand'
import { createBugsSlice } from './bugs-slice'
import type { BugsSlice } from './bugs-slice'
import type { BugzillaBug } from '@/lib/bugzilla/types'
import { createApiKey } from '@/types/branded'

// Mock BugzillaClient
const mockGetBugs = vi.fn()

vi.mock('@/lib/bugzilla/client', () => ({
  BugzillaClient: vi.fn().mockImplementation(() => ({
    getBugs: mockGetBugs,
  })),
}))

const mockBugs: BugzillaBug[] = [
  {
    id: 1,
    summary: 'Test bug 1',
    status: 'NEW',
    assigned_to: 'dev@example.com',
    priority: 'P2',
    severity: 'major',
    component: 'Core',
    whiteboard: '[kanban]',
    last_change_time: '2024-01-15T10:00:00Z',
    creation_time: '2024-01-01T00:00:00Z',
    groups: [],
  },
  {
    id: 2,
    summary: 'Test bug 2',
    status: 'ASSIGNED',
    assigned_to: 'dev2@example.com',
    priority: 'P1',
    severity: 'critical',
    component: 'UI',
    whiteboard: '[kanban]',
    last_change_time: '2024-01-14T09:00:00Z',
    creation_time: '2024-01-01T00:00:00Z',
    groups: [],
  },
]

const mockBugsWithSecurity: BugzillaBug[] = [
  {
    id: 1,
    summary: 'Public bug',
    status: 'NEW',
    assigned_to: 'dev@example.com',
    priority: 'P2',
    severity: 'major',
    component: 'Core',
    whiteboard: '[kanban]',
    last_change_time: '2024-01-15T10:00:00Z',
    creation_time: '2024-01-01T00:00:00Z',
    groups: [],
  },
  {
    id: 2,
    summary: 'Security bug',
    status: 'NEW',
    assigned_to: 'dev@example.com',
    priority: 'P1',
    severity: 'critical',
    component: 'Core',
    whiteboard: '[kanban]',
    last_change_time: '2024-01-15T10:00:00Z',
    creation_time: '2024-01-01T00:00:00Z',
    groups: ['core-security'],
  },
  {
    id: 3,
    summary: 'Confidential bug',
    status: 'ASSIGNED',
    assigned_to: 'dev2@example.com',
    priority: 'P1',
    severity: 'major',
    component: 'UI',
    whiteboard: '[kanban]',
    last_change_time: '2024-01-14T09:00:00Z',
    creation_time: '2024-01-01T00:00:00Z',
    groups: ['mozilla-corporation-confidential'],
  },
]

const testApiKey = createApiKey('test-api-key')

describe('BugsSlice', () => {
  let useStore: ReturnType<typeof create<BugsSlice>>

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetBugs.mockResolvedValue(mockBugs)

    useStore = create<BugsSlice>()((...args) => ({
      ...createBugsSlice(...args),
    }))
  })

  describe('initial state', () => {
    it('should have empty bugs array initially', () => {
      const { bugs } = useStore.getState()
      expect(bugs).toEqual([])
    })

    it('should have isLoading false initially', () => {
      const { isLoading } = useStore.getState()
      expect(isLoading).toBe(false)
    })

    it('should have error null initially', () => {
      const { error } = useStore.getState()
      expect(error).toBeNull()
    })

    it('should have empty filters initially', () => {
      const { filters } = useStore.getState()
      expect(filters.whiteboardTag).toBe('')
      expect(filters.component).toBe('')
    })
  })

  describe('fetchBugs', () => {
    it('should set isLoading to true while fetching', async () => {
      const { fetchBugs } = useStore.getState()

      // Start fetch but don't await
      const promise = fetchBugs(testApiKey)

      const { isLoading } = useStore.getState()
      expect(isLoading).toBe(true)

      await promise
    })

    it('should set isLoading to false after fetching', async () => {
      const { fetchBugs } = useStore.getState()

      await fetchBugs(testApiKey)

      const { isLoading } = useStore.getState()
      expect(isLoading).toBe(false)
    })

    it('should store fetched bugs', async () => {
      const { fetchBugs } = useStore.getState()

      await fetchBugs(testApiKey)

      const { bugs } = useStore.getState()
      expect(bugs).toEqual(mockBugs)
    })

    it('should clear error on successful fetch', async () => {
      // Set an initial error
      useStore.setState({ error: 'Previous error' })

      const { fetchBugs } = useStore.getState()
      await fetchBugs(testApiKey)

      const { error } = useStore.getState()
      expect(error).toBeNull()
    })

    it('should set error on fetch failure', async () => {
      mockGetBugs.mockRejectedValueOnce(new Error('Network error'))

      const { fetchBugs } = useStore.getState()
      await fetchBugs(testApiKey)

      const { error, bugs } = useStore.getState()
      expect(error).toBe('Network error')
      expect(bugs).toEqual([])
    })

    it('should pass filters to BugzillaClient', async () => {
      useStore.setState({
        filters: { whiteboardTag: '[kanban]', component: 'Core' },
      })

      const { fetchBugs } = useStore.getState()
      await fetchBugs(testApiKey)

      expect(mockGetBugs).toHaveBeenCalledWith({
        whiteboardTag: '[kanban]',
        component: 'Core',
      })
    })

    it('should filter out security and confidential bugs', async () => {
      mockGetBugs.mockResolvedValueOnce(mockBugsWithSecurity)

      const { fetchBugs } = useStore.getState()
      await fetchBugs(testApiKey)

      const { bugs } = useStore.getState()
      // Should only have the public bug (id: 1)
      expect(bugs).toHaveLength(1)
      expect(bugs[0].id).toBe(1)
      expect(bugs[0].summary).toBe('Public bug')
    })

    it('should keep bugs with empty groups array', async () => {
      const publicBugs: BugzillaBug[] = [
        { ...mockBugs[0], groups: [] },
        { ...mockBugs[1], groups: [] },
      ]
      mockGetBugs.mockResolvedValueOnce(publicBugs)

      const { fetchBugs } = useStore.getState()
      await fetchBugs(testApiKey)

      const { bugs } = useStore.getState()
      expect(bugs).toHaveLength(2)
    })

    it('should keep bugs with undefined groups', async () => {
      const publicBugs: BugzillaBug[] = [
        { ...mockBugs[0], groups: undefined },
        { ...mockBugs[1], groups: undefined },
      ]
      mockGetBugs.mockResolvedValueOnce(publicBugs)

      const { fetchBugs } = useStore.getState()
      await fetchBugs(testApiKey)

      const { bugs } = useStore.getState()
      expect(bugs).toHaveLength(2)
    })
  })

  describe('refreshBugs', () => {
    it('should refetch bugs with same filters', async () => {
      const { fetchBugs, refreshBugs } = useStore.getState()

      // Initial fetch
      await fetchBugs(testApiKey)
      expect(mockGetBugs).toHaveBeenCalledTimes(1)

      // Refresh
      await refreshBugs()
      expect(mockGetBugs).toHaveBeenCalledTimes(2)
    })

    it('should use stored API key for refresh', async () => {
      const { fetchBugs, refreshBugs } = useStore.getState()

      await fetchBugs(createApiKey('my-api-key'))
      mockGetBugs.mockClear()

      await refreshBugs()
      expect(mockGetBugs).toHaveBeenCalled()
    })

    it('should not fetch if no API key stored', async () => {
      const { refreshBugs } = useStore.getState()

      await refreshBugs()

      expect(mockGetBugs).not.toHaveBeenCalled()
    })
  })

  describe('setFilters', () => {
    it('should update whiteboard tag filter', () => {
      const { setFilters } = useStore.getState()

      setFilters({ whiteboardTag: '[kanban]' })

      const { filters } = useStore.getState()
      expect(filters.whiteboardTag).toBe('[kanban]')
    })

    it('should update component filter', () => {
      const { setFilters } = useStore.getState()

      setFilters({ component: 'Core' })

      const { filters } = useStore.getState()
      expect(filters.component).toBe('Core')
    })

    it('should merge with existing filters', () => {
      const { setFilters } = useStore.getState()

      setFilters({ whiteboardTag: '[kanban]' })
      setFilters({ component: 'Core' })

      const { filters } = useStore.getState()
      expect(filters.whiteboardTag).toBe('[kanban]')
      expect(filters.component).toBe('Core')
    })

    it('should allow clearing filters', () => {
      const { setFilters } = useStore.getState()

      setFilters({ whiteboardTag: '[kanban]', component: 'Core' })
      setFilters({ whiteboardTag: '', component: '' })

      const { filters } = useStore.getState()
      expect(filters.whiteboardTag).toBe('')
      expect(filters.component).toBe('')
    })
  })

  describe('clearBugs', () => {
    it('should clear all bugs', async () => {
      const { fetchBugs, clearBugs } = useStore.getState()

      await fetchBugs(testApiKey)
      expect(useStore.getState().bugs.length).toBe(2)

      clearBugs()
      expect(useStore.getState().bugs).toEqual([])
    })

    it('should clear error', () => {
      useStore.setState({ error: 'Some error' })

      const { clearBugs } = useStore.getState()
      clearBugs()

      expect(useStore.getState().error).toBeNull()
    })
  })

  describe('getBugById', () => {
    it('should return bug by ID', async () => {
      const { fetchBugs, getBugById } = useStore.getState()

      await fetchBugs(testApiKey)

      const bug = getBugById(1)
      expect(bug).toEqual(mockBugs[0])
    })

    it('should return undefined for non-existent bug', async () => {
      const { fetchBugs, getBugById } = useStore.getState()

      await fetchBugs(testApiKey)

      const bug = getBugById(999)
      expect(bug).toBeUndefined()
    })
  })
})
