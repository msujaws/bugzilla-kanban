/**
 * Secure storage for Bugzilla API keys using Web Crypto API
 */

const STORAGE_KEY = 'bugzilla_api_key'
const ALGORITHM = 'AES-GCM'

interface EncryptedData {
  iv: string // Base64 encoded initialization vector
  encryptedData: string // Base64 encoded encrypted data
}

/**
 * Storage interface for dependency injection (enables testing)
 */
export interface Storage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export class ApiKeyStorage {
  private encoder = new TextEncoder()
  private decoder = new TextDecoder()
  private keyMaterialOverride?: string
  private storage: Storage

  /**
   * @param options - Optional configuration for testing
   * @param options.keyMaterial - Override for key derivation
   * @param options.storage - Override for storage backend (defaults to localStorage)
   */
  constructor(options?: { keyMaterial?: string; storage?: Storage }) {
    this.keyMaterialOverride = options?.keyMaterial
    this.storage = options?.storage ?? localStorage
  }

  /**
   * Derive a crypto key from the user agent string
   * This provides basic obfuscation (not cryptographically secure against determined attackers)
   * but protects against casual inspection of localStorage
   */
  private async deriveCryptoKey(): Promise<CryptoKey> {
    // Use user agent as key material (stable across sessions), or override for testing
    const keySource = this.keyMaterialOverride ?? navigator.userAgent
    // Debug logging - TODO: remove after debugging CI issue
    /* eslint-disable @typescript-eslint/no-unnecessary-condition */
    console.log(
      '[ApiKeyStorage.deriveCryptoKey] keySource length:',
      keySource?.length,
      'using override:',
      !!this.keyMaterialOverride,
    )
    console.log('[ApiKeyStorage.deriveCryptoKey] crypto.subtle available:', !!crypto?.subtle)
    /* eslint-enable @typescript-eslint/no-unnecessary-condition */
    const keyMaterial = this.encoder.encode(keySource + 'bugzilla-kanban-salt')

    // Import as raw key material
    const importedKey = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey'],
    )
    console.log('[ApiKeyStorage.deriveCryptoKey] importKey succeeded')

    // Derive actual encryption key
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: this.encoder.encode('bugzilla-kanban'),
        iterations: 100_000,
        hash: 'SHA-256',
      },
      importedKey,
      { name: ALGORITHM, length: 256 },
      false,
      ['encrypt', 'decrypt'],
    )
    console.log('[ApiKeyStorage.deriveCryptoKey] deriveKey succeeded')
    return derivedKey
  }

  /**
   * Encrypt a string using AES-GCM
   */
  private async encrypt(plaintext: string): Promise<EncryptedData> {
    const key = await this.deriveCryptoKey()

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Encrypt the data
    const encrypted = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      this.encoder.encode(plaintext),
    )

    // Convert to base64 for storage
    return {
      iv: this.arrayBufferToBase64(iv),
      encryptedData: this.arrayBufferToBase64(encrypted),
    }
  }

  /**
   * Decrypt encrypted data
   */
  private async decrypt(encrypted: EncryptedData): Promise<string> {
    const key = await this.deriveCryptoKey()

    // Convert from base64
    const iv = this.base64ToArrayBuffer(encrypted.iv)
    const encryptedData = this.base64ToArrayBuffer(encrypted.encryptedData)

    // Decrypt
    const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, encryptedData)

    return this.decoder.decode(decrypted)
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
    let binary = ''
    for (const byte of bytes) {
      binary += String.fromCodePoint(byte)
    }
    return btoa(binary)
  }

  /**
   * Convert base64 string to Uint8Array (compatible with SubtleCrypto in all environments)
   */
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index++) {
      const charCode = binary.codePointAt(index)
      if (charCode !== undefined) {
        bytes[index] = charCode
      }
    }
    // Return Uint8Array directly instead of .buffer for Node.js compatibility
    return bytes
  }

  /**
   * Save API key to localStorage (encrypted)
   */
  async saveApiKey(apiKey: string): Promise<void> {
    console.log('[ApiKeyStorage.saveApiKey] saving key of length:', apiKey.length)
    const encrypted = await this.encrypt(apiKey)
    console.log(
      '[ApiKeyStorage.saveApiKey] encrypted, iv length:',
      encrypted.iv.length,
      'data length:',
      encrypted.encryptedData.length,
    )
    this.storage.setItem(STORAGE_KEY, JSON.stringify(encrypted))
    console.log('[ApiKeyStorage.saveApiKey] saved to storage')
  }

  /**
   * Retrieve API key from localStorage (decrypted)
   */
  async getApiKey(): Promise<string | undefined> {
    const stored = this.storage.getItem(STORAGE_KEY)

    // Debug logging for CI
    console.log('[ApiKeyStorage.getApiKey] stored value:', stored ? 'exists' : 'null')

    if (!stored) {
      return undefined
    }

    try {
      const encrypted = JSON.parse(stored) as EncryptedData
      /* eslint-disable @typescript-eslint/no-unnecessary-condition */
      console.log(
        '[ApiKeyStorage.getApiKey] parsed encrypted data, iv length:',
        encrypted.iv?.length,
      )
      const result = await this.decrypt(encrypted)
      console.log('[ApiKeyStorage.getApiKey] decrypt succeeded, result length:', result?.length)
      /* eslint-enable @typescript-eslint/no-unnecessary-condition */
      return result
    } catch (error) {
      // Invalid or corrupted data
      console.error('[ApiKeyStorage.getApiKey] decrypt FAILED:', error)
      return undefined
    }
  }

  /**
   * Remove API key from localStorage
   */
  clearApiKey(): void {
    this.storage.removeItem(STORAGE_KEY)
  }

  /**
   * Check if API key exists in localStorage
   */
  hasApiKey(): boolean {
    return this.storage.getItem(STORAGE_KEY) !== null
  }
}
