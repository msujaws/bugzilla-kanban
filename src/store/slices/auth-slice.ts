/* eslint-disable unicorn/no-null */
// Null is required for API state that can be absent (apiKey, validationError)

import type { StateCreator } from 'zustand'
import { ApiKeyStorage } from '@/lib/storage/api-key-storage'
import { BugzillaClient } from '@/lib/bugzilla/client'
import type { ApiKey } from '@/types/branded'
import { createApiKey, DEFAULT_BUGZILLA_URL } from '@/types/branded'

export interface AuthSlice {
  // State
  apiKey: ApiKey | null
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
  setApiKey: async (apiKeyString: string) => {
    let apiKey: ApiKey
    try {
      apiKey = createApiKey(apiKeyString)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid API key'
      set({ isValid: false, isValidating: false, validationError: errorMessage })
      return
    }

    set({ apiKey, isValidating: true, validationError: null })

    try {
      // Save to encrypted storage
      await storage.saveApiKey(apiKey)

      // Validate by making a simple API call with limit to avoid large responses
      const client = new BugzillaClient(apiKey, DEFAULT_BUGZILLA_URL)
      await client.getBugs({ status: ['NEW'], limit: 1 })

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
      const apiKeyString = await storage.getApiKey()

      if (!apiKeyString) {
        set({ apiKey: null, isValid: false })
        return
      }

      const apiKey = createApiKey(apiKeyString)
      set({ apiKey, isValidating: true, validationError: null })

      // Validate the loaded key with limit to avoid large responses
      const client = new BugzillaClient(apiKey, DEFAULT_BUGZILLA_URL)
      await client.getBugs({ status: ['NEW'], limit: 1 })

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
      const client = new BugzillaClient(apiKey, DEFAULT_BUGZILLA_URL)
      await client.getBugs({ status: ['NEW'], limit: 1 })

      set({ isValid: true, isValidating: false, validationError: null })
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set({ isValid: false, isValidating: false, validationError: errorMessage })
      return false
    }
  },
})
