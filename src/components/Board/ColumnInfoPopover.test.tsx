import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ColumnInfoPopover } from './ColumnInfoPopover'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

describe('ColumnInfoPopover', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    description: 'Test description for the column',
    anchorPosition: { x: 100, y: 100 },
  }

  describe('rendering', () => {
    it('should render description when open', () => {
      render(<ColumnInfoPopover {...defaultProps} />)

      expect(screen.getByText('Test description for the column')).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(<ColumnInfoPopover {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('Test description for the column')).not.toBeInTheDocument()
    })

    it('should have a header with "Column Info"', () => {
      render(<ColumnInfoPopover {...defaultProps} />)

      expect(screen.getByText('Column Info')).toBeInTheDocument()
    })
  })

  describe('closing behavior', () => {
    it('should call onClose when clicking backdrop', () => {
      const onClose = vi.fn()
      render(<ColumnInfoPopover {...defaultProps} onClose={onClose} />)

      const backdrop = screen.getByTestId('column-info-backdrop')
      fireEvent.click(backdrop)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when pressing Escape', () => {
      const onClose = vi.fn()
      render(<ColumnInfoPopover {...defaultProps} onClose={onClose} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should not call onClose when clicking inside the popover', () => {
      const onClose = vi.fn()
      render(<ColumnInfoPopover {...defaultProps} onClose={onClose} />)

      const popover = screen.getByText('Test description for the column')
      fireEvent.click(popover)

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have appropriate role', () => {
      render(<ColumnInfoPopover {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should have aria-label', () => {
      render(<ColumnInfoPopover {...defaultProps} />)

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Column information')
    })
  })
})
