import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Card } from './Card'
import type { BugzillaBug } from '@/lib/bugzilla/types'

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
}))

const mockBug: BugzillaBug = {
  id: 12_345,
  summary: 'Fix the login button not working on mobile',
  status: 'NEW',
  assigned_to: 'developer@example.com',
  priority: 'P2',
  severity: 'major',
  component: 'Authentication',
  whiteboard: '[kanban]',
  last_change_time: '2024-01-15T10:30:00Z',
}

describe('Card', () => {
  describe('rendering', () => {
    it('should render bug ID', () => {
      render(<Card bug={mockBug} />)

      expect(screen.getByText('#12345')).toBeInTheDocument()
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

      expect(screen.getByText('major')).toBeInTheDocument()
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
    it('should show blocker severity with error color', () => {
      const blockerBug = { ...mockBug, severity: 'blocker' }
      render(<Card bug={blockerBug} />)

      const severityBadge = screen.getByText('blocker')
      expect(severityBadge.className).toContain('accent-error')
    })

    it('should show critical severity with error color', () => {
      const criticalBug = { ...mockBug, severity: 'critical' }
      render(<Card bug={criticalBug} />)

      const severityBadge = screen.getByText('critical')
      expect(severityBadge.className).toContain('accent-error')
    })

    it('should show major severity with warning color', () => {
      const majorBug = { ...mockBug, severity: 'major' }
      render(<Card bug={majorBug} />)

      const severityBadge = screen.getByText('major')
      expect(severityBadge.className).toContain('accent-warning')
    })

    it('should show normal severity with default color', () => {
      const normalBug = { ...mockBug, severity: 'normal' }
      render(<Card bug={normalBug} />)

      const severityBadge = screen.getByText('normal')
      expect(severityBadge.className).toContain('text-tertiary')
    })

    it('should show minor severity with success color', () => {
      const minorBug = { ...mockBug, severity: 'minor' }
      render(<Card bug={minorBug} />)

      const severityBadge = screen.getByText('minor')
      expect(severityBadge.className).toContain('accent-success')
    })

    it('should show trivial severity with success color', () => {
      const trivialBug = { ...mockBug, severity: 'trivial' }
      render(<Card bug={trivialBug} />)

      const severityBadge = screen.getByText('trivial')
      expect(severityBadge.className).toContain('accent-success')
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
  })

  describe('interaction', () => {
    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      render(<Card bug={mockBug} onClick={onClick} />)

      await user.click(screen.getByText('#12345'))

      expect(onClick).toHaveBeenCalledWith(mockBug)
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
    it('should truncate long summaries', () => {
      const longSummaryBug = {
        ...mockBug,
        summary:
          'This is a very long summary that should be truncated when it exceeds the maximum width of the card component in the Kanban board',
      }
      render(<Card bug={longSummaryBug} />)

      const summary = screen.getByText(longSummaryBug.summary)
      expect(summary.className).toContain('truncate')
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
})
