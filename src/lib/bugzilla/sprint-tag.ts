/**
 * Sprint tag helpers for managing the [bzkanban-sprint] whiteboard tag
 */

export const SPRINT_TAG = '[bzkanban-sprint]'

/**
 * Check if whiteboard contains the sprint tag
 */
export function hasSprintTag(whiteboard: string): boolean {
  // Match the tag as a complete token, not as part of another tag
  // This regex matches [bzkanban-sprint] only when it's not followed by more tag characters
  const tagRegex = /\[bzkanban-sprint](?![^\s\]])/
  return tagRegex.test(whiteboard)
}

/**
 * Add sprint tag to whiteboard (if not already present)
 */
export function addSprintTag(whiteboard: string): string {
  const trimmed = whiteboard.trim()

  if (hasSprintTag(trimmed)) {
    return trimmed
  }

  if (trimmed === '') {
    return SPRINT_TAG
  }

  return `${trimmed} ${SPRINT_TAG}`
}

/**
 * Remove sprint tag from whiteboard
 */
export function removeSprintTag(whiteboard: string): string {
  if (!hasSprintTag(whiteboard)) {
    return whiteboard
  }

  // Remove all instances of the tag using split/join
  const withoutTag = whiteboard.split(SPRINT_TAG).join('')
  // Normalize multiple spaces to single space
  const normalizedSpaces = withoutTag.split(/\s+/).join(' ')
  const result = normalizedSpaces.trim()

  return result
}
