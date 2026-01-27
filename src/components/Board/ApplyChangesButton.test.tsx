import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApplyChangesButton } from './ApplyChangesButton'
import type { StagedChange } from '@/store/slices/staged-slice'
import type { BugzillaBug } from '@/lib/bugzilla/types'

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
    div: ({
      children,
      whileHover: _whileHover,
      whileTap: _whileTap,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

const mockBugs: BugzillaBug[] = [
  {
    id: 12_345,
    summary: 'Fix the login button not working on mobile',
    status: 'NEW',
    assigned_to: 'developer@example.com',
    priority: 'P2',
    severity: 'S3',
    component: 'Authentication',
    whiteboard: '[kanban]',
    last_change_time: '2024-01-15T10:30:00Z',
    creation_time: '2024-01-01T00:00:00Z',
  },
]

describe('ApplyChangesButton', () => {
  const defaultChanges = new Map<number, StagedChange>([
    [12_345, { status: { from: 'backlog', to: 'in-progress' } }],
  ])

  const defaultProps = {
    changes: defaultChanges,
    bugs: mockBugs,
    isApplying: false,
    onApply: vi.fn(),
    onClear: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render when there are changes', () => {
      render(<ApplyChangesButton {...defaultProps} />)

      expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument()
    })

    it('should not render when no changes', () => {
      const emptyChanges = new Map<number, StagedChange>()
      render(<ApplyChangesButton {...defaultProps} changes={emptyChanges} />)

      expect(screen.queryByRole('button', { name: /apply/i })).not.toBeInTheDocument()
    })

    it('should show change count', () => {
      const changes = new Map<number, StagedChange>([
        [1, { status: { from: 'backlog', to: 'todo' } }],
        [2, { status: { from: 'backlog', to: 'todo' } }],
        [3, { status: { from: 'backlog', to: 'todo' } }],
        [4, { status: { from: 'backlog', to: 'todo' } }],
        [5, { status: { from: 'backlog', to: 'todo' } }],
      ])
      render(<ApplyChangesButton {...defaultProps} changes={changes} />)

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

      const button = screen.getByRole('button', { name: /apply/i })
      await user.click(button)

      expect(onApply).toHaveBeenCalled()
    })

    it('should be disabled when isApplying', () => {
      render(<ApplyChangesButton {...defaultProps} isApplying={true} />)

      const button = screen.getByRole('button', { name: /apply/i })
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
      const singleChange = new Map<number, StagedChange>([
        [1, { status: { from: 'backlog', to: 'todo' } }],
      ])
      render(<ApplyChangesButton {...defaultProps} changes={singleChange} />)

      expect(screen.getByText(/1 change/i)).toBeInTheDocument()
    })

    it('should show plural text for multiple changes', () => {
      const multipleChanges = new Map<number, StagedChange>([
        [1, { status: { from: 'backlog', to: 'todo' } }],
        [2, { status: { from: 'backlog', to: 'todo' } }],
        [3, { status: { from: 'backlog', to: 'todo' } }],
      ])
      render(<ApplyChangesButton {...defaultProps} changes={multipleChanges} />)

      expect(screen.getByText(/3 changes/i)).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('should be positioned fixed at bottom right', () => {
      const { container } = render(<ApplyChangesButton {...defaultProps} />)

      const wrapper = container.querySelector('.fixed')
      expect(wrapper).toBeInTheDocument()
      expect(wrapper?.className).toContain('bottom')
      expect(wrapper?.className).toContain('right')
    })

    it('should have accent color background', () => {
      render(<ApplyChangesButton {...defaultProps} />)

      const button = screen.getByRole('button', { name: /apply/i })
      expect(button.className).toContain('bg-accent')
    })

    it('should have shadow for elevation', () => {
      render(<ApplyChangesButton {...defaultProps} />)

      const button = screen.getByRole('button', { name: /apply/i })
      expect(button.className).toContain('shadow')
    })
  })

  describe('accessibility', () => {
    it('should have descriptive aria-label', () => {
      const changes = new Map<number, StagedChange>([
        [1, { status: { from: 'backlog', to: 'todo' } }],
        [2, { status: { from: 'backlog', to: 'todo' } }],
        [3, { status: { from: 'backlog', to: 'todo' } }],
      ])
      render(<ApplyChangesButton {...defaultProps} changes={changes} />)

      const button = screen.getByRole('button', { name: /apply/i })
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('3'))
    })

    it('should be keyboard focusable', async () => {
      const user = userEvent.setup()
      const onApply = vi.fn()
      render(<ApplyChangesButton {...defaultProps} onApply={onApply} />)

      // Tab through buttons: Preview -> Clear -> Apply
      await user.tab() // Preview button
      await user.tab() // Clear button
      await user.tab() // Apply button
      await user.keyboard('{Enter}')

      expect(onApply).toHaveBeenCalled()
    })
  })

  describe('clear button', () => {
    it('should render clear button when there are changes', () => {
      render(<ApplyChangesButton {...defaultProps} />)

      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
    })

    it('should not render clear button when no changes', () => {
      const emptyChanges = new Map<number, StagedChange>()
      render(<ApplyChangesButton {...defaultProps} changes={emptyChanges} />)

      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument()
    })

    it('should call onClear when clear button is clicked', async () => {
      const user = userEvent.setup()
      const onClear = vi.fn()
      render(<ApplyChangesButton {...defaultProps} onClear={onClear} />)

      const clearButton = screen.getByRole('button', { name: /clear/i })
      await user.click(clearButton)

      expect(onClear).toHaveBeenCalled()
    })

    it('should disable clear button when isApplying', () => {
      render(<ApplyChangesButton {...defaultProps} isApplying={true} />)

      const clearButton = screen.getByRole('button', { name: /clear/i })
      expect(clearButton).toBeDisabled()
    })

    it('should have delete icon on clear button', () => {
      render(<ApplyChangesButton {...defaultProps} />)

      expect(screen.getByText('delete_sweep')).toBeInTheDocument()
    })

    it('should position clear button next to apply button', () => {
      const { container } = render(<ApplyChangesButton {...defaultProps} />)

      // The wrapper div should be fixed at bottom
      const wrapper = container.querySelector('.fixed')
      expect(wrapper).toBeInTheDocument()
      expect(wrapper?.className).toContain('bottom')

      // Both buttons should be in the wrapper (clear and apply, plus preview toggle)
      const buttons = wrapper?.querySelectorAll('button')
      expect(buttons?.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('preview toggle', () => {
    it('should show preview toggle button when there are changes', () => {
      render(<ApplyChangesButton {...defaultProps} />)

      expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument()
    })

    it('should not show preview by default', () => {
      render(<ApplyChangesButton {...defaultProps} />)

      expect(screen.queryByRole('region', { name: /staged changes/i })).not.toBeInTheDocument()
    })

    it('should show preview when toggle is clicked', async () => {
      const user = userEvent.setup()
      render(<ApplyChangesButton {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /preview/i }))

      expect(screen.getByRole('region', { name: /staged changes/i })).toBeInTheDocument()
    })

    it('should hide preview when toggle is clicked again', async () => {
      const user = userEvent.setup()
      render(<ApplyChangesButton {...defaultProps} />)

      // Open preview
      await user.click(screen.getByRole('button', { name: /preview/i }))
      expect(screen.getByRole('region', { name: /staged changes/i })).toBeInTheDocument()

      // Close preview
      await user.click(screen.getByRole('button', { name: /preview/i }))
      expect(screen.queryByRole('region', { name: /staged changes/i })).not.toBeInTheDocument()
    })

    it('should show bug details in preview', async () => {
      const user = userEvent.setup()
      render(<ApplyChangesButton {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /preview/i }))

      // Should show bug ID from the changes
      expect(screen.getByText(/#12345/)).toBeInTheDocument()
    })

    it('should disable preview toggle when applying', () => {
      render(<ApplyChangesButton {...defaultProps} isApplying={true} />)

      const previewButton = screen.getByRole('button', { name: /preview/i })
      expect(previewButton).toBeDisabled()
    })
  })
})
