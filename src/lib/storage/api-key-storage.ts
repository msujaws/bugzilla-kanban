/**
 * Secure storage for Bugzilla API keys using Web Crypto API
 */

const STORAGE_KEY = 'bugzilla_api_key'
const ALGORITHM = 'AES-GCM'

interface EncryptedData {
  iv: string // Base64 encoded initialization vector
  encryptedData: string // Base64 encoded encrypted data
}

export class ApiKeyStorage {
  private encoder = new TextEncoder()
  private decoder = new TextDecoder()

  /**
   * Derive a crypto key from the user agent string
   * This provides basic obfuscation (not cryptographically secure against determined attackers)
   * but protects against casual inspection of localStorage
   */
  private async deriveCryptoKey(): Promise<CryptoKey> {
    // Use user agent as key material (stable across sessions)
    const keyMaterial = this.encoder.encode(navigator.userAgent + 'bugzilla-kanban-salt')

    // Import as raw key material
    const importedKey = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey'],
    )

    // Derive actual encryption key
    return crypto.subtle.deriveKey(
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
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index++) {
      const charCode = binary.codePointAt(index)
      if (charCode !== undefined) {
        bytes[index] = charCode
      }
    }
    return bytes.buffer
  }

  /**
   * Save API key to localStorage (encrypted)
   */
  async saveApiKey(apiKey: string): Promise<void> {
    const encrypted = await this.encrypt(apiKey)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted))
  }

  /**
   * Retrieve API key from localStorage (decrypted)
   */
  async getApiKey(): Promise<string | undefined> {
    const stored = localStorage.getItem(STORAGE_KEY)

    if (!stored) {
      return undefined
    }

    try {
      const encrypted = JSON.parse(stored) as EncryptedData
      return await this.decrypt(encrypted)
    } catch {
      // Invalid or corrupted data
      return undefined
    }
  }

  /**
   * Remove API key from localStorage
   */
  clearApiKey(): void {
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * Check if API key exists in localStorage
   */
  hasApiKey(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null
  }
}
