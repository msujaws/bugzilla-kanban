/* eslint-disable unicorn/no-null */
// Null is required for API state that can be absent (apiKey, validationError)

import type { StateCreator } from 'zustand'
import { ApiKeyStorage } from '@/lib/storage/api-key-storage'
import { BugzillaClient } from '@/lib/bugzilla/client'

const BUGZILLA_BASE_URL = 'https://bugzilla.mozilla.org/rest'

export interface AuthSlice {
  // State
  apiKey: string | null
  isValid: boolean
  isValidating: boolean
  validationError: string | null

  // Actions
  setApiKey: (apiKey: string) => Promise<void>
  clearApiKey: () => void
  loadApiKey: () => Promise<void>
  validateApiKey: () => Promise<boolean>
}

const storage = new ApiKeyStorage()

export const createAuthSlice: StateCreator<AuthSlice> = (set, get) => ({
  // Initial state
  apiKey: null,
  isValid: false,
  isValidating: false,
  validationError: null,

  // Set API key, save to storage, and validate
  setApiKey: async (apiKey: string) => {
    set({ apiKey, isValidating: true, validationError: null })

    try {
      // Save to encrypted storage
      await storage.saveApiKey(apiKey)

      // Validate by making a simple API call
      const client = new BugzillaClient(apiKey, BUGZILLA_BASE_URL)
      await client.getBugs({ status: ['NEW'] }) // Just test with one status

      set({ isValid: true, isValidating: false, validationError: null })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set({ isValid: false, isValidating: false, validationError: errorMessage })
    }
  },

  // Clear API key and reset validation state
  clearApiKey: () => {
    storage.clearApiKey()
    set({
      apiKey: null,
      isValid: false,
      isValidating: false,
      validationError: null,
    })
  },

  // Load API key from storage on init
  loadApiKey: async () => {
    try {
      const apiKey = await storage.getApiKey()

      if (!apiKey) {
        set({ apiKey: null, isValid: false })
        return
      }

      set({ apiKey, isValidating: true, validationError: null })

      // Validate the loaded key
      const client = new BugzillaClient(apiKey, BUGZILLA_BASE_URL)
      await client.getBugs({ status: ['NEW'] })

      set({ isValid: true, isValidating: false, validationError: null })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set({
        apiKey: null,
        isValid: false,
        isValidating: false,
        validationError: errorMessage,
      })
    }
  },

  // Validate current API key
  validateApiKey: async () => {
    const { apiKey } = get()

    if (!apiKey) {
      set({ isValid: false })
      return false
    }

    set({ isValidating: true, validationError: null })

    try {
      const client = new BugzillaClient(apiKey, BUGZILLA_BASE_URL)
      await client.getBugs({ status: ['NEW'] })

      set({ isValid: true, isValidating: false, validationError: null })
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set({ isValid: false, isValidating: false, validationError: errorMessage })
      return false
    }
  },
})
