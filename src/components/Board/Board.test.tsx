import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Board } from './Board'
import type { BugzillaBug } from '@/lib/bugzilla/types'
import type { StagedChange } from '@/store/slices/staged-slice'

// Set system time to match test data dates (so done bugs are within 2 weeks)
beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
})

afterAll(() => {
  vi.useRealTimers()
})

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
        RESOLVED: 'done',
        VERIFIED: 'done',
        CLOSED: 'done',
      }
      return mapping[status] ?? 'backlog'
    }),
    getAvailableColumns: vi.fn(() => ['backlog', 'todo', 'in-progress', 'in-testing', 'done']),
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
    status: 'NEW', // NEW with sprint tag goes to todo
    assigned_to: 'dev2@example.com',
    priority: 'P1',
    severity: 'critical',
    component: 'UI',
    whiteboard: '[kanban] [bzkanban-sprint]', // Sprint tag puts it in todo
    last_change_time: '2024-01-14T09:00:00Z',
  },
  {
    id: 3,
    summary: 'Bug in progress',
    status: 'ASSIGNED', // ASSIGNED goes to in-progress now
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
    stagedChanges: new Map<number, StagedChange>(),
    onBugMove: vi.fn(),
    isLoading: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render four board columns (excluding backlog)', () => {
      render(<Board {...defaultProps} />)

      expect(screen.getByText('Todo')).toBeInTheDocument()
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      expect(screen.getByText('In Testing')).toBeInTheDocument()
      expect(screen.getByText('Done')).toBeInTheDocument()
    })

    it('should render BacklogSection below the board', () => {
      render(<Board {...defaultProps} />)

      // BacklogSection should render with Backlog header
      expect(screen.getByRole('region', { name: /backlog section/i })).toBeInTheDocument()
      expect(screen.getByText('Backlog')).toBeInTheDocument()
    })

    it('should distribute bugs to correct columns', () => {
      render(<Board {...defaultProps} />)

      // Todo: 1 (NEW with sprint tag), In Progress: 1 (ASSIGNED), Done: 2 (RESOLVED + VERIFIED)
      // Backlog: 1 (NEW without sprint tag)
      expect(screen.getByText('Bug in backlog')).toBeInTheDocument()
      expect(screen.getByText('Bug in todo')).toBeInTheDocument()
      expect(screen.getByText('Bug in progress')).toBeInTheDocument()
    })

    it('should have horizontal scrolling container', () => {
      const { container } = render(<Board {...defaultProps} />)

      const scrollContainer = container.querySelector('.overflow-x-auto')
      expect(scrollContainer).toBeInTheDocument()
    })

    it('should have max height constraint on board container', () => {
      const { container } = render(<Board {...defaultProps} />)

      const boardContainer = container.querySelector('.max-h-\\[600px\\]')
      expect(boardContainer).toBeInTheDocument()
    })

    it('should have overflow-y-auto on board container', () => {
      const { container } = render(<Board {...defaultProps} />)

      const scrollContainer = container.querySelector('.overflow-y-auto')
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

    it('should place NEW bugs with sprint tag in todo', () => {
      const bugs = [
        { ...mockBugs[0], status: 'NEW', whiteboard: '[bzkanban-sprint]', summary: 'Sprint bug' },
      ]
      render(<Board {...defaultProps} bugs={bugs} />)

      expect(screen.getByText('Sprint bug')).toBeInTheDocument()
    })

    it('should place ASSIGNED bugs in in-progress', () => {
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
      const bugs = [
        { ...mockBugs[0], status: 'RESOLVED', resolution: 'FIXED', summary: 'Resolved bug' },
      ]
      render(<Board {...defaultProps} bugs={bugs} />)

      expect(screen.getByText('Resolved bug')).toBeInTheDocument()
    })

    it('should place VERIFIED bugs in done', () => {
      const bugs = [
        { ...mockBugs[0], status: 'VERIFIED', resolution: 'FIXED', summary: 'Done bug' },
      ]
      render(<Board {...defaultProps} bugs={bugs} />)

      expect(screen.getByText('Done bug')).toBeInTheDocument()
    })
  })

  describe('priority sorting within columns', () => {
    it('should sort bugs by priority with highest (P1) at the top', () => {
      const bugsWithVaryingPriority: BugzillaBug[] = [
        {
          id: 1,
          summary: 'Low priority bug',
          status: 'NEW',
          assigned_to: 'dev@example.com',
          priority: 'P5',
          severity: 'normal',
          component: 'Core',
          whiteboard: '[kanban]',
          last_change_time: '2024-01-15T10:00:00Z',
          creation_time: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          summary: 'High priority bug',
          status: 'NEW',
          assigned_to: 'dev@example.com',
          priority: 'P1',
          severity: 'critical',
          component: 'Core',
          whiteboard: '[kanban]',
          last_change_time: '2024-01-14T10:00:00Z',
          creation_time: '2024-01-02T00:00:00Z',
        },
        {
          id: 3,
          summary: 'Medium priority bug',
          status: 'NEW',
          assigned_to: 'dev@example.com',
          priority: 'P3',
          severity: 'normal',
          component: 'Core',
          whiteboard: '[kanban]',
          last_change_time: '2024-01-13T10:00:00Z',
          creation_time: '2024-01-03T00:00:00Z',
        },
      ]

      render(<Board {...defaultProps} bugs={bugsWithVaryingPriority} />)

      // Get all bug cards in the backlog column
      const cards = screen.getAllByRole('article')

      // Verify order: P1 (High) should be first, then P3 (Medium), then P5 (Low)
      expect(cards[0]).toHaveTextContent('High priority bug')
      expect(cards[1]).toHaveTextContent('Medium priority bug')
      expect(cards[2]).toHaveTextContent('Low priority bug')
    })

    it('should maintain priority sorting across different columns', () => {
      const mixedColumnBugs: BugzillaBug[] = [
        // Backlog bugs (unsorted input)
        {
          id: 1,
          summary: 'Backlog P3',
          status: 'NEW',
          assigned_to: 'dev@example.com',
          priority: 'P3',
          severity: 'normal',
          component: 'Core',
          whiteboard: '[kanban]',
          last_change_time: '2024-01-15T10:00:00Z',
          creation_time: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          summary: 'Backlog P1',
          status: 'NEW',
          assigned_to: 'dev@example.com',
          priority: 'P1',
          severity: 'critical',
          component: 'Core',
          whiteboard: '[kanban]',
          last_change_time: '2024-01-14T10:00:00Z',
          creation_time: '2024-01-02T00:00:00Z',
        },
        // Todo bugs (unsorted input)
        {
          id: 3,
          summary: 'Todo P4',
          status: 'ASSIGNED',
          assigned_to: 'dev@example.com',
          priority: 'P4',
          severity: 'minor',
          component: 'Core',
          whiteboard: '[kanban]',
          last_change_time: '2024-01-13T10:00:00Z',
          creation_time: '2024-01-03T00:00:00Z',
        },
        {
          id: 4,
          summary: 'Todo P2',
          status: 'ASSIGNED',
          assigned_to: 'dev@example.com',
          priority: 'P2',
          severity: 'major',
          component: 'Core',
          whiteboard: '[kanban]',
          last_change_time: '2024-01-12T10:00:00Z',
          creation_time: '2024-01-04T00:00:00Z',
        },
      ]

      render(<Board {...defaultProps} bugs={mixedColumnBugs} />)

      const cards = screen.getAllByRole('article')

      // Backlog column should have P1 before P3
      const backlogP1Index = cards.findIndex((c) => c.textContent.includes('Backlog P1'))
      const backlogP3Index = cards.findIndex((c) => c.textContent.includes('Backlog P3'))
      expect(backlogP1Index).toBeLessThan(backlogP3Index)

      // Todo column should have P2 before P4
      const todoP2Index = cards.findIndex((c) => c.textContent.includes('Todo P2'))
      const todoP4Index = cards.findIndex((c) => c.textContent.includes('Todo P4'))
      expect(todoP2Index).toBeLessThan(todoP4Index)
    })
  })

  describe('loading state', () => {
    it('should show loading state for all columns and backlog when loading', () => {
      render(<Board {...defaultProps} isLoading={true} />)

      // 4 board columns + 1 backlog section = 5 loading indicators
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

      // Each column has its own empty state message
      // Backlog: "Backlog bankruptcy!", Todo: "Clean slate!", In Progress: "All clear!",
      // In Testing: "QE standing by!", Done: "Ship it!"
      expect(screen.getByText(/backlog bankruptcy/i)).toBeInTheDocument()
      expect(screen.getByText(/clean slate/i)).toBeInTheDocument()
      expect(screen.getByText(/all clear/i)).toBeInTheDocument()
      expect(screen.getByText(/QE standing by/i)).toBeInTheDocument()
      expect(screen.getByText(/ship it/i)).toBeInTheDocument()
    })
  })

  describe('staged changes', () => {
    it('should pass staged bug IDs to columns', () => {
      const stagedChanges = new Map<number, StagedChange>([
        [1, { status: { from: 'backlog', to: 'todo' } }],
      ])
      render(<Board {...defaultProps} stagedChanges={stagedChanges} />)

      // Staged indicator should be shown
      expect(screen.getByText(/1 staged/i)).toBeInTheDocument()
    })

    it('should highlight staged bugs in destination column', () => {
      const stagedChanges = new Map<number, StagedChange>([
        [1, { status: { from: 'backlog', to: 'todo' } }],
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

    it('should have vertical padding around the board', () => {
      const { container } = render(<Board {...defaultProps} />)

      const board = container.firstChild as HTMLElement
      expect(board.className).toContain('py-')
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

  describe('keyboard navigation', () => {
    // Create multiple bugs in todo column for up/down navigation
    // Note: Board only has 4 columns (todo, in-progress, in-testing, done) - backlog is separate
    const multipleTodoBugs: BugzillaBug[] = [
      {
        id: 10,
        summary: 'First todo bug',
        status: 'NEW',
        assigned_to: 'dev1@example.com',
        priority: 'P1',
        severity: 'major',
        component: 'Core',
        whiteboard: '[kanban] [bzkanban-sprint]', // Sprint tag puts it in todo
        last_change_time: '2024-01-15T10:00:00Z',
      },
      {
        id: 11,
        summary: 'Second todo bug',
        status: 'NEW',
        assigned_to: 'dev2@example.com',
        priority: 'P2',
        severity: 'normal',
        component: 'Core',
        whiteboard: '[kanban] [bzkanban-sprint]',
        last_change_time: '2024-01-14T09:00:00Z',
      },
      {
        id: 12,
        summary: 'Third todo bug',
        status: 'NEW',
        assigned_to: 'dev3@example.com',
        priority: 'P3',
        severity: 'minor',
        component: 'Core',
        whiteboard: '[kanban] [bzkanban-sprint]',
        last_change_time: '2024-01-13T08:00:00Z',
      },
      {
        id: 20,
        summary: 'First in-progress bug',
        status: 'ASSIGNED',
        assigned_to: 'dev4@example.com',
        priority: 'P2',
        severity: 'normal',
        component: 'UI',
        whiteboard: '[kanban]',
        last_change_time: '2024-01-12T07:00:00Z',
      },
    ]

    describe('arrow key navigation', () => {
      it('should select first bug in first non-empty column on initial arrow key press', () => {
        render(<Board {...defaultProps} bugs={multipleTodoBugs} />)

        fireEvent.keyDown(document, { key: 'ArrowDown' })

        // Should select first bug in todo (first board column with bugs)
        const firstCard = screen.getByText('First todo bug').closest('[role="article"]')
        expect(firstCard?.className).toContain('ring-2')
      })

      it('should move selection down within column on ArrowDown', () => {
        render(<Board {...defaultProps} bugs={multipleTodoBugs} />)

        // Initial selection
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        // Move down
        fireEvent.keyDown(document, { key: 'ArrowDown' })

        const secondCard = screen.getByText('Second todo bug').closest('[role="article"]')
        expect(secondCard?.className).toContain('ring-2')
      })

      it('should move selection up within column on ArrowUp', () => {
        render(<Board {...defaultProps} bugs={multipleTodoBugs} />)

        // Select first, then second
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        // Move back up
        fireEvent.keyDown(document, { key: 'ArrowUp' })

        const firstCard = screen.getByText('First todo bug').closest('[role="article"]')
        expect(firstCard?.className).toContain('ring-2')
      })

      it('should move selection to next column on ArrowRight', () => {
        render(<Board {...defaultProps} bugs={multipleTodoBugs} />)

        // Select first bug in todo
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        // Move to in-progress column
        fireEvent.keyDown(document, { key: 'ArrowRight' })

        const inProgressCard = screen.getByText('First in-progress bug').closest('[role="article"]')
        expect(inProgressCard?.className).toContain('ring-2')
      })

      it('should move selection to previous column on ArrowLeft', () => {
        render(<Board {...defaultProps} bugs={multipleTodoBugs} />)

        // Select first bug in todo, move right to in-progress, then back left
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        fireEvent.keyDown(document, { key: 'ArrowRight' })
        fireEvent.keyDown(document, { key: 'ArrowLeft' })

        const todoCard = screen.getByText('First todo bug').closest('[role="article"]')
        expect(todoCard?.className).toContain('ring-2')
      })

      it('should not move selection past first column on ArrowLeft', () => {
        render(<Board {...defaultProps} bugs={multipleTodoBugs} />)

        // Select first bug in todo
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        // Try to move left (should stay in todo)
        fireEvent.keyDown(document, { key: 'ArrowLeft' })

        const todoCard = screen.getByText('First todo bug').closest('[role="article"]')
        expect(todoCard?.className).toContain('ring-2')
      })

      it('should not move selection past last column on ArrowRight', () => {
        const bugsInDone: BugzillaBug[] = [
          {
            id: 50,
            summary: 'Done bug',
            status: 'VERIFIED',
            resolution: 'FIXED',
            assigned_to: 'dev@example.com',
            priority: 'P1',
            severity: 'normal',
            component: 'Core',
            whiteboard: '[kanban]',
            last_change_time: '2024-01-15T10:00:00Z',
          },
        ]
        render(<Board {...defaultProps} bugs={bugsInDone} />)

        // Select bug in done column
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        // Try to move right (should stay in done)
        fireEvent.keyDown(document, { key: 'ArrowRight' })

        const doneCard = screen.getByText('Done bug').closest('[role="article"]')
        expect(doneCard?.className).toContain('ring-2')
      })

      it('should clamp index when moving to column with fewer bugs', () => {
        render(<Board {...defaultProps} bugs={multipleTodoBugs} />)

        // Select third bug in todo (index 2)
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        // Move to in-progress (which only has 1 bug, so should clamp to index 0)
        fireEvent.keyDown(document, { key: 'ArrowRight' })

        const inProgressCard = screen.getByText('First in-progress bug').closest('[role="article"]')
        expect(inProgressCard?.className).toContain('ring-2')
      })
    })

    describe('escape key', () => {
      it('should clear selection on Escape', () => {
        render(<Board {...defaultProps} bugs={multipleTodoBugs} />)

        // Select a bug
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        // Clear selection
        fireEvent.keyDown(document, { key: 'Escape' })

        // No cards should have selection ring
        const cards = screen.getAllByRole('article')
        for (const card of cards) {
          expect(card.className).not.toContain('ring-accent-primary')
        }
      })
    })

    describe('grab and move with Shift', () => {
      it('should enter grab mode when Shift is pressed with selection', () => {
        render(<Board {...defaultProps} bugs={multipleTodoBugs} />)

        // Select a bug
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        // Hold shift
        fireEvent.keyDown(document, { key: 'Shift' })

        const selectedCard = screen.getByText('First todo bug').closest('[role="article"]')
        expect(selectedCard?.className).toContain('ring-accent-warning')
        expect(selectedCard?.className).toContain('animate-pulse')
      })

      it('should exit grab mode and stage move when Shift is released', () => {
        const onBugMove = vi.fn()
        render(<Board {...defaultProps} bugs={multipleTodoBugs} onBugMove={onBugMove} />)

        // Select first todo bug
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        // Hold shift
        fireEvent.keyDown(document, { key: 'Shift' })
        // Move to in-progress column
        fireEvent.keyDown(document, { key: 'ArrowRight' })
        // Release shift
        fireEvent.keyUp(document, { key: 'Shift' })

        // Should call onBugMove to stage the change
        expect(onBugMove).toHaveBeenCalledWith(10, 'todo', 'in-progress')
      })

      it('should not stage move if column did not change', () => {
        const onBugMove = vi.fn()
        render(<Board {...defaultProps} bugs={multipleTodoBugs} onBugMove={onBugMove} />)

        // Select first todo bug
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        // Hold shift (no movement)
        fireEvent.keyDown(document, { key: 'Shift' })
        // Release shift without moving
        fireEvent.keyUp(document, { key: 'Shift' })

        // Should not call onBugMove
        expect(onBugMove).not.toHaveBeenCalled()
      })

      it('should move grabbed bug to new column on ArrowRight while grabbing', () => {
        render(<Board {...defaultProps} bugs={multipleTodoBugs} />)

        // Select first todo bug
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        // Hold shift
        fireEvent.keyDown(document, { key: 'Shift' })
        // Move to in-progress column
        fireEvent.keyDown(document, { key: 'ArrowRight' })

        // The bug should now appear selected in the in-progress column visually
        // (grab mode shows warning ring)
        const firstCard = screen.getByText('First todo bug').closest('[role="article"]')
        expect(firstCard?.className).toContain('ring-accent-warning')
      })

      it('should not allow movement past first column while grabbing', () => {
        const onBugMove = vi.fn()
        render(<Board {...defaultProps} bugs={multipleTodoBugs} onBugMove={onBugMove} />)

        // Select first todo bug
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        // Hold shift
        fireEvent.keyDown(document, { key: 'Shift' })
        // Try to move left (already at first column)
        fireEvent.keyDown(document, { key: 'ArrowLeft' })
        // Release shift
        fireEvent.keyUp(document, { key: 'Shift' })

        // Should not stage any move
        expect(onBugMove).not.toHaveBeenCalled()
      })
    })

    describe('Shift+Enter to apply changes', () => {
      it('should call onApplyChanges when Shift+Enter is pressed', () => {
        const onApplyChanges = vi.fn()
        render(<Board {...defaultProps} bugs={multipleTodoBugs} onApplyChanges={onApplyChanges} />)

        // Press Shift+Enter
        fireEvent.keyDown(document, { key: 'Enter', shiftKey: true })

        expect(onApplyChanges).toHaveBeenCalled()
      })

      it('should not call onApplyChanges on Enter without Shift', () => {
        const onApplyChanges = vi.fn()
        render(<Board {...defaultProps} bugs={multipleTodoBugs} onApplyChanges={onApplyChanges} />)

        // Press Enter without shift
        fireEvent.keyDown(document, { key: 'Enter', shiftKey: false })

        expect(onApplyChanges).not.toHaveBeenCalled()
      })
    })

    describe('disabled states', () => {
      it('should not respond to keyboard when loading', () => {
        render(<Board {...defaultProps} bugs={multipleTodoBugs} isLoading={true} />)

        fireEvent.keyDown(document, { key: 'ArrowDown' })

        // Should not select anything (no ring class on any card)
        // When loading, cards are not rendered, so this just confirms no errors
        expect(screen.queryByText('First todo bug')).not.toBeInTheDocument()
      })

      it('should not respond to keyboard when no bugs', () => {
        render(<Board {...defaultProps} bugs={[]} />)

        // Should not throw error when pressing keys with no bugs
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        fireEvent.keyDown(document, { key: 'Shift' })

        // Each column should show its empty state message
        expect(screen.getByText(/backlog bankruptcy/i)).toBeInTheDocument()
        expect(screen.getByText(/clean slate/i)).toBeInTheDocument()
        expect(screen.getByText(/all clear/i)).toBeInTheDocument()
        expect(screen.getByText(/QE standing by/i)).toBeInTheDocument()
        expect(screen.getByText(/ship it/i)).toBeInTheDocument()
      })
    })

    describe('Escape confirmation to clear staged changes', () => {
      it('should show confirmation message on first Escape when there are staged changes', () => {
        const stagedChanges = new Map<number, StagedChange>([
          [10, { status: { from: 'todo', to: 'in-progress' } }],
        ])
        render(<Board {...defaultProps} bugs={multipleTodoBugs} stagedChanges={stagedChanges} />)

        fireEvent.keyDown(document, { key: 'Escape' })

        // Text is split across elements, so check for the warning icon and key elements
        expect(screen.getByText('warning')).toBeInTheDocument()
        expect(screen.getByText('Enter')).toBeInTheDocument()
      })

      it('should show count in confirmation message', () => {
        const stagedChanges = new Map<number, StagedChange>([
          [10, { status: { from: 'todo', to: 'in-progress' } }],
          [11, { status: { from: 'todo', to: 'done' } }],
        ])
        render(<Board {...defaultProps} bugs={multipleTodoBugs} stagedChanges={stagedChanges} />)

        fireEvent.keyDown(document, { key: 'Escape' })

        expect(screen.getByText(/2 staged/i)).toBeInTheDocument()
      })

      it('should call onClearChanges when Enter is pressed after confirmation', () => {
        const onClearChanges = vi.fn()
        const stagedChanges = new Map<number, StagedChange>([
          [10, { status: { from: 'todo', to: 'in-progress' } }],
        ])
        render(
          <Board
            {...defaultProps}
            bugs={multipleTodoBugs}
            stagedChanges={stagedChanges}
            onClearChanges={onClearChanges}
          />,
        )

        // First Escape shows confirmation
        fireEvent.keyDown(document, { key: 'Escape' })
        // Enter confirms
        fireEvent.keyDown(document, { key: 'Enter' })

        expect(onClearChanges).toHaveBeenCalled()
      })

      it('should hide confirmation when Escape is pressed again', () => {
        const stagedChanges = new Map<number, StagedChange>([
          [10, { status: { from: 'todo', to: 'in-progress' } }],
        ])
        render(<Board {...defaultProps} bugs={multipleTodoBugs} stagedChanges={stagedChanges} />)

        // First Escape shows confirmation
        fireEvent.keyDown(document, { key: 'Escape' })
        expect(screen.getByText('warning')).toBeInTheDocument()

        // Second Escape cancels
        fireEvent.keyDown(document, { key: 'Escape' })
        expect(screen.queryByText('warning')).not.toBeInTheDocument()
      })

      it('should not call onClearChanges when cancelled', () => {
        const onClearChanges = vi.fn()
        const stagedChanges = new Map<number, StagedChange>([
          [10, { status: { from: 'todo', to: 'in-progress' } }],
        ])
        render(
          <Board
            {...defaultProps}
            bugs={multipleTodoBugs}
            stagedChanges={stagedChanges}
            onClearChanges={onClearChanges}
          />,
        )

        // First Escape shows confirmation
        fireEvent.keyDown(document, { key: 'Escape' })
        // Second Escape cancels
        fireEvent.keyDown(document, { key: 'Escape' })

        expect(onClearChanges).not.toHaveBeenCalled()
      })

      it('should not show confirmation when no staged changes', () => {
        render(<Board {...defaultProps} bugs={multipleTodoBugs} />)

        fireEvent.keyDown(document, { key: 'Escape' })

        // Warning icon from confirmation banner should not appear
        expect(screen.queryByText('warning')).not.toBeInTheDocument()
      })

      it('should hide confirmation after clearing', () => {
        const onClearChanges = vi.fn()
        const stagedChanges = new Map<number, StagedChange>([
          [10, { status: { from: 'todo', to: 'in-progress' } }],
        ])
        render(
          <Board
            {...defaultProps}
            bugs={multipleTodoBugs}
            stagedChanges={stagedChanges}
            onClearChanges={onClearChanges}
          />,
        )

        // First Escape shows confirmation
        fireEvent.keyDown(document, { key: 'Escape' })
        // Enter confirms
        fireEvent.keyDown(document, { key: 'Enter' })

        // Warning icon from confirmation banner should be hidden
        expect(screen.queryByText('warning')).not.toBeInTheDocument()
      })

      it('should be idempotent - multiple Escapes just toggle confirmation', () => {
        const onClearChanges = vi.fn()
        const stagedChanges = new Map<number, StagedChange>([
          [10, { status: { from: 'todo', to: 'in-progress' } }],
        ])
        render(
          <Board
            {...defaultProps}
            bugs={multipleTodoBugs}
            stagedChanges={stagedChanges}
            onClearChanges={onClearChanges}
          />,
        )

        // Multiple Escape presses should toggle, not accumulate
        fireEvent.keyDown(document, { key: 'Escape' }) // Show
        fireEvent.keyDown(document, { key: 'Escape' }) // Hide
        fireEvent.keyDown(document, { key: 'Escape' }) // Show again

        expect(screen.getByText('warning')).toBeInTheDocument()
        expect(onClearChanges).not.toHaveBeenCalled()
      })
    })

    describe('target column visual feedback during grab', () => {
      it('should highlight target column when grabbing and moving right', () => {
        render(<Board {...defaultProps} bugs={multipleTodoBugs} />)

        // Select first todo bug
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        // Hold shift to grab
        fireEvent.keyDown(document, { key: 'Shift' })
        // Move right to in-progress column
        fireEvent.keyDown(document, { key: 'ArrowRight' })

        // In Progress column should have drop target indicator
        const inProgressColumn = screen.getByRole('region', { name: /in progress column/i })
        expect(inProgressColumn.className).toContain('ring')
      })

      it('should remove highlight when grab is cancelled', () => {
        render(<Board {...defaultProps} bugs={multipleTodoBugs} />)

        // Select, grab, move right
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        fireEvent.keyDown(document, { key: 'Shift' })
        fireEvent.keyDown(document, { key: 'ArrowRight' })

        // Release shift
        fireEvent.keyUp(document, { key: 'Shift' })

        // No column should have drop target ring anymore
        const columns = screen.getAllByRole('region')
        for (const column of columns) {
          // Should not have the dashed ring style
          expect(column.className).not.toContain('ring-dashed')
        }
      })

      it('should show indicator text on target column', () => {
        render(<Board {...defaultProps} bugs={multipleTodoBugs} />)

        // Select, grab, move right
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        fireEvent.keyDown(document, { key: 'Shift' })
        fireEvent.keyDown(document, { key: 'ArrowRight' })

        // Should show drop indicator
        expect(screen.getByText(/drop here/i)).toBeInTheDocument()
      })
    })

    // Note: Unassigned bug move validation is now tested in BacklogSection tests
    // since backlog is separate from the board and keyboard navigation only works
    // within the 4 board columns (todo, in-progress, in-testing, done)
  })

  describe('done column resolution filter', () => {
    const bugsWithDifferentResolutions: BugzillaBug[] = [
      {
        id: 200,
        summary: 'Fixed bug',
        status: 'RESOLVED',
        resolution: 'FIXED',
        assigned_to: 'dev@example.com',
        priority: 'P2',
        severity: 'major',
        component: 'Core',
        whiteboard: '[kanban]',
        last_change_time: '2024-01-15T10:00:00Z',
      },
      {
        id: 201,
        summary: 'Wontfix bug',
        status: 'RESOLVED',
        resolution: 'WONTFIX',
        assigned_to: 'dev@example.com',
        priority: 'P3',
        severity: 'normal',
        component: 'Core',
        whiteboard: '[kanban]',
        last_change_time: '2024-01-15T10:00:00Z',
      },
      {
        id: 202,
        summary: 'Duplicate bug',
        status: 'RESOLVED',
        resolution: 'DUPLICATE',
        assigned_to: 'dev@example.com',
        priority: 'P3',
        severity: 'normal',
        component: 'Core',
        whiteboard: '[kanban]',
        last_change_time: '2024-01-15T10:00:00Z',
      },
      {
        id: 203,
        summary: 'Invalid bug',
        status: 'CLOSED',
        resolution: 'INVALID',
        assigned_to: 'dev@example.com',
        priority: 'P3',
        severity: 'normal',
        component: 'Core',
        whiteboard: '[kanban]',
        last_change_time: '2024-01-15T10:00:00Z',
      },
      {
        id: 204,
        summary: 'Verified fixed bug',
        status: 'VERIFIED',
        resolution: 'FIXED',
        assigned_to: 'dev@example.com',
        priority: 'P1',
        severity: 'critical',
        component: 'Core',
        whiteboard: '[kanban]',
        last_change_time: '2024-01-15T10:00:00Z',
      },
    ]

    it('should only show bugs with FIXED resolution in done column', () => {
      render(<Board {...defaultProps} bugs={bugsWithDifferentResolutions} />)

      // Fixed bugs should be visible
      expect(screen.getByText('Fixed bug')).toBeInTheDocument()
      expect(screen.getByText('Verified fixed bug')).toBeInTheDocument()

      // Non-fixed bugs should not be visible
      expect(screen.queryByText('Wontfix bug')).not.toBeInTheDocument()
      expect(screen.queryByText('Duplicate bug')).not.toBeInTheDocument()
      expect(screen.queryByText('Invalid bug')).not.toBeInTheDocument()
    })
  })

  describe('assignee filtering', () => {
    const bugsWithDifferentAssignees: BugzillaBug[] = [
      {
        id: 100,
        summary: 'Bug by Alice',
        status: 'ASSIGNED',
        assigned_to: 'alice@example.com',
        priority: 'P2',
        severity: 'major',
        component: 'Core',
        whiteboard: '[kanban]',
        last_change_time: '2024-01-15T10:00:00Z',
      },
      {
        id: 101,
        summary: 'Bug by Bob',
        status: 'ASSIGNED',
        assigned_to: 'bob@example.com',
        priority: 'P3',
        severity: 'normal',
        component: 'UI',
        whiteboard: '[kanban]',
        last_change_time: '2024-01-15T10:00:00Z',
      },
      {
        id: 102,
        summary: 'Another bug by Alice',
        status: 'IN_PROGRESS',
        assigned_to: 'alice@example.com',
        priority: 'P1',
        severity: 'critical',
        component: 'Core',
        whiteboard: '[kanban]',
        last_change_time: '2024-01-15T10:00:00Z',
      },
    ]

    it('should show all bugs when no assignee filter is set', () => {
      render(<Board {...defaultProps} bugs={bugsWithDifferentAssignees} />)

      expect(screen.getByText('Bug by Alice')).toBeInTheDocument()
      expect(screen.getByText('Bug by Bob')).toBeInTheDocument()
      expect(screen.getByText('Another bug by Alice')).toBeInTheDocument()
    })

    it('should filter bugs by assignee when filter is set', async () => {
      // Import the actual store to set the filter
      const { useStore } = await import('@/store')

      // Set the assignee filter
      useStore.getState().setAssigneeFilter('alice@example.com')

      render(<Board {...defaultProps} bugs={bugsWithDifferentAssignees} />)

      // Alice's bugs should be visible
      expect(screen.getByText('Bug by Alice')).toBeInTheDocument()
      expect(screen.getByText('Another bug by Alice')).toBeInTheDocument()

      // Bob's bug should not be visible
      expect(screen.queryByText('Bug by Bob')).not.toBeInTheDocument()

      // Clean up: reset filter
      useStore.getState().setAssigneeFilter(null)
    })

    it('should show empty columns when no bugs match the filter', async () => {
      const { useStore } = await import('@/store')

      // Set filter to a non-existent assignee
      useStore.getState().setAssigneeFilter('nonexistent@example.com')

      render(<Board {...defaultProps} bugs={bugsWithDifferentAssignees} />)

      // None of the bugs should be visible
      expect(screen.queryByText('Bug by Alice')).not.toBeInTheDocument()
      expect(screen.queryByText('Bug by Bob')).not.toBeInTheDocument()

      // Clean up
      useStore.getState().setAssigneeFilter(null)
    })
  })
})
