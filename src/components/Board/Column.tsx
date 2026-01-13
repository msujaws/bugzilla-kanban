import { useDroppable } from '@dnd-kit/core'
import { Card } from './Card'
import type { BugzillaBug } from '@/lib/bugzilla/types'
import type { KanbanColumn } from '@/lib/bugzilla/status-mapper'
import { COLUMN_NAMES } from '@/types'

interface ColumnProps {
  column: KanbanColumn
  bugs: BugzillaBug[]
  stagedBugIds: Set<number>
  isLoading?: boolean
  selectedIndex?: number
  isGrabbing?: boolean
}

const columnIcons: Record<KanbanColumn, string> = {
  backlog: 'inbox',
  todo: 'list',
  'in-progress': 'code',
  'in-review': 'rate_review',
  done: 'done_all',
}

export function Column({
  column,
  bugs,
  stagedBugIds,
  isLoading = false,
  selectedIndex,
  isGrabbing = false,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column,
  })

  const columnName = COLUMN_NAMES[column] ?? column
  const icon = columnIcons[column]
  const stagedCount = bugs.filter((bug) => stagedBugIds.has(bug.id)).length
  const countId = `${column}-count`

  return (
    <div
      ref={setNodeRef}
      role="region"
      aria-label={`${columnName} column`}
      aria-describedby={countId}
      className={`flex min-h-[500px] w-72 flex-shrink-0 flex-col rounded-lg p-4 transition-colors ${
        isOver ? 'bg-accent-primary/20 ring-2 ring-accent-primary' : 'bg-bg-secondary/50'
      }`}
    >
      {/* Column Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-icons text-text-secondary">{icon}</span>
          <h2 className="text-lg font-bold text-text-primary">{columnName}</h2>
        </div>
        <div className="flex items-center gap-2">
          {stagedCount > 0 && (
            <span className="rounded bg-accent-primary/20 px-2 py-0.5 text-xs text-accent-primary">
              {stagedCount} staged
            </span>
          )}
          <span
            id={countId}
            className="rounded-full bg-bg-tertiary px-2 py-0.5 text-sm font-bold text-text-secondary"
          >
            {bugs.length}
          </span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-text-secondary">
          <span className="material-icons animate-spin text-4xl">refresh</span>
          <p className="text-sm">Loading... 🐛</p>
          <p className="text-xs">The bugs are coming for you!</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && bugs.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-text-secondary">
          <span className="material-icons text-4xl">celebration</span>
          <p className="text-sm">No bugs here! 🎉</p>
          <p className="text-xs">Time to celebrate!</p>
        </div>
      )}

      {/* Bug Cards */}
      {!isLoading && bugs.length > 0 && (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {bugs.map((bug, index) => (
            <Card
              key={bug.id}
              bug={bug}
              isStaged={stagedBugIds.has(bug.id)}
              isSelected={selectedIndex === index}
              isGrabbed={selectedIndex === index && isGrabbing}
            />
          ))}
        </div>
      )}
    </div>
  )
}
