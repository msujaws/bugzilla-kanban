/**
 * Branded Types
 *
 * These types use TypeScript's structural typing system to create distinct types
 * from primitives. This prevents accidentally swapping arguments of the same
 * underlying type (e.g., passing a URL where an API key is expected).
 *
 * Example:
 *   const apiKey = createApiKey('my-key')
 *   const url = createBugzillaBaseUrl('https://bugzilla.mozilla.org/rest')
 *   new BugzillaClient(url, apiKey) // TypeScript ERROR! Arguments swapped
 *   new BugzillaClient(apiKey, url) // OK
 */

// Brand symbol for type uniqueness
declare const brand: unique symbol

// Generic branded type helper
type Brand<T, TBrand extends string> = T & { readonly [brand]: TBrand }

// ============================================================================
// API Key
// ============================================================================

/**
 * A Bugzilla API key for authentication.
 * Create with `createApiKey()`.
 */
export type ApiKey = Brand<string, 'ApiKey'>

// Bugzilla API keys are alphanumeric with possible underscores/dashes
const API_KEY_PATTERN = /^[\w-]+$/
const API_KEY_MIN_LENGTH = 10

/**
 * Create a branded ApiKey from a string.
 * Validates that the key is non-empty and matches expected format.
 */
export function createApiKey(key: string): ApiKey {
  const trimmed = key.trim()
  if (trimmed.length === 0) {
    throw new Error('API key cannot be empty')
  }
  if (trimmed.length < API_KEY_MIN_LENGTH) {
    throw new Error(`API key must be at least ${String(API_KEY_MIN_LENGTH)} characters`)
  }
  if (!API_KEY_PATTERN.test(trimmed)) {
    throw new Error('API key contains invalid characters')
  }
  return trimmed as ApiKey
}

/**
 * Safely attempt to create an ApiKey, returning undefined if invalid.
 */
export function tryCreateApiKey(key: string | undefined | null): ApiKey | undefined {
  if (!key) {
    return undefined
  }
  try {
    return createApiKey(key)
  } catch {
    return undefined
  }
}

// ============================================================================
// Bugzilla Base URL
// ============================================================================

/**
 * A Bugzilla REST API base URL.
 * Create with `createBugzillaBaseUrl()`.
 */
export type BugzillaBaseUrl = Brand<string, 'BugzillaBaseUrl'>

/** Default Bugzilla base URL - uses proxy to avoid CORS issues */
export const DEFAULT_BUGZILLA_URL = '/api/bugzilla' as BugzillaBaseUrl

/**
 * Create a branded BugzillaBaseUrl from a string.
 * Validates that the URL is valid (absolute or relative path starting with /).
 */
export function createBugzillaBaseUrl(url: string): BugzillaBaseUrl {
  const trimmed = url.trim()

  // Allow relative paths starting with /
  if (trimmed.startsWith('/')) {
    const normalized = trimmed.replace(/\/+$/, '')
    return normalized as BugzillaBaseUrl
  }

  // Validate absolute URL format
  try {
    new URL(trimmed)
  } catch {
    throw new Error(`Invalid URL: ${trimmed}`)
  }
  // Remove trailing slash for consistency
  const normalized = trimmed.replace(/\/+$/, '')
  return normalized as BugzillaBaseUrl
}

// ============================================================================
// Bug ID
// ============================================================================

/**
 * A Bugzilla bug ID.
 * Create with `createBugId()`.
 */
export type BugId = Brand<number, 'BugId'>

/**
 * Create a branded BugId from a number.
 * Validates that the ID is a positive integer.
 */
export function createBugId(id: number): BugId {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`Invalid bug ID: ${String(id)}. Must be a positive integer.`)
  }
  return id as BugId
}

/**
 * Safely attempt to create a BugId, returning undefined if invalid.
 */
export function tryCreateBugId(id: number | undefined | null): BugId | undefined {
  if (id === undefined || id === null) {
    return undefined
  }
  try {
    return createBugId(id)
  } catch {
    return undefined
  }
}
