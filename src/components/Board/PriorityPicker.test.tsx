import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PriorityPicker } from './PriorityPicker'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

describe('PriorityPicker', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
    currentPriority: 'P3',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render when open', () => {
      render(<PriorityPicker {...defaultProps} />)

      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(<PriorityPicker {...defaultProps} isOpen={false} />)

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('should render all priority options P1-P5', () => {
      render(<PriorityPicker {...defaultProps} />)

      expect(screen.getByText('P1')).toBeInTheDocument()
      expect(screen.getByText('P2')).toBeInTheDocument()
      expect(screen.getByText('P3')).toBeInTheDocument()
      expect(screen.getByText('P4')).toBeInTheDocument()
      expect(screen.getByText('P5')).toBeInTheDocument()
    })

    it('should show priority descriptions', () => {
      render(<PriorityPicker {...defaultProps} />)

      expect(screen.getByText(/highest/i)).toBeInTheDocument()
      expect(screen.getByText(/lowest/i)).toBeInTheDocument()
    })
  })

  describe('selection', () => {
    it('should call onSelect with priority when clicking', () => {
      const onSelect = vi.fn()
      render(<PriorityPicker {...defaultProps} onSelect={onSelect} />)

      fireEvent.click(screen.getByText('P1'))

      expect(onSelect).toHaveBeenCalledWith('P1')
    })

    it('should call onClose after selection', () => {
      const onClose = vi.fn()
      render(<PriorityPicker {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByText('P2'))

      expect(onClose).toHaveBeenCalled()
    })

    it('should highlight currently selected priority', () => {
      render(<PriorityPicker {...defaultProps} currentPriority="P2" />)

      const selectedOption = screen.getByRole('option', { selected: true })
      expect(selectedOption).toHaveTextContent('P2')
    })
  })

  describe('closing', () => {
    it('should close on Escape key', () => {
      const onClose = vi.fn()
      render(<PriorityPicker {...defaultProps} onClose={onClose} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(onClose).toHaveBeenCalled()
    })

    it('should close when clicking backdrop', () => {
      const onClose = vi.fn()
      render(<PriorityPicker {...defaultProps} onClose={onClose} />)

      const backdrop = screen.getByTestId('priority-picker-backdrop')
      fireEvent.click(backdrop)

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have listbox role', () => {
      render(<PriorityPicker {...defaultProps} />)

      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    it('should have aria-label', () => {
      render(<PriorityPicker {...defaultProps} />)

      expect(screen.getByRole('listbox')).toHaveAttribute('aria-label', 'Select priority')
    })

    it('should have option roles for each item', () => {
      render(<PriorityPicker {...defaultProps} />)

      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(5) // P1-P5
    })
  })

  describe('color indicators', () => {
    it('should show color indicator for each priority', () => {
      const { container } = render(<PriorityPicker {...defaultProps} />)

      // Each priority should have a colored indicator dot
      const colorDots = container.querySelectorAll('[class*="rounded-full"][class*="w-3"]')
      expect(colorDots).toHaveLength(5)
    })
  })
})
