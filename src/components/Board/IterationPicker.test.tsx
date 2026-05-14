import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { IterationPicker } from './IterationPicker'

describe('IterationPicker', () => {
  const baseProps = {
    isOpen: true,
    onClose: () => {},
    onSelect: () => {},
    iterationOptions: ['152.1', '152.2', '152.3'],
    currentIteration: undefined as string | undefined,
  }

  it('renders all iteration options plus a clear option when open', () => {
    render(<IterationPicker {...baseProps} />)
    expect(screen.getByRole('option', { name: /Clear iteration/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Iteration 152.1/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Iteration 152.2/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Iteration 152.3/i })).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    render(<IterationPicker {...baseProps} isOpen={false} />)
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('calls onSelect with the chosen iteration and onClose when clicking an option', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    render(<IterationPicker {...baseProps} onSelect={onSelect} onClose={onClose} />)
    fireEvent.click(screen.getByRole('option', { name: /Iteration 152.2/i }))
    expect(onSelect).toHaveBeenCalledWith('152.2')
    expect(onClose).toHaveBeenCalled()
  })

  it('passes undefined to onSelect when clearing', () => {
    const onSelect = vi.fn()
    render(<IterationPicker {...baseProps} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('option', { name: /Clear iteration/i }))
    expect(onSelect).toHaveBeenCalledWith(undefined)
  })

  it('marks the current iteration as selected', () => {
    render(<IterationPicker {...baseProps} currentIteration="152.2" />)
    const option = screen.getByRole('option', { name: /Iteration 152.2.*currently selected/i })
    expect(option).toHaveAttribute('aria-selected', 'true')
  })
})
