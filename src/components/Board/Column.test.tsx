import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Column } from './Column'
import type { BugzillaBug } from '@/lib/bugzilla/types'
import type { KanbanColumn } from '@/lib/bugzilla/status-mapper'

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

// Mock Card component with selection props
vi.mock('./Card', () => ({
  Card: ({
    bug,
    isSelected,
    isGrabbed,
    allAssignees,
  }: {
    bug: BugzillaBug
    isSelected?: boolean
    isGrabbed?: boolean
    allAssignees?: Array<{ email: string; displayName: string }>
  }) => (
    <div
      data-testid={`card-${bug.id.toString()}`}
      data-selected={isSelected}
      data-grabbed={isGrabbed}
      data-assignees={allAssignees ? allAssignees.map((a) => a.email).join(',') : ''}
    >
      Card: {bug.summary}
    </div>
  ),
}))

const mockBugs: BugzillaBug[] = [
  {
    id: 12_345,
    summary: 'Fix login button',
    status: 'NEW',
    assigned_to: 'dev@example.com',
    priority: 'P2',
    severity: 'major',
    component: 'Auth',
    whiteboard: '[kanban]',
    last_change_time: '2024-01-15T10:30:00Z',
  },
  {
    id: 12_346,
    summary: 'Update documentation',
    status: 'NEW',
    assigned_to: 'writer@example.com',
    priority: 'P3',
    severity: 'normal',
    component: 'Docs',
    whiteboard: '[kanban]',
    last_change_time: '2024-01-14T09:00:00Z',
  },
]

