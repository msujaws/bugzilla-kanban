import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AssigneeFilter } from './AssigneeFilter'

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

const mockAssignees = [
  { email: 'alice@example.com', displayName: 'Alice', count: 5 },
  { email: 'bob@example.com', displayName: 'Bob', count: 3 },
  { email: 'charlie@example.com', displayName: 'Charlie', count: 1 },
]

describe('AssigneeFilter', () => {
  const defaultProps = {
    assignees: mockAssignees,
    selectedAssignee: null as string | null,
    onSelect: vi.fn(),
  }

  it('should render dropdown with "All Assignees" default', () => {
    render(<AssigneeFilter {...defaultProps} />)
    expect(screen.getByText('All Assignees')).toBeInTheDocument()
  })

  it('should show assignee list when clicked', async () => {
    const user = userEvent.setup()
    render(<AssigneeFilter {...defaultProps} />)

    await user.click(screen.getByRole('button'))

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('should call onSelect when assignee is selected', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<AssigneeFilter {...defaultProps} onSelect={onSelect} />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('Alice'))

    expect(onSelect).toHaveBeenCalledWith('alice@example.com')
  })

  it('should show bug count in dropdown', async () => {
    const user = userEvent.setup()
    render(<AssigneeFilter {...defaultProps} />)

    await user.click(screen.getByRole('button'))
    expect(screen.getByText('(5)')).toBeInTheDocument()
    expect(screen.getByText('(3)')).toBeInTheDocument()
  })

  it('should show selected assignee name in button', () => {
    render(<AssigneeFilter {...defaultProps} selectedAssignee="alice@example.com" />)
    expect(screen.getByRole('button')).toHaveTextContent('Alice')
  })

  it('should have "All Assignees" option to reset filter', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <AssigneeFilter {...defaultProps} selectedAssignee="alice@example.com" onSelect={onSelect} />,
    )

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('All Assignees'))

    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('should close dropdown after selection', async () => {
    const user = userEvent.setup()
    render(<AssigneeFilter {...defaultProps} />)

    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.click(screen.getByText('Alice'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('should close dropdown on Escape key', async () => {
    const user = userEvent.setup()
    render(<AssigneeFilter {...defaultProps} />)

    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('should show checkmark for selected assignee', async () => {
    const user = userEvent.setup()
    render(<AssigneeFilter {...defaultProps} selectedAssignee="alice@example.com" />)

    await user.click(screen.getByRole('button'))

    const aliceOption = screen.getByRole('option', { name: /alice/i })
    expect(aliceOption).toHaveAttribute('aria-selected', 'true')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<AssigneeFilter {...defaultProps} disabled={true} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  describe('accessibility', () => {
    it('should have aria-expanded=false when dropdown is closed', () => {
      render(<AssigneeFilter {...defaultProps} />)
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
    })

    it('should have aria-expanded=true when dropdown is open', async () => {
      const user = userEvent.setup()
      render(<AssigneeFilter {...defaultProps} />)

      await user.click(screen.getByRole('button'))
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
    })

    it('should have aria-controls linking button to listbox', async () => {
      const user = userEvent.setup()
      render(<AssigneeFilter {...defaultProps} />)

      await user.click(screen.getByRole('button'))

      const button = screen.getByRole('button')
      const listbox = screen.getByRole('listbox')
      expect(button).toHaveAttribute('aria-controls', listbox.id)
    })

    it('should have aria-haspopup=listbox on button', () => {
      render(<AssigneeFilter {...defaultProps} />)
      expect(screen.getByRole('button')).toHaveAttribute('aria-haspopup', 'listbox')
    })
  })
})
