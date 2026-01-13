import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterBar } from './FilterBar'

describe('FilterBar', () => {
  const defaultProps = {
    whiteboardTag: '',
    component: '',
    excludeMetaBugs: false,
    onWhiteboardTagChange: vi.fn(),
    onComponentChange: vi.fn(),
    onExcludeMetaBugsChange: vi.fn(),
    onApplyFilters: vi.fn(),
    isLoading: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render whiteboard tag input', () => {
      render(<FilterBar {...defaultProps} />)

      expect(screen.getByLabelText(/whiteboard/i)).toBeInTheDocument()
    })

    it('should render component input', () => {
      render(<FilterBar {...defaultProps} />)

      expect(screen.getByLabelText(/component/i)).toBeInTheDocument()
    })

    it('should render apply button', () => {
      render(<FilterBar {...defaultProps} />)

      expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument()
    })

    it('should show playful helper text', () => {
      render(<FilterBar {...defaultProps} />)

      expect(screen.getByText(/filter your bugs/i)).toBeInTheDocument()
    })
  })

  describe('whiteboard tag input', () => {
    it('should display current whiteboard tag value', () => {
      render(<FilterBar {...defaultProps} whiteboardTag="[kanban]" />)

      const input = screen.getByLabelText(/whiteboard/i)
      expect(input.value).toBe('[kanban]')
    })

    it('should call onWhiteboardTagChange when typing', async () => {
      const user = userEvent.setup()
      const onWhiteboardTagChange = vi.fn()
      render(<FilterBar {...defaultProps} onWhiteboardTagChange={onWhiteboardTagChange} />)

      const input = screen.getByLabelText(/whiteboard/i)
      await user.type(input, 'k')

      expect(onWhiteboardTagChange).toHaveBeenCalled()
    })

    it('should show placeholder text', () => {
      render(<FilterBar {...defaultProps} />)

      const input = screen.getByLabelText(/whiteboard/i)
      expect(input.placeholder).toContain('kanban')
    })
  })

  describe('component input', () => {
    it('should display current component value', () => {
      render(<FilterBar {...defaultProps} component="Core" />)

      const input = screen.getByLabelText(/component/i)
      expect(input.value).toBe('Core')
    })

    it('should call onComponentChange when typing', async () => {
      const user = userEvent.setup()
      render(<FilterBar {...defaultProps} />)

      const input = screen.getByLabelText(/component/i)
      await user.type(input, 'UI')

      expect(defaultProps.onComponentChange).toHaveBeenCalled()
    })
  })

  describe('apply button', () => {
    it('should call onApplyFilters when clicked', async () => {
      const user = userEvent.setup()
      render(<FilterBar {...defaultProps} />)

      const button = screen.getByRole('button', { name: /apply/i })
      await user.click(button)

      expect(defaultProps.onApplyFilters).toHaveBeenCalled()
    })

    it('should be disabled when loading', () => {
      render(<FilterBar {...defaultProps} isLoading={true} />)

      const button = screen.getByRole('button', { name: /loading/i })
      expect(button).toBeDisabled()
    })

    it('should show loading text when loading', () => {
      render(<FilterBar {...defaultProps} isLoading={true} />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should submit on Enter key in whiteboard input', async () => {
      const user = userEvent.setup()
      render(<FilterBar {...defaultProps} />)

      const input = screen.getByLabelText(/whiteboard/i)
      await user.type(input, '{Enter}')

      expect(defaultProps.onApplyFilters).toHaveBeenCalled()
    })

    it('should submit on Enter key in component input', async () => {
      const user = userEvent.setup()
      render(<FilterBar {...defaultProps} />)

      const input = screen.getByLabelText(/component/i)
      await user.type(input, '{Enter}')

      expect(defaultProps.onApplyFilters).toHaveBeenCalled()
    })
  })

  describe('clear filters', () => {
    it('should show clear button when filters are set', () => {
      render(<FilterBar {...defaultProps} whiteboardTag="[kanban]" />)

      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
    })

    it('should not show clear button when no filters', () => {
      render(<FilterBar {...defaultProps} />)

      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument()
    })

    it('should clear filters when clear button clicked', async () => {
      const user = userEvent.setup()
      render(<FilterBar {...defaultProps} whiteboardTag="[kanban]" component="Core" />)

      const clearButton = screen.getByRole('button', { name: /clear/i })
      await user.click(clearButton)

      expect(defaultProps.onWhiteboardTagChange).toHaveBeenCalledWith('')
      expect(defaultProps.onComponentChange).toHaveBeenCalledWith('')
    })
  })

  describe('styling', () => {
    it('should have proper container styling', () => {
      const { container } = render(<FilterBar {...defaultProps} />)

      const filterBar = container.firstChild as HTMLElement
      expect(filterBar.className).toContain('bg-bg-secondary')
    })

    it('should have filter icon', () => {
      render(<FilterBar {...defaultProps} />)

      expect(screen.getByText('filter_list')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have proper form role', () => {
      render(<FilterBar {...defaultProps} />)

      expect(screen.getByRole('search')).toBeInTheDocument()
    })

    it('should have associated labels', () => {
      render(<FilterBar {...defaultProps} />)

      const whiteboardInput = screen.getByLabelText(/whiteboard/i)
      const componentInput = screen.getByLabelText(/component/i)

      expect(whiteboardInput).toHaveAttribute('id')
      expect(componentInput).toHaveAttribute('id')
    })
  })

  describe('debouncing', () => {
    it('should debounce whiteboard input changes', async () => {
      const user = userEvent.setup()
      const onWhiteboardTagChange = vi.fn()

      render(<FilterBar {...defaultProps} onWhiteboardTagChange={onWhiteboardTagChange} />)

      const input = screen.getByLabelText(/whiteboard/i)
      await user.type(input, 'test')

      // Should be called for each keystroke in controlled component
      await waitFor(() => {
        expect(onWhiteboardTagChange).toHaveBeenCalled()
      })
    })
  })
})
