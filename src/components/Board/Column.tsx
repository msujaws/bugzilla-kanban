import { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Card } from './Card'
import type { BugzillaBug } from '@/lib/bugzilla/types'
import type { KanbanColumn } from '@/lib/bugzilla/status-mapper'
import type { Assignee } from '@/hooks/use-board-assignees'
import { COLUMN_NAMES } from '@/types'

const NOBODY_EMAIL = 'nobody@mozilla.org'

interface ColumnProps {
  column: KanbanColumn
  bugs: BugzillaBug[]
  stagedBugIds: Set<number>
  stagedAssigneeBugIds?: Set<number>
  stagedAssignees?: Map<number, string>
  allAssignees?: Assignee[]
  onAssigneeChange?: (bugId: number, newAssignee: string) => void
  isLoading?: boolean
  selectedIndex?: number
  isGrabbing?: boolean
  isDropTarget?: boolean
}

const columnIcons: Record<KanbanColumn, string> = {
  backlog: 'inbox',
  todo: 'list',
  'in-progress': 'code',
  'in-testing': 'science',
  done: 'done_all',
}

export function Column({
  column,
  bugs,
  stagedBugIds,
  stagedAssigneeBugIds,
  stagedAssignees,
  allAssignees,
  onAssigneeChange,
  isLoading = false,
  selectedIndex,
  isGrabbing = false,
  isDropTarget = false,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column,
  })

  const columnName = COLUMN_NAMES[column] ?? column
  const icon = columnIcons[column]
  const stagedCount = bugs.filter((bug) => stagedBugIds.has(bug.id)).length
  const countId = `${column}-count`

  // Filter out nobody@mozilla.org for non-backlog columns
  // Bugzilla requires a real assignee for non-backlog statuses (ASSIGNED, IN_PROGRESS, etc.)
  const filteredAssignees = useMemo(() => {
    if (!allAssignees) return
    if (column === 'backlog') return allAssignees
    return allAssignees.filter((assignee) => assignee.email !== NOBODY_EMAIL)
  }, [allAssignees, column])

  // Determine column styling based on state
  const getColumnClassName = () => {
    const base = 'flex min-h-[500px] w-72 flex-shrink-0 flex-col rounded-lg p-4 transition-colors'
    if (isOver) {
      return `${base} bg-accent-primary/20 ring-2 ring-accent-primary`
    }
    if (isDropTarget) {
      return `${base} bg-accent-warning/10 ring-2 ring-dashed ring-accent-warning`
    }
    return `${base} bg-bg-secondary/50`
  }

  return (
    <div
      ref={setNodeRef}
      role="region"
      aria-label={`${columnName} column`}
      aria-describedby={countId}
      className={getColumnClassName()}
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

      {/* Drop target indicator */}
      {isDropTarget && (
        <div className="mb-3 flex items-center justify-center gap-2 rounded bg-accent-warning/20 px-3 py-2 text-sm text-accent-warning">
          <span className="material-icons text-base">keyboard_arrow_down</span>
          <span>Drop here</span>
        </div>
      )}

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
              isAssigneeStaged={stagedAssigneeBugIds?.has(bug.id)}
              stagedAssignee={stagedAssignees?.get(bug.id)}
              isSelected={selectedIndex === index}
              isGrabbed={selectedIndex === index && isGrabbing}
              allAssignees={filteredAssignees}
              onAssigneeChange={onAssigneeChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
