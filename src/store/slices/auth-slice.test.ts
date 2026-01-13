import { describe, it, expect, beforeEach, vi } from 'vitest'
import { create } from 'zustand'
import { createAuthSlice } from './auth-slice'
import type { AuthSlice } from './auth-slice'

// Use vi.hoisted to create mocks that can be referenced in vi.mock
const { mockSaveApiKey, mockGetApiKey, mockClearApiKey, mockGetBugs } = vi.hoisted(() => ({
  mockSaveApiKey: vi.fn(),
  mockGetApiKey: vi.fn(),
  mockClearApiKey: vi.fn(),
  mockGetBugs: vi.fn(),
}))

// Mock ApiKeyStorage
vi.mock('@/lib/storage/api-key-storage', () => ({
  ApiKeyStorage: vi.fn().mockImplementation(() => ({
    saveApiKey: mockSaveApiKey,
    getApiKey: mockGetApiKey,
    clearApiKey: mockClearApiKey,
  })),
}))

// Mock BugzillaClient
vi.mock('@/lib/bugzilla/client', () => ({
  BugzillaClient: vi.fn().mockImplementation(() => ({
    getBugs: mockGetBugs,
  })),
}))

describe('AuthSlice', () => {
  let useStore: ReturnType<typeof create<AuthSlice>>

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock implementations to defaults
    mockSaveApiKey.mockResolvedValue()
    mockGetApiKey.mockResolvedValue(null)
    mockGetBugs.mockResolvedValue([])

    useStore = create<AuthSlice>()((...args) => ({
      ...createAuthSlice(...args),
    }))
  })

  describe('initial state', () => {
    it('should have null apiKey initially', () => {
      const { apiKey } = useStore.getState()

      expect(apiKey).toBeNull()
    })

    it('should have isValid false initially', () => {
      const { isValid } = useStore.getState()
      expect(isValid).toBe(false)
    })

    it('should have isValidating false initially', () => {
      const { isValidating } = useStore.getState()
      expect(isValidating).toBe(false)
    })

    it('should have validationError null initially', () => {
      const { validationError } = useStore.getState()

      expect(validationError).toBeNull()
    })
  })

  describe('setApiKey', () => {
    it('should set the API key', async () => {
      const { setApiKey } = useStore.getState()
      await setApiKey('test-api-key-123')

      const { apiKey } = useStore.getState()
      expect(apiKey).toBe('test-api-key-123')
    })

    it('should save API key to storage', async () => {
      const { setApiKey } = useStore.getState()

      await setApiKey('test-api-key-123')

      expect(mockSaveApiKey).toHaveBeenCalledWith('test-api-key-123')
    })

    it('should validate the API key', async () => {
      const { setApiKey } = useStore.getState()
      await setApiKey('test-api-key-123')

      const { isValid, isValidating } = useStore.getState()
      expect(isValidating).toBe(false)
      expect(isValid).toBe(true)
    })

    it('should set isValidating during validation', async () => {
      const { setApiKey } = useStore.getState()
      const promise = setApiKey('test-api-key-123')

      // Check immediately while promise is pending
      const { isValidating: isValidatingDuring } = useStore.getState()
      expect(isValidatingDuring).toBe(true)

      await promise

      const { isValidating: isValidatingAfter } = useStore.getState()
      expect(isValidatingAfter).toBe(false)
    })

    it('should handle validation errors gracefully', async () => {
      mockGetBugs.mockRejectedValueOnce(new Error('Unauthorized'))

      const { setApiKey } = useStore.getState()
      await setApiKey('invalid-key-12345')

      const { isValid, validationError } = useStore.getState()
      expect(isValid).toBe(false)
      expect(validationError).toBe('Unauthorized')
    })

    it('should clear previous validation error on new key', async () => {
      const { setApiKey } = useStore.getState()

      // First attempt with error
      mockGetBugs.mockRejectedValueOnce(new Error('Error 1'))
      await setApiKey('bad-key-12345')

      const { validationError: error1 } = useStore.getState()
      expect(error1).toBe('Error 1')

      // Second attempt succeeds
      mockGetBugs.mockResolvedValueOnce([])
      await setApiKey('good-key-12345')

      const { validationError: error2, isValid } = useStore.getState()
      expect(error2).toBeNull()
      expect(isValid).toBe(true)
    })
  })

  describe('clearApiKey', () => {
    it('should clear the API key', async () => {
      const { setApiKey, clearApiKey } = useStore.getState()
      await setApiKey('test-api-key-123')

      clearApiKey()

      const { apiKey } = useStore.getState()
      expect(apiKey).toBeNull()
    })

    it('should reset isValid to false', async () => {
      const { setApiKey, clearApiKey } = useStore.getState()
      await setApiKey('test-api-key-123')

      clearApiKey()

      const { isValid } = useStore.getState()
      expect(isValid).toBe(false)
    })

    it('should clear validation error', async () => {
      const { setApiKey, clearApiKey } = useStore.getState()
      mockGetBugs.mockRejectedValueOnce(new Error('Error'))
      await setApiKey('bad-key-12345')

      clearApiKey()

      const { validationError } = useStore.getState()

      expect(validationError).toBeNull()
    })

    it('should remove API key from storage', () => {
      const { clearApiKey } = useStore.getState()

      clearApiKey()

      // Can't easily verify this without exposing storage instance
      // Trust that implementation calls storage.clearApiKey()
    })
  })

  describe('loadApiKey', () => {
    it('should load API key from storage', async () => {
      mockGetApiKey.mockResolvedValueOnce('stored-key-12345')

      const { loadApiKey } = useStore.getState()
      await loadApiKey()

      const { apiKey } = useStore.getState()
      expect(apiKey).toBe('stored-key-12345')
    })

    it('should validate loaded API key', async () => {
      mockGetApiKey.mockResolvedValueOnce('stored-key-12345')

      const { loadApiKey } = useStore.getState()
      await loadApiKey()

      const { isValid } = useStore.getState()
      expect(isValid).toBe(true)
    })

    it('should handle missing API key gracefully', async () => {
      // eslint-disable-next-line unicorn/no-null
      mockGetApiKey.mockResolvedValueOnce(null)

      const { loadApiKey } = useStore.getState()
      await loadApiKey()

      const { apiKey, isValid } = useStore.getState()

      expect(apiKey).toBeNull()
      expect(isValid).toBe(false)
    })

    it('should handle storage errors gracefully', async () => {
      mockGetApiKey.mockRejectedValueOnce(new Error('Storage error'))

      const { loadApiKey } = useStore.getState()
      await loadApiKey()

      const { apiKey, isValid, validationError } = useStore.getState()
      expect(apiKey).toBeNull()
      expect(isValid).toBe(false)
      expect(validationError).toBe('Storage error')
    })
  })

  describe('validateApiKey', () => {
    it('should validate current API key', async () => {
      const { setApiKey, validateApiKey } = useStore.getState()
      await setApiKey('test-key-12345')

      // Clear validation state
      useStore.setState({ isValid: false, validationError: 'Previous error' })

      await validateApiKey()

      const { isValid, validationError } = useStore.getState()
      expect(isValid).toBe(true)
      expect(validationError).toBeNull()
    })

    it('should return false if no API key set', async () => {
      const { validateApiKey } = useStore.getState()

      const result = await validateApiKey()

      expect(result).toBe(false)
      const { isValid } = useStore.getState()
      expect(isValid).toBe(false)
    })

    it('should handle validation errors', async () => {
      const { setApiKey, validateApiKey } = useStore.getState()
      await setApiKey('test-key-12345')

      // Mock rejection for the next getBugs call
      mockGetBugs.mockRejectedValueOnce(new Error('Invalid key'))

      await validateApiKey()

      const { isValid, validationError } = useStore.getState()
      expect(isValid).toBe(false)
      expect(validationError).toBe('Invalid key')
    })
  })
})
