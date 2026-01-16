import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PointsPicker } from './PointsPicker'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

describe('PointsPicker', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
    currentPoints: undefined as number | string | undefined,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render when open', () => {
      render(<PointsPicker {...defaultProps} />)

      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(<PointsPicker {...defaultProps} isOpen={false} />)

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('should render all point options', () => {
      render(<PointsPicker {...defaultProps} />)

      expect(screen.getByText('---')).toBeInTheDocument()
      expect(screen.getByText('?')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('8')).toBeInTheDocument()
      expect(screen.getByText('13')).toBeInTheDocument()
      expect(screen.getByText('21')).toBeInTheDocument()
    })
  })

  describe('selection', () => {
    it('should call onSelect with number when clicking a point value', () => {
      const onSelect = vi.fn()
      render(<PointsPicker {...defaultProps} onSelect={onSelect} />)

      fireEvent.click(screen.getByText('5'))

      expect(onSelect).toHaveBeenCalledWith(5)
    })

    it('should call onSelect with "?" for unknown points', () => {
      const onSelect = vi.fn()
      render(<PointsPicker {...defaultProps} onSelect={onSelect} />)

      fireEvent.click(screen.getByText('?'))

      expect(onSelect).toHaveBeenCalledWith('?')
    })

    it('should call onSelect with undefined for "---" (clear)', () => {
      const onSelect = vi.fn()
      render(<PointsPicker {...defaultProps} onSelect={onSelect} />)

      fireEvent.click(screen.getByText('---'))

      expect(onSelect).toHaveBeenCalledWith(undefined)
    })

    it('should call onClose after selection', () => {
      const onClose = vi.fn()
      render(<PointsPicker {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByText('5'))

      expect(onClose).toHaveBeenCalled()
    })

    it('should highlight currently selected points', () => {
      render(<PointsPicker {...defaultProps} currentPoints={5} />)

      const selectedOption = screen.getByRole('option', { selected: true })
      expect(selectedOption).toHaveTextContent('5')
    })

    it('should highlight "?" when currentPoints is "?"', () => {
      render(<PointsPicker {...defaultProps} currentPoints="?" />)

      const selectedOption = screen.getByRole('option', { selected: true })
      expect(selectedOption).toHaveTextContent('?')
    })
  })

  describe('closing', () => {
    it('should close on Escape key', () => {
      const onClose = vi.fn()
      render(<PointsPicker {...defaultProps} onClose={onClose} />)

      const listbox = screen.getByRole('listbox')
      fireEvent.keyDown(listbox, { key: 'Escape' })

      expect(onClose).toHaveBeenCalled()
    })

    it('should close when clicking backdrop', () => {
      const onClose = vi.fn()
      render(<PointsPicker {...defaultProps} onClose={onClose} />)

      const backdrop = screen.getByTestId('points-picker-backdrop')
      fireEvent.click(backdrop)

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have listbox role', () => {
      render(<PointsPicker {...defaultProps} />)

      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    it('should have aria-label', () => {
      render(<PointsPicker {...defaultProps} />)

      expect(screen.getByRole('listbox')).toHaveAttribute('aria-label', 'Select story points')
    })

    it('should have option roles for each item', () => {
      render(<PointsPicker {...defaultProps} />)

      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(9) // ---, ?, 1, 2, 3, 5, 8, 13, 21
    })

    it('should have descriptive aria-label on each option', () => {
      render(<PointsPicker {...defaultProps} currentPoints={5} />)

      const options = screen.getAllByRole('option')
      expect(options[0]).toHaveAttribute('aria-label', 'Clear points')
      expect(options[1]).toHaveAttribute('aria-label', 'Unknown points')
      expect(options[2]).toHaveAttribute('aria-label', '1 points')
      expect(options[3]).toHaveAttribute('aria-label', '2 points')
      expect(options[4]).toHaveAttribute('aria-label', '3 points')
      expect(options[5]).toHaveAttribute('aria-label', '5 points, currently selected')
      expect(options[6]).toHaveAttribute('aria-label', '8 points')
      expect(options[7]).toHaveAttribute('aria-label', '13 points')
      expect(options[8]).toHaveAttribute('aria-label', '21 points')
    })

    it('should have aria-activedescendant on listbox', () => {
      render(<PointsPicker {...defaultProps} currentPoints={5} />)

      const listbox = screen.getByRole('listbox')
      expect(listbox).toHaveAttribute('aria-activedescendant')
    })

    it('should focus currently selected option on open', () => {
      render(<PointsPicker {...defaultProps} currentPoints={8} />)

      // 8 is at index 6, should have focus ring
      const options = screen.getAllByRole('option')
      expect(options[6]).toHaveClass('ring-2')
    })
  })
})
