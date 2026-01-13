export const NOBODY_EMAIL = 'nobody@mozilla.org'

/**
 * Format assignee email for display.
 * Shows "unassigned" for the default nobody@mozilla.org email.
 */
export function formatAssignee(email: string): string {
  if (email.toLowerCase() === NOBODY_EMAIL.toLowerCase()) {
    return 'unassigned'
  }
  return email
}
