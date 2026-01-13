import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toast } from './Toast'
import type { Toast as ToastType } from '@/types'

describe('Toast', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
  })

  describe('rendering', () => {
    it('should render success toast with message', () => {
      const toast: ToastType = {
        id: 'test-1',
        type: 'success',
        message: 'Boom! Changes applied like a boss 💥',
        dismissible: true,
        autoClose: 3000,
      }

      render(<Toast toast={toast} onClose={mockOnClose} />)

      expect(screen.getByText('Boom! Changes applied like a boss 💥')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toHaveClass('border-accent-success')
    })

    it('should render error toast with message', () => {
      const toast: ToastType = {
        id: 'test-2',
        type: 'error',
        message: "Uh oh, Bugzilla isn't feeling it right now 😅",
        dismissible: true,
      }

      render(<Toast toast={toast} onClose={mockOnClose} />)

      expect(screen.getByText("Uh oh, Bugzilla isn't feeling it right now 😅")).toBeInTheDocument()
      expect(screen.getByRole('alert')).toHaveClass('border-accent-error')
    })

    it('should render info toast with message', () => {
      const toast: ToastType = {
        id: 'test-3',
        type: 'info',
        message: "Bugs are loading... they're coming for you! 🐛",
        dismissible: true,
        autoClose: 3000,
      }

      render(<Toast toast={toast} onClose={mockOnClose} />)

      expect(screen.getByText("Bugs are loading... they're coming for you! 🐛")).toBeInTheDocument()
      expect(screen.getByRole('alert')).toHaveClass('border-accent-primary')
    })
  })

  describe('icons', () => {
    it('should render check_circle icon for success toast', () => {
      const toast: ToastType = {
        id: 'test-1',
        type: 'success',
        message: 'Success',
        dismissible: true,
        autoClose: 3000,
      }

      render(<Toast toast={toast} onClose={mockOnClose} />)

      expect(screen.getByText('check_circle')).toBeInTheDocument()
    })

    it('should render error icon for error toast', () => {
      const toast: ToastType = {
        id: 'test-2',
        type: 'error',
        message: 'Error',
        dismissible: true,
      }

      render(<Toast toast={toast} onClose={mockOnClose} />)

      expect(screen.getByText('error')).toBeInTheDocument()
    })

    it('should render info icon for info toast', () => {
      const toast: ToastType = {
        id: 'test-3',
        type: 'info',
        message: 'Info',
        dismissible: true,
        autoClose: 3000,
      }

      render(<Toast toast={toast} onClose={mockOnClose} />)

      expect(screen.getByText('info')).toBeInTheDocument()
    })
  })

  describe('close button', () => {
    it('should render close button when dismissible', () => {
      const toast: ToastType = {
        id: 'test-1',
        type: 'success',
        message: 'Success',
        dismissible: true,
        autoClose: 3000,
      }

      render(<Toast toast={toast} onClose={mockOnClose} />)

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      const toast: ToastType = {
        id: 'test-1',
        type: 'success',
        message: 'Success',
        dismissible: true,
        autoClose: 3000,
      }

      render(<Toast toast={toast} onClose={mockOnClose} />)

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledWith('test-1')
    })

    it('should not render close button when not dismissible', () => {
      const toast: ToastType = {
        id: 'test-1',
        type: 'success',
        message: 'Success',
        dismissible: false,
        autoClose: 3000,
      }

      render(<Toast toast={toast} onClose={mockOnClose} />)

      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
    })
  })

  describe('auto-close', () => {
    it('should auto-close after specified duration', () => {
      vi.useFakeTimers()

      const toast: ToastType = {
        id: 'test-1',
        type: 'success',
        message: 'Success',
        dismissible: true,
        autoClose: 3000,
      }

      render(<Toast toast={toast} onClose={mockOnClose} />)

      expect(mockOnClose).not.toHaveBeenCalled()

      // Fast-forward time by 3 seconds
      vi.advanceTimersByTime(3000)

      expect(mockOnClose).toHaveBeenCalledWith('test-1')

      vi.useRealTimers()
    })

    it('should not auto-close when autoClose is undefined', () => {
      vi.useFakeTimers()

      const toast: ToastType = {
        id: 'test-1',
        type: 'error',
        message: 'Error',
        dismissible: true,
      }

      render(<Toast toast={toast} onClose={mockOnClose} />)

      vi.advanceTimersByTime(5000)

      expect(mockOnClose).not.toHaveBeenCalled()

      vi.useRealTimers()
    })
  })
})
