import type { StagedChange } from '@/store/slices/staged-slice'
import type { BugzillaBug } from '@/lib/bugzilla/types'
import type { QeVerifyStatus } from '@/lib/bugzilla/qe-verify'

interface StagedChangesPreviewProps {
  changes: Map<number, StagedChange>
  bugs: BugzillaBug[]
}

const COLUMN_DISPLAY_NAMES: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  'in-progress': 'In Progress',
  'in-testing': 'In Testing',
  done: 'Done',
}

function formatColumnName(column: string): string {
  return COLUMN_DISPLAY_NAMES[column] ?? column
}

function formatQeVerifyStatus(status: QeVerifyStatus): string {
  switch (status) {
    case 'plus': {
      return 'qe+'
    }
    case 'minus': {
      return 'qe-'
    }
    default: {
      return '---'
    }
  }
}

function formatPoints(points: number | string | undefined): string {
  if (points === undefined || points === '') {
    return 'none'
  }
  return String(points)
}

export function StagedChangesPreview({ changes, bugs }: StagedChangesPreviewProps) {
  if (changes.size === 0) {
    // eslint-disable-next-line unicorn/no-null -- React expects null for "render nothing"
    return null
  }

  const bugMap = new Map(bugs.map((bug) => [bug.id, bug]))

  return (
    <div
      role="region"
      aria-label="Staged changes preview"
      className="max-h-64 overflow-y-auto rounded-lg bg-bg-secondary p-3 shadow-lg ring-1 ring-bg-tertiary"
    >
      <ul role="list" className="space-y-3">
        {[...changes.entries()].map(([bugId, change]) => {
          const bug = bugMap.get(bugId)
          return (
            <li key={bugId} className="border-b border-bg-tertiary pb-3 last:border-0 last:pb-0">
              {/* Bug header */}
              <div className="mb-1 flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-accent-primary">#{bugId}</span>
                {bug && (
                  <span className="truncate text-sm text-text-secondary" title={bug.summary}>
                    {bug.summary}
                  </span>
                )}
              </div>

              {/* Changes list */}
              <div className="ml-4 space-y-0.5 text-xs">
                {change.status && (
                  <div className="text-text-tertiary">
                    <span className="font-medium text-text-secondary">Status:</span>{' '}
                    {formatColumnName(change.status.from)} → {formatColumnName(change.status.to)}
                  </div>
                )}

                {change.assignee && (
                  <div className="text-text-tertiary">
                    <span className="font-medium text-text-secondary">Assignee:</span>{' '}
                    {change.assignee.from} → {change.assignee.to}
                  </div>
                )}

                {change.priority && (
                  <div className="text-text-tertiary">
                    <span className="font-medium text-text-secondary">Priority:</span>{' '}
                    {change.priority.from} → {change.priority.to}
                  </div>
                )}

                {change.severity && (
                  <div className="text-text-tertiary">
                    <span className="font-medium text-text-secondary">Severity:</span>{' '}
                    {change.severity.from} → {change.severity.to}
                  </div>
                )}

                {change.points && (
                  <div className="text-text-tertiary">
                    <span className="font-medium text-text-secondary">Points:</span>{' '}
                    {formatPoints(change.points.from)} → {formatPoints(change.points.to)}
                  </div>
                )}

                {change.qeVerify && (
                  <div className="text-text-tertiary">
                    <span className="font-medium text-text-secondary">QE Verify:</span>{' '}
                    {formatQeVerifyStatus(change.qeVerify.from)} →{' '}
                    {formatQeVerifyStatus(change.qeVerify.to)}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
