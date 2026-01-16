import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OriginStoryModal } from './OriginStoryModal'

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

describe('OriginStoryModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render when isOpen is true', () => {
      render(<OriginStoryModal isOpen={true} onClose={mockOnClose} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<OriginStoryModal isOpen={false} onClose={mockOnClose} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should have a title mentioning Boardzilla', () => {
      render(<OriginStoryModal isOpen={true} onClose={mockOnClose} />)

      expect(screen.getByRole('heading', { name: /boardzilla/i })).toBeInTheDocument()
    })
  })

  describe('origin story content', () => {
    it('should mention bugzilla.mozilla.org as the origin', () => {
      render(<OriginStoryModal isOpen={true} onClose={mockOnClose} />)

      expect(screen.getByText(/bugzilla\.mozilla\.org/i)).toBeInTheDocument()
    })

    it('should mention Boardzilla was accidentally exported', () => {
      render(<OriginStoryModal isOpen={true} onClose={mockOnClose} />)

      expect(screen.getByText(/csv export/i)).toBeInTheDocument()
    })

    it('should mention Boardzilla is a bug whisperer', () => {
      render(<OriginStoryModal isOpen={true} onClose={mockOnClose} />)

      // Multiple elements mention whispering - just verify at least one exists
      expect(screen.getAllByText(/whisper/i).length).toBeGreaterThan(0)
    })

    it('should mention sugar free Red Bull', () => {
      render(<OriginStoryModal isOpen={true} onClose={mockOnClose} />)

      // Multiple elements mention Red Bull - just verify at least one exists
      expect(screen.getAllByText(/red bull/i).length).toBeGreaterThan(0)
    })

    it('should mention the nemesis Scope Creep', () => {
      render(<OriginStoryModal isOpen={true} onClose={mockOnClose} />)

      // Multiple elements mention Scope Creep - just verify at least one exists
      expect(screen.getAllByText(/scope creep/i).length).toBeGreaterThan(0)
    })

    it('should reference Mozilla or open source mission', () => {
      render(<OriginStoryModal isOpen={true} onClose={mockOnClose} />)

      // Multiple elements might match - just verify at least one exists
      expect(screen.getAllByText(/open source|mozilla|firefox/i).length).toBeGreaterThan(0)
    })
  })

  describe('interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<OriginStoryModal isOpen={true} onClose={mockOnClose} />)

      await user.click(screen.getByRole('button', { name: /close/i }))

      expect(mockOnClose).toHaveBeenCalledOnce()
    })

    it('should call onClose when clicking outside the modal', async () => {
      const user = userEvent.setup()
      render(<OriginStoryModal isOpen={true} onClose={mockOnClose} />)

      // Click the backdrop
      const backdrop = screen.getByRole('dialog').parentElement
      if (backdrop) {
        await user.click(backdrop)
      }

      expect(mockOnClose).toHaveBeenCalledOnce()
    })

    it('should call onClose when Escape key is pressed', async () => {
      const user = userEvent.setup()
      render(<OriginStoryModal isOpen={true} onClose={mockOnClose} />)

      await user.keyboard('{Escape}')

      expect(mockOnClose).toHaveBeenCalledOnce()
    })
  })

  describe('accessibility', () => {
    it('should have proper aria attributes for dialog', () => {
      render(<OriginStoryModal isOpen={true} onClose={mockOnClose} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby')
    })
  })
})
