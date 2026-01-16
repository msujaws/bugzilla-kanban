import { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Card } from './Card'
import type { BugzillaBug } from '@/lib/bugzilla/types'
import type { StagedChange } from '@/store/slices/staged-slice'
import type { Assignee } from '@/hooks/use-board-assignees'
import type { QeVerifyStatus } from '@/lib/bugzilla/qe-verify'

interface BacklogSectionProps {
  bugs: BugzillaBug[]
  stagedChanges: Map<number, StagedChange>
  allAssignees?: Assignee[]
  onAssigneeChange?: (bugId: number, newAssignee: string) => void
  onPointsChange?: (bugId: number, points: number | string | undefined) => void
  onPriorityChange?: (bugId: number, priority: string) => void
  onSeverityChange?: (bugId: number, severity: string) => void
  onQeVerifyChange?: (bugId: number, status: QeVerifyStatus) => void
  onBugClick?: (bug: BugzillaBug) => void
  isLoading?: boolean
  isDropTarget?: boolean
  hasActiveFilters?: boolean
}

export function BacklogSection({
  bugs,
  stagedChanges,
  allAssignees,
  onAssigneeChange,
  onPointsChange,
  onPriorityChange,
  onSeverityChange,
  onQeVerifyChange,
  onBugClick,
  isLoading = false,
  isDropTarget = false,
  hasActiveFilters = false,
}: BacklogSectionProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'backlog',
  })

  // Get staged bug IDs for this section
  const stagedBugIds = useMemo(() => {
    const ids = new Set<number>()
    for (const [bugId, change] of stagedChanges) {
      if (change.status) {
        ids.add(bugId)
      }
    }
    return ids
  }, [stagedChanges])

  // Get staged assignee bug IDs
  const stagedAssigneeBugIds = useMemo(() => {
    const ids = new Set<number>()
    for (const [bugId, change] of stagedChanges) {
      if (change.assignee) {
        ids.add(bugId)
      }
    }
    return ids
  }, [stagedChanges])

  // Get staged assignees
  const stagedAssignees = useMemo(() => {
    const map = new Map<number, string>()
    for (const [bugId, change] of stagedChanges) {
      if (change.assignee) {
        map.set(bugId, change.assignee.to)
      }
    }
    return map
  }, [stagedChanges])

  // Get staged points bug IDs
  const stagedPointsBugIds = useMemo(() => {
    const ids = new Set<number>()
    for (const [bugId, change] of stagedChanges) {
      if (change.points) {
        ids.add(bugId)
      }
    }
    return ids
  }, [stagedChanges])

  // Get staged points
  const stagedPoints = useMemo(() => {
    const map = new Map<number, number | string | undefined>()
    for (const [bugId, change] of stagedChanges) {
      if (change.points) {
        map.set(bugId, change.points.to)
      }
    }
    return map
  }, [stagedChanges])

  // Get staged priority bug IDs
  const stagedPriorityBugIds = useMemo(() => {
    const ids = new Set<number>()
    for (const [bugId, change] of stagedChanges) {
      if (change.priority) {
        ids.add(bugId)
      }
    }
    return ids
  }, [stagedChanges])

  // Get staged priorities
  const stagedPriorities = useMemo(() => {
    const map = new Map<number, string>()
    for (const [bugId, change] of stagedChanges) {
      if (change.priority) {
        map.set(bugId, change.priority.to)
      }
    }
    return map
  }, [stagedChanges])

  // Get staged severity bug IDs
  const stagedSeverityBugIds = useMemo(() => {
    const ids = new Set<number>()
    for (const [bugId, change] of stagedChanges) {
      if (change.severity) {
        ids.add(bugId)
      }
    }
    return ids
  }, [stagedChanges])

  // Get staged severities
  const stagedSeverities = useMemo(() => {
    const map = new Map<number, string>()
    for (const [bugId, change] of stagedChanges) {
      if (change.severity) {
        map.set(bugId, change.severity.to)
      }
    }
    return map
  }, [stagedChanges])

  // Get staged qe-verify bug IDs
  const stagedQeVerifyBugIds = useMemo(() => {
    const ids = new Set<number>()
    for (const [bugId, change] of stagedChanges) {
      if (change.qeVerify) {
        ids.add(bugId)
      }
    }
    return ids
  }, [stagedChanges])

  // Get staged qe-verifies
  const stagedQeVerifies = useMemo(() => {
    const map = new Map<number, QeVerifyStatus>()
    for (const [bugId, change] of stagedChanges) {
      if (change.qeVerify) {
        map.set(bugId, change.qeVerify.to)
      }
    }
    return map
  }, [stagedChanges])

  const stagedCount = bugs.filter((bug) => stagedBugIds.has(bug.id)).length
  const countId = 'backlog-count'

  // Determine section styling based on state
  const getSectionClassName = () => {
    const base = 'mt-6 flex min-h-[200px] flex-col rounded-lg p-4 transition-colors'
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
      aria-label="Backlog section"
      aria-describedby={countId}
      className={getSectionClassName()}
    >
      {/* Section Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-icons text-text-secondary">inbox</span>
          <h2 className="text-lg font-bold text-text-primary">Backlog</h2>
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
        <div className="flex flex-1 flex-col items-center justify-start pt-8 gap-2 text-text-secondary">
          <span className="material-icons animate-spin text-4xl">refresh</span>
          <p className="text-sm">Loading... 🐛</p>
        </div>
      )}

      {/* Empty State - aligned to top */}
      {!isLoading && bugs.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-start pt-8 gap-2 text-text-secondary">
          <span className="material-icons text-4xl">
            {hasActiveFilters ? 'filter_alt_off' : 'celebration'}
          </span>
          <p className="text-sm">No bugs here! 🎉</p>
          {hasActiveFilters ? (
            <p className="text-xs">Try adjusting your filters to see more bugs.</p>
          ) : (
            <p className="text-xs">Time to celebrate!</p>
          )}
        </div>
      )}

      {/* Bug Cards - horizontal scrolling grid */}
      {!isLoading && bugs.length > 0 && (
        <div className="flex flex-wrap gap-3 overflow-y-auto max-h-[400px]">
          {bugs.map((bug) => (
            <div key={bug.id} className="w-72 flex-shrink-0">
              <Card
                bug={bug}
                isStaged={stagedBugIds.has(bug.id)}
                isAssigneeStaged={stagedAssigneeBugIds.has(bug.id)}
                stagedAssignee={stagedAssignees.get(bug.id)}
                isPointsStaged={stagedPointsBugIds.has(bug.id)}
                stagedPoints={stagedPoints.get(bug.id)}
                isPriorityStaged={stagedPriorityBugIds.has(bug.id)}
                stagedPriority={stagedPriorities.get(bug.id)}
                isSeverityStaged={stagedSeverityBugIds.has(bug.id)}
                stagedSeverity={stagedSeverities.get(bug.id)}
                isQeVerifyStaged={stagedQeVerifyBugIds.has(bug.id)}
                stagedQeVerify={stagedQeVerifies.get(bug.id)}
                allAssignees={allAssignees}
                onAssigneeChange={onAssigneeChange}
                onPointsChange={onPointsChange}
                onPriorityChange={onPriorityChange}
                onSeverityChange={onSeverityChange}
                onQeVerifyChange={onQeVerifyChange}
                onClick={onBugClick}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
