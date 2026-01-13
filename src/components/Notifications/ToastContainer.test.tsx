import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastContainer } from './ToastContainer'
import type { Toast } from '@/types'

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('ToastContainer', () => {
  const mockRemoveToast = vi.fn()

  beforeEach(() => {
    mockRemoveToast.mockClear()
  })

  describe('rendering', () => {
    it('should render empty container when no toasts', () => {
      const { container } = render(<ToastContainer toasts={[]} removeToast={mockRemoveToast} />)

      // Container should exist but be empty
      expect(container.querySelector('.fixed')).toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should render single toast', () => {
      const toasts: Toast[] = [
        {
          id: 'toast-1',
          type: 'success',
          message: 'Success message',
          dismissible: true,
          autoClose: 3000,
        },
      ]

      render(<ToastContainer toasts={toasts} removeToast={mockRemoveToast} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Success message')).toBeInTheDocument()
    })

    it('should render multiple toasts in stack', () => {
      const toasts: Toast[] = [
        {
          id: 'toast-1',
          type: 'success',
          message: 'First message',
          dismissible: true,
          autoClose: 3000,
        },
        {
          id: 'toast-2',
          type: 'error',
          message: 'Second message',
          dismissible: true,
        },
        {
          id: 'toast-3',
          type: 'info',
          message: 'Third message',
          dismissible: true,
          autoClose: 3000,
        },
      ]

      render(<ToastContainer toasts={toasts} removeToast={mockRemoveToast} />)

      expect(screen.getAllByRole('alert')).toHaveLength(3)
      expect(screen.getByText('First message')).toBeInTheDocument()
      expect(screen.getByText('Second message')).toBeInTheDocument()
      expect(screen.getByText('Third message')).toBeInTheDocument()
    })
  })

  describe('positioning', () => {
    it('should be fixed in bottom-right corner', () => {
      const toasts: Toast[] = [
        {
          id: 'toast-1',
          type: 'success',
          message: 'Success',
          dismissible: true,
          autoClose: 3000,
        },
      ]

      const { container } = render(<ToastContainer toasts={toasts} removeToast={mockRemoveToast} />)

      const containerElement = container.querySelector('.fixed')
      expect(containerElement).toHaveClass('fixed', 'bottom-4', 'right-4')
    })

    it('should have high z-index', () => {
      const toasts: Toast[] = [
        {
          id: 'toast-1',
          type: 'success',
          message: 'Success',
          dismissible: true,
          autoClose: 3000,
        },
      ]

      const { container } = render(<ToastContainer toasts={toasts} removeToast={mockRemoveToast} />)

      const containerElement = container.querySelector('.fixed')
      expect(containerElement).toHaveClass('z-50')
    })
  })

  describe('toast interactions', () => {
    it('should call removeToast when toast close button is clicked', async () => {
      const user = userEvent.setup()
      const toasts: Toast[] = [
        {
          id: 'toast-1',
          type: 'success',
          message: 'Success',
          dismissible: true,
          autoClose: 3000,
        },
      ]

      render(<ToastContainer toasts={toasts} removeToast={mockRemoveToast} />)

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(mockRemoveToast).toHaveBeenCalledWith('toast-1')
    })

    it('should handle auto-dismiss for success toasts', () => {
      vi.useFakeTimers()

      const toasts: Toast[] = [
        {
          id: 'toast-1',
          type: 'success',
          message: 'Success',
          dismissible: true,
          autoClose: 3000,
        },
      ]

      render(<ToastContainer toasts={toasts} removeToast={mockRemoveToast} />)

      expect(mockRemoveToast).not.toHaveBeenCalled()

      vi.advanceTimersByTime(3000)

      expect(mockRemoveToast).toHaveBeenCalledWith('toast-1')

      vi.useRealTimers()
    })

    it('should not auto-dismiss error toasts', () => {
      vi.useFakeTimers()

      const toasts: Toast[] = [
        {
          id: 'toast-1',
          type: 'error',
          message: 'Error',
          dismissible: true,
        },
      ]

      render(<ToastContainer toasts={toasts} removeToast={mockRemoveToast} />)

      vi.advanceTimersByTime(5000)

      expect(mockRemoveToast).not.toHaveBeenCalled()

      vi.useRealTimers()
    })
  })

  describe('toast stacking', () => {
    it('should stack toasts with spacing', () => {
      const toasts: Toast[] = [
        {
          id: 'toast-1',
          type: 'success',
          message: 'First',
          dismissible: true,
          autoClose: 3000,
        },
        {
          id: 'toast-2',
          type: 'error',
          message: 'Second',
          dismissible: true,
        },
      ]

      const { container } = render(<ToastContainer toasts={toasts} removeToast={mockRemoveToast} />)

      const stackContainer = container.querySelector('.space-y-2')
      expect(stackContainer).toBeInTheDocument()
    })
  })
})
