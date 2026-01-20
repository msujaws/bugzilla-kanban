/**
 * Storage for Bugzilla filter persistence
 * Filters are stored in plain text since they're not sensitive data
 */

import type { SortOrder } from '@/lib/bugzilla/sort-bugs'

const STORAGE_KEY = 'bugzilla_filters'

/**
 * Filter values to persist
 */
export interface StoredFilters {
  whiteboardTag: string
  component: string
  sortOrder: SortOrder
}

/**
 * Validate that an object has the expected filter shape
 */
function isValidFilters(value: unknown): value is StoredFilters {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>
  return (
    typeof obj.whiteboardTag === 'string' &&
    typeof obj.component === 'string' &&
    (obj.sortOrder === 'priority' || obj.sortOrder === 'lastChanged')
  )
}

/**
 * Save filters to localStorage
 */
export function saveFilters(filters: StoredFilters): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
}

/**
 * Retrieve filters from localStorage
 * Returns undefined if no filters are stored or if data is invalid
 */
export function getFilters(): StoredFilters | undefined {
  const stored = localStorage.getItem(STORAGE_KEY)

  if (!stored) {
    return undefined
  }

  try {
    const parsed: unknown = JSON.parse(stored)
    if (isValidFilters(parsed)) {
      return parsed
    }
    return undefined
  } catch {
    // Invalid JSON
    return undefined
  }
}

/**
 * Remove filters from localStorage
 */
export function clearFilters(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Check if valid filters exist in localStorage
 */
export function hasFilters(): boolean {
  return getFilters() !== undefined
}
