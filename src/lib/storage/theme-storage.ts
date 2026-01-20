/**
 * Storage for theme preference persistence
 * Theme is stored in plain text since it's not sensitive data
 */

const STORAGE_KEY = 'bugzilla_theme'

export type Theme = 'light' | 'dark'

/**
 * Save theme preference to localStorage
 */
export function saveTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme)
}

/**
 * Retrieve theme preference from localStorage
 * Returns 'dark' as default if no theme is stored or if data is invalid
 */
export function getTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)

  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  return 'dark'
}
