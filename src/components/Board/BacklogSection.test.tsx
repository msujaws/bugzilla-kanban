import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BacklogSection } from './BacklogSection'
import type { BugzillaBug } from '@/lib/bugzilla/types'
import type { StagedChange } from '@/store/slices/staged-slice'

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', () => ({
  useDroppable: vi.fn(() => ({
    setNodeRef: vi.fn(),
    isOver: false,
  })),
  useDraggable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: undefined,
    isDragging: false,
  })),
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

const createBug = (overrides: Partial<BugzillaBug> = {}): BugzillaBug => ({
  id: 1,
  summary: 'Test bug',
  status: 'NEW',
  assigned_to: 'dev@example.com',
  priority: 'P2',
  severity: 'normal',
  component: 'Core',
  whiteboard: '',
  last_change_time: '2024-01-15T10:00:00Z',
  creation_time: '2024-01-01T00:00:00Z',
  ...overrides,
})

describe('BacklogSection', () => {
  const defaultProps = {
    bugs: [createBug()],
    stagedChanges: new Map<number, StagedChange>(),
  }

  describe('rendering', () => {
    it('should render with Backlog header', () => {
      render(<BacklogSection {...defaultProps} />)
      expect(screen.getByText('Backlog')).toBeInTheDocument()
    })

    it('should display bug count', () => {
      const bugs = [createBug({ id: 1 }), createBug({ id: 2 })]
      render(<BacklogSection {...defaultProps} bugs={bugs} />)
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should render bug cards', () => {
      const bugs = [
        createBug({ summary: 'First bug' }),
        createBug({ id: 2, summary: 'Second bug' }),
      ]
      render(<BacklogSection {...defaultProps} bugs={bugs} />)

      expect(screen.getByText('First bug')).toBeInTheDocument()
      expect(screen.getByText('Second bug')).toBeInTheDocument()
    })

    it('should be styled as a horizontal section below the board', () => {
      const { container } = render(<BacklogSection {...defaultProps} />)
      // Should have mt (margin-top) to separate from board
      const section = container.querySelector('[role="region"]')
      expect(section).toHaveClass('mt-6')
    })
  })

  describe('empty state', () => {
    it('should show empty state when no bugs', () => {
      render(<BacklogSection {...defaultProps} bugs={[]} />)
      expect(screen.getByText(/No bugs here/)).toBeInTheDocument()
    })

    it('should align empty state towards top', () => {
      render(<BacklogSection {...defaultProps} bugs={[]} />)
      const emptyState = screen.getByText(/No bugs here/).parentElement
      expect(emptyState).toHaveClass('justify-start')
    })
  })

  describe('loading state', () => {
    it('should show loading indicator when isLoading is true', () => {
      render(<BacklogSection {...defaultProps} isLoading />)
      expect(screen.getByText(/Loading/)).toBeInTheDocument()
    })
  })

  describe('staged changes', () => {
    it('should show staged count badge', () => {
      const bugs = [createBug({ id: 1 })]
      const stagedChanges = new Map<number, StagedChange>([
        [1, { status: { from: 'backlog', to: 'todo' } }],
      ])
      render(<BacklogSection {...defaultProps} bugs={bugs} stagedChanges={stagedChanges} />)

      expect(screen.getByText('1 staged')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have region role', () => {
      render(<BacklogSection {...defaultProps} />)
      expect(screen.getByRole('region', { name: /backlog/i })).toBeInTheDocument()
    })
  })
})
