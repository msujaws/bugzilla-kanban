import type { BugzillaBug } from './types'
import type { KanbanColumn } from './status-mapper'
import { StatusMapper } from './status-mapper'

const statusMapper = new StatusMapper()

/**
 * Check if bug has qe-verify flag with + status (verified by QE)
 */
export function hasQeVerifyFlag(bug: BugzillaBug): boolean {
  return bug.flags?.some((flag) => flag.name === 'qe-verify' && flag.status === '+') ?? false
}

/**
 * Determine which column a bug belongs to.
 * Special case: RESOLVED + FIXED + qe-verify+ goes to in-testing
 */
export function assignBugToColumn(bug: BugzillaBug): KanbanColumn {
  // Special case for in-testing column:
  // Bug must be RESOLVED with FIXED resolution AND have qe-verify+ flag
  if (bug.status === 'RESOLVED' && bug.resolution === 'FIXED' && hasQeVerifyFlag(bug)) {
    return 'in-testing'
  }

  // Fall back to standard status mapping
  return statusMapper.statusToColumn(bug.status)
}
