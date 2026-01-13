import type { BugzillaBug } from './types'

/**
 * Number of milliseconds in 2 weeks (14 days)
 */
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000

/**
 * Check if a date string is within the past 2 weeks from now.
 */
export function isWithinTwoWeeks(dateString: string): boolean {
  const date = new Date(dateString)
  const now = new Date()
  const twoWeeksAgo = now.getTime() - TWO_WEEKS_MS

  return date.getTime() >= twoWeeksAgo
}

/**
 * Filter bugs to only include those with last_change_time within the past 2 weeks.
 * Does not mutate the original array.
 */
export function filterRecentBugs(bugs: BugzillaBug[]): BugzillaBug[] {
  if (bugs.length === 0) {
    return []
  }

  return bugs.filter((bug) => isWithinTwoWeeks(bug.last_change_time))
}
