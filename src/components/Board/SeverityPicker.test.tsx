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
    currentSeverity: 'S3',
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

      expect(screen.getByText('S1')).toBeInTheDocument()
      expect(screen.getByText('S2')).toBeInTheDocument()
      expect(screen.getByText('S3')).toBeInTheDocument()
      expect(screen.getByText('S4')).toBeInTheDocument()
      expect(screen.getByText('N/A')).toBeInTheDocument()
    })

    it('should show severity descriptions', () => {
      render(<SeverityPicker {...defaultProps} />)

      expect(screen.getByText(/catastrophic/i)).toBeInTheDocument()
      expect(screen.getByText(/not applicable/i)).toBeInTheDocument()
    })
  })

  describe('selection', () => {
    it('should call onSelect with severity when clicking', () => {
      const onSelect = vi.fn()
      render(<SeverityPicker {...defaultProps} onSelect={onSelect} />)

      fireEvent.click(screen.getByText('S1'))

      expect(onSelect).toHaveBeenCalledWith('S1')
    })

    it('should call onClose after selection', () => {
      const onClose = vi.fn()
      render(<SeverityPicker {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByText('S2'))

      expect(onClose).toHaveBeenCalled()
    })

    it('should highlight currently selected severity', () => {
      render(<SeverityPicker {...defaultProps} currentSeverity="S2" />)

      const selectedOption = screen.getByRole('option', { selected: true })
      expect(selectedOption).toHaveTextContent('S2')
    })
  })

  describe('closing', () => {
    it('should close on Escape key', () => {
      const onClose = vi.fn()
      render(<SeverityPicker {...defaultProps} onClose={onClose} />)

      const listbox = screen.getByRole('listbox')
      fireEvent.keyDown(listbox, { key: 'Escape' })

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
      expect(options).toHaveLength(5) // S1, S2, S3, S4, N/A
    })

    it('should have descriptive aria-label on each option', () => {
      render(<SeverityPicker {...defaultProps} currentSeverity="S1" />)

      const options = screen.getAllByRole('option')
      expect(options[0]).toHaveAttribute(
        'aria-label',
        'Severity S1: Catastrophic, currently selected',
      )
      expect(options[1]).toHaveAttribute('aria-label', 'Severity S2: Serious')
      expect(options[2]).toHaveAttribute('aria-label', 'Severity S3: Normal')
      expect(options[3]).toHaveAttribute('aria-label', 'Severity S4: Minor')
      expect(options[4]).toHaveAttribute('aria-label', 'Severity N/A: Not applicable')
    })

    it('should have aria-activedescendant on listbox', () => {
      render(<SeverityPicker {...defaultProps} currentSeverity="S2" />)

      const listbox = screen.getByRole('listbox')
      expect(listbox).toHaveAttribute('aria-activedescendant')
    })

    it('should focus currently selected option on open', () => {
      render(<SeverityPicker {...defaultProps} currentSeverity="S3" />)

      // S3 is at index 2, should have focus ring
      const options = screen.getAllByRole('option')
      expect(options[2]).toHaveClass('ring-2')
    })
  })

  describe('color indicators', () => {
    it('should show color indicator for each severity', () => {
      render(<SeverityPicker {...defaultProps} />)

      // Each severity should have a colored indicator dot
      // Query from document.body since picker uses portal
      const colorDots = document.body.querySelectorAll('[class*="rounded-full"][class*="w-3"]')
      expect(colorDots).toHaveLength(5)
    })
  })
})
