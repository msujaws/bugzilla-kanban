import { useMemo } from 'react'
import type { BugzillaBug } from '@/lib/bugzilla/types'

export interface Assignee {
  email: string
  displayName: string
  count: number
}

/**
 * Extracts unique assignees from bugs, sorted by frequency
 * @param bugs - Array of bugs to extract assignees from
 * @returns Array of unique assignees sorted by count (descending)
 */
export function getBoardAssignees(bugs: BugzillaBug[]): Assignee[] {
  const assigneeMap = new Map<string, { displayName: string; count: number }>()

  for (const bug of bugs) {
    const email = bug.assigned_to
    const existing = assigneeMap.get(email)

    if (existing) {
      existing.count++
      // Update displayName if we found a better one (real_name)
      if (existing.displayName === email && bug.assigned_to_detail?.real_name) {
        existing.displayName = bug.assigned_to_detail.real_name
      }
    } else {
      const displayName = bug.assigned_to_detail?.real_name || email
      assigneeMap.set(email, { displayName, count: 1 })
    }
  }

  // Convert to array and sort by count (descending)
  const assignees: Assignee[] = []
  for (const [email, data] of assigneeMap) {
    assignees.push({
      email,
      displayName: data.displayName,
      count: data.count,
    })
  }

  return assignees.sort((a, b) => b.count - a.count)
}

/**
 * React hook that returns unique assignees from bugs, sorted by frequency
 * @param bugs - Array of bugs to extract assignees from
 * @returns Memoized array of unique assignees
 */
export function useBoardAssignees(bugs: BugzillaBug[]): Assignee[] {
  return useMemo(() => getBoardAssignees(bugs), [bugs])
}