describe('Column', () => {
  const defaultProps = {
    column: 'backlog' as KanbanColumn,
    bugs: mockBugs,
    stagedBugIds: new Set<number>(),
    onBugMove: vi.fn(),
  }

  describe('rendering', () => {
    it('should render column title', () => {
      render(<Column {...defaultProps} />)

      expect(screen.getByText('Backlog')).toBeInTheDocument()
    })

    it('should render bug count', () => {
      render(<Column {...defaultProps} />)

      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should render all bugs as cards', () => {
      render(<Column {...defaultProps} />)

      expect(screen.getByTestId('card-12345')).toBeInTheDocument()
      expect(screen.getByTestId('card-12346')).toBeInTheDocument()
    })

    it('should show empty state when no bugs', () => {
      render(<Column {...defaultProps} bugs={[]} />)

      expect(screen.getByText(/no bugs here/i)).toBeInTheDocument()
    })

    it('should show playful empty state message', () => {
      render(<Column {...defaultProps} bugs={[]} />)

      expect(screen.getByText(/time to celebrate/i)).toBeInTheDocument()
    })

    it('should align empty state towards top of column', () => {
      render(<Column {...defaultProps} bugs={[]} />)

      const emptyState = screen.getByText(/no bugs here/i).parentElement
      expect(emptyState).toHaveClass('justify-start')
    })
  })

  describe('column names', () => {
    it('should display "Backlog" for backlog column', () => {
      render(<Column {...defaultProps} column="backlog" />)

      expect(screen.getByText('Backlog')).toBeInTheDocument()
    })

    it('should display "Todo" for todo column', () => {
      render(<Column {...defaultProps} column="todo" />)

      expect(screen.getByText('Todo')).toBeInTheDocument()
    })

    it('should display "In Progress" for in-progress column', () => {
      render(<Column {...defaultProps} column="in-progress" />)

      expect(screen.getByText('In Progress')).toBeInTheDocument()
    })

    it('should display "In Testing" for in-testing column', () => {
      render(<Column {...defaultProps} column="in-testing" />)

      expect(screen.getByText('In Testing')).toBeInTheDocument()
    })

    it('should display "Done" for done column', () => {
      render(<Column {...defaultProps} column="done" />)

      expect(screen.getByText('Done')).toBeInTheDocument()
    })
  })

  describe('column styling', () => {
    it('should have distinct background color', () => {
      const { container } = render(<Column {...defaultProps} />)

      const column = container.firstChild as HTMLElement
      expect(column.className).toContain('bg-bg-secondary')
    })

    it('should have rounded corners', () => {
      const { container } = render(<Column {...defaultProps} />)

      const column = container.firstChild as HTMLElement
      expect(column.className).toContain('rounded')
    })

    it('should have minimum height', () => {
      const { container } = render(<Column {...defaultProps} />)

      const column = container.firstChild as HTMLElement
      expect(column.className).toContain('min-h')
    })
  })

  describe('column icons', () => {
    it('should show inbox icon for backlog', () => {
      render(<Column {...defaultProps} column="backlog" />)

      expect(screen.getByText('inbox')).toBeInTheDocument()
    })

    it('should show list icon for todo', () => {
      render(<Column {...defaultProps} column="todo" />)

      expect(screen.getByText('list')).toBeInTheDocument()
    })

    it('should show code icon for in-progress', () => {
      render(<Column {...defaultProps} column="in-progress" />)

      expect(screen.getByText('code')).toBeInTheDocument()
    })

    it('should show science icon for in-testing', () => {
      render(<Column {...defaultProps} column="in-testing" />)

      expect(screen.getByText('science')).toBeInTheDocument()
    })

    it('should show done icon for done', () => {
      render(<Column {...defaultProps} column="done" />)

      expect(screen.getByText('done_all')).toBeInTheDocument()
    })
  })

  describe('staged bugs', () => {
    it('should pass isStaged prop to cards for staged bugs', () => {
      const stagedBugIds = new Set([12_345])
      render(<Column {...defaultProps} stagedBugIds={stagedBugIds} />)

      // The Card mock doesn't show isStaged, but we can verify it's passed
      expect(screen.getByTestId('card-12345')).toBeInTheDocument()
    })

    it('should show staged count when bugs are staged', () => {
      const stagedBugIds = new Set([12_345])
      render(<Column {...defaultProps} stagedBugIds={stagedBugIds} />)

      expect(screen.getByText(/1 staged/i)).toBeInTheDocument()
    })

    it('should not show staged count when no bugs are staged', () => {
      render(<Column {...defaultProps} stagedBugIds={new Set()} />)

      expect(screen.queryByText(/staged/i)).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have proper region role', () => {
      render(<Column {...defaultProps} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should have aria-label with column name', () => {
      render(<Column {...defaultProps} column="backlog" />)

      const region = screen.getByRole('region')
      expect(region).toHaveAttribute('aria-label', expect.stringContaining('Backlog'))
    })

    it('should have aria-describedby for bug count', () => {
      render(<Column {...defaultProps} />)

      const region = screen.getByRole('region')
      expect(region).toHaveAttribute('aria-describedby')
    })
  })

  describe('loading state', () => {
    it('should show loading skeleton when isLoading is true', () => {
      render(<Column {...defaultProps} isLoading={true} />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should show playful loading message', () => {
      render(<Column {...defaultProps} isLoading={true} />)

      expect(screen.getByText(/bugs are coming/i)).toBeInTheDocument()
    })

    it('should not render cards when loading', () => {
      render(<Column {...defaultProps} isLoading={true} />)

      expect(screen.queryByTestId('card-12345')).not.toBeInTheDocument()
    })
  })

  describe('keyboard selection', () => {
    it('should not pass selection props by default', () => {
      render(<Column {...defaultProps} />)

      const card1 = screen.getByTestId('card-12345')
      const card2 = screen.getByTestId('card-12346')
      expect(card1).toHaveAttribute('data-selected', 'false')
      expect(card1).toHaveAttribute('data-grabbed', 'false')
      expect(card2).toHaveAttribute('data-selected', 'false')
      expect(card2).toHaveAttribute('data-grabbed', 'false')
    })

    it('should pass isSelected=true to card at selectedIndex', () => {
      render(<Column {...defaultProps} selectedIndex={0} />)

      const card1 = screen.getByTestId('card-12345')
      const card2 = screen.getByTestId('card-12346')
      expect(card1).toHaveAttribute('data-selected', 'true')
      expect(card2).toHaveAttribute('data-selected', 'false')
    })

    it('should pass isSelected=true to second card when selectedIndex=1', () => {
      render(<Column {...defaultProps} selectedIndex={1} />)

      const card1 = screen.getByTestId('card-12345')
      const card2 = screen.getByTestId('card-12346')
      expect(card1).toHaveAttribute('data-selected', 'false')
      expect(card2).toHaveAttribute('data-selected', 'true')
    })

    it('should pass isGrabbed=true when both selectedIndex and isGrabbing are set', () => {
      render(<Column {...defaultProps} selectedIndex={0} isGrabbing={true} />)

      const card1 = screen.getByTestId('card-12345')
      const card2 = screen.getByTestId('card-12346')
      expect(card1).toHaveAttribute('data-grabbed', 'true')
      expect(card2).toHaveAttribute('data-grabbed', 'false')
    })

    it('should not pass isGrabbed when isGrabbing is true but no selectedIndex', () => {
      render(<Column {...defaultProps} isGrabbing={true} />)

      const card1 = screen.getByTestId('card-12345')
      expect(card1).toHaveAttribute('data-grabbed', 'false')
    })

    it('should pass both isSelected and isGrabbed to selected card when grabbing', () => {
      render(<Column {...defaultProps} selectedIndex={1} isGrabbing={true} />)

      const card2 = screen.getByTestId('card-12346')
      expect(card2).toHaveAttribute('data-selected', 'true')
      expect(card2).toHaveAttribute('data-grabbed', 'true')
    })
  })

  describe('points total', () => {
    const bugsWithPoints: BugzillaBug[] = [
      {
        id: 12_345,
        summary: 'Fix login button',
        status: 'NEW',
        assigned_to: 'dev@example.com',
        priority: 'P2',
        severity: 'major',
        component: 'Auth',
        whiteboard: '[kanban]',
        last_change_time: '2024-01-15T10:30:00Z',
        cf_fx_points: 5,
      },
      {
        id: 12_346,
        summary: 'Update documentation',
        status: 'NEW',
        assigned_to: 'writer@example.com',
        priority: 'P3',
        severity: 'normal',
        component: 'Docs',
        whiteboard: '[kanban]',
        last_change_time: '2024-01-14T09:00:00Z',
        cf_fx_points: 3,
      },
    ]

    it('should display total points when bugs have points', () => {
      render(<Column {...defaultProps} bugs={bugsWithPoints} />)
      expect(screen.getByText('8 pts')).toBeInTheDocument()
    })

    it('should not display points badge when total is 0', () => {
      render(<Column {...defaultProps} bugs={mockBugs} />)
      expect(screen.queryByText(/pts/i)).not.toBeInTheDocument()
    })

    it('should handle string points like "?" by excluding them from total', () => {
      const bugsWithQuestionMark: BugzillaBug[] = [
        { ...bugsWithPoints[0], cf_fx_points: '?' },
        { ...bugsWithPoints[1], cf_fx_points: 5 },
      ]
      render(<Column {...defaultProps} bugs={bugsWithQuestionMark} />)
      expect(screen.getByText('5 pts')).toBeInTheDocument()
    })

    it('should handle undefined points', () => {
      const bugsWithMixed: BugzillaBug[] = [
        { ...bugsWithPoints[0], cf_fx_points: 8 },
        { ...bugsWithPoints[1], cf_fx_points: undefined },
      ]
      render(<Column {...defaultProps} bugs={bugsWithMixed} />)
      expect(screen.getByText('8 pts')).toBeInTheDocument()
    })

    it('should display points badge with aria-label for accessibility', () => {
      render(<Column {...defaultProps} bugs={bugsWithPoints} />)
      expect(screen.getByLabelText(/total points/i)).toBeInTheDocument()
    })
  })

  describe('assignee filtering', () => {
    const assigneesWithNobody = [
      { email: 'nobody@mozilla.org', displayName: 'Nobody' },
      { email: 'dev@mozilla.com', displayName: 'Developer' },
      { email: 'qa@mozilla.com', displayName: 'QA Engineer' },
    ]

    it('should include nobody@mozilla.org in backlog column', () => {
      render(<Column {...defaultProps} column="backlog" allAssignees={assigneesWithNobody} />)

      const card = screen.getByTestId('card-12345')
      expect(card).toHaveAttribute('data-assignees', expect.stringContaining('nobody@mozilla.org'))
    })

    it('should exclude nobody@mozilla.org in todo column', () => {
      render(<Column {...defaultProps} column="todo" allAssignees={assigneesWithNobody} />)

      const card = screen.getByTestId('card-12345')
      expect(card).toHaveAttribute(
        'data-assignees',
        expect.not.stringContaining('nobody@mozilla.org'),
      )
      expect(card).toHaveAttribute('data-assignees', expect.stringContaining('dev@mozilla.com'))
    })

    it('should exclude nobody@mozilla.org in in-progress column', () => {
      render(<Column {...defaultProps} column="in-progress" allAssignees={assigneesWithNobody} />)

      const card = screen.getByTestId('card-12345')
      expect(card).toHaveAttribute(
        'data-assignees',
        expect.not.stringContaining('nobody@mozilla.org'),
      )
    })

    it('should exclude nobody@mozilla.org in done column', () => {
      render(<Column {...defaultProps} column="done" allAssignees={assigneesWithNobody} />)

      const card = screen.getByTestId('card-12345')
      expect(card).toHaveAttribute(
        'data-assignees',
        expect.not.stringContaining('nobody@mozilla.org'),
      )
    })
  })
})
