import { describe, it, expect, beforeEach } from 'vitest'
import { saveTheme, getTheme, type Theme } from './theme-storage'

describe('theme-storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('saveTheme', () => {
    it('should save theme to localStorage', () => {
      saveTheme('light')

      const stored = localStorage.getItem('bugzilla_theme')
      expect(stored).toBe('light')
    })

    it('should overwrite existing theme', () => {
      saveTheme('light')
      saveTheme('dark')

      const stored = localStorage.getItem('bugzilla_theme')
      expect(stored).toBe('dark')
    })
  })

  describe('getTheme', () => {
    it('should return dark when no theme is stored (default)', () => {
      const theme = getTheme()
      expect(theme).toBe('dark')
    })

    it('should return stored light theme', () => {
      localStorage.setItem('bugzilla_theme', 'light')

      const theme = getTheme()
      expect(theme).toBe('light')
    })

    it('should return stored dark theme', () => {
      localStorage.setItem('bugzilla_theme', 'dark')

      const theme = getTheme()
      expect(theme).toBe('dark')
    })

    it('should return dark for invalid stored value', () => {
      localStorage.setItem('bugzilla_theme', 'invalid-theme')

      const theme = getTheme()
      expect(theme).toBe('dark')
    })
  })
})
