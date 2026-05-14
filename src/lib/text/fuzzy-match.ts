/**
 * Computes the Levenshtein edit distance between two strings.
 * Uses a single-row dynamic-programming table for O(min(m,n)) space.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  // Make `a` the shorter string for smaller row allocation.
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a]
  const m = shorter.length
  const n = longer.length

  let previous: number[] = Array.from({ length: m + 1 }, (_, i) => i)
  let current: number[] = Array.from<number>({ length: m + 1 }).fill(0)

  for (let j = 1; j <= n; j += 1) {
    current[0] = j
    for (let i = 1; i <= m; i += 1) {
      const cost = shorter[i - 1] === longer[j - 1] ? 0 : 1
      const insertion = (current[i - 1] ?? 0) + 1
      const deletion = (previous[i] ?? 0) + 1
      const substitution = (previous[i - 1] ?? 0) + cost
      current[i] = Math.min(insertion, deletion, substitution)
    }
    ;[previous, current] = [current, previous]
  }

  return previous[m] ?? 0
}

/**
 * Returns the minimum Levenshtein distance between `token` and any length-N
 * window of `text` (where N = token.length).
 */
function minWindowDistance(text: string, token: string): number {
  if (token.length === 0) return 0
  if (token.length > text.length) {
    return levenshteinDistance(text, token)
  }

  let best = Number.POSITIVE_INFINITY
  for (let start = 0; start <= text.length - token.length; start += 1) {
    const window = text.slice(start, start + token.length)
    const distance = levenshteinDistance(window, token)
    if (distance < best) {
      best = distance
      if (best === 0) return 0
    }
  }
  return best
}

/**
 * Returns the maximum allowed Levenshtein distance for a token of the given
 * length. Short tokens (<4 chars) require an exact substring match.
 */
function thresholdFor(tokenLength: number): number {
  if (tokenLength < 4) return 0
  return Math.max(1, Math.floor(tokenLength / 4))
}

/**
 * Returns true when every whitespace-separated token in `query` either appears
 * as a substring of `text` or is within an edit-distance threshold (scaled by
 * token length) of some same-length window of `text`. Case-insensitive.
 */
export function fuzzyMatch(text: string, query: string): boolean {
  const trimmedQuery = query.trim()
  if (trimmedQuery === '') return true

  const haystack = text.toLowerCase()
  const tokens = trimmedQuery.toLowerCase().split(/\s+/)

  for (const token of tokens) {
    if (haystack.includes(token)) continue
    const threshold = thresholdFor(token.length)
    if (threshold === 0) return false
    if (minWindowDistance(haystack, token) > threshold) return false
  }

  return true
}
