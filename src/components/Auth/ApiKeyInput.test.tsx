import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiKeyInput } from './ApiKeyInput'
import { useStore } from '@/store'

// Mock the store
vi.mock('@/store', () => ({
  useStore: vi.fn(),
}))

describe('ApiKeyInput', () => {
  const mockSetApiKey = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Default store state

    vi.mocked(useStore).mockImplementation((selector) => {
      const state = {
        setApiKey: mockSetApiKey,
        isValidating: false,
        // eslint-disable-next-line unicorn/no-null
        validationError: null,
      }
      // @ts-expect-error - Simplified mock for testing
      return selector(state)
    })
  })

  describe('rendering', () => {
    it('should render the modal with input field', () => {
      render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByLabelText(/api key/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<ApiKeyInput isOpen={false} onClose={mockOnClose} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should show playful copy in the modal', () => {
      render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      expect(screen.getByText(/enter your bugzilla api key/i)).toBeInTheDocument()
    })

    it('should show help text about where to find API key', () => {
      render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      expect(screen.getByText(/you can generate one in bugzilla/i)).toBeInTheDocument()
    })
  })

  describe('input handling', () => {
    it('should allow typing in the input field', async () => {
      const user = userEvent.setup()
      render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByLabelText(/api key/i)
      await user.type(input, 'test-api-key-123')

      expect(input.value).toBe('test-api-key-123')
    })

    it('should trim whitespace from input', async () => {
      const user = userEvent.setup()
      mockSetApiKey.mockResolvedValue()

      render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByLabelText(/api key/i)
      await user.type(input, '  test-api-key-123  ')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      expect(mockSetApiKey).toHaveBeenCalledWith('test-api-key-123')
    })

    it('should not submit with empty input', async () => {
      const user = userEvent.setup()
      render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      expect(mockSetApiKey).not.toHaveBeenCalled()
    })
  })

  describe('form submission', () => {
    it('should call setApiKey when form is submitted', async () => {
      const user = userEvent.setup()
      mockSetApiKey.mockResolvedValue()

      render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByLabelText(/api key/i)
      await user.type(input, 'test-api-key-123')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      expect(mockSetApiKey).toHaveBeenCalledWith('test-api-key-123')
    })

    it('should close modal on successful save', async () => {
      const user = userEvent.setup()
      mockSetApiKey.mockResolvedValue()

      render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByLabelText(/api key/i)
      await user.type(input, 'test-api-key-123')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('should submit form on Enter key', async () => {
      const user = userEvent.setup()
      mockSetApiKey.mockResolvedValue()

      render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByLabelText(/api key/i)
      await user.type(input, 'test-api-key-123{Enter}')

      expect(mockSetApiKey).toHaveBeenCalledWith('test-api-key-123')
    })
  })

  describe('validation states', () => {
    it('should show loading state while validating', () => {
      vi.mocked(useStore).mockImplementation((selector) => {
        const state = {
          setApiKey: mockSetApiKey,
          isValidating: true,
          // eslint-disable-next-line unicorn/no-null
          validationError: null,
        }
        // @ts-expect-error - Simplified mock for testing
        return selector(state)
      })

      render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      expect(screen.getByText(/validating/i)).toBeInTheDocument()
    })

    it('should disable inputs while validating', () => {
      vi.mocked(useStore).mockImplementation((selector) => {
        const state = {
          setApiKey: mockSetApiKey,
          isValidating: true,
          // eslint-disable-next-line unicorn/no-null
          validationError: null,
        }
        // @ts-expect-error - Simplified mock for testing
        return selector(state)
      })

      render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByLabelText(/api key/i)
      const saveButton = screen.getByRole('button', { name: /save/i })

      expect(input).toBeDisabled()
      expect(saveButton).toBeDisabled()
    })

    it('should show error message on validation failure', () => {
      vi.mocked(useStore).mockImplementation((selector) => {
        const state = {
          setApiKey: mockSetApiKey,
          isValidating: false,
          validationError: 'Invalid API key',
        }
        // @ts-expect-error - Simplified mock for testing
        return selector(state)
      })

      render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      expect(screen.getByText(/invalid api key/i)).toBeInTheDocument()
    })

    it('should show playful error message', () => {
      vi.mocked(useStore).mockImplementation((selector) => {
        const state = {
          setApiKey: mockSetApiKey,
          isValidating: false,
          validationError: 'Unauthorized',
        }
        // @ts-expect-error - Simplified mock for testing
        return selector(state)
      })

      render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      expect(screen.getByText(/oops!/i)).toBeInTheDocument()
    })

    it('should have aria-describedby linking input to error message', () => {
      vi.mocked(useStore).mockImplementation((selector) => {
        const state = {
          setApiKey: mockSetApiKey,
          isValidating: false,
          validationError: 'Invalid API key',
        }
        // @ts-expect-error - Simplified mock for testing
        return selector(state)
      })

      render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByLabelText(/api key/i)
      const errorId = input.getAttribute('aria-describedby')
      expect(errorId).toBeTruthy()

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const errorElement = document.querySelector(`#${errorId!}`)
      expect(errorElement).toBeInTheDocument()
      expect(errorElement).toHaveTextContent(/invalid api key/i)
    })

    it('should have aria-live on error for screen reader announcements', () => {
      vi.mocked(useStore).mockImplementation((selector) => {
        const state = {
          setApiKey: mockSetApiKey,
          isValidating: false,
          validationError: 'Invalid API key',
        }
        // @ts-expect-error - Simplified mock for testing
        return selector(state)
      })

      render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      const errorElement = screen.getByRole('alert')
      expect(errorElement).toBeInTheDocument()
    })
  })

  describe('cancel handling', () => {
    it('should close modal when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should close modal on Escape key', async () => {
      const user = userEvent.setup()
      render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      await user.keyboard('{Escape}')

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should clear input when modal is closed', async () => {
      const user = userEvent.setup()
      const { rerender } = render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByLabelText(/api key/i)
      await user.type(input, 'test-api-key-123')

      expect(input.value).toBe('test-api-key-123')

      rerender(<ApiKeyInput isOpen={false} onClose={mockOnClose} />)
      rerender(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      const newInput = screen.getByLabelText(/api key/i)
      expect(newInput.value).toBe('')
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('should focus input when modal opens', async () => {
      render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      await waitFor(() => {
        const input = screen.getByLabelText(/api key/i)
        expect(input).toHaveFocus()
      })
    })

    it('should allow keyboard navigation between elements', async () => {
      const user = userEvent.setup()
      render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      const input = screen.getByLabelText(/api key/i)
      const cancelButton = screen.getByRole('button', { name: /cancel/i })

      // Type something to enable the save button
      await user.type(input, 'test-key')

      const saveButton = screen.getByRole('button', { name: /save/i })

      // Tab through elements
      await user.tab()
      expect(saveButton).toHaveFocus()

      await user.tab()
      expect(cancelButton).toHaveFocus()
    })

    it('should trap focus within modal on Tab from last element', async () => {
      const user = userEvent.setup()
      render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      // Focus the cancel button (last focusable element in default state)
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      cancelButton.focus()
      expect(cancelButton).toHaveFocus()

      // Tab should wrap to first focusable element
      await user.tab()

      // Should wrap to first focusable element in the dialog
      const dialog = screen.getByRole('dialog')
      expect(dialog.contains(document.activeElement)).toBe(true)
    })

    it('should trap focus within modal on Shift+Tab from first element', async () => {
      const user = userEvent.setup()
      render(<ApiKeyInput isOpen={true} onClose={mockOnClose} />)

      // Focus the input (first focusable element)
      const input = screen.getByLabelText(/api key/i)
      input.focus()
      expect(input).toHaveFocus()

      // Shift+Tab should wrap to last focusable element
      await user.tab({ shift: true })

      // Should wrap to last focusable element in the dialog
      const dialog = screen.getByRole('dialog')
      expect(dialog.contains(document.activeElement)).toBe(true)
    })
  })
})
