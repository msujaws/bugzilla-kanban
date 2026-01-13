import type { BugzillaBug } from './types'
import type { KanbanColumn } from './status-mapper'
import { hasSprintTag } from './sprint-tag'

/**
 * Check if bug has qe-verify flag with + status (verified by QE)
 */
export function hasQeVerifyFlag(bug: BugzillaBug): boolean {
  return bug.flags?.some((flag) => flag.name === 'qe-verify' && flag.status === '+') ?? false
}

/**
 * Determine which column a bug belongs to.
 *
 * Column assignment logic:
 * - ASSIGNED status → in-progress (regardless of whiteboard)
 * - RESOLVED + FIXED + qe-verify+ → in-testing
 * - RESOLVED/VERIFIED/CLOSED → done
 * - NEW/UNCONFIRMED + [bzkanban-sprint] tag → todo
 * - NEW/UNCONFIRMED without sprint tag → backlog
 */
export function assignBugToColumn(bug: BugzillaBug): KanbanColumn {
  // ASSIGNED always goes to in-progress (regardless of whiteboard tag)
  if (bug.status === 'ASSIGNED') {
    return 'in-progress'
  }

  // Special case for in-testing column:
  // Bug must be RESOLVED with FIXED resolution AND have qe-verify+ flag
  if (bug.status === 'RESOLVED' && bug.resolution === 'FIXED' && hasQeVerifyFlag(bug)) {
    return 'in-testing'
  }

  // Done statuses
  if (['RESOLVED', 'VERIFIED', 'CLOSED'].includes(bug.status)) {
    return 'done'
  }

  // IN_PROGRESS goes to in-progress column
  if (bug.status === 'IN_PROGRESS') {
    return 'in-progress'
  }

  // NEW/UNCONFIRMED with sprint tag goes to todo
  if (['NEW', 'UNCONFIRMED'].includes(bug.status) && hasSprintTag(bug.whiteboard)) {
    return 'todo'
  }

  // Everything else (NEW/UNCONFIRMED without sprint tag, unknown statuses) is backlog
  return 'backlog'
}
