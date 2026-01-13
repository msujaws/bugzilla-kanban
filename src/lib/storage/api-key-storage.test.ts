import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { ApiKeyStorage, type Storage } from './api-key-storage'

// Debug logging for CI - TODO: remove after debugging
const DEBUG = true
const log = (...args: unknown[]) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- DEBUG may change
  if (DEBUG) {
    console.log('[ApiKeyStorage Test]', ...args)
  }
}

describe('ApiKeyStorage', () => {
  let storage: ApiKeyStorage
  let mockStorageData: Record<string, string>
  let mockStorage: Storage
  const testKeyMaterial = 'test-key-material-for-encryption'

  beforeAll(() => {
    // Log environment info - eslint disabled for debug logging
    /* eslint-disable @typescript-eslint/no-unnecessary-condition */
    log('=== Environment Info ===')
    log('crypto available:', typeof crypto !== 'undefined')
    log('crypto.subtle available:', typeof crypto?.subtle !== 'undefined')
    log('globalThis.crypto available:', typeof globalThis.crypto !== 'undefined')
    log('globalThis.crypto.subtle available:', typeof globalThis.crypto?.subtle !== 'undefined')
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      log('crypto.subtle methods:', Object.keys(crypto.subtle))
    }
    log('========================')
    /* eslint-enable @typescript-eslint/no-unnecessary-condition */
  })

  beforeEach(() => {
    // Create in-memory storage mock (no global stubbing needed)
    mockStorageData = {}
    mockStorage = {
      getItem: (key: string) => {
        const value = mockStorageData[key]
        // eslint-disable-next-line unicorn/no-null -- localStorage API returns null
        const result = value ?? null
        log(`mockStorage.getItem('${key}'):`, value ? `${value.slice(0, 50)}...` : 'null')
        return result
      },
      setItem: (key: string, value: string) => {
        log(`mockStorage.setItem('${key}'):`, value.slice(0, 50) + '...')
        mockStorageData[key] = value
      },
      removeItem: (key: string) => {
        log(`mockStorage.removeItem('${key}')`)
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete mockStorageData[key]
      },
    }

    // Inject both key material and storage for deterministic testing
    storage = new ApiKeyStorage({
      keyMaterial: testKeyMaterial,
      storage: mockStorage,
    })
    log('Created new ApiKeyStorage instance with keyMaterial:', testKeyMaterial)
  })

  describe('saveApiKey', () => {
    it('should save API key to localStorage', async () => {
      const apiKey = 'test-api-key-123'

      await storage.saveApiKey(apiKey)

      const savedValue = mockStorageData['bugzilla_api_key']
      expect(savedValue).toBeDefined()
      expect(savedValue).not.toBe(apiKey) // Should be encrypted
    })

    it('should save different encrypted values for same key on multiple saves', async () => {
      const apiKey = 'test-api-key-123'

      await storage.saveApiKey(apiKey)
      const firstSave = mockStorageData['bugzilla_api_key']

      await storage.saveApiKey(apiKey)
      const secondSave = mockStorageData['bugzilla_api_key']

      // Should have different encrypted values due to random IV
      expect(firstSave).not.toBe(secondSave)
    })

    it('should handle empty API key', async () => {
      await storage.saveApiKey('')

      expect(mockStorageData['bugzilla_api_key']).toBeDefined()
    })
  })

  describe('getApiKey', () => {
    it('should retrieve and decrypt saved API key', async () => {
      const apiKey = 'test-api-key-456'

      log('--- Test: should retrieve and decrypt saved API key ---')
      log('Input apiKey:', apiKey)

      try {
        log('Calling saveApiKey...')
        await storage.saveApiKey(apiKey)
        log('saveApiKey completed, mockStorageData:', JSON.stringify(mockStorageData))
      } catch (error) {
        log('saveApiKey FAILED with error:', error)
        throw error
      }

      try {
        log('Calling getApiKey...')
        const retrieved = await storage.getApiKey()
        log('getApiKey returned:', retrieved)
        log('Expected:', apiKey)
        log('Match:', retrieved === apiKey)

        expect(retrieved).toBe(apiKey)
      } catch (error) {
        log('getApiKey FAILED with error:', error)
        throw error
      }
    })

    it('should return undefined when no API key is stored', async () => {
      const retrieved = await storage.getApiKey()

      expect(retrieved).toBeUndefined()
    })

    it('should return undefined when localStorage value is invalid', async () => {
      mockStorageData['bugzilla_api_key'] = 'invalid-encrypted-data'

      const retrieved = await storage.getApiKey()

      expect(retrieved).toBeUndefined()
    })

    it('should handle decryption errors gracefully', async () => {
      // Set malformed encrypted data
      mockStorageData['bugzilla_api_key'] = JSON.stringify({
        iv: 'invalid-iv',
        encryptedData: 'invalid-data',
      })

      const retrieved = await storage.getApiKey()

      expect(retrieved).toBeUndefined()
    })
  })

  describe('clearApiKey', () => {
    it('should remove API key from localStorage', async () => {
      await storage.saveApiKey('test-key')

      storage.clearApiKey()

      expect(mockStorageData['bugzilla_api_key']).toBeUndefined()
    })

    it('should not throw error when no key exists', () => {
      expect(() => {
        storage.clearApiKey()
      }).not.toThrow()
    })
  })

  describe('hasApiKey', () => {
    it('should return true when API key exists', async () => {
      await storage.saveApiKey('test-key')

      const exists = storage.hasApiKey()

      expect(exists).toBe(true)
    })

    it('should return false when no API key exists', () => {
      const exists = storage.hasApiKey()

      expect(exists).toBe(false)
    })
  })

  describe('encryption', () => {
    it('should encrypt different keys to different values', async () => {
      await storage.saveApiKey('key1')
      const encrypted1 = mockStorageData['bugzilla_api_key']

      await storage.saveApiKey('key2')
      const encrypted2 = mockStorageData['bugzilla_api_key']

      expect(encrypted1).not.toBe(encrypted2)
    })

    it('should successfully decrypt after multiple save/retrieve cycles', async () => {
      const keys = ['key1', 'key2', 'key3']

      log('--- Test: should successfully decrypt after multiple save/retrieve cycles ---')

      for (const key of keys) {
        log(`\nCycle for key: '${key}'`)
        try {
          log('Calling saveApiKey...')
          await storage.saveApiKey(key)
          log(
            'saveApiKey completed, stored value:',
            mockStorageData['bugzilla_api_key']?.slice(0, 50),
          )
        } catch (error) {
          log('saveApiKey FAILED:', error)
          throw error
        }

        try {
          log('Calling getApiKey...')
          const retrieved = await storage.getApiKey()
          log('getApiKey returned:', retrieved)
          log('Expected:', key)
          log('Match:', retrieved === key)

          expect(retrieved).toBe(key)
        } catch (error) {
          log('getApiKey FAILED:', error)
          throw error
        }
      }
    })
  })
})
