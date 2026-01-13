import { useMemo, useState } from 'react'
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
}

const statusMapper = new StatusMapper()
const columns = statusMapper.getAvailableColumns()

export function Board({ bugs, stagedChanges, onBugMove, isLoading = false }: BoardProps) {
  const [activeBug, setActiveBug] = useState<BugzillaBug | null>(null)

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
            {columns.map((column) => (
              <Column
                key={column}
                column={column}
                bugs={isLoading ? [] : (bugsByColumn.get(column) ?? [])}
                stagedBugIds={stagedBugIds}
                isLoading={isLoading}
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
