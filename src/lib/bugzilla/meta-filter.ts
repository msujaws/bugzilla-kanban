import type { BugzillaBug } from './types'

/**
 * Check if a bug is a meta bug.
 * Meta bugs are identified by:
 * - Having "meta" in their keywords array
 * - Having "[meta]" in their whiteboard
 */
export function isMetaBug(bug: BugzillaBug): boolean {
  // Check keywords array for 'meta'
  if (bug.keywords?.some((kw) => kw.toLowerCase() === 'meta')) {
    return true
  }

  // Check whiteboard for [meta] (case insensitive)
  if (bug.whiteboard.toLowerCase().includes('[meta]')) {
    return true
  }

  return false
}

/**
 * Filter out meta bugs from the list if excludeMeta is true.
 */
export function filterMetaBugs(bugs: BugzillaBug[], excludeMeta: boolean): BugzillaBug[] {
  if (!excludeMeta) {
    return bugs
  }
  return bugs.filter((bug) => !isMetaBug(bug))
}
