import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GanttChart } from './GanttChart'
import type { BugzillaBug } from '@/lib/bugzilla/types'
import { createFirefoxBetaVersion } from '@/types/branded'

function bug(overrides: Partial<BugzillaBug> & { id: number }): BugzillaBug {
  return {
    id: overrides.id,
    summary: overrides.summary ?? `Bug ${String(overrides.id)}`,
    status: overrides.status ?? 'NEW',
    assigned_to: overrides.assigned_to ?? 'dev@example.com',
    priority: overrides.priority ?? 'P2',
    severity: overrides.severity ?? 'S3',
    component: overrides.component ?? 'Core',
    whiteboard: overrides.whiteboard ?? '',
    last_change_time: overrides.last_change_time ?? '2026-05-01T00:00:00Z',
    creation_time: overrides.creation_time ?? '2026-04-01T00:00:00Z',
    cf_fx_iteration: overrides.cf_fx_iteration,
    cf_fx_points: overrides.cf_fx_points,
    target_milestone: overrides.target_milestone,
    product: overrides.product,
    groups: overrides.groups,
  }
}

describe('GanttChart', () => {
  const v152 = createFirefoxBetaVersion(152)

  it('renders a header with iteration columns .1, .2, .3', () => {
    render(<GanttChart bugs={[]} nightlyVersion={v152} />)
    expect(screen.queryByText('152.0')).not.toBeInTheDocument()
    expect(screen.getByText('152.1')).toBeInTheDocument()
    expect(screen.getByText('152.2')).toBeInTheDocument()
    expect(screen.getByText('152.3')).toBeInTheDocument()
  })

  it('places a bug in the cell matching its iteration', () => {
    const bugs = [bug({ id: 100, cf_fx_iteration: '152.2', cf_fx_points: 3 })]
    render(<GanttChart bugs={bugs} nightlyVersion={v152} />)
    expect(screen.getByTestId('gantt-bar-100')).toBeInTheDocument()
    expect(screen.getByTestId('gantt-cell-100-152.2')).toContainElement(
      screen.getByTestId('gantt-bar-100'),
    )
    // No bar should appear in other iteration cells.
    const otherCell = screen.getByTestId('gantt-cell-100-152.1')
    expect(otherCell.children).toHaveLength(0)
  })

  it('treats bugs from a different cycle as unscheduled', () => {
    const bugs = [bug({ id: 200, cf_fx_iteration: '151.1', cf_fx_points: 2 })]
    render(<GanttChart bugs={bugs} nightlyVersion={v152} />)
    // No bar rendered (it's in the unscheduled row but with no iteration match).
    expect(screen.queryByTestId('gantt-bar-200')).not.toBeInTheDocument()
    expect(screen.getByText(/1 bug unscheduled/)).toBeInTheDocument()
  })

  it('scales the bar width by points', () => {
    const bugs = [
      bug({ id: 1, cf_fx_iteration: '152.1', cf_fx_points: 1 }),
      bug({ id: 2, cf_fx_iteration: '152.1', cf_fx_points: 8 }),
    ]
    render(<GanttChart bugs={bugs} nightlyVersion={v152} />)
    const small = screen.getByTestId('gantt-bar-1')
    const large = screen.getByTestId('gantt-bar-2')
    const smallWidth = Number.parseFloat(small.style.width)
    const largeWidth = Number.parseFloat(large.style.width)
    expect(largeWidth).toBeGreaterThan(smallWidth)
  })

  it('shows a friendly message when no cycle is selected', () => {
    render(<GanttChart bugs={[]} />)
    expect(screen.getByText(/Select a Nightly cycle/)).toBeInTheDocument()
  })
})
