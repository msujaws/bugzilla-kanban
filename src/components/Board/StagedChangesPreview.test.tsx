import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StagedChangesPreview } from './StagedChangesPreview'
import type { StagedChange } from '@/store/slices/staged-slice'
import type { BugzillaBug } from '@/lib/bugzilla/types'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockBugs: BugzillaBug[] = [
  {
    id: 12_345,
    summary: 'Fix the login button not working on mobile devices when clicked',
    status: 'NEW',
    assigned_to: 'developer@example.com',
    priority: 'P2',
    severity: 'S3',
    component: 'Authentication',
    whiteboard: '[kanban]',
    last_change_time: '2024-01-15T10:30:00Z',
    creation_time: '2024-01-01T00:00:00Z',
  },
  {
    id: 67_890,
    summary: 'Add dark mode toggle to settings page',
    status: 'ASSIGNED',
    assigned_to: 'alice@example.com',
    priority: 'P3',
    severity: 'S4',
    component: 'Settings',
    whiteboard: '[kanban]',
    last_change_time: '2024-01-16T10:30:00Z',
    creation_time: '2024-01-02T00:00:00Z',
  },
]

describe('StagedChangesPreview', () => {
  describe('rendering', () => {
    it('should render nothing when changes map is empty', () => {
      const changes = new Map<number, StagedChange>()
      const { container } = render(<StagedChangesPreview changes={changes} bugs={mockBugs} />)

      expect(container.firstChild).toBeNull()
    })

    it('should render bug ID', () => {
      const changes = new Map<number, StagedChange>([
        [12_345, { status: { from: 'backlog', to: 'in-progress' } }],
      ])
      render(<StagedChangesPreview changes={changes} bugs={mockBugs} />)

      expect(screen.getByText(/#12345/)).toBeInTheDocument()
    })

    it('should render truncated bug summary', () => {
      const changes = new Map<number, StagedChange>([
        [12_345, { status: { from: 'backlog', to: 'in-progress' } }],
      ])
      render(<StagedChangesPreview changes={changes} bugs={mockBugs} />)

      // The summary should be truncated but present
      expect(screen.getByText(/Fix the login button/)).toBeInTheDocument()
    })

    it('should render multiple bugs when changes map has multiple entries', () => {
      const changes = new Map<number, StagedChange>([
        [12_345, { status: { from: 'backlog', to: 'in-progress' } }],
        [67_890, { priority: { from: 'P3', to: 'P1' } }],
      ])
      render(<StagedChangesPreview changes={changes} bugs={mockBugs} />)

      expect(screen.getByText(/#12345/)).toBeInTheDocument()
      expect(screen.getByText(/#67890/)).toBeInTheDocument()
    })
  })

  describe('status changes', () => {
    it('should format column names with proper capitalization', () => {
      const changes = new Map<number, StagedChange>([
        [12_345, { status: { from: 'backlog', to: 'in-progress' } }],
      ])
      render(<StagedChangesPreview changes={changes} bugs={mockBugs} />)

      expect(screen.getByText(/Backlog/)).toBeInTheDocument()
      expect(screen.getByText(/In Progress/)).toBeInTheDocument()
    })

    it('should show arrow between from and to values', () => {
      const changes = new Map<number, StagedChange>([
        [12_345, { status: { from: 'backlog', to: 'in-progress' } }],
      ])
      render(<StagedChangesPreview changes={changes} bugs={mockBugs} />)

      expect(screen.getByText(/→/)).toBeInTheDocument()
    })

    it('should show Status label for status changes', () => {
      const changes = new Map<number, StagedChange>([
        [12_345, { status: { from: 'backlog', to: 'in-progress' } }],
      ])
      render(<StagedChangesPreview changes={changes} bugs={mockBugs} />)

      expect(screen.getByText(/Status:/)).toBeInTheDocument()
    })
  })

  describe('assignee changes', () => {
    it('should show Assignee label and email values', () => {
      const changes = new Map<number, StagedChange>([
        [12_345, { assignee: { from: 'nobody@mozilla.org', to: 'alice@example.com' } }],
      ])
      render(<StagedChangesPreview changes={changes} bugs={mockBugs} />)

      expect(screen.getByText(/Assignee:/)).toBeInTheDocument()
      expect(screen.getByText(/nobody@mozilla.org/)).toBeInTheDocument()
      expect(screen.getByText(/alice@example.com/)).toBeInTheDocument()
    })
  })

  describe('priority changes', () => {
    it('should show Priority label and values', () => {
      const changes = new Map<number, StagedChange>([
        [67_890, { priority: { from: 'P3', to: 'P1' } }],
      ])
      render(<StagedChangesPreview changes={changes} bugs={mockBugs} />)

      expect(screen.getByText(/Priority:/)).toBeInTheDocument()
      expect(screen.getByText(/P3.*→.*P1/)).toBeInTheDocument()
    })
  })

  describe('severity changes', () => {
    it('should show Severity label and values', () => {
      const changes = new Map<number, StagedChange>([
        [67_890, { severity: { from: 'S4', to: 'S1' } }],
      ])
      render(<StagedChangesPreview changes={changes} bugs={mockBugs} />)

      expect(screen.getByText(/Severity:/)).toBeInTheDocument()
      expect(screen.getByText(/S4.*→.*S1/)).toBeInTheDocument()
    })
  })

  describe('points changes', () => {
    it('should show Points label and values', () => {
      const changes = new Map<number, StagedChange>([[12_345, { points: { from: 3, to: 8 } }]])
      render(<StagedChangesPreview changes={changes} bugs={mockBugs} />)

      expect(screen.getByText(/Points:/)).toBeInTheDocument()
      expect(screen.getByText(/3.*→.*8/)).toBeInTheDocument()
    })

    it('should show "none" for undefined points', () => {
      const changes = new Map<number, StagedChange>([
        [12_345, { points: { from: undefined, to: 5 } }],
      ])
      render(<StagedChangesPreview changes={changes} bugs={mockBugs} />)

      expect(screen.getByText(/none.*→.*5/i)).toBeInTheDocument()
    })
  })

  describe('qe-verify changes', () => {
    it('should format qe-verify values as qe+, qe-, and ---', () => {
      const changes = new Map<number, StagedChange>([
        [12_345, { qeVerify: { from: 'unknown', to: 'plus' } }],
      ])
      render(<StagedChangesPreview changes={changes} bugs={mockBugs} />)

      expect(screen.getByText(/QE Verify:/)).toBeInTheDocument()
      expect(screen.getByText(/---.*→.*qe\+/)).toBeInTheDocument()
    })

    it('should show qe- for minus status', () => {
      const changes = new Map<number, StagedChange>([
        [12_345, { qeVerify: { from: 'plus', to: 'minus' } }],
      ])
      render(<StagedChangesPreview changes={changes} bugs={mockBugs} />)

      expect(screen.getByText(/qe\+.*→.*qe-/)).toBeInTheDocument()
    })
  })

  describe('multiple changes per bug', () => {
    it('should show all types of changes for a single bug', () => {
      const changes = new Map<number, StagedChange>([
        [
          12_345,
          {
            status: { from: 'backlog', to: 'in-progress' },
            assignee: { from: 'nobody@mozilla.org', to: 'alice@example.com' },
            priority: { from: 'P2', to: 'P1' },
          },
        ],
      ])
      render(<StagedChangesPreview changes={changes} bugs={mockBugs} />)

      expect(screen.getByText(/Status:/)).toBeInTheDocument()
      expect(screen.getByText(/Assignee:/)).toBeInTheDocument()
      expect(screen.getByText(/Priority:/)).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have proper region role', () => {
      const changes = new Map<number, StagedChange>([
        [12_345, { status: { from: 'backlog', to: 'in-progress' } }],
      ])
      render(<StagedChangesPreview changes={changes} bugs={mockBugs} />)

      expect(screen.getByRole('region', { name: /staged changes/i })).toBeInTheDocument()
    })

    it('should have list structure for changes', () => {
      const changes = new Map<number, StagedChange>([
        [12_345, { status: { from: 'backlog', to: 'in-progress' } }],
        [67_890, { priority: { from: 'P3', to: 'P1' } }],
      ])
      render(<StagedChangesPreview changes={changes} bugs={mockBugs} />)

      const list = screen.getByRole('list')
      expect(list).toBeInTheDocument()
      expect(screen.getAllByRole('listitem')).toHaveLength(2)
    })
  })

  describe('bug not found handling', () => {
    it('should handle bug not found in bugs array gracefully', () => {
      const changes = new Map<number, StagedChange>([
        [99_999, { status: { from: 'backlog', to: 'in-progress' } }],
      ])
      render(<StagedChangesPreview changes={changes} bugs={mockBugs} />)

      // Should still show bug ID even without summary
      expect(screen.getByText(/#99999/)).toBeInTheDocument()
    })
  })
})
