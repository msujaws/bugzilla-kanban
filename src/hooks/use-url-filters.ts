import { useCallback, useMemo } from 'react'
import type { SortOrder } from '@/lib/bugzilla/sort-bugs'

/**
 * Filter configuration from URL
 */
export interface UrlFilters {
  whiteboardTag: string
  component: string
  sortOrder: SortOrder
}

/**
 * Default filter values
 */
const DEFAULT_FILTERS: UrlFilters = {
  whiteboardTag: '',
  component: '',
  sortOrder: 'priority',
}

/**
 * URL parameter names
 */
const URL_PARAMS = {
  whiteboard: 'whiteboard',
  component: 'component',
  sort: 'sort',
} as const

/**
 * Valid sort order values
 */
const VALID_SORT_ORDERS = new Set<SortOrder>(['priority', 'lastChanged'])

/**
 * Maximum length for URL filter parameters (security measure)
 */
const MAX_PARAM_LENGTH = 200

/**
 * Sanitize a URL parameter value by truncating to max length
 */
function sanitizeParam(value: string | null): string {
  if (!value) return ''
  return value.slice(0, MAX_PARAM_LENGTH)
}

/**
 * Parse filters from URL search params
 */
function parseFiltersFromUrl(): UrlFilters {
  const params = new URLSearchParams(window.location.search)

  // Sanitize string params to prevent excessively long values
  const whiteboardTag = sanitizeParam(params.get(URL_PARAMS.whiteboard))
  const component = sanitizeParam(params.get(URL_PARAMS.component))
  const sortParam = params.get(URL_PARAMS.sort)
  const sortOrder: SortOrder = VALID_SORT_ORDERS.has(sortParam as SortOrder)
    ? (sortParam as SortOrder)
    : 'priority'

  return {
    whiteboardTag,
    component,
    sortOrder,
  }
}

/**
 * Check if URL has any filter params
 */
function hasFiltersInUrl(): boolean {
  const params = new URLSearchParams(window.location.search)
  return (
    params.has(URL_PARAMS.whiteboard) ||
    params.has(URL_PARAMS.component) ||
    params.has(URL_PARAMS.sort)
  )
}

/**
 * Hook for reading and writing filters to URL
 */
export function useUrlFilters() {
  // Read initial filters from URL (only computed once on mount)
  const initialFilters = useMemo(() => parseFiltersFromUrl(), [])
  const hasUrlFilters = useMemo(() => hasFiltersInUrl(), [])

  // Update URL with new filters
  const updateUrl = useCallback((filters: UrlFilters) => {
    const params = new URLSearchParams()

    // Only add non-default values to URL
    if (filters.whiteboardTag !== DEFAULT_FILTERS.whiteboardTag) {
      params.set(URL_PARAMS.whiteboard, filters.whiteboardTag)
    }
    if (filters.component !== DEFAULT_FILTERS.component) {
      params.set(URL_PARAMS.component, filters.component)
    }
    if (filters.sortOrder !== DEFAULT_FILTERS.sortOrder) {
      params.set(URL_PARAMS.sort, filters.sortOrder)
    }

    // Build new URL
    const queryString = params.toString()
    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname

    // Update URL without navigation
    window.history.replaceState({}, '', newUrl)
  }, [])

  return {
    initialFilters,
    hasUrlFilters,
    updateUrl,
  }
}
