/**
 * Maps Bugzilla bug statuses to Kanban board columns
 * Based on Mozilla Bugzilla workflow
 */

export type KanbanColumn = 'backlog' | 'todo' | 'in-progress' | 'done'

type StatusMapping = Record<KanbanColumn, string[]>

const DEFAULT_STATUS_MAPPING: StatusMapping = {
  backlog: ['UNCONFIRMED', 'NEW'],
  todo: ['ASSIGNED'],
  'in-progress': ['IN_PROGRESS'],
  done: ['RESOLVED', 'VERIFIED', 'CLOSED'],
}

// Reverse mapping: status -> column
const REVERSE_MAPPING: Record<string, KanbanColumn> = {}
for (const [column, statuses] of Object.entries(DEFAULT_STATUS_MAPPING)) {
  for (const status of statuses) {
    REVERSE_MAPPING[status.toUpperCase()] = column as KanbanColumn
  }
}

// Column -> default status for updates
const COLUMN_TO_STATUS: Record<KanbanColumn, string> = {
  backlog: 'NEW',
  todo: 'ASSIGNED',
  'in-progress': 'IN_PROGRESS',
  done: 'RESOLVED',
}

export class StatusMapper {
  /**
   * Map a Bugzilla status to a Kanban column
   */
  statusToColumn(status: string): KanbanColumn {
    const normalizedStatus = status.toUpperCase()
    return REVERSE_MAPPING[normalizedStatus] ?? 'backlog'
  }

  /**
   * Map a Kanban column to the default Bugzilla status for that column
   */
  columnToStatus(column: string): string {
    const status = COLUMN_TO_STATUS[column as KanbanColumn]

    if (!status) {
      throw new Error(`Unknown column: ${column}`)
    }

    return status
  }

  /**
   * Get all available Kanban columns
   */
  getAvailableColumns(): KanbanColumn[] {
    return ['backlog', 'todo', 'in-progress', 'done']
  }

  /**
   * Get all Bugzilla statuses that map to a specific column
   */
  getStatusesForColumn(column: string): string[] {
    if (!this.isValidColumn(column)) {
      return []
    }
    const statuses = DEFAULT_STATUS_MAPPING[column]
    return [...statuses]
  }

  /**
   * Check if a column name is valid
   */
  isValidColumn(column: string): column is KanbanColumn {
    return Object.keys(COLUMN_TO_STATUS).includes(column)
  }
}
