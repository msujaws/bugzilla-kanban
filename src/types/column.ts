// Kanban column type
export type { KanbanColumn } from '@/lib/bugzilla/status-mapper'

export const COLUMN_NAMES: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  'in-progress': 'In Progress',
  done: 'Done',
}
