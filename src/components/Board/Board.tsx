import { useMemo, useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { Column } from './Column'
import { Card } from './Card'
import { StatusMapper, type KanbanColumn } from '@/lib/bugzilla/status-mapper'
import type { BugzillaBug } from '@/lib/bugzilla/types'

interface BoardProps {
  bugs: BugzillaBug[]
  stagedChanges: Map<number, { from: string; to: string }>
  onBugMove: (bugId: number, fromColumn: KanbanColumn, toColumn: KanbanColumn) => void
  isLoading?: boolean
  onApplyChanges?: () => void
}

interface SelectedPosition {
  columnIndex: number
  bugIndex: number
}

const statusMapper = new StatusMapper()
const columns = statusMapper.getAvailableColumns()

export function Board({
  bugs,
  stagedChanges,
  onBugMove,
  isLoading = false,
  onApplyChanges,
}: BoardProps) {
  const [activeBug, setActiveBug] = useState<BugzillaBug | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<SelectedPosition | null>(null)
  const [isGrabbing, setIsGrabbing] = useState(false)
  const [grabStartColumn, setGrabStartColumn] = useState<number | null>(null)
  const [grabbedBugId, setGrabbedBugId] = useState<number | null>(null)
  const [targetColumnIndex, setTargetColumnIndex] = useState<number | null>(null)

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    }),
  )

  // Group bugs by column based on their status (with staged changes applied)
  const bugsByColumn = useMemo(() => {
    const grouped = new Map<KanbanColumn, BugzillaBug[]>()

    // Initialize all columns with empty arrays
    for (const column of columns) {
      grouped.set(column, [])
    }

    // Distribute bugs to their columns (considering staged changes)
    for (const bug of bugs) {
      const stagedChange = stagedChanges.get(bug.id)
      // If bug has a staged change, show it in the target column
      const column = stagedChange
        ? (stagedChange.to as KanbanColumn)
        : statusMapper.statusToColumn(bug.status)
      const columnBugs = grouped.get(column) ?? []
      columnBugs.push(bug)
      grouped.set(column, columnBugs)
    }

    return grouped
  }, [bugs, stagedChanges])

  // Get all staged bug IDs for highlighting
  const stagedBugIds = useMemo(() => {
    const ids = new Set<number>()
    for (const bugId of stagedChanges.keys()) {
      ids.add(bugId)
    }
    return ids
  }, [stagedChanges])

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
  const getSelectedBug = useCallback((): BugzillaBug | null => {
    if (!selectedPosition) return null
    const column = columns[selectedPosition.columnIndex]
    if (!column) return null
    const columnBugs = bugsByColumn.get(column) ?? []
    return columnBugs[selectedPosition.bugIndex] ?? null
  }, [selectedPosition, bugsByColumn])

  // Keyboard event handlers
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle keyboard when loading or no bugs
      if (isLoading || bugs.length === 0) return

      // Handle Shift+Enter for applying changes
      if (event.key === 'Enter' && event.shiftKey) {
        onApplyChanges?.()
        return
      }

      // Handle Escape to clear selection
      if (event.key === 'Escape') {
        setSelectedPosition(null)
        setIsGrabbing(false)
        setGrabStartColumn(null)
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
            if (isGrabbing && targetColumnIndex !== null) {
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
            if (isGrabbing && targetColumnIndex !== null) {
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
      getSelectedBug,
      targetColumnIndex,
    ],
  )

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Shift' && isGrabbing) {
        setIsGrabbing(false)

        // Stage the move if column changed
        if (
          grabbedBugId !== null &&
          grabStartColumn !== null &&
          targetColumnIndex !== null &&
          targetColumnIndex !== grabStartColumn
        ) {
          const fromColumn = columns[grabStartColumn]
          const toColumn = columns[targetColumnIndex]
          if (fromColumn && toColumn) {
            onBugMove(grabbedBugId, fromColumn, toColumn)
          }
        }
        setGrabStartColumn(null)
        setGrabbedBugId(null)
        setTargetColumnIndex(null)
      }
    },
    [isGrabbing, grabStartColumn, grabbedBugId, targetColumnIndex, onBugMove],
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
    setActiveBug(null)

    if (!over) return

    const bugId = active.id as number
    const targetColumn = over.id as KanbanColumn

    // Find the bug's current column
    const bug = bugs.find((b) => b.id === bugId)
    if (!bug) return

    // Check if there's already a staged change for this bug
    const stagedChange = stagedChanges.get(bugId)
    const currentColumn = stagedChange
      ? (stagedChange.to as KanbanColumn)
      : statusMapper.statusToColumn(bug.status)

    // Only trigger move if dropping on a different column
    if (currentColumn !== targetColumn) {
      onBugMove(bugId, currentColumn, targetColumn)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <main
        role="main"
        aria-label="Kanban Board"
        aria-busy={isLoading}
        className="min-h-screen bg-bg-primary p-6"
      >
        <div className="overflow-x-auto">
          <div className="flex gap-6 pb-4">
            {columns.map((column, columnIndex) => (
              <Column
                key={column}
                column={column}
                bugs={isLoading ? [] : (bugsByColumn.get(column) ?? [])}
                stagedBugIds={stagedBugIds}
                isLoading={isLoading}
                selectedIndex={
                  selectedPosition?.columnIndex === columnIndex
                    ? selectedPosition.bugIndex
                    : undefined
                }
                isGrabbing={selectedPosition?.columnIndex === columnIndex && isGrabbing}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Drag overlay - shows the card being dragged */}
      <DragOverlay>
        {activeBug ? (
          <Card bug={activeBug} isStaged={stagedBugIds.has(activeBug.id)} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
