import { useMemo } from 'react'
import type { BugzillaBug } from '@/lib/bugzilla/types'
import { getIterationOptions, parseIterationVersion } from '@/lib/firefox/nightly-version'
import type { FirefoxBetaVersion } from '@/types/branded'

const BUGZILLA_BUG_URL = 'https://bugzilla.mozilla.org/show_bug.cgi?id='
const POINT_TO_PERCENT = 12
const MIN_BAR_PERCENT = 25

interface GanttChartProps {
  bugs: BugzillaBug[]
  nightlyVersion?: FirefoxBetaVersion
}

function pointsAsNumber(value: number | string | undefined): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 1
  }
  return 1
}

function barWidthPercent(points: number | string | undefined): string {
  const numeric = pointsAsNumber(points)
  const pct = Math.min(100, Math.max(MIN_BAR_PERCENT, numeric * POINT_TO_PERCENT))
  return `${String(pct)}%`
}

export function GanttChart({ bugs, nightlyVersion }: GanttChartProps) {
  const iterationOptions = useMemo(
    () => (nightlyVersion === undefined ? [] : getIterationOptions(nightlyVersion)),
    [nightlyVersion],
  )

  const cycleVersion = nightlyVersion as number | undefined

  const { scheduledByIteration, unscheduled } = useMemo(() => {
    const byIteration = new Map<string, BugzillaBug[]>()
    for (const option of iterationOptions) {
      byIteration.set(option, [])
    }
    const unscheduledBugs: BugzillaBug[] = []
    for (const bug of bugs) {
      const iter = bug.cf_fx_iteration
      if (iter && byIteration.has(iter) && parseIterationVersion(iter) === cycleVersion) {
        byIteration.get(iter)?.push(bug)
      } else {
        unscheduledBugs.push(bug)
      }
    }
    return { scheduledByIteration: byIteration, unscheduled: unscheduledBugs }
  }, [bugs, iterationOptions, cycleVersion])

  if (nightlyVersion === undefined) {
    return (
      <div className="rounded-lg bg-bg-secondary p-6 text-center text-text-secondary">
        <span className="material-icons mb-2 text-4xl">timeline</span>
        <p>Select a Nightly cycle to see the Gantt view.</p>
      </div>
    )
  }

  const rows: { bug: BugzillaBug; iteration: string | undefined }[] = []
  for (const option of iterationOptions) {
    for (const bug of scheduledByIteration.get(option) ?? []) {
      rows.push({ bug, iteration: option })
    }
  }
  for (const bug of unscheduled) {
    rows.push({ bug, iteration: undefined })
  }

  return (
    <div
      role="table"
      aria-label={`Gantt chart for Firefox ${String(nightlyVersion)}`}
      className="rounded-lg bg-bg-secondary p-4"
    >
      {/* Header row */}
      <div
        role="row"
        className="grid items-center gap-2 border-b border-bg-tertiary pb-2 text-xs font-bold text-text-secondary"
        style={{ gridTemplateColumns: '280px repeat(3, 1fr)' }}
      >
        <div role="columnheader">Bug</div>
        {iterationOptions.map((option) => (
          <div key={option} role="columnheader" className="text-center">
            {option}
          </div>
        ))}
      </div>

      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 p-8 text-text-secondary">
          <span className="material-icons text-4xl">event_busy</span>
          <p className="text-sm">No bugs scheduled for this cycle.</p>
        </div>
      )}

      {rows.map(({ bug, iteration }) => (
        <div
          key={bug.id}
          role="row"
          data-testid={`gantt-row-${String(bug.id)}`}
          className="grid items-center gap-2 border-b border-bg-tertiary/50 py-2"
          style={{ gridTemplateColumns: '280px repeat(3, 1fr)' }}
        >
          <div role="cell" className="min-w-0">
            <a
              href={`${BUGZILLA_BUG_URL}${String(bug.id)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block min-w-0 truncate text-sm text-text-primary hover:text-accent-primary"
              title={bug.summary}
            >
              <span className="font-mono text-xs text-accent-primary">#{String(bug.id)}</span>{' '}
              {bug.summary}
            </a>
          </div>
          {iterationOptions.map((option) => (
            <div
              key={option}
              role="cell"
              data-testid={`gantt-cell-${String(bug.id)}-${option}`}
              className="flex h-6 items-center"
            >
              {iteration === option && (
                <div
                  data-testid={`gantt-bar-${String(bug.id)}`}
                  title={`${String(bug.id)} • ${String(bug.cf_fx_points ?? '?')} pts`}
                  className="h-4 rounded bg-accent-primary/60"
                  style={{ width: barWidthPercent(bug.cf_fx_points) }}
                />
              )}
            </div>
          ))}
        </div>
      ))}

      {unscheduled.length > 0 && (
        <p className="mt-3 text-xs text-text-tertiary">
          {String(unscheduled.length)} bug{unscheduled.length === 1 ? '' : 's'} unscheduled — set an
          iteration from the card to place them on the timeline.
        </p>
      )}
    </div>
  )
}
