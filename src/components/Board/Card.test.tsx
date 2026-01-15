import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Card } from './Card'
import type { BugzillaBug } from '@/lib/bugzilla/types'
import type { Assignee } from '@/hooks/use-board-assignees'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      whileHover: _whileHover,
      whileTap: _whileTap,
      whileDrag: _whileDrag,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      layout: _layout,
      layoutId: _layoutId,
      drag: _drag,
      dragConstraints: _dragConstraints,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  },
  Reorder: {
    Item: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockBug: BugzillaBug = {
  id: 12_345,
  summary: 'Fix the login button not working on mobile',
  status: 'NEW',
  assigned_to: 'developer@example.com',
  priority: 'P2',
  severity: 'S3',
  component: 'Authentication',
  whiteboard: '[kanban]',
  last_change_time: '2024-01-15T10:30:00Z',
  creation_time: '2024-01-01T00:00:00Z',
}

const mockAssignees: Assignee[] = [
  { email: 'developer@example.com', displayName: 'Developer', count: 3 },
  { email: 'alice@example.com', displayName: 'Alice Johnson', count: 2 },
  { email: 'bob@example.com', displayName: 'Bob Smith', count: 1 },
]

describe('Card', () => {
  describe('rendering', () => {
    it('should render bug ID as a link to Bugzilla', () => {
      render(<Card bug={mockBug} />)

      const link = screen.getByRole('link', { name: /#12345/ })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://bugzilla.mozilla.org/show_bug.cgi?id=12345')
    })

    it('should open bug link in new tab', () => {
      render(<Card bug={mockBug} />)

      const link = screen.getByRole('link', { name: /#12345/ })
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('should render bug summary', () => {
      render(<Card bug={mockBug} />)

      expect(screen.getByText('Fix the login button not working on mobile')).toBeInTheDocument()
    })

    it('should render assignee', () => {
      render(<Card bug={mockBug} />)

      expect(screen.getByText('developer@example.com')).toBeInTheDocument()
    })

    it('should render priority', () => {
      render(<Card bug={mockBug} />)

      expect(screen.getByText('P2')).toBeInTheDocument()
    })

    it('should render severity', () => {
      render(<Card bug={mockBug} />)

      expect(screen.getByText('S3')).toBeInTheDocument()
    })

    it('should render component', () => {
      render(<Card bug={mockBug} />)

      expect(screen.getByText('Authentication')).toBeInTheDocument()
    })

    it('should render drag handle icon', () => {
      render(<Card bug={mockBug} />)

      expect(screen.getByText('drag_indicator')).toBeInTheDocument()
    })
  })

  describe('priority colors', () => {
    it('should use P1 color for critical priority', () => {
      const p1Bug = { ...mockBug, priority: 'P1' }
      render(<Card bug={p1Bug} />)

      const priorityBadge = screen.getByText('P1')
      expect(priorityBadge.className).toContain('priority-p1')
    })

    it('should use P2 color for high priority', () => {
      const p2Bug = { ...mockBug, priority: 'P2' }
      render(<Card bug={p2Bug} />)

      const priorityBadge = screen.getByText('P2')
      expect(priorityBadge.className).toContain('priority-p2')
    })

    it('should use P3 color for medium priority', () => {
      const p3Bug = { ...mockBug, priority: 'P3' }
      render(<Card bug={p3Bug} />)

      const priorityBadge = screen.getByText('P3')
      expect(priorityBadge.className).toContain('priority-p3')
    })

    it('should use P4 color for low priority', () => {
      const p4Bug = { ...mockBug, priority: 'P4' }
      render(<Card bug={p4Bug} />)

      const priorityBadge = screen.getByText('P4')
      expect(priorityBadge.className).toContain('priority-p4')
    })

    it('should use P5 color for no priority', () => {
      const p5Bug = { ...mockBug, priority: 'P5' }
      render(<Card bug={p5Bug} />)

      const priorityBadge = screen.getByText('P5')
      expect(priorityBadge.className).toContain('priority-p5')
    })

    it('should handle unknown priority gracefully', () => {
      const unknownBug = { ...mockBug, priority: '--' }
      render(<Card bug={unknownBug} />)

      const priorityBadge = screen.getByText('--')
      expect(priorityBadge.className).toContain('priority-p5')
    })
  })

  describe('severity badge', () => {
    it('should show S1 severity with error color', () => {
      const s1Bug = { ...mockBug, severity: 'S1' }
      render(<Card bug={s1Bug} />)

      const severityBadge = screen.getByText('S1')
      expect(severityBadge.className).toContain('accent-error')
    })

    it('should show S2 severity with warning color', () => {
      const s2Bug = { ...mockBug, severity: 'S2' }
      render(<Card bug={s2Bug} />)

      const severityBadge = screen.getByText('S2')
      expect(severityBadge.className).toContain('accent-warning')
    })

    it('should show S3 severity with secondary text color', () => {
      const s3Bug = { ...mockBug, severity: 'S3' }
      render(<Card bug={s3Bug} />)

      const severityBadge = screen.getByText('S3')
      expect(severityBadge.className).toContain('text-secondary')
    })

    it('should show S4 severity with primary accent color', () => {
      const s4Bug = { ...mockBug, severity: 'S4' }
      render(<Card bug={s4Bug} />)

      const severityBadge = screen.getByText('S4')
      expect(severityBadge.className).toContain('accent-primary')
    })

    it('should show N/A severity with tertiary text color', () => {
      const naBug = { ...mockBug, severity: 'N/A' }
      render(<Card bug={naBug} />)

      const severityBadge = screen.getByText('N/A')
      expect(severityBadge.className).toContain('text-tertiary')
    })
  })

  describe('staged indicator', () => {
    it('should not show staged indicator by default', () => {
      render(<Card bug={mockBug} />)

      expect(screen.queryByText('pending')).not.toBeInTheDocument()
    })

    it('should show staged indicator when isStaged is true', () => {
      render(<Card bug={mockBug} isStaged={true} />)

      expect(screen.getByText('pending')).toBeInTheDocument()
    })

    it('should show playful staged message', () => {
      render(<Card bug={mockBug} isStaged={true} />)

      expect(screen.getByText(/staged/i)).toBeInTheDocument()
    })

    it('should show staged border with accent-staged color when status is staged', () => {
      const { container } = render(<Card bug={mockBug} isStaged={true} />)

      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('ring-accent-staged')
    })

    it('should not show staged border when isStaged is false', () => {
      const { container } = render(<Card bug={mockBug} isStaged={false} />)

      const card = container.firstChild as HTMLElement
      expect(card.className).not.toContain('ring-accent-staged')
    })
  })

  describe('interaction', () => {
    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      render(<Card bug={mockBug} onClick={onClick} />)

      // Click on the summary text (not the bug ID link which stops propagation)
      await user.click(screen.getByText('Fix the login button not working on mobile'))

      expect(onClick).toHaveBeenCalledWith(mockBug)
    })

    it('should not trigger onClick when bug ID link is clicked', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      render(<Card bug={mockBug} onClick={onClick} />)

      await user.click(screen.getByRole('link', { name: /#12345/ }))

      expect(onClick).not.toHaveBeenCalled()
    })

    it('should have cursor pointer when onClick is provided', () => {
      const onClick = vi.fn()
      const { container } = render(<Card bug={mockBug} onClick={onClick} />)

      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('cursor-pointer')
    })

    it('should not have cursor pointer when onClick is not provided', () => {
      const { container } = render(<Card bug={mockBug} />)

      const card = container.firstChild as HTMLElement
      expect(card.className).not.toContain('cursor-pointer')
    })
  })

  describe('accessibility', () => {
    it('should have proper article role', () => {
      render(<Card bug={mockBug} />)

      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    it('should have aria-label with bug info', () => {
      render(<Card bug={mockBug} />)

      const article = screen.getByRole('article')
      expect(article).toHaveAttribute('aria-label', expect.stringContaining('12345'))
    })

    it('should be focusable when clickable', () => {
      const onClick = vi.fn()
      render(<Card bug={mockBug} onClick={onClick} />)

      const article = screen.getByRole('article')
      expect(article).toHaveAttribute('tabIndex', '0')
    })

    it('should handle keyboard Enter when clickable', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      render(<Card bug={mockBug} onClick={onClick} />)

      const article = screen.getByRole('article')
      article.focus()
      await user.keyboard('{Enter}')

      expect(onClick).toHaveBeenCalledWith(mockBug)
    })
  })

  describe('truncation', () => {
    it('should clamp long summaries to two lines', () => {
      const longSummaryBug = {
        ...mockBug,
        summary:
          'This is a very long summary that should be truncated when it exceeds the maximum width of the card component in the Kanban board',
      }
      render(<Card bug={longSummaryBug} />)

      const summary = screen.getByText(longSummaryBug.summary)
      expect(summary.className).toContain('line-clamp-2')
    })

    it('should show full summary in tooltip on hover', () => {
      const longSummaryBug = {
        ...mockBug,
        summary:
          'This is a very long summary that should be truncated when it exceeds the maximum width of the card component in the Kanban board',
      }
      render(<Card bug={longSummaryBug} />)

      const summary = screen.getByText(longSummaryBug.summary)
      expect(summary).toHaveAttribute('title', longSummaryBug.summary)
    })

    it('should truncate long assignee emails', () => {
      const longAssigneeBug = {
        ...mockBug,
        assigned_to: 'very.long.developer.email.address@example.mozilla.org',
      }
      render(<Card bug={longAssigneeBug} />)

      const assignee = screen.getByText(longAssigneeBug.assigned_to)
      expect(assignee.className).toContain('truncate')
    })
  })

  describe('keyboard selection', () => {
    it('should not show selection styles by default', () => {
      const { container } = render(<Card bug={mockBug} />)

      const card = container.firstChild as HTMLElement
      // Should not have ring classes (selection indicator) by default
      expect(card.className).not.toContain('ring-2')
    })

    it('should show selection ring when isSelected is true', () => {
      const { container } = render(<Card bug={mockBug} isSelected={true} />)

      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('ring-2')
      expect(card.className).toContain('ring-accent-primary')
    })

    it('should show enhanced shadow when isSelected is true', () => {
      const { container } = render(<Card bug={mockBug} isSelected={true} />)

      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('shadow-xl')
    })

    it('should show grabbed state with warning ring when isGrabbed is true', () => {
      const { container } = render(<Card bug={mockBug} isGrabbed={true} />)

      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('ring-2')
      expect(card.className).toContain('ring-accent-warning')
    })

    it('should show pulse animation when isGrabbed is true', () => {
      const { container } = render(<Card bug={mockBug} isGrabbed={true} />)

      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('animate-pulse')
    })

    it('should show scale effect when isGrabbed is true', () => {
      const { container } = render(<Card bug={mockBug} isGrabbed={true} />)

      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('scale-105')
    })

    it('should prioritize grabbed state over selected state', () => {
      const { container } = render(<Card bug={mockBug} isSelected={true} isGrabbed={true} />)

      const card = container.firstChild as HTMLElement
      // Should show grabbed styling (warning) not selected styling (primary)
      expect(card.className).toContain('ring-accent-warning')
      expect(card.className).not.toContain('ring-accent-primary')
    })

    it('should prioritize selected state over staged state', () => {
      const { container } = render(<Card bug={mockBug} isStaged={true} isSelected={true} />)

      const card = container.firstChild as HTMLElement
      // Selected should have full ring, staged should be dimmer
      expect(card.className).toContain('ring-accent-primary')
      expect(card.className).toContain('shadow-xl')
    })
  })

  describe('assignee picker', () => {
    it('should make person icon clickable when allAssignees is provided', () => {
      render(<Card bug={mockBug} allAssignees={mockAssignees} onAssigneeChange={vi.fn()} />)

      expect(screen.getByLabelText('Change assignee')).toBeInTheDocument()
      // Should be person icon, not account_circle
      expect(screen.getByText('person')).toBeInTheDocument()
      expect(screen.queryByText('account_circle')).not.toBeInTheDocument()
    })

    it('should not make person icon clickable when allAssignees is not provided', () => {
      render(<Card bug={mockBug} />)

      // Person icon should still be there but not as a button
      expect(screen.getByText('person')).toBeInTheDocument()
      expect(screen.queryByLabelText('Change assignee')).not.toBeInTheDocument()
    })

    it('should open picker when person icon is clicked', async () => {
      const user = userEvent.setup()
      render(<Card bug={mockBug} allAssignees={mockAssignees} onAssigneeChange={vi.fn()} />)

      await user.click(screen.getByLabelText('Change assignee'))

      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    it('should call onAssigneeChange when assignee is selected', async () => {
      const user = userEvent.setup()
      const onAssigneeChange = vi.fn()
      render(
        <Card bug={mockBug} allAssignees={mockAssignees} onAssigneeChange={onAssigneeChange} />,
      )

      await user.click(screen.getByLabelText('Change assignee'))
      await user.click(screen.getByText('Alice Johnson'))

      expect(onAssigneeChange).toHaveBeenCalledWith(mockBug.id, 'alice@example.com')
    })

    it('should close picker after selection', async () => {
      const user = userEvent.setup()
      render(<Card bug={mockBug} allAssignees={mockAssignees} onAssigneeChange={vi.fn()} />)

      await user.click(screen.getByLabelText('Change assignee'))
      await user.click(screen.getByText('Alice Johnson'))

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('should not trigger card onClick when clicking assignee button', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      render(
        <Card
          bug={mockBug}
          onClick={onClick}
          allAssignees={mockAssignees}
          onAssigneeChange={vi.fn()}
        />,
      )

      await user.click(screen.getByLabelText('Change assignee'))

      expect(onClick).not.toHaveBeenCalled()
    })

    it('should show isAssigneeStaged indicator with accent-staged border when assignee is staged', () => {
      render(
        <Card
          bug={mockBug}
          allAssignees={mockAssignees}
          onAssigneeChange={vi.fn()}
          isAssigneeStaged={true}
        />,
      )

      // The person icon button should have accent-staged border
      const button = screen.getByLabelText('Change assignee')
      expect(button.className).toContain('ring-accent-staged')
    })

    it('should not show staged border on assignee button when assignee is not staged', () => {
      render(
        <Card
          bug={mockBug}
          allAssignees={mockAssignees}
          onAssigneeChange={vi.fn()}
          isAssigneeStaged={false}
        />,
      )

      const button = screen.getByLabelText('Change assignee')
      expect(button.className).not.toContain('ring-accent-staged')
    })

    it('should open picker when Space key is pressed on selected card', async () => {
      const user = userEvent.setup()
      render(
        <Card
          bug={mockBug}
          allAssignees={mockAssignees}
          onAssigneeChange={vi.fn()}
          isSelected={true}
        />,
      )

      const card = screen.getByRole('article')
      card.focus()
      await user.keyboard(' ')

      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    it('should not open picker when Space key is pressed on non-selected card', async () => {
      const user = userEvent.setup()
      render(
        <Card
          bug={mockBug}
          allAssignees={mockAssignees}
          onAssigneeChange={vi.fn()}
          isSelected={false}
        />,
      )

      const card = screen.getByRole('article')
      card.focus()
      await user.keyboard(' ')

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('should display staged assignee when isAssigneeStaged is true', () => {
      render(
        <Card
          bug={mockBug}
          allAssignees={mockAssignees}
          onAssigneeChange={vi.fn()}
          isAssigneeStaged={true}
          stagedAssignee="alice@example.com"
        />,
      )

      // Should show staged assignee, not original
      expect(screen.getByText('alice@example.com')).toBeInTheDocument()
      expect(screen.queryByText('developer@example.com')).not.toBeInTheDocument()
    })

    it('should display original assignee when not staged', () => {
      render(<Card bug={mockBug} />)

      expect(screen.getByText('developer@example.com')).toBeInTheDocument()
    })
  })

  describe('story points', () => {
    it('should display story points when cf_fx_points is set', () => {
      const bugWithPoints = { ...mockBug, cf_fx_points: 5 }
      render(<Card bug={bugWithPoints} />)

      expect(screen.getByLabelText('story points')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should not display story points when cf_fx_points is not set', () => {
      render(<Card bug={mockBug} />)

      expect(screen.queryByLabelText('story points')).not.toBeInTheDocument()
    })

    it('should not display story points when cf_fx_points is 0', () => {
      const bugWithZeroPoints = { ...mockBug, cf_fx_points: 0 }
      render(<Card bug={bugWithZeroPoints} />)

      expect(screen.queryByLabelText('story points')).not.toBeInTheDocument()
    })

    it('should not display story points when cf_fx_points is "0"', () => {
      const bugWithZeroPoints = { ...mockBug, cf_fx_points: '0' }
      render(<Card bug={bugWithZeroPoints} />)

      expect(screen.queryByLabelText('story points')).not.toBeInTheDocument()
    })

    it('should handle string values for cf_fx_points', () => {
      const bugWithStringPoints = { ...mockBug, cf_fx_points: '3' }
      render(<Card bug={bugWithStringPoints} />)

      expect(screen.getByLabelText('story points')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  describe('points picker', () => {
    const bugWithPoints = { ...mockBug, cf_fx_points: 5 }

    it('should make points badge clickable when onPointsChange is provided', () => {
      render(<Card bug={bugWithPoints} onPointsChange={vi.fn()} />)

      expect(screen.getByLabelText('Change story points')).toBeInTheDocument()
    })

    it('should not make points badge clickable when onPointsChange is not provided', () => {
      render(<Card bug={bugWithPoints} />)

      expect(screen.queryByLabelText('Change story points')).not.toBeInTheDocument()
    })

    it('should open picker when points badge is clicked', async () => {
      const user = userEvent.setup()
      render(<Card bug={bugWithPoints} onPointsChange={vi.fn()} />)

      await user.click(screen.getByLabelText('Change story points'))

      expect(screen.getByRole('listbox', { name: /story points/i })).toBeInTheDocument()
    })

    it('should call onPointsChange when points are selected', async () => {
      const user = userEvent.setup()
      const onPointsChange = vi.fn()
      render(<Card bug={bugWithPoints} onPointsChange={onPointsChange} />)

      await user.click(screen.getByLabelText('Change story points'))
      await user.click(screen.getByText('8'))

      expect(onPointsChange).toHaveBeenCalledWith(mockBug.id, 8)
    })

    it('should show isPointsStaged indicator when points are staged', () => {
      render(<Card bug={bugWithPoints} onPointsChange={vi.fn()} isPointsStaged={true} />)

      const button = screen.getByLabelText('Change story points')
      expect(button.className).toContain('ring-accent-staged')
    })

    it('should display staged points when isPointsStaged is true', () => {
      render(
        <Card
          bug={bugWithPoints}
          onPointsChange={vi.fn()}
          isPointsStaged={true}
          stagedPoints={13}
        />,
      )

      expect(screen.getByText('13')).toBeInTheDocument()
    })
  })

  describe('priority picker', () => {
    it('should make priority badge clickable when onPriorityChange is provided', () => {
      render(<Card bug={mockBug} onPriorityChange={vi.fn()} />)

      expect(screen.getByLabelText('Change priority')).toBeInTheDocument()
    })

    it('should not make priority badge clickable when onPriorityChange is not provided', () => {
      render(<Card bug={mockBug} />)

      expect(screen.queryByLabelText('Change priority')).not.toBeInTheDocument()
    })

    it('should open picker when priority badge is clicked', async () => {
      const user = userEvent.setup()
      render(<Card bug={mockBug} onPriorityChange={vi.fn()} />)

      await user.click(screen.getByLabelText('Change priority'))

      expect(screen.getByRole('listbox', { name: /priority/i })).toBeInTheDocument()
    })

    it('should call onPriorityChange when priority is selected', async () => {
      const user = userEvent.setup()
      const onPriorityChange = vi.fn()
      render(<Card bug={mockBug} onPriorityChange={onPriorityChange} />)

      await user.click(screen.getByLabelText('Change priority'))
      await user.click(screen.getByText('P1'))

      expect(onPriorityChange).toHaveBeenCalledWith(mockBug.id, 'P1')
    })

    it('should show isPriorityStaged indicator when priority is staged', () => {
      render(<Card bug={mockBug} onPriorityChange={vi.fn()} isPriorityStaged={true} />)

      const button = screen.getByLabelText('Change priority')
      expect(button.className).toContain('ring-accent-staged')
    })

    it('should display staged priority when isPriorityStaged is true', () => {
      render(
        <Card
          bug={mockBug}
          onPriorityChange={vi.fn()}
          isPriorityStaged={true}
          stagedPriority="P1"
        />,
      )

      // Should show staged priority, not original P2
      const priorityBadges = screen.getAllByText(/P[1-5]/)
      expect(priorityBadges[0]).toHaveTextContent('P1')
    })
  })

  describe('severity picker', () => {
    it('should make severity badge clickable when onSeverityChange is provided', () => {
      render(<Card bug={mockBug} onSeverityChange={vi.fn()} />)

      expect(screen.getByLabelText('Change severity')).toBeInTheDocument()
    })

    it('should not make severity badge clickable when onSeverityChange is not provided', () => {
      render(<Card bug={mockBug} />)

      expect(screen.queryByLabelText('Change severity')).not.toBeInTheDocument()
    })

    it('should open picker when severity badge is clicked', async () => {
      const user = userEvent.setup()
      render(<Card bug={mockBug} onSeverityChange={vi.fn()} />)

      await user.click(screen.getByLabelText('Change severity'))

      expect(screen.getByRole('listbox', { name: /severity/i })).toBeInTheDocument()
    })

    it('should call onSeverityChange when severity is selected', async () => {
      const user = userEvent.setup()
      const onSeverityChange = vi.fn()
      render(<Card bug={mockBug} onSeverityChange={onSeverityChange} />)

      await user.click(screen.getByLabelText('Change severity'))
      await user.click(screen.getByText('S1'))

      expect(onSeverityChange).toHaveBeenCalledWith(mockBug.id, 'S1')
    })

    it('should show isSeverityStaged indicator when severity is staged', () => {
      render(<Card bug={mockBug} onSeverityChange={vi.fn()} isSeverityStaged={true} />)

      const button = screen.getByLabelText('Change severity')
      expect(button.className).toContain('ring-accent-staged')
    })

    it('should display staged severity when isSeverityStaged is true', () => {
      render(
        <Card
          bug={mockBug}
          onSeverityChange={vi.fn()}
          isSeverityStaged={true}
          stagedSeverity="S1"
        />,
      )

      // Should show staged severity, not original S3
      const severityBadges = screen.getAllByText(/S1|S2|S3|S4|N\/A/)
      expect(severityBadges[0]).toHaveTextContent('S1')
    })

    it('should not trigger card onClick when clicking severity button', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      render(<Card bug={mockBug} onClick={onClick} onSeverityChange={vi.fn()} />)

      await user.click(screen.getByLabelText('Change severity'))

      expect(onClick).not.toHaveBeenCalled()
    })
  })

  describe('qe verification indicator', () => {
    it('should show "qe?" when no qe-verify flag exists', () => {
      render(<Card bug={mockBug} />)

      expect(screen.getByText('qe?')).toBeInTheDocument()
    })

    it('should show "qe?" when qe-verify flag has "?" status', () => {
      const bugWithQeQuestion = {
        ...mockBug,
        flags: [{ name: 'qe-verify', status: '?' }],
      }
      render(<Card bug={bugWithQeQuestion} />)

      expect(screen.getByText('qe?')).toBeInTheDocument()
    })

    it('should show "qe-" when qe-verify flag has "-" status', () => {
      const bugWithQeMinus = {
        ...mockBug,
        flags: [{ name: 'qe-verify', status: '-' }],
      }
      render(<Card bug={bugWithQeMinus} />)

      expect(screen.getByText('qe-')).toBeInTheDocument()
    })

    it('should show "qe+" when qe-verify flag has "+" status', () => {
      const bugWithQePlus = {
        ...mockBug,
        flags: [{ name: 'qe-verify', status: '+' }],
      }
      render(<Card bug={bugWithQePlus} />)

      expect(screen.getByText('qe+')).toBeInTheDocument()
    })

    it('should have wavy underline style for unknown status', () => {
      render(<Card bug={mockBug} />)

      const indicator = screen.getByText('qe?')
      expect(indicator.className).toContain('decoration-wavy')
    })

    it('should not have wavy underline for minus status', () => {
      const bugWithQeMinus = {
        ...mockBug,
        flags: [{ name: 'qe-verify', status: '-' }],
      }
      render(<Card bug={bugWithQeMinus} />)

      const indicator = screen.getByText('qe-')
      expect(indicator.className).not.toContain('decoration-wavy')
    })

    it('should not have wavy underline for plus status', () => {
      const bugWithQePlus = {
        ...mockBug,
        flags: [{ name: 'qe-verify', status: '+' }],
      }
      render(<Card bug={bugWithQePlus} />)

      const indicator = screen.getByText('qe+')
      expect(indicator.className).not.toContain('decoration-wavy')
    })

    it('should be in the same row as assignee, aligned to the right', () => {
      render(<Card bug={mockBug} />)

      // QE indicator should be in the same row as the assignee
      const assigneeRow = screen.getByText('qe?').closest('div')
      expect(assigneeRow?.className).toContain('flex')
      // The indicator should have flex-shrink-0 to stay on the right
      const indicator = screen.getByText('qe?')
      expect(indicator.className).toContain('flex-shrink-0')
    })

    it('should make qe indicator clickable when onQeVerifyChange is provided', () => {
      render(<Card bug={mockBug} onQeVerifyChange={vi.fn()} />)

      expect(screen.getByLabelText('Change QE verification')).toBeInTheDocument()
    })

    it('should not make qe indicator clickable when onQeVerifyChange is not provided', () => {
      render(<Card bug={mockBug} />)

      expect(screen.queryByLabelText('Change QE verification')).not.toBeInTheDocument()
    })

    it('should open picker when qe indicator is clicked', async () => {
      const user = userEvent.setup()
      render(<Card bug={mockBug} onQeVerifyChange={vi.fn()} />)

      await user.click(screen.getByLabelText('Change QE verification'))

      expect(screen.getByRole('listbox', { name: /qe verification/i })).toBeInTheDocument()
    })

    it('should call onQeVerifyChange when qe status is selected', async () => {
      const user = userEvent.setup()
      const onQeVerifyChange = vi.fn()
      render(<Card bug={mockBug} onQeVerifyChange={onQeVerifyChange} />)

      await user.click(screen.getByLabelText('Change QE verification'))
      await user.click(screen.getByText('qe-verify: -'))

      expect(onQeVerifyChange).toHaveBeenCalledWith(mockBug.id, 'minus')
    })

    it('should show isQeVerifyStaged indicator when qe-verify is staged', () => {
      render(<Card bug={mockBug} onQeVerifyChange={vi.fn()} isQeVerifyStaged={true} />)

      const button = screen.getByLabelText('Change QE verification')
      expect(button.className).toContain('ring-accent-staged')
    })

    it('should display staged qe status when isQeVerifyStaged is true', () => {
      render(
        <Card
          bug={mockBug}
          onQeVerifyChange={vi.fn()}
          isQeVerifyStaged={true}
          stagedQeVerify="plus"
        />,
      )

      // Should show qe+ for staged plus status
      expect(screen.getByText('qe+')).toBeInTheDocument()
    })

    it('should not trigger card onClick when clicking qe indicator', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      render(<Card bug={mockBug} onClick={onClick} onQeVerifyChange={vi.fn()} />)

      await user.click(screen.getByLabelText('Change QE verification'))

      expect(onClick).not.toHaveBeenCalled()
    })
  })
})
