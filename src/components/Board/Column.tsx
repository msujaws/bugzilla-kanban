import { Reorder, AnimatePresence } from 'framer-motion'
import { Card } from './Card'
import type { BugzillaBug } from '@/lib/bugzilla/types'
import type { KanbanColumn } from '@/lib/bugzilla/status-mapper'
import { COLUMN_NAMES } from '@/types'

interface ColumnProps {
  column: KanbanColumn
  bugs: BugzillaBug[]
  stagedBugIds: Set<number>
  onBugMove: (bugId: number, fromColumn: KanbanColumn, toColumn: KanbanColumn) => void
  isLoading?: boolean
}

const columnIcons: Record<KanbanColumn, string> = {
  backlog: 'inbox',
  todo: 'list',
  'in-progress': 'code',
  'in-review': 'rate_review',
  done: 'done_all',
}

// Handle reorder within column (for visual feedback, doesn't change status)
function handleReorder(newOrder: BugzillaBug[]) {
  // For now, just visual reordering - actual status changes happen on drop to different column
  console.log('Reordered within column:', newOrder)
}

export function Column({
  column,
  bugs,
  stagedBugIds,
  onBugMove: _onBugMove,
  isLoading = false,
}: ColumnProps) {
  const columnName = COLUMN_NAMES[column] ?? column
  const icon = columnIcons[column]
  const stagedCount = bugs.filter((bug) => stagedBugIds.has(bug.id)).length
  const countId = `${column}-count`

  return (
    <div
      role="region"
      aria-label={`${columnName} column`}
      aria-describedby={countId}
      className="flex min-h-[500px] w-72 flex-shrink-0 flex-col rounded-lg bg-bg-secondary/50 p-4"
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
        <Reorder.Group
          axis="y"
          values={bugs}
          onReorder={handleReorder}
          className="flex flex-1 flex-col gap-3 overflow-y-auto"
        >
          <AnimatePresence mode="popLayout">
            {bugs.map((bug) => (
              <Reorder.Item key={bug.id} value={bug} className="cursor-grab active:cursor-grabbing">
                <Card bug={bug} isStaged={stagedBugIds.has(bug.id)} />
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}
    </div>
  )
}
