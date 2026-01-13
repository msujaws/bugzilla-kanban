import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AssigneePicker } from './AssigneePicker'
import type { Assignee } from '@/hooks/use-board-assignees'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      ...props
    }: {
      children?: React.ReactNode
      initial?: unknown
      animate?: unknown
      exit?: unknown
      [key: string]: unknown
    }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockAssignees: Assignee[] = [
  { email: 'alice@example.com', displayName: 'Alice Johnson', count: 5 },
  { email: 'bob@example.com', displayName: 'Bob Smith', count: 3 },
  { email: 'charlie@example.com', displayName: 'charlie@example.com', count: 1 },
]

describe('AssigneePicker', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
    assignees: mockAssignees,
    currentAssignee: 'alice@example.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render dropdown when isOpen is true', () => {
      render(<AssigneePicker {...defaultProps} />)

      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    it('should not render dropdown when isOpen is false', () => {
      render(<AssigneePicker {...defaultProps} isOpen={false} />)

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('should display header text', () => {
      render(<AssigneePicker {...defaultProps} />)

      expect(screen.getByText(/assignees on this board/i)).toBeInTheDocument()
    })

    it('should list all assignees', () => {
      render(<AssigneePicker {...defaultProps} />)

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      expect(screen.getByText('Bob Smith')).toBeInTheDocument()
      expect(screen.getByText('charlie@example.com')).toBeInTheDocument()
    })

    it('should highlight current assignee with checkmark', () => {
      render(<AssigneePicker {...defaultProps} />)

      // Find the alice row and check for checkmark
      const aliceRow = screen.getByText('Alice Johnson').closest('[role="option"]')
      expect(aliceRow).toHaveAttribute('aria-selected', 'true')
    })

    it('should not highlight non-current assignees', () => {
      render(<AssigneePicker {...defaultProps} />)

      const bobRow = screen.getByText('Bob Smith').closest('[role="option"]')
      expect(bobRow).toHaveAttribute('aria-selected', 'false')
    })
  })

  describe('interaction', () => {
    it('should call onSelect with email when assignee is clicked', () => {
      const onSelect = vi.fn()
      render(<AssigneePicker {...defaultProps} onSelect={onSelect} />)

      fireEvent.click(screen.getByText('Bob Smith'))

      expect(onSelect).toHaveBeenCalledWith('bob@example.com')
    })

    it('should call onClose when Escape key is pressed', () => {
      const onClose = vi.fn()
      render(<AssigneePicker {...defaultProps} onClose={onClose} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(onClose).toHaveBeenCalled()
    })

    it('should call onClose when clicking outside', () => {
      const onClose = vi.fn()
      render(
        <div data-testid="outside">
          <AssigneePicker {...defaultProps} onClose={onClose} />
        </div>,
      )

      // Click on the backdrop
      const backdrop = screen.getByTestId('assignee-picker-backdrop')
      fireEvent.click(backdrop)

      expect(onClose).toHaveBeenCalled()
    })

    it('should not call onClose when clicking inside the dropdown', () => {
      const onClose = vi.fn()
      render(<AssigneePicker {...defaultProps} onClose={onClose} />)

      // Click on the dropdown content (not the backdrop)
      fireEvent.click(screen.getByRole('listbox'))

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('empty state', () => {
    it('should show message when no assignees', () => {
      render(<AssigneePicker {...defaultProps} assignees={[]} />)

      expect(screen.getByText(/no assignees found/i)).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have proper listbox role', () => {
      render(<AssigneePicker {...defaultProps} />)

      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    it('should have option roles for each assignee', () => {
      render(<AssigneePicker {...defaultProps} />)

      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(3)
    })

    it('should have aria-label on the listbox', () => {
      render(<AssigneePicker {...defaultProps} />)

      expect(screen.getByRole('listbox')).toHaveAttribute('aria-label', 'Select assignee')
    })
  })
})
