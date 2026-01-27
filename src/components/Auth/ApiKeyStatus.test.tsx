import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiKeyStatus } from './ApiKeyStatus'
import { useStore } from '@/store'

// Mock the store
vi.mock('@/store', () => ({
  useStore: vi.fn(),
}))

describe('ApiKeyStatus', () => {
  const mockClearApiKey = vi.fn()
  const mockOnOpenModal = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('unauthenticated state', () => {
    beforeEach(() => {
      vi.mocked(useStore).mockImplementation((selector) => {
        const state = {
          apiKey: undefined,
          isValid: false,
          isValidating: false,
          clearApiKey: mockClearApiKey,
        }
        // @ts-expect-error - Simplified mock for testing
        return selector(state)
      })
    })

    it('should show login button when not authenticated', () => {
      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument()
    })

    it('should show playful unauthenticated message', () => {
      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      expect(screen.getByText(/not connected/i)).toBeInTheDocument()
    })

    it('should call onOpenModal when connect button is clicked', async () => {
      const user = userEvent.setup()
      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      const connectButton = screen.getByRole('button', { name: /connect/i })
      await user.click(connectButton)

      expect(mockOnOpenModal).toHaveBeenCalled()
    })

    it('should not show logout button when not authenticated', () => {
      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument()
    })
  })

  describe('authenticated state', () => {
    beforeEach(() => {
      vi.mocked(useStore).mockImplementation((selector) => {
        const state = {
          apiKey: 'test-api-key-123',
          isValid: true,
          isValidating: false,
          clearApiKey: mockClearApiKey,
          username: 'testuser@mozilla.com',
        }
        // @ts-expect-error - Simplified mock for testing
        return selector(state)
      })
    })

    it('should show connected status when authenticated', () => {
      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      expect(screen.getByText(/connected/i)).toBeInTheDocument()
    })

    it('should show email address in connected message', () => {
      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      expect(screen.getByText(/testuser@mozilla\.com/i)).toBeInTheDocument()
    })

    it('should show playful authenticated message', () => {
      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      expect(screen.getByText(/you're all set/i)).toBeInTheDocument()
    })

    it('should show logout button when authenticated', () => {
      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
    })

    it('should call clearApiKey when logout button is clicked', async () => {
      const user = userEvent.setup()
      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      const logoutButton = screen.getByRole('button', { name: /logout/i })
      await user.click(logoutButton)

      expect(mockClearApiKey).toHaveBeenCalled()
    })

    it('should not show connect button when authenticated', () => {
      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      expect(screen.queryByRole('button', { name: /connect/i })).not.toBeInTheDocument()
    })

    it('should show success icon when authenticated', () => {
      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      expect(screen.getByText('check_circle')).toBeInTheDocument()
    })
  })

  describe('validating state', () => {
    beforeEach(() => {
      vi.mocked(useStore).mockImplementation((selector) => {
        const state = {
          apiKey: 'test-api-key-123',
          isValid: false,
          isValidating: true,
          clearApiKey: mockClearApiKey,
        }
        // @ts-expect-error - Simplified mock for testing
        return selector(state)
      })
    })

    it('should show validating message', () => {
      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      expect(screen.getByText(/validating/i)).toBeInTheDocument()
    })

    it('should show loading icon when validating', () => {
      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      expect(screen.getByText('hourglass_empty')).toBeInTheDocument()
    })

    it('should disable logout button while validating', () => {
      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      const logoutButton = screen.getByRole('button', { name: /logout/i })
      expect(logoutButton).toBeDisabled()
    })
  })

  describe('invalid state with API key', () => {
    beforeEach(() => {
      vi.mocked(useStore).mockImplementation((selector) => {
        const state = {
          apiKey: 'invalid-key',
          isValid: false,
          isValidating: false,
          clearApiKey: mockClearApiKey,
        }
        // @ts-expect-error - Simplified mock for testing
        return selector(state)
      })
    })

    it('should show invalid message', () => {
      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      expect(screen.getByText(/invalid key/i)).toBeInTheDocument()
    })

    it('should show error icon', () => {
      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      expect(screen.getByText('error')).toBeInTheDocument()
    })

    it('should show reconnect button', () => {
      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      expect(screen.getByRole('button', { name: /reconnect/i })).toBeInTheDocument()
    })

    it('should call onOpenModal when reconnect button is clicked', async () => {
      const user = userEvent.setup()
      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      const reconnectButton = screen.getByRole('button', { name: /reconnect/i })
      await user.click(reconnectButton)

      expect(mockOnOpenModal).toHaveBeenCalled()
    })

    it('should show logout button in invalid state', () => {
      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
    })
  })

  describe('styling and icons', () => {
    it('should use success colors when authenticated', () => {
      vi.mocked(useStore).mockImplementation((selector) => {
        const state = {
          apiKey: 'test-key',
          isValid: true,
          isValidating: false,
          clearApiKey: mockClearApiKey,
        }
        // @ts-expect-error - Simplified mock for testing
        return selector(state)
      })

      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      const icon = screen.getByText('check_circle')
      expect(icon.className).toContain('accent-success')
    })

    it('should use error colors when invalid', () => {
      vi.mocked(useStore).mockImplementation((selector) => {
        const state = {
          apiKey: 'invalid-key',
          isValid: false,
          isValidating: false,
          clearApiKey: mockClearApiKey,
        }
        // @ts-expect-error - Simplified mock for testing
        return selector(state)
      })

      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      const icon = screen.getByText('error')
      expect(icon.className).toContain('accent-error')
    })

    it('should use info colors when validating', () => {
      vi.mocked(useStore).mockImplementation((selector) => {
        const state = {
          apiKey: 'test-key',
          isValid: false,
          isValidating: true,
          clearApiKey: mockClearApiKey,
        }
        // @ts-expect-error - Simplified mock for testing
        return selector(state)
      })

      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      const icon = screen.getByText('hourglass_empty')
      expect(icon.className).toContain('accent-primary')
    })
  })

  describe('accessibility', () => {
    it('should have descriptive button labels', () => {
      vi.mocked(useStore).mockImplementation((selector) => {
        const state = {
          apiKey: undefined,
          isValid: false,
          isValidating: false,
          clearApiKey: mockClearApiKey,
        }
        // @ts-expect-error - Simplified mock for testing
        return selector(state)
      })

      render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAccessibleName()
    })

    it('should have proper ARIA attributes for status', () => {
      vi.mocked(useStore).mockImplementation((selector) => {
        const state = {
          apiKey: 'test-key',
          isValid: true,
          isValidating: false,
          clearApiKey: mockClearApiKey,
        }
        // @ts-expect-error - Simplified mock for testing
        return selector(state)
      })

      const { container } = render(<ApiKeyStatus onOpenModal={mockOnOpenModal} />)

      const statusElement = container.querySelector('[role="status"]')
      expect(statusElement).toBeInTheDocument()
    })
  })
})
