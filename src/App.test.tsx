import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { useStore } from './store'

describe('App', () => {
  const originalLocation = window.location

  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({
      toasts: [],
      apiKey: '',
      bugs: [],
      isLoading: false,
      error: '',
      filters: { whiteboardTag: '', component: '', excludeMetaBugs: false, sortOrder: 'priority' },
      changes: new Map(),
      isApplying: false,
      applyError: '',
    })

    // Reset URL to base
    const mockLocation = {
      search: '',
      pathname: '/',
      href: 'http://localhost:3000/',
      origin: 'http://localhost:3000',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      protocol: 'http:',
      hash: '',
      assign: vi.fn(),
      reload: vi.fn(),
      replace: vi.fn(),
      toString: () => 'http://localhost:3000/',
    }
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    })
  })

  describe('without API key', () => {
    it('should call loadApiKey on mount to restore persisted key', () => {
      const loadApiKey = vi.fn()
      useStore.setState({ loadApiKey })

      render(<App />)

      expect(loadApiKey).toHaveBeenCalledOnce()
    })

    it('should render the app title', () => {
      render(<App />)

      expect(screen.getByText('Bugzilla Kanban')).toBeInTheDocument()
    })

    it('should render the tagline', () => {
      render(<App />)

      expect(screen.getByText("Puttin' bugz in their place since '26 😎")).toBeInTheDocument()
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

    describe('keyboard hints', () => {
      it('should display keyboard hints in header', () => {
        render(<App />)

        expect(screen.getByText(/arrows/i)).toBeInTheDocument()
        // There are multiple Shift elements (Shift and Shift+Enter)
        expect(screen.getAllByText(/shift/i).length).toBeGreaterThanOrEqual(1)
      })

      it('should show kbd elements for keyboard shortcuts', () => {
        const { container } = render(<App />)

        const kbdElements = container.querySelectorAll('kbd')
        expect(kbdElements.length).toBeGreaterThanOrEqual(3) // Arrows, Shift, Shift+Enter
      })

      it('should explain arrow navigation', () => {
        render(<App />)

        expect(screen.getByText(/select/i)).toBeInTheDocument()
      })

      it('should explain grab/drop with Shift', () => {
        render(<App />)

        expect(screen.getByText(/grab/i)).toBeInTheDocument()
      })

      it('should explain Shift+Enter for apply', () => {
        render(<App />)

        // Multiple elements contain "apply" (keyboard hint and button)
        expect(screen.getByText('to apply')).toBeInTheDocument()
      })
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

  describe('auto-fetch with URL filters', () => {
    it('should auto-fetch bugs when URL has filters and API key is loaded', async () => {
      // Setup: URL has filters
      window.location.search = '?whiteboard=%5Bkanban%5D'

      const fetchBugs = vi.fn().mockResolvedValue([])

      // Simulate async API key loading - resolves after a short delay
      const loadApiKey = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 10)
        })
        useStore.setState({ apiKey: 'test-api-key', isValid: true })
      })

      useStore.setState({
        loadApiKey,
        fetchBugs,
        apiKey: '', // No API key initially
      })

      render(<App />)

      // Wait for loadApiKey to complete and fetchBugs to be called
      await waitFor(() => {
        expect(fetchBugs).toHaveBeenCalledWith('test-api-key')
      })
    })

    it('should not auto-fetch when URL has no filters even with API key', async () => {
      // Setup: URL has no filters (search is empty)
      window.location.search = ''

      const fetchBugs = vi.fn().mockResolvedValue([])
      const loadApiKey = vi.fn().mockImplementation(() => {
        useStore.setState({ apiKey: 'test-api-key', isValid: true })
        return Promise.resolve()
      })

      useStore.setState({
        loadApiKey,
        fetchBugs,
        apiKey: '',
      })

      render(<App />)

      // Wait a bit to ensure no auto-fetch happens
      await new Promise((resolve) => {
        setTimeout(resolve, 50)
      })

      expect(fetchBugs).not.toHaveBeenCalled()
    })

    it('should apply filters from URL to store before fetching', async () => {
      window.location.search = '?whiteboard=%5Bkanban%5D&component=Core'

      const fetchBugs = vi.fn().mockResolvedValue([])
      const setFilters = vi.fn()
      const loadApiKey = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 10)
        })
        useStore.setState({ apiKey: 'test-api-key', isValid: true })
      })

      useStore.setState({
        loadApiKey,
        fetchBugs,
        setFilters,
        apiKey: '',
      })

      render(<App />)

      await waitFor(() => {
        expect(setFilters).toHaveBeenCalledWith(
          expect.objectContaining({
            whiteboardTag: '[kanban]',
            component: 'Core',
          }),
        )
      })
    })
  })

  describe('URL sync behavior', () => {
    let replaceStateMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
      replaceStateMock = vi.fn()
      vi.spyOn(window.history, 'replaceState').mockImplementation(replaceStateMock)

      useStore.setState({
        apiKey: 'test-api-key',
        isValid: true,
        isValidating: false,
      })
    })

    it('should NOT update URL when filter input changes', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Clear any calls from initialization
      replaceStateMock.mockClear()

      // Type into the whiteboard filter
      const whiteboardInput = screen.getByLabelText(/whiteboard/i)
      await user.clear(whiteboardInput)
      await user.type(whiteboardInput, '[test]')

      // URL should NOT have been updated
      expect(replaceStateMock).not.toHaveBeenCalled()
    })

    it('should update URL when Apply Filter button is clicked', async () => {
      const user = userEvent.setup()
      const fetchBugs = vi.fn().mockResolvedValue([])
      useStore.setState({
        fetchBugs,
        filters: {
          whiteboardTag: '[test]',
          component: '',
          excludeMetaBugs: false,
          sortOrder: 'priority',
        },
      })

      render(<App />)

      // Clear any calls from initialization
      replaceStateMock.mockClear()

      // Click Apply Filters button
      const applyButton = screen.getByRole('button', { name: /apply filters/i })
      await user.click(applyButton)

      // URL should have been updated with the filter
      expect(replaceStateMock).toHaveBeenCalled()
      const call = replaceStateMock.mock.calls[0]
      expect(call[2]).toContain('whiteboard=%5Btest%5D')
    })

    it('should NOT update URL when sort order changes without clicking Apply', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Clear any calls from initialization
      replaceStateMock.mockClear()

      // Change sort order by clicking the radio button
      const lastChangedRadio = screen.getByRole('radio', { name: /last changed/i })
      await user.click(lastChangedRadio)

      // URL should NOT have been updated
      expect(replaceStateMock).not.toHaveBeenCalled()
    })
  })
})
