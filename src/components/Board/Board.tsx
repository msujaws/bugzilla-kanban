import { useMemo } from 'react'
import { Column } from './Column'
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
  // Group bugs by column based on their status
  const bugsByColumn = useMemo(() => {
    const grouped = new Map<KanbanColumn, BugzillaBug[]>()

    // Initialize all columns with empty arrays
    for (const column of columns) {
      grouped.set(column, [])
    }

    // Distribute bugs to their columns
    for (const bug of bugs) {
      const column = statusMapper.statusToColumn(bug.status)
      const columnBugs = grouped.get(column) ?? []
      columnBugs.push(bug)
      grouped.set(column, columnBugs)
    }

    return grouped
  }, [bugs])

  // Get all staged bug IDs for highlighting
  const stagedBugIds = useMemo(() => {
    const ids = new Set<number>()
    for (const bugId of stagedChanges.keys()) {
      ids.add(bugId)
    }
    return ids
  }, [stagedChanges])

  return (
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
              onBugMove={onBugMove}
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
