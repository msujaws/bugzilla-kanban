import { useMemo, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Card } from './Card'
import { ColumnInfoPopover } from './ColumnInfoPopover'
import type { BugzillaBug } from '@/lib/bugzilla/types'
import type { KanbanColumn } from '@/lib/bugzilla/status-mapper'
import type { Assignee } from '@/hooks/use-board-assignees'
import type { QeVerifyStatus } from '@/lib/bugzilla/qe-verify'
import { COLUMN_NAMES } from '@/types'

const NOBODY_EMAIL = 'nobody@mozilla.org'

function calculateTotalPoints(bugs: BugzillaBug[]): number {
  let total = 0
  for (const bug of bugs) {
    const points = bug.cf_fx_points
    if (typeof points === 'number' && points > 0) {
      total += points
    }
  }
  return total
}

interface ColumnProps {
  column: KanbanColumn
  bugs: BugzillaBug[]
  stagedBugIds: Set<number>
  stagedAssigneeBugIds?: Set<number>
  stagedAssignees?: Map<number, string>
  stagedPointsBugIds?: Set<number>
  stagedPoints?: Map<number, number | string | undefined>
  stagedPriorityBugIds?: Set<number>
  stagedPriorities?: Map<number, string>
  stagedSeverityBugIds?: Set<number>
  stagedSeverities?: Map<number, string>
  stagedQeVerifyBugIds?: Set<number>
  stagedQeVerifies?: Map<number, QeVerifyStatus>
  allAssignees?: Assignee[]
  onAssigneeChange?: (bugId: number, newAssignee: string) => void
  onPointsChange?: (bugId: number, points: number | string | undefined) => void
  onPriorityChange?: (bugId: number, priority: string) => void
  onSeverityChange?: (bugId: number, severity: string) => void
  onQeVerifyChange?: (bugId: number, status: QeVerifyStatus) => void
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

const columnDescriptions: Record<KanbanColumn, string> = {
  backlog: 'Bugs with status NEW or UNCONFIRMED without a [bzkanban-sprint] whiteboard tag',
  todo: 'Bugs with status NEW or UNCONFIRMED that have a [bzkanban-sprint] whiteboard tag',
  'in-progress': 'Bugs with status ASSIGNED',
  'in-testing': 'Bugs with status RESOLVED, resolution FIXED, and qe-verify+ flag',
  done: 'Bugs with status RESOLVED/VERIFIED/CLOSED and resolution FIXED (last 2 weeks)',
}

export function Column({
  column,
  bugs,
  stagedBugIds,
  stagedAssigneeBugIds,
  stagedAssignees,
  stagedPointsBugIds,
  stagedPoints,
  stagedPriorityBugIds,
  stagedPriorities,
  stagedSeverityBugIds,
  stagedSeverities,
  stagedQeVerifyBugIds,
  stagedQeVerifies,
  allAssignees,
  onAssigneeChange,
  onPointsChange,
  onPriorityChange,
  onSeverityChange,
  onQeVerifyChange,
  isLoading = false,
  selectedIndex,
  isGrabbing = false,
  isDropTarget = false,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column,
  })

  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [infoAnchorPosition, setInfoAnchorPosition] = useState<{ x: number; y: number }>()

  const columnName = COLUMN_NAMES[column] ?? column
  const icon = columnIcons[column]
  const description = columnDescriptions[column]
  const stagedCount = bugs.filter((bug) => stagedBugIds.has(bug.id)).length
  const countId = `${column}-count`
  const totalPoints = useMemo(() => calculateTotalPoints(bugs), [bugs])

  const handleInfoClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setInfoAnchorPosition({ x: rect.left, y: rect.bottom + 4 })
    setIsInfoOpen(true)
  }

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
          <button
            type="button"
            aria-label="Column info"
            onClick={handleInfoClick}
            className="rounded text-text-tertiary transition-colors hover:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-1 focus:ring-offset-bg-secondary"
          >
            <span className="material-icons text-base">info_outline</span>
          </button>
          <ColumnInfoPopover
            isOpen={isInfoOpen}
            onClose={() => {
              setIsInfoOpen(false)
            }}
            description={description}
            anchorPosition={infoAnchorPosition}
          />
        </div>
        <div className="flex items-center gap-2">
          {stagedCount > 0 && (
            <span
              aria-live="polite"
              aria-atomic="true"
              className="rounded bg-accent-primary/20 px-2 py-0.5 text-xs text-accent-primary"
            >
              {stagedCount} staged
            </span>
          )}
          <span
            id={countId}
            className="rounded-full bg-bg-tertiary px-2 py-0.5 text-sm font-bold text-text-secondary"
          >
            {bugs.length}
          </span>
          {totalPoints > 0 && (
            <span
              aria-label="total points"
              className="rounded-full bg-accent-primary/20 px-2 py-0.5 text-sm font-bold text-accent-primary"
            >
              {totalPoints} pts
            </span>
          )}
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

      {/* Empty State - aligned to top */}
      {!isLoading && bugs.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-start pt-8 gap-2 text-text-secondary">
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
              isPointsStaged={stagedPointsBugIds?.has(bug.id)}
              stagedPoints={stagedPoints?.get(bug.id)}
              isPriorityStaged={stagedPriorityBugIds?.has(bug.id)}
              stagedPriority={stagedPriorities?.get(bug.id)}
              isSeverityStaged={stagedSeverityBugIds?.has(bug.id)}
              stagedSeverity={stagedSeverities?.get(bug.id)}
              isQeVerifyStaged={stagedQeVerifyBugIds?.has(bug.id)}
              stagedQeVerify={stagedQeVerifies?.get(bug.id)}
              isSelected={selectedIndex === index}
              isGrabbed={selectedIndex === index && isGrabbing}
              allAssignees={filteredAssignees}
              onAssigneeChange={onAssigneeChange}
              onPointsChange={onPointsChange}
              onPriorityChange={onPriorityChange}
              onSeverityChange={onSeverityChange}
              onQeVerifyChange={onQeVerifyChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
