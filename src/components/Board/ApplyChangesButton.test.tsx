import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApplyChangesButton } from './ApplyChangesButton'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      whileHover: _whileHover,
      whileTap: _whileTap,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

describe('ApplyChangesButton', () => {
  const defaultProps = {
    changeCount: 3,
    isApplying: false,
    onApply: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render when there are changes', () => {
      render(<ApplyChangesButton {...defaultProps} />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should not render when no changes', () => {
      render(<ApplyChangesButton {...defaultProps} changeCount={0} />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('should show change count', () => {
      render(<ApplyChangesButton {...defaultProps} changeCount={5} />)

      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should show playful apply message', () => {
      render(<ApplyChangesButton {...defaultProps} />)

      expect(screen.getByText(/apply/i)).toBeInTheDocument()
    })

    it('should have cloud upload icon', () => {
      render(<ApplyChangesButton {...defaultProps} />)

      expect(screen.getByText('cloud_upload')).toBeInTheDocument()
    })
  })

  describe('apply action', () => {
    it('should call onApply when clicked', async () => {
      const user = userEvent.setup()
      const onApply = vi.fn()
      render(<ApplyChangesButton {...defaultProps} onApply={onApply} />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(onApply).toHaveBeenCalled()
    })

    it('should be disabled when isApplying', () => {
      render(<ApplyChangesButton {...defaultProps} isApplying={true} />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should show loading state when applying', () => {
      render(<ApplyChangesButton {...defaultProps} isApplying={true} />)

      expect(screen.getByText(/applying/i)).toBeInTheDocument()
    })

    it('should show spinner when applying', () => {
      render(<ApplyChangesButton {...defaultProps} isApplying={true} />)

      expect(screen.getByText('sync')).toBeInTheDocument()
    })
  })

  describe('singular/plural text', () => {
    it('should show singular text for 1 change', () => {
      render(<ApplyChangesButton {...defaultProps} changeCount={1} />)

      expect(screen.getByText(/1 change/i)).toBeInTheDocument()
    })

    it('should show plural text for multiple changes', () => {
      render(<ApplyChangesButton {...defaultProps} changeCount={3} />)

      expect(screen.getByText(/3 changes/i)).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('should be positioned fixed at bottom right', () => {
      render(<ApplyChangesButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button.className).toContain('fixed')
      expect(button.className).toContain('bottom')
      expect(button.className).toContain('right')
    })

    it('should have accent color background', () => {
      render(<ApplyChangesButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button.className).toContain('bg-accent')
    })

    it('should have shadow for elevation', () => {
      render(<ApplyChangesButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button.className).toContain('shadow')
    })
  })

  describe('accessibility', () => {
    it('should have descriptive aria-label', () => {
      render(<ApplyChangesButton {...defaultProps} changeCount={3} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('3'))
    })

    it('should be keyboard focusable', async () => {
      const user = userEvent.setup()
      const onApply = vi.fn()
      render(<ApplyChangesButton {...defaultProps} onApply={onApply} />)

      await user.tab()
      await user.keyboard('{Enter}')

      expect(onApply).toHaveBeenCalled()
    })
  })
})
