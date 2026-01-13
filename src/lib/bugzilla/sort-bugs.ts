import type { BugzillaBug } from './types'

/**
 * Sort order for bugs
 */
export type SortOrder = 'priority' | 'lastChanged'

/**
 * Priority order map: lower number = higher priority
 * P1 is highest priority, P5 is lowest
 * Unknown priorities are treated as lowest (999)
 */
const PRIORITY_ORDER: Record<string, number> = {
  P1: 1,
  P2: 2,
  P3: 3,
  P4: 4,
  P5: 5,
}

/**
 * Value used for unknown priorities (ensures they sort to end)
 */
const UNKNOWN_PRIORITY_ORDER = 999

/**
 * Get the numeric order value for a priority string
 */
function getPriorityOrder(priority: string): number {
  return PRIORITY_ORDER[priority] ?? UNKNOWN_PRIORITY_ORDER
}

/**
 * Compare two bugs by priority (P1 = highest)
 */
function compareByPriority(a: BugzillaBug, b: BugzillaBug): number {
  return getPriorityOrder(a.priority) - getPriorityOrder(b.priority)
}

/**
 * Compare two bugs by last_change_time (most recent first)
 */
function compareByLastChanged(a: BugzillaBug, b: BugzillaBug): number {
  const timeA = new Date(a.last_change_time).getTime()
  const timeB = new Date(b.last_change_time).getTime()
  return timeB - timeA // Descending order (most recent first)
}

/**
 * Sort an array of bugs by the specified order.
 * Does not mutate the original array.
 */
export function sortBugs(bugs: BugzillaBug[], order: SortOrder): BugzillaBug[] {
  if (bugs.length === 0) {
    return []
  }

  const compareFn = order === 'priority' ? compareByPriority : compareByLastChanged
  return [...bugs].sort(compareFn)
}
