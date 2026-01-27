import { describe, it, expect } from 'vitest'
import {
  createApiKey,
  tryCreateApiKey,
  createBugzillaBaseUrl,
  createBugId,
  tryCreateBugId,
  DEFAULT_BUGZILLA_URL,
  type ApiKey,
  type BugzillaBaseUrl,
  type BugId,
} from './branded'

describe('Branded Types', () => {
  describe('ApiKey', () => {
    describe('createApiKey', () => {
      it('should create an ApiKey from a valid string', () => {
        const key = createApiKey('my-api-key-123')
        expect(key).toBe('my-api-key-123')
      })

      it('should trim whitespace', () => {
        const key = createApiKey('  my-api-key-123  ')
        expect(key).toBe('my-api-key-123')
      })

      it('should throw for empty string', () => {
        expect(() => createApiKey('')).toThrow('API key cannot be empty')
      })

      it('should throw for whitespace-only string', () => {
        expect(() => createApiKey('   ')).toThrow('API key cannot be empty')
      })
    })

    describe('tryCreateApiKey', () => {
      it('should return ApiKey for valid input', () => {
        const key = tryCreateApiKey('valid-api-key-123')
        expect(key).toBe('valid-api-key-123')
      })

      it('should return undefined for empty string', () => {
        const key = tryCreateApiKey('')
        expect(key).toBeUndefined()
      })

      it('should return undefined for nullish values', () => {
        // eslint-disable-next-line unicorn/no-useless-undefined
        const key = tryCreateApiKey(undefined)
        expect(key).toBeUndefined()
      })

      it('should return undefined for undefined', () => {
        const key = tryCreateApiKey()
        expect(key).toBeUndefined()
      })
    })

    describe('type safety', () => {
      it('should be assignable to string', () => {
        const key: ApiKey = createApiKey('test-api-key-123')
        const str: string = key
        expect(str).toBe('test-api-key-123')
      })
    })
  })

  describe('BugzillaBaseUrl', () => {
    describe('createBugzillaBaseUrl', () => {
      it('should create a BugzillaBaseUrl from a valid URL', () => {
        const url = createBugzillaBaseUrl('https://bugzilla.mozilla.org/rest')
        expect(url).toBe('https://bugzilla.mozilla.org/rest')
      })

      it('should remove trailing slashes', () => {
        const url = createBugzillaBaseUrl('https://bugzilla.mozilla.org/rest/')
        expect(url).toBe('https://bugzilla.mozilla.org/rest')
      })

      it('should remove multiple trailing slashes', () => {
        const url = createBugzillaBaseUrl('https://bugzilla.mozilla.org/rest///')
        expect(url).toBe('https://bugzilla.mozilla.org/rest')
      })

      it('should trim whitespace', () => {
        const url = createBugzillaBaseUrl('  https://example.com  ')
        expect(url).toBe('https://example.com')
      })

      it('should throw for invalid URL', () => {
        expect(() => createBugzillaBaseUrl('not-a-url')).toThrow('Invalid URL')
      })

      it('should throw for empty string', () => {
        expect(() => createBugzillaBaseUrl('')).toThrow('Invalid URL')
      })
    })

    describe('relative paths', () => {
      it('should accept relative paths starting with /', () => {
        const url = createBugzillaBaseUrl('/api/bugzilla')
        expect(url).toBe('/api/bugzilla')
      })

      it('should remove trailing slashes from relative paths', () => {
        const url = createBugzillaBaseUrl('/api/bugzilla/')
        expect(url).toBe('/api/bugzilla')
      })
    })

    describe('DEFAULT_BUGZILLA_URL', () => {
      it('should be the proxy URL', () => {
        expect(DEFAULT_BUGZILLA_URL).toBe('/api/bugzilla')
      })

      it('should be a BugzillaBaseUrl type', () => {
        const url: BugzillaBaseUrl = DEFAULT_BUGZILLA_URL
        expect(url).toBeDefined()
      })
    })
  })

  describe('BugId', () => {
    describe('createBugId', () => {
      it('should create a BugId from a positive integer', () => {
        const id = createBugId(12_345)
        expect(id).toBe(12_345)
      })

      it('should accept 1 as valid', () => {
        const id = createBugId(1)
        expect(id).toBe(1)
      })

      it('should throw for zero', () => {
        expect(() => createBugId(0)).toThrow('Invalid bug ID')
      })

      it('should throw for negative numbers', () => {
        expect(() => createBugId(-1)).toThrow('Invalid bug ID')
      })

      it('should throw for non-integers', () => {
        expect(() => createBugId(1.5)).toThrow('Invalid bug ID')
      })

      it('should throw for NaN', () => {
        expect(() => createBugId(Number.NaN)).toThrow('Invalid bug ID')
      })
    })

    describe('tryCreateBugId', () => {
      it('should return BugId for valid input', () => {
        const id = tryCreateBugId(123)
        expect(id).toBe(123)
      })

      it('should return undefined for invalid number', () => {
        const id = tryCreateBugId(-1)
        expect(id).toBeUndefined()
      })

      it('should return undefined for nullish values', () => {
        // eslint-disable-next-line unicorn/no-useless-undefined
        const id = tryCreateBugId(undefined)
        expect(id).toBeUndefined()
      })

      it('should return undefined for undefined', () => {
        const id = tryCreateBugId()
        expect(id).toBeUndefined()
      })
    })

    describe('type safety', () => {
      it('should be assignable to number', () => {
        const id: BugId = createBugId(42)
        const num: number = id
        expect(num).toBe(42)
      })
    })
  })
})
