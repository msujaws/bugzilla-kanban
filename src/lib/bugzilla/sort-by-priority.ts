import type { BugzillaBug } from './types'

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
 * Compare two priority strings for sorting
 * Returns negative if a should come before b (higher priority)
 * Returns positive if a should come after b (lower priority)
 * Returns 0 if equal
 */
export function comparePriority(a: string, b: string): number {
  return getPriorityOrder(a) - getPriorityOrder(b)
}

/**
 * Sort an array of bugs by priority (highest priority first)
 * P1 > P2 > P3 > P4 > P5 > unknown
 * Does not mutate the original array
 */
export function sortByPriority(bugs: BugzillaBug[]): BugzillaBug[] {
  return [...bugs].sort((a, b) => comparePriority(a.priority, b.priority))
}
