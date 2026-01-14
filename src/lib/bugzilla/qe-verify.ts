import type { BugzillaFlag } from './types'

export type QeVerifyStatus = 'unknown' | 'minus' | 'plus'

/**
 * Get the qe-verify status from a bug's flags array
 *
 * @param flags - Array of flags from a BugzillaBug
 * @returns The qe-verify status: 'unknown' (no flag or '?'), 'minus' ('-'), or 'plus' ('+')
 */
export function getQeVerifyStatus(flags: BugzillaFlag[] | undefined): QeVerifyStatus {
  if (!flags || flags.length === 0) return 'unknown'

  const qeVerifyFlag = flags.find((f) => f.name === 'qe-verify')
  if (!qeVerifyFlag || qeVerifyFlag.status === '?') return 'unknown'
  if (qeVerifyFlag.status === '-') return 'minus'
  if (qeVerifyFlag.status === '+') return 'plus'

  return 'unknown'
}
