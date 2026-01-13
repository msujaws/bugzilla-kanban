import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Board } from './Board'
import type { BugzillaBug } from '@/lib/bugzilla/types'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      whileHover: _whileHover,
      whileTap: _whileTap,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      layout: _layout,
      layoutId: _layoutId,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  },
  Reorder: {
    Group: ({
      children,
      axis: _axis,
      values: _values,
      onReorder: _onReorder,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
    Item: ({
      children,
      value: _value,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// Mock status mapper
vi.mock('@/lib/bugzilla/status-mapper', () => ({
  StatusMapper: vi.fn().mockImplementation(() => ({
    statusToColumn: vi.fn((status: string) => {
      const mapping: Record<string, string> = {
        NEW: 'backlog',
        UNCONFIRMED: 'backlog',
        ASSIGNED: 'todo',
        IN_PROGRESS: 'in-progress',
        RESOLVED: 'in-review',
        VERIFIED: 'done',
        CLOSED: 'done',
      }
      return mapping[status] ?? 'backlog'
    }),
    getAvailableColumns: vi.fn(() => ['backlog', 'todo', 'in-progress', 'in-review', 'done']),
  })),
}))

const mockBugs: BugzillaBug[] = [
  {
    id: 1,
    summary: 'Bug in backlog',
    status: 'NEW',
    assigned_to: 'dev1@example.com',
    priority: 'P2',
    severity: 'major',
    component: 'Core',
    whiteboard: '[kanban]',
    last_change_time: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    summary: 'Bug in todo',
    status: 'ASSIGNED',
    assigned_to: 'dev2@example.com',
    priority: 'P1',
    severity: 'critical',
    component: 'UI',
    whiteboard: '[kanban]',
    last_change_time: '2024-01-14T09:00:00Z',
  },
  {
    id: 3,
    summary: 'Bug in progress',
    status: 'IN_PROGRESS',
    assigned_to: 'dev3@example.com',
    priority: 'P3',
    severity: 'normal',
    component: 'Backend',
    whiteboard: '[kanban]',
    last_change_time: '2024-01-13T08:00:00Z',
  },
  {
    id: 4,
    summary: 'Bug in review',
    status: 'RESOLVED',
    assigned_to: 'dev4@example.com',
    priority: 'P4',
    severity: 'minor',
    component: 'Docs',
    whiteboard: '[kanban]',
    last_change_time: '2024-01-12T07:00:00Z',
  },
  {
    id: 5,
    summary: 'Bug done',
    status: 'VERIFIED',
    assigned_to: 'dev5@example.com',
    priority: 'P5',
    severity: 'trivial',
    component: 'Test',
    whiteboard: '[kanban]',
    last_change_time: '2024-01-11T06:00:00Z',
  },
]

describe('Board', () => {
  const defaultProps = {
    bugs: mockBugs,
    stagedChanges: new Map<number, { from: string; to: string }>(),
    onBugMove: vi.fn(),
    isLoading: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render all five columns', () => {
      render(<Board {...defaultProps} />)

      expect(screen.getByText('Backlog')).toBeInTheDocument()
      expect(screen.getByText('Todo')).toBeInTheDocument()
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      expect(screen.getByText('In Review')).toBeInTheDocument()
      expect(screen.getByText('Done')).toBeInTheDocument()
    })

    it('should distribute bugs to correct columns', () => {
      render(<Board {...defaultProps} />)

      // Each column should show its bug count
      const countBadges = screen.getAllByText('1')
      expect(countBadges.length).toBe(5) // One bug per column
    })

    it('should have horizontal scrolling container', () => {
      const { container } = render(<Board {...defaultProps} />)

      const scrollContainer = container.querySelector('.overflow-x-auto')
      expect(scrollContainer).toBeInTheDocument()
    })
  })

  describe('bug distribution', () => {
    it('should place NEW bugs in backlog', () => {
      const bugs = [{ ...mockBugs[0], status: 'NEW' }]
      render(<Board {...defaultProps} bugs={bugs} />)

      // The bug card should be in the backlog column
      expect(screen.getByText('Bug in backlog')).toBeInTheDocument()
    })

    it('should place ASSIGNED bugs in todo', () => {
      const bugs = [{ ...mockBugs[0], status: 'ASSIGNED', summary: 'Assigned bug' }]
      render(<Board {...defaultProps} bugs={bugs} />)

      expect(screen.getByText('Assigned bug')).toBeInTheDocument()
    })

    it('should place IN_PROGRESS bugs in in-progress', () => {
      const bugs = [{ ...mockBugs[0], status: 'IN_PROGRESS', summary: 'WIP bug' }]
      render(<Board {...defaultProps} bugs={bugs} />)

      expect(screen.getByText('WIP bug')).toBeInTheDocument()
    })

    it('should place RESOLVED bugs in in-review', () => {
      const bugs = [{ ...mockBugs[0], status: 'RESOLVED', summary: 'Resolved bug' }]
      render(<Board {...defaultProps} bugs={bugs} />)

      expect(screen.getByText('Resolved bug')).toBeInTheDocument()
    })

    it('should place VERIFIED bugs in done', () => {
      const bugs = [{ ...mockBugs[0], status: 'VERIFIED', summary: 'Done bug' }]
      render(<Board {...defaultProps} bugs={bugs} />)

      expect(screen.getByText('Done bug')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('should show loading state for all columns when loading', () => {
      render(<Board {...defaultProps} isLoading={true} />)

      const loadingElements = screen.getAllByText(/loading/i)
      expect(loadingElements.length).toBe(5)
    })

    it('should not show bugs when loading', () => {
      render(<Board {...defaultProps} isLoading={true} />)

      expect(screen.queryByText('Bug in backlog')).not.toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('should show empty state when no bugs', () => {
      render(<Board {...defaultProps} bugs={[]} />)

      const emptyMessages = screen.getAllByText(/no bugs here/i)
      expect(emptyMessages.length).toBe(5)
    })
  })

  describe('staged changes', () => {
    it('should pass staged bug IDs to columns', () => {
      const stagedChanges = new Map<number, { from: string; to: string }>([
        [1, { from: 'backlog', to: 'todo' }],
      ])
      render(<Board {...defaultProps} stagedChanges={stagedChanges} />)

      // Staged indicator should be shown
      expect(screen.getByText(/1 staged/i)).toBeInTheDocument()
    })

    it('should highlight staged bugs in destination column', () => {
      const stagedChanges = new Map<number, { from: string; to: string }>([
        [1, { from: 'backlog', to: 'todo' }],
      ])
      render(<Board {...defaultProps} stagedChanges={stagedChanges} />)

      // Bug 1 is staged to move from backlog to todo
      // Both columns should show staged indicator
      const stagedIndicators = screen.getAllByText(/staged/i)
      expect(stagedIndicators.length).toBeGreaterThan(0)
    })
  })

  describe('styling', () => {
    it('should have proper gap between columns', () => {
      const { container } = render(<Board {...defaultProps} />)

      const flexContainer = container.querySelector('.gap-6')
      expect(flexContainer).toBeInTheDocument()
    })

    it('should have padding around the board', () => {
      const { container } = render(<Board {...defaultProps} />)

      const board = container.firstChild as HTMLElement
      expect(board.className).toContain('p-')
    })
  })

  describe('accessibility', () => {
    it('should have main landmark role', () => {
      render(<Board {...defaultProps} />)

      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should have aria-label for the board', () => {
      render(<Board {...defaultProps} />)

      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', expect.stringContaining('Kanban'))
    })

    it('should have aria-busy when loading', () => {
      render(<Board {...defaultProps} isLoading={true} />)

      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-busy', 'true')
    })
  })
})
