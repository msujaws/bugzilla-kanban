import { createFirefoxBetaVersion, type FirefoxBetaVersion } from '@/types/branded'
import type { BugzillaBug, BugUpdate } from '@/lib/bugzilla/types'

interface BetaCycle {
  start: string
  end: string
  version: FirefoxBetaVersion
}

/**
 * Firefox release schedule: date ranges mapped to Beta channel version numbers.
 * Source: https://whattrainisitnow.com/calendar/
 */
const BETA_SCHEDULE: BetaCycle[] = [
  { start: '2026-02-25', end: '2026-03-24', version: createFirefoxBetaVersion(149) },
  { start: '2026-03-24', end: '2026-04-21', version: createFirefoxBetaVersion(150) },
  { start: '2026-04-21', end: '2026-05-19', version: createFirefoxBetaVersion(151) },
  { start: '2026-05-19', end: '2026-06-16', version: createFirefoxBetaVersion(152) },
  { start: '2026-06-16', end: '2026-07-21', version: createFirefoxBetaVersion(153) },
  { start: '2026-07-21', end: '2026-08-18', version: createFirefoxBetaVersion(154) },
  { start: '2026-08-18', end: '2026-09-15', version: createFirefoxBetaVersion(155) },
  { start: '2026-09-15', end: '2026-10-13', version: createFirefoxBetaVersion(156) },
  { start: '2026-10-13', end: '2026-11-10', version: createFirefoxBetaVersion(157) },
  { start: '2026-11-10', end: '2026-12-08', version: createFirefoxBetaVersion(158) },
  { start: '2026-12-08', end: '2027-01-19', version: createFirefoxBetaVersion(159) },
]

/**
 * Get the current Firefox Beta version based on the given date.
 * Returns undefined if the date falls outside the known schedule.
 */
export function getCurrentBetaVersion(date: Date = new Date()): FirefoxBetaVersion | undefined {
  const dateString = date.toISOString().slice(0, 10)

  for (const cycle of BETA_SCHEDULE) {
    if (dateString >= cycle.start && dateString < cycle.end) {
      return cycle.version
    }
  }

  return undefined
}

/** Returns the Bugzilla API field name for the status tracking flag. */
export function getBetaStatusField(version: FirefoxBetaVersion): string {
  return `cf_status_firefox${String(version)}`
}

/** Returns the Bugzilla API field name for the tracking flag. */
export function getBetaTrackingField(version: FirefoxBetaVersion): string {
  return `cf_tracking_firefox${String(version)}`
}

/** Returns the human-readable display name for the status flag. */
export function getBetaStatusDisplayName(version: FirefoxBetaVersion): string {
  return `status-firefox-${String(version)}`
}

/** Returns the human-readable display name for the tracking flag. */
export function getBetaTrackingDisplayName(version: FirefoxBetaVersion): string {
  return `tracking-firefox-${String(version)}`
}

/** Read the beta status flag value from a bug. */
export function getBugBetaStatus(
  bug: BugzillaBug,
  version: FirefoxBetaVersion,
): string | undefined {
  return bug[getBetaStatusField(version) as `cf_status_firefox${number}`]
}

/** Read the beta tracking flag value from a bug. */
export function getBugBetaTracking(
  bug: BugzillaBug,
  version: FirefoxBetaVersion,
): string | undefined {
  return bug[getBetaTrackingField(version) as `cf_tracking_firefox${number}`]
}

/** Set a dynamic tracking field on a BugUpdate. */
export function setBugUpdateField(update: BugUpdate, fieldName: string, value: string): void {
  ;(update as unknown as Record<string, unknown>)[fieldName] = value
}
