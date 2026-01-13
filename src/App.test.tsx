import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'
import { useStore } from './store'

describe('App', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({
      toasts: [],
      apiKey: '',
      bugs: [],
      isLoading: false,
      error: '',
      filters: { whiteboardTag: '', component: '' },
      changes: new Map(),
      isApplying: false,
      applyError: '',
    })
  })

  describe('without API key', () => {
    it('should render the app title', () => {
      render(<App />)

      expect(screen.getByText('Bugzilla Kanban')).toBeInTheDocument()
    })

    it('should render the tagline', () => {
      render(<App />)

      expect(screen.getByText('Where bugs go to chill 😎')).toBeInTheDocument()
    })

    it('should show API key input', () => {
      render(<App />)

      expect(screen.getByLabelText(/api key/i)).toBeInTheDocument()
    })
  })

  describe('with API key', () => {
    beforeEach(() => {
      useStore.setState({
        apiKey: 'test-api-key',
        isValid: true,
        isValidating: false,
      })
    })

    it('should render the header with title', () => {
      render(<App />)

      expect(screen.getByText('Bugzilla Kanban')).toBeInTheDocument()
    })

    it('should show filter bar', () => {
      render(<App />)

      expect(screen.getByLabelText(/whiteboard/i)).toBeInTheDocument()
    })

    it('should show board columns', () => {
      render(<App />)

      expect(screen.getByText('Backlog')).toBeInTheDocument()
      expect(screen.getByText('Todo')).toBeInTheDocument()
      expect(screen.getByText('In Progress')).toBeInTheDocument()
    })

    it('should show API key status', () => {
      render(<App />)

      expect(screen.getByText(/connected/i)).toBeInTheDocument()
    })
  })

  it('should render ToastContainer', () => {
    const { container } = render(<App />)

    // Check that toast container exists (even if empty)
    const toastContainer = container.querySelector('.fixed.bottom-4.right-4')
    expect(toastContainer).toBeInTheDocument()
  })

  it('should display toasts from store', () => {
    // Add a toast to the store
    useStore.getState().addToast('success', 'Test toast message')

    render(<App />)

    expect(screen.getByText('Test toast message')).toBeInTheDocument()
  })

  it('should have dark theme background', () => {
    const { container } = render(<App />)

    const appContainer = container.querySelector('.min-h-screen')
    expect(appContainer).toHaveClass('bg-bg-primary')
  })
})
