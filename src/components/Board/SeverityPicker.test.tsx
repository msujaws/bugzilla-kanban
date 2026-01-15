import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SeverityPicker } from './SeverityPicker'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

describe('SeverityPicker', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
    currentSeverity: 'normal',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render when open', () => {
      render(<SeverityPicker {...defaultProps} />)

      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(<SeverityPicker {...defaultProps} isOpen={false} />)

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('should render all severity options', () => {
      render(<SeverityPicker {...defaultProps} />)

      expect(screen.getByText('blocker')).toBeInTheDocument()
      expect(screen.getByText('critical')).toBeInTheDocument()
      expect(screen.getByText('major')).toBeInTheDocument()
      expect(screen.getByText('normal')).toBeInTheDocument()
      expect(screen.getByText('minor')).toBeInTheDocument()
      expect(screen.getByText('trivial')).toBeInTheDocument()
      expect(screen.getByText('enhancement')).toBeInTheDocument()
    })

    it('should show severity descriptions', () => {
      render(<SeverityPicker {...defaultProps} />)

      expect(screen.getByText(/blocks development/i)).toBeInTheDocument()
      expect(screen.getByText(/feature request/i)).toBeInTheDocument()
    })
  })

  describe('selection', () => {
    it('should call onSelect with severity when clicking', () => {
      const onSelect = vi.fn()
      render(<SeverityPicker {...defaultProps} onSelect={onSelect} />)

      fireEvent.click(screen.getByText('critical'))

      expect(onSelect).toHaveBeenCalledWith('critical')
    })

    it('should call onClose after selection', () => {
      const onClose = vi.fn()
      render(<SeverityPicker {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByText('major'))

      expect(onClose).toHaveBeenCalled()
    })

    it('should highlight currently selected severity', () => {
      render(<SeverityPicker {...defaultProps} currentSeverity="major" />)

      const selectedOption = screen.getByRole('option', { selected: true })
      expect(selectedOption).toHaveTextContent('major')
    })
  })

  describe('closing', () => {
    it('should close on Escape key', () => {
      const onClose = vi.fn()
      render(<SeverityPicker {...defaultProps} onClose={onClose} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(onClose).toHaveBeenCalled()
    })

    it('should close when clicking backdrop', () => {
      const onClose = vi.fn()
      render(<SeverityPicker {...defaultProps} onClose={onClose} />)

      const backdrop = screen.getByTestId('severity-picker-backdrop')
      fireEvent.click(backdrop)

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have listbox role', () => {
      render(<SeverityPicker {...defaultProps} />)

      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    it('should have aria-label', () => {
      render(<SeverityPicker {...defaultProps} />)

      expect(screen.getByRole('listbox')).toHaveAttribute('aria-label', 'Select severity')
    })

    it('should have option roles for each item', () => {
      render(<SeverityPicker {...defaultProps} />)

      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(7) // blocker, critical, major, normal, minor, trivial, enhancement
    })
  })

  describe('color indicators', () => {
    it('should show color indicator for each severity', () => {
      const { container } = render(<SeverityPicker {...defaultProps} />)

      // Each severity should have a colored indicator dot
      const colorDots = container.querySelectorAll('[class*="rounded-full"][class*="w-3"]')
      expect(colorDots).toHaveLength(7)
    })
  })
})
