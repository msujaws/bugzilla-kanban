import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QeVerifyPicker } from './QeVerifyPicker'
import type { QeVerifyStatus } from '@/lib/bugzilla/qe-verify'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

describe('QeVerifyPicker', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
    currentStatus: 'unknown' as QeVerifyStatus,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render when open', () => {
      render(<QeVerifyPicker {...defaultProps} />)

      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(<QeVerifyPicker {...defaultProps} isOpen={false} />)

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('should render all three qe-verify options', () => {
      render(<QeVerifyPicker {...defaultProps} />)

      expect(screen.getByText('qe-verify: ---')).toBeInTheDocument()
      expect(screen.getByText('qe-verify: -')).toBeInTheDocument()
      expect(screen.getByText('qe-verify: +')).toBeInTheDocument()
    })

    it('should show option descriptions', () => {
      render(<QeVerifyPicker {...defaultProps} />)

      expect(screen.getByText(/remove flag/i)).toBeInTheDocument()
      expect(screen.getByText(/not needed/i)).toBeInTheDocument()
      expect(screen.getByText(/verified/i)).toBeInTheDocument()
    })
  })

  describe('selection', () => {
    it('should call onSelect with "unknown" when clicking remove option', () => {
      const onSelect = vi.fn()
      render(<QeVerifyPicker {...defaultProps} onSelect={onSelect} />)

      fireEvent.click(screen.getByText('qe-verify: ---'))

      expect(onSelect).toHaveBeenCalledWith('unknown')
    })

    it('should call onSelect with "minus" when clicking minus option', () => {
      const onSelect = vi.fn()
      render(<QeVerifyPicker {...defaultProps} onSelect={onSelect} />)

      fireEvent.click(screen.getByText('qe-verify: -'))

      expect(onSelect).toHaveBeenCalledWith('minus')
    })

    it('should call onSelect with "plus" when clicking plus option', () => {
      const onSelect = vi.fn()
      render(<QeVerifyPicker {...defaultProps} onSelect={onSelect} />)

      fireEvent.click(screen.getByText('qe-verify: +'))

      expect(onSelect).toHaveBeenCalledWith('plus')
    })

    it('should call onClose after selection', () => {
      const onClose = vi.fn()
      render(<QeVerifyPicker {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByText('qe-verify: -'))

      expect(onClose).toHaveBeenCalled()
    })

    it('should highlight currently selected status', () => {
      render(<QeVerifyPicker {...defaultProps} currentStatus="minus" />)

      const selectedOption = screen.getByRole('option', { selected: true })
      expect(selectedOption).toHaveTextContent('qe-verify: -')
    })
  })

  describe('closing', () => {
    it('should close on Escape key', () => {
      const onClose = vi.fn()
      render(<QeVerifyPicker {...defaultProps} onClose={onClose} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(onClose).toHaveBeenCalled()
    })

    it('should close when clicking backdrop', () => {
      const onClose = vi.fn()
      render(<QeVerifyPicker {...defaultProps} onClose={onClose} />)

      const backdrop = screen.getByTestId('qe-verify-picker-backdrop')
      fireEvent.click(backdrop)

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have listbox role', () => {
      render(<QeVerifyPicker {...defaultProps} />)

      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    it('should have aria-label', () => {
      render(<QeVerifyPicker {...defaultProps} />)

      expect(screen.getByRole('listbox')).toHaveAttribute('aria-label', 'Select QE verification')
    })

    it('should have option roles for each item', () => {
      render(<QeVerifyPicker {...defaultProps} />)

      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(3)
    })
  })
})
