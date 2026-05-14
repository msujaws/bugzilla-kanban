import type { FirefoxBetaVersion } from '@/types/branded'

/**
 * Mozilla products whose target_milestone uses the `mozilla<version>` prefix
 * (e.g., `mozilla152`) instead of the `Firefox <version>` prefix.
 */
export const MOZILLA_PREFIX_PRODUCTS: ReadonlySet<string> = new Set([
  'Core',
  'Toolkit',
  'NSPR',
  'NSS',
  'External Software Affecting Firefox',
])

/**
 * Returns the appropriate `target_milestone` string for a bug in the given
 * product. Mozilla suite-core products use `mozilla152`; everything else uses
 * `Firefox 152`.
 */
export function formatTargetMilestone(version: FirefoxBetaVersion, product?: string): string {
  if (product !== undefined && MOZILLA_PREFIX_PRODUCTS.has(product)) {
    return `mozilla${String(version)}`
  }
  return `Firefox ${String(version)}`
}

/** Bugzilla's sentinel for an empty/unset target_milestone. */
export const BLANK_MILESTONE = '---'

/**
 * Returns the candidate milestone strings to send in a Bugzilla query when
 * filtering by a specific cycle. Mozilla products use several conventions:
 *   - `Firefox 152` (Firefox product)
 *   - `mozilla152` (Core, Toolkit, NSPR, NSS, …)
 *   - `152 Branch` (Toolkit and some others)
 * All three forms are returned so the query matches bugs from any product.
 */
export function getMilestoneCandidatesForCycle(version: FirefoxBetaVersion): string[] {
  return [`Firefox ${String(version)}`, `mozilla${String(version)}`, `${String(version)} Branch`]
}

/**
 * Returns true when the given milestone string strictly identifies the given
 * cycle, regardless of which naming convention was used. The blank sentinel
 * does NOT match — it's only included in queries for discoverability.
 */
export function matchesCycle(milestone: string | undefined, version: FirefoxBetaVersion): boolean {
  if (!milestone || milestone === BLANK_MILESTONE) {
    return false
  }
  return getMilestoneCandidatesForCycle(version).includes(milestone)
}
