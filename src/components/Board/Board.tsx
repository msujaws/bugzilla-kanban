import { useMemo, useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { Column } from './Column'
import { Card } from './Card'
import { BacklogSection } from './BacklogSection'
import { StatusMapper, type KanbanColumn } from '@/lib/bugzilla/status-mapper'
import { assignBugToColumn } from '@/lib/bugzilla/column-assignment'
import { sortBugs } from '@/lib/bugzilla/sort-bugs'
import { filterRecentBugs } from '@/lib/bugzilla/date-filter'
import type { BugzillaBug } from '@/lib/bugzilla/types'
import type { StagedChange } from '@/store/slices/staged-slice'
import type { QeVerifyStatus } from '@/lib/bugzilla/qe-verify'
import { useBoardAssignees } from '@/hooks/use-board-assignees'
import { useStore } from '@/store'

const NOBODY_EMAIL = 'nobody@mozilla.org'

interface BoardProps {
  bugs: BugzillaBug[]
  stagedChanges: Map<number, StagedChange>
  onBugMove: (bugId: number, fromColumn: KanbanColumn, toColumn: KanbanColumn) => void
  onAssigneeChange?: (bugId: number, newAssignee: string) => void
  onPointsChange?: (bugId: number, points: number | string | undefined) => void
  onPriorityChange?: (bugId: number, priority: string) => void
  onSeverityChange?: (bugId: number, severity: string) => void
  onQeVerifyChange?: (bugId: number, status: QeVerifyStatus) => void
  onInvalidMove?: (bugId: number, reason: string) => void
  isLoading?: boolean
  onApplyChanges?: () => void
  onClearChanges?: () => void
  hasActiveFilters?: boolean
}

interface SelectedPosition {
  columnIndex: number
  bugIndex: number
}

const statusMapper = new StatusMapper()
// Board columns exclude backlog (backlog is rendered separately below the board)
const columns = statusMapper.getAvailableColumns().filter((col) => col !== 'backlog')

export function Board({
  bugs,
  stagedChanges,
  onBugMove,
  onAssigneeChange,
  onPointsChange,
  onPriorityChange,
  onSeverityChange,
  onQeVerifyChange,
  onInvalidMove,
  isLoading = false,
  onApplyChanges,
  onClearChanges,
  hasActiveFilters = false,
}: BoardProps) {
  const sortOrder = useStore((state) => state.filters.sortOrder)
  const assigneeFilter = useStore((state) => state.assigneeFilter)
  const [activeBug, setActiveBug] = useState<BugzillaBug>()
  const [selectedPosition, setSelectedPosition] = useState<SelectedPosition>()
  const [isGrabbing, setIsGrabbing] = useState(false)
  const [grabStartColumn, setGrabStartColumn] = useState<number>()
  const [grabbedBugId, setGrabbedBugId] = useState<number>()
  const [targetColumnIndex, setTargetColumnIndex] = useState<number>()
  const [showClearConfirmation, setShowClearConfirmation] = useState(false)

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    }),
  )

  // All available columns including backlog (for bug distribution)
  const allColumns = statusMapper.getAvailableColumns()

  // Filter bugs by assignee if filter is set
  const filteredBugs = useMemo(() => {
    if (!assigneeFilter) return bugs
    return bugs.filter((bug) => bug.assigned_to === assigneeFilter)
  }, [bugs, assigneeFilter])

  // Group bugs by column based on their status (with staged changes applied)
  const bugsByColumn = useMemo(() => {
    const grouped = new Map<KanbanColumn, BugzillaBug[]>()

    // Initialize all columns with empty arrays (including backlog)
    for (const column of allColumns) {
      grouped.set(column, [])
    }

    // Distribute bugs to their columns (considering staged status changes)
    for (const bug of filteredBugs) {
      const stagedChange = stagedChanges.get(bug.id)
      // If bug has a staged status change, show it in the target column
      const column = stagedChange?.status
        ? (stagedChange.status.to as KanbanColumn)
        : assignBugToColumn(bug)
      const columnBugs = grouped.get(column) ?? []
      columnBugs.push(bug)
      grouped.set(column, columnBugs)
    }

    // Filter done column to only show bugs with FIXED resolution from the past 2 weeks
    const doneBugs = grouped.get('done') ?? []
    const fixedDoneBugs = doneBugs.filter((bug) => bug.resolution === 'FIXED')
    grouped.set('done', filterRecentBugs(fixedDoneBugs))

    // Sort bugs within each column by the configured sort order
    for (const column of allColumns) {
      const columnBugs = grouped.get(column) ?? []
      grouped.set(column, sortBugs(columnBugs, sortOrder))
    }

    return grouped
  }, [filteredBugs, stagedChanges, sortOrder, allColumns])

  // Get all staged bug IDs for highlighting
  const stagedBugIds = useMemo(() => {
    const ids = new Set<number>()
    for (const bugId of stagedChanges.keys()) {
      ids.add(bugId)
    }
    return ids
  }, [stagedChanges])

  // Get bug IDs with staged assignee changes
  const stagedAssigneeBugIds = useMemo(() => {
    const ids = new Set<number>()
    for (const [bugId, change] of stagedChanges) {
      if (change.assignee) {
        ids.add(bugId)
      }
    }
    return ids
  }, [stagedChanges])

  // Get staged assignees map (bugId -> new assignee email)
  const stagedAssignees = useMemo(() => {
    const assignees = new Map<number, string>()
    for (const [bugId, change] of stagedChanges) {
      if (change.assignee) {
        assignees.set(bugId, change.assignee.to)
      }
    }
    return assignees
  }, [stagedChanges])

  // Get bug IDs with staged points changes
  const stagedPointsBugIds = useMemo(() => {
    const ids = new Set<number>()
    for (const [bugId, change] of stagedChanges) {
      if (change.points) {
        ids.add(bugId)
      }
    }
    return ids
  }, [stagedChanges])

  // Get staged points map (bugId -> new points)
  const stagedPoints = useMemo(() => {
    const points = new Map<number, number | string | undefined>()
    for (const [bugId, change] of stagedChanges) {
      if (change.points) {
        points.set(bugId, change.points.to)
      }
    }
    return points
  }, [stagedChanges])

  // Get bug IDs with staged priority changes
  const stagedPriorityBugIds = useMemo(() => {
    const ids = new Set<number>()
    for (const [bugId, change] of stagedChanges) {
      if (change.priority) {
        ids.add(bugId)
      }
    }
    return ids
  }, [stagedChanges])

  // Get staged priorities map (bugId -> new priority)
  const stagedPriorities = useMemo(() => {
    const priorities = new Map<number, string>()
    for (const [bugId, change] of stagedChanges) {
      if (change.priority) {
        priorities.set(bugId, change.priority.to)
      }
    }
    return priorities
  }, [stagedChanges])

  // Get bug IDs with staged severity changes
  const stagedSeverityBugIds = useMemo(() => {
    const ids = new Set<number>()
    for (const [bugId, change] of stagedChanges) {
      if (change.severity) {
        ids.add(bugId)
      }
    }
    return ids
  }, [stagedChanges])

  // Get staged severities map (bugId -> new severity)
  const stagedSeverities = useMemo(() => {
    const severities = new Map<number, string>()
    for (const [bugId, change] of stagedChanges) {
      if (change.severity) {
        severities.set(bugId, change.severity.to)
      }
    }
    return severities
  }, [stagedChanges])

  // Get bug IDs with staged qe-verify changes
  const stagedQeVerifyBugIds = useMemo(() => {
    const ids = new Set<number>()
    for (const [bugId, change] of stagedChanges) {
      if (change.qeVerify) {
        ids.add(bugId)
      }
    }
    return ids
  }, [stagedChanges])

  // Get staged qe-verifies map (bugId -> new status)
  const stagedQeVerifies = useMemo(() => {
    const qeVerifies = new Map<number, QeVerifyStatus>()
    for (const [bugId, change] of stagedChanges) {
      if (change.qeVerify) {
        qeVerifies.set(bugId, change.qeVerify.to)
      }
    }
    return qeVerifies
  }, [stagedChanges])

  // Get all assignees from bugs on the board
  const allAssignees = useBoardAssignees(bugs)

  // Check if a bug can be moved to a column
  // Returns error message if invalid, undefined if valid
  const validateMove = useCallback(
    (bugId: number, fromColumn: KanbanColumn, toColumn: KanbanColumn): string | undefined => {
      // Only validate moves OUT of backlog (except to todo, which allows unassigned bugs)
      if (fromColumn === 'backlog' && toColumn !== 'backlog' && toColumn !== 'todo') {
        const bug = bugs.find((b) => b.id === bugId)
        if (!bug) return undefined

        // Check the effective assignee (staged or original)
        const stagedChange = stagedChanges.get(bugId)
        const effectiveAssignee = stagedChange?.assignee?.to ?? bug.assigned_to

        if (effectiveAssignee === NOBODY_EMAIL) {
          return 'Cannot move unassigned bug to this column. Please assign someone first.'
        }
      }
      return undefined
    },
    [bugs, stagedChanges],
  )

  // Find first non-empty column
  const findFirstNonEmptyColumn = useCallback((): number => {
    for (const [i, column] of columns.entries()) {
      if ((bugsByColumn.get(column)?.length ?? 0) > 0) {
        return i
      }
    }
    return -1
  }, [bugsByColumn])

  // Find next non-empty column in direction
  const findNextNonEmptyColumn = useCallback(
    (currentIndex: number, direction: 1 | -1): number => {
      let nextIndex = currentIndex + direction
      while (nextIndex >= 0 && nextIndex < columns.length) {
        const column = columns[nextIndex]
        if (column && (bugsByColumn.get(column)?.length ?? 0) > 0) {
          return nextIndex
        }
        nextIndex += direction
      }
      return currentIndex // Stay at current if no non-empty column found
    },
    [bugsByColumn],
  )

  // Get selected bug based on position
  const getSelectedBug = useCallback((): BugzillaBug | undefined => {
    if (!selectedPosition) return undefined
    const column = columns[selectedPosition.columnIndex]
    if (!column) return undefined
    const columnBugs = bugsByColumn.get(column) ?? []
    return columnBugs[selectedPosition.bugIndex]
  }, [selectedPosition, bugsByColumn])

  // Keyboard event handlers
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle keyboard when loading or no bugs
      if (isLoading || bugs.length === 0) return

      // Handle Enter for confirmation or Shift+Enter for applying changes
      if (event.key === 'Enter') {
        if (showClearConfirmation) {
          // Confirm clear
          onClearChanges?.()
          setShowClearConfirmation(false)
          return
        }
        if (event.shiftKey) {
          onApplyChanges?.()
          return
        }
        return
      }

      // Handle Escape - either cancel confirmation or show confirmation if staged changes exist
      if (event.key === 'Escape') {
        if (showClearConfirmation) {
          // Cancel confirmation
          setShowClearConfirmation(false)
          return
        }
        // If there are staged changes, show confirmation instead of clearing selection
        if (stagedChanges.size > 0) {
          setShowClearConfirmation(true)
          return
        }
        // Otherwise just clear selection
        setSelectedPosition(undefined)
        setIsGrabbing(false)
        setGrabStartColumn(undefined)
        return
      }

      // Handle Shift key for grab mode
      if (event.key === 'Shift' && selectedPosition) {
        const bug = getSelectedBug()
        if (bug) {
          setIsGrabbing(true)
          setGrabStartColumn(selectedPosition.columnIndex)
          setGrabbedBugId(bug.id)
          setTargetColumnIndex(selectedPosition.columnIndex)
        }
        return
      }

      // Handle arrow keys
      if (event.key.startsWith('Arrow')) {
        event.preventDefault()

        // Initialize selection if none exists
        if (!selectedPosition) {
          const firstColumn = findFirstNonEmptyColumn()
          if (firstColumn >= 0) {
            setSelectedPosition({ columnIndex: firstColumn, bugIndex: 0 })
          }
          return
        }

        const column = columns[selectedPosition.columnIndex]
        if (!column) return
        const currentColumnBugs = bugsByColumn.get(column) ?? []

        switch (event.key) {
          case 'ArrowUp': {
            if (!isGrabbing && selectedPosition.bugIndex > 0) {
              setSelectedPosition({
                ...selectedPosition,
                bugIndex: selectedPosition.bugIndex - 1,
              })
            }
            break
          }
          case 'ArrowDown': {
            if (!isGrabbing && selectedPosition.bugIndex < currentColumnBugs.length - 1) {
              setSelectedPosition({
                ...selectedPosition,
                bugIndex: selectedPosition.bugIndex + 1,
              })
            }
            break
          }
          case 'ArrowLeft': {
            if (isGrabbing && targetColumnIndex !== undefined) {
              // During grab mode, just track target column
              if (targetColumnIndex > 0) {
                setTargetColumnIndex(targetColumnIndex - 1)
              }
            } else {
              const prevColumn = findNextNonEmptyColumn(selectedPosition.columnIndex, -1)
              if (prevColumn !== selectedPosition.columnIndex) {
                const prevColumnKey = columns[prevColumn]
                if (prevColumnKey) {
                  const prevColumnBugs = bugsByColumn.get(prevColumnKey) ?? []
                  const clampedIndex = Math.min(
                    selectedPosition.bugIndex,
                    prevColumnBugs.length - 1,
                  )
                  setSelectedPosition({
                    columnIndex: prevColumn,
                    bugIndex: Math.max(0, clampedIndex),
                  })
                }
              }
            }
            break
          }
          case 'ArrowRight': {
            if (isGrabbing && targetColumnIndex !== undefined) {
              // During grab mode, just track target column
              if (targetColumnIndex < columns.length - 1) {
                setTargetColumnIndex(targetColumnIndex + 1)
              }
            } else {
              const nextColumn = findNextNonEmptyColumn(selectedPosition.columnIndex, 1)
              if (nextColumn !== selectedPosition.columnIndex) {
                const nextColumnKey = columns[nextColumn]
                if (nextColumnKey) {
                  const nextColumnBugs = bugsByColumn.get(nextColumnKey) ?? []
                  const clampedIndex = Math.min(
                    selectedPosition.bugIndex,
                    nextColumnBugs.length - 1,
                  )
                  setSelectedPosition({
                    columnIndex: nextColumn,
                    bugIndex: Math.max(0, clampedIndex),
                  })
                }
              }
            }
            break
          }
        }
      }
    },
    [
      isLoading,
      bugs.length,
      selectedPosition,
      bugsByColumn,
      findFirstNonEmptyColumn,
      findNextNonEmptyColumn,
      isGrabbing,
      onApplyChanges,
      onClearChanges,
      getSelectedBug,
      targetColumnIndex,
      showClearConfirmation,
      stagedChanges.size,
    ],
  )

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Shift' && isGrabbing) {
        setIsGrabbing(false)

        // Stage the move if column changed
        if (
          grabbedBugId !== undefined &&
          grabStartColumn !== undefined &&
          targetColumnIndex !== undefined &&
          targetColumnIndex !== grabStartColumn
        ) {
          const fromColumn = columns[grabStartColumn]
          const toColumn = columns[targetColumnIndex]
          if (fromColumn && toColumn) {
            // Validate the move
            const error = validateMove(grabbedBugId, fromColumn, toColumn)
            if (error) {
              onInvalidMove?.(grabbedBugId, error)
            } else {
              onBugMove(grabbedBugId, fromColumn, toColumn)
            }
          }
        }
        setGrabStartColumn(undefined)
        setGrabbedBugId(undefined)
        setTargetColumnIndex(undefined)
      }
    },
    [
      isGrabbing,
      grabStartColumn,
      grabbedBugId,
      targetColumnIndex,
      onBugMove,
      validateMove,
      onInvalidMove,
    ],
  )

  // Set up keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const bugId = event.active.id as number
    const bug = bugs.find((b) => b.id === bugId)
    if (bug) {
      setActiveBug(bug)
    }
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveBug(undefined)

    if (!over) return

    const bugId = active.id as number
    const targetColumn = over.id as KanbanColumn

    // Find the bug's current column
    const bug = bugs.find((b) => b.id === bugId)
    if (!bug) return

    // Check if there's already a staged status change for this bug
    const stagedChange = stagedChanges.get(bugId)
    // Use assignBugToColumn for consistent column assignment (handles sprint tags)
    const currentColumn = stagedChange?.status
      ? (stagedChange.status.to as KanbanColumn)
      : assignBugToColumn(bug)

    // Only trigger move if dropping on a different column
    if (currentColumn !== targetColumn) {
      // Validate the move
      const error = validateMove(bugId, currentColumn, targetColumn)
      if (error) {
        onInvalidMove?.(bugId, error)
      } else {
        onBugMove(bugId, currentColumn, targetColumn)
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <main
        role="main"
        aria-label="Kanban Board"
        aria-busy={isLoading}
        className="min-h-screen bg-bg-primary py-6"
      >
        {/* Clear confirmation banner */}
        {showClearConfirmation && (
          <div className="mb-4 flex items-center justify-center gap-3 rounded-lg bg-accent-warning/20 px-4 py-3 text-accent-warning">
            <span className="material-icons">warning</span>
            <span>
              Press{' '}
              <kbd className="rounded bg-bg-tertiary px-1.5 py-0.5 font-mono text-text-primary">
                Enter
              </kbd>{' '}
              to clear {stagedChanges.size} staged {stagedChanges.size === 1 ? 'change' : 'changes'}
              , or{' '}
              <kbd className="rounded bg-bg-tertiary px-1.5 py-0.5 font-mono text-text-primary">
                Escape
              </kbd>{' '}
              to cancel
            </span>
          </div>
        )}

        {/* Board container with height constraint */}
        <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
          <div className="flex gap-6 pb-4">
            {columns.map((column, columnIndex) => (
              <Column
                key={column}
                column={column}
                bugs={isLoading ? [] : (bugsByColumn.get(column) ?? [])}
                stagedBugIds={stagedBugIds}
                stagedAssigneeBugIds={stagedAssigneeBugIds}
                stagedAssignees={stagedAssignees}
                stagedPointsBugIds={stagedPointsBugIds}
                stagedPoints={stagedPoints}
                stagedPriorityBugIds={stagedPriorityBugIds}
                stagedPriorities={stagedPriorities}
                stagedSeverityBugIds={stagedSeverityBugIds}
                stagedSeverities={stagedSeverities}
                stagedQeVerifyBugIds={stagedQeVerifyBugIds}
                stagedQeVerifies={stagedQeVerifies}
                allAssignees={allAssignees}
                onAssigneeChange={onAssigneeChange}
                onPointsChange={onPointsChange}
                onPriorityChange={onPriorityChange}
                onSeverityChange={onSeverityChange}
                onQeVerifyChange={onQeVerifyChange}
                isLoading={isLoading}
                selectedIndex={
                  selectedPosition?.columnIndex === columnIndex
                    ? selectedPosition.bugIndex
                    : undefined
                }
                isGrabbing={selectedPosition?.columnIndex === columnIndex && isGrabbing}
                isDropTarget={isGrabbing && targetColumnIndex === columnIndex}
                hasActiveFilters={hasActiveFilters}
              />
            ))}
          </div>
        </div>

        {/* Backlog section below the board */}
        <BacklogSection
          bugs={isLoading ? [] : (bugsByColumn.get('backlog') ?? [])}
          stagedChanges={stagedChanges}
          allAssignees={allAssignees}
          onAssigneeChange={onAssigneeChange}
          onPointsChange={onPointsChange}
          onPriorityChange={onPriorityChange}
          onSeverityChange={onSeverityChange}
          onQeVerifyChange={onQeVerifyChange}
          isLoading={isLoading}
          hasActiveFilters={hasActiveFilters}
        />
      </main>

      {/* Drag overlay - shows the card being dragged */}
      <DragOverlay>
        {activeBug ? (
          <Card bug={activeBug} isStaged={stagedBugIds.has(activeBug.id)} isDragging />
        ) : undefined}
      </DragOverlay>
    </DndContext>
  )
}
