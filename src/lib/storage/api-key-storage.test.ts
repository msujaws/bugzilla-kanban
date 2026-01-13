import { describe, it, expect, beforeEach } from 'vitest'
import { ApiKeyStorage, type Storage } from './api-key-storage'

describe('ApiKeyStorage', () => {
  let storage: ApiKeyStorage
  let mockStorageData: Record<string, string>
  let mockStorage: Storage
  const testKeyMaterial = 'test-key-material-for-encryption'

  beforeEach(() => {
    // Create in-memory storage mock (no global stubbing needed)
    mockStorageData = {}
    mockStorage = {
      // eslint-disable-next-line unicorn/no-null
      getItem: (key: string) => mockStorageData[key] ?? null,
      setItem: (key: string, value: string) => {
        mockStorageData[key] = value
      },
      removeItem: (key: string) => {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete mockStorageData[key]
      },
    }

    // Inject both key material and storage for deterministic testing
    storage = new ApiKeyStorage({
      keyMaterial: testKeyMaterial,
      storage: mockStorage,
    })
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

      await storage.saveApiKey(apiKey)
      const retrieved = await storage.getApiKey()

      expect(retrieved).toBe(apiKey)
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

      for (const key of keys) {
        await storage.saveApiKey(key)
        const retrieved = await storage.getApiKey()
        expect(retrieved).toBe(key)
      }
    })
  })
})
