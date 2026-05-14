import { createFirefoxBetaVersion, type FirefoxBetaVersion } from '@/types/branded'
import { getCurrentBetaVersion, getEarliestBetaVersion } from './beta-version'

/** Sentinel values for the Nightly cycle filter dropdown. */
export const ALL_RELEASES = 'all' as const
export const UNSCHEDULED = 'unscheduled' as const

export type NightlyCycleFilter = FirefoxBetaVersion | typeof ALL_RELEASES | typeof UNSCHEDULED

const NIGHTLY_OFFSET_FROM_BETA = 1
const FUTURE_VERSIONS_TO_SHOW = 2
const MIN_VERSION = 100
const MAX_VERSION = 300

/**
 * Returns the current Firefox Nightly version for the given date.
 * Nightly is one version ahead of Beta. Returns undefined outside the schedule.
 */
export function getCurrentNightlyVersion(date: Date = new Date()): FirefoxBetaVersion | undefined {
  const beta = getCurrentBetaVersion(date)
  if (beta === undefined) {
    return undefined
  }
  return createFirefoxBetaVersion(beta + NIGHTLY_OFFSET_FROM_BETA)
}

/**
 * Returns the list of Nightly versions to display in the cycle-picker dropdown.
 * Spans from the earliest known Nightly (derived from the Beta schedule)
 * through the current Nightly plus two future versions. If `selectedVersion`
 * falls outside that range, it is included so the dropdown can show the
 * current selection.
 */
export function getNightlyVersionOptions(
  currentNightly?: FirefoxBetaVersion,
  selectedVersion?: FirefoxBetaVersion,
): FirefoxBetaVersion[] {
  const earliest = (getEarliestBetaVersion() as number) + NIGHTLY_OFFSET_FROM_BETA
  const upperFromCurrent =
    currentNightly === undefined ? earliest : (currentNightly as number) + FUTURE_VERSIONS_TO_SHOW
  const upperFromSelected = selectedVersion === undefined ? earliest : (selectedVersion as number)

  const lower = Math.max(MIN_VERSION, Math.min(earliest, upperFromSelected))
  const upper = Math.min(MAX_VERSION, Math.max(upperFromCurrent, upperFromSelected))

  const result: FirefoxBetaVersion[] = []
  for (let v = lower; v <= upper; v += 1) {
    result.push(createFirefoxBetaVersion(v))
  }
  return result
}

/**
 * Returns the iteration strings for a given Nightly cycle, e.g.
 * ['152.1', '152.2', '152.3']. Note: `.0` is not used.
 */
export function getIterationOptions(version: FirefoxBetaVersion): string[] {
  return [1, 2, 3].map((i) => `${String(version)}.${String(i)}`)
}

/**
 * Parses the leading integer version from an iteration string like '152.1'.
 * Returns undefined if the string is not recognizable.
 */
export function parseIterationVersion(iteration: string): number | undefined {
  const match = /^(\d+)\.\d+$/.exec(iteration)
  if (!match) {
    return undefined
  }
  return Number(match[1])
}

/** Type guard for the specific-version case of a NightlyCycleFilter. */
export function isCycleVersion(
  filter: NightlyCycleFilter | undefined,
): filter is FirefoxBetaVersion {
  return typeof filter === 'number'
}
