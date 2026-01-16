import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler from './bugzilla'

// Helper to create mock request
function createMockRequest(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'GET',
    url: '/api/bugzilla/bug',
    query: { path: ['bug'] },
    headers: {},
    body: undefined,
    ...overrides,
  } as VercelRequest
}

// Helper to create mock response
function createMockResponse(): VercelResponse & {
  _status: number
  _headers: Record<string, string>
  _json: unknown
  _ended: boolean
} {
  const res = {
    _status: 200,
    _headers: {} as Record<string, string>,
    _json: undefined as unknown,
    _ended: false,
    setHeader(name: string, value: string) {
      this._headers[name] = value
      return this
    },
    status(code: number) {
      this._status = code
      return this
    },
    json(data: unknown) {
      this._json = data
      this._ended = true
      return this
    },
    end() {
      this._ended = true
      return this
    },
  }
  return res as VercelResponse & typeof res
}

describe('Bugzilla API Proxy Security', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.env = originalEnv
  })

  describe('Origin Whitelist', () => {
    it('should reject requests from unknown origins', async () => {
      const req = createMockRequest({
        headers: {
          origin: 'https://malicious-site.com',
        },
      })
      const res = createMockResponse()

      await handler(req, res)

      expect(res._status).toBe(403)
      expect(res._json).toEqual({
        error: true,
        message: 'Origin not allowed',
      })
    })

    it('should allow requests from allowed origins', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ bugs: [] })),
      })

      const req = createMockRequest({
        headers: {
          origin: 'https://bugzilla-kanban.vercel.app',
        },
      })
      const res = createMockResponse()

      await handler(req, res)

      expect(res._status).not.toBe(403)
    })

    it('should allow requests from localhost in development', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ bugs: [] })),
      })

      const req = createMockRequest({
        headers: {
          origin: 'http://localhost:5173',
        },
      })
      const res = createMockResponse()

      await handler(req, res)

      expect(res._status).not.toBe(403)
    })

    it('should allow requests without origin header (same-origin)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ bugs: [] })),
      })

      const req = createMockRequest({
        headers: {},
      })
      const res = createMockResponse()

      await handler(req, res)

      expect(res._status).not.toBe(403)
    })
  })

  describe('Endpoint Whitelist', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ bugs: [] })),
      })
    })

    it('should allow /bug endpoint', async () => {
      const req = createMockRequest({
        url: '/api/bugzilla/bug',
        query: { path: ['bug'] },
        headers: { origin: 'http://localhost:5173' },
      })
      const res = createMockResponse()

      await handler(req, res)

      expect(res._status).not.toBe(403)
      expect(fetch).toHaveBeenCalled()
    })

    it('should allow /bug/{id} endpoint', async () => {
      const req = createMockRequest({
        url: '/api/bugzilla/bug/123456',
        query: { path: ['bug', '123456'] },
        headers: { origin: 'http://localhost:5173' },
      })
      const res = createMockResponse()

      await handler(req, res)

      expect(res._status).not.toBe(403)
      expect(fetch).toHaveBeenCalled()
    })

    it('should allow /user endpoint', async () => {
      const req = createMockRequest({
        url: '/api/bugzilla/user',
        query: { path: ['user'] },
        headers: { origin: 'http://localhost:5173' },
      })
      const res = createMockResponse()

      await handler(req, res)

      expect(res._status).not.toBe(403)
      expect(fetch).toHaveBeenCalled()
    })

    it('should reject unauthorized endpoints', async () => {
      const req = createMockRequest({
        url: '/api/bugzilla/admin/settings',
        query: { path: ['admin', 'settings'] },
        headers: { origin: 'http://localhost:5173' },
      })
      const res = createMockResponse()

      await handler(req, res)

      expect(res._status).toBe(403)
      expect(res._json).toEqual({
        error: true,
        message: 'Endpoint not allowed',
      })
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should reject path traversal attempts', async () => {
      const req = createMockRequest({
        url: '/api/bugzilla/../../../etc/passwd',
        query: { path: ['..', '..', '..', 'etc', 'passwd'] },
        headers: { origin: 'http://localhost:5173' },
      })
      const res = createMockResponse()

      await handler(req, res)

      expect(res._status).toBe(403)
      expect(fetch).not.toHaveBeenCalled()
    })
  })

  describe('Error Response Sanitization', () => {
    it('should not expose raw Bugzilla error details in production', async () => {
      process.env.NODE_ENV = 'production'

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            'Invalid JSON response with sensitive data: database connection string xyz',
          ),
      })

      const req = createMockRequest({
        headers: { origin: 'http://localhost:5173' },
      })
      const res = createMockResponse()

      await handler(req, res)

      expect(res._status).toBe(502)
      expect((res._json as { details?: string }).details).toBeUndefined()
      expect((res._json as { message?: string }).message).toBe('Invalid response from Bugzilla API')
    })

    it('should include error details in development for debugging', async () => {
      process.env.NODE_ENV = 'development'

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('Invalid JSON response'),
      })

      const req = createMockRequest({
        headers: { origin: 'http://localhost:5173' },
      })
      const res = createMockResponse()

      await handler(req, res)

      expect(res._status).toBe(502)
      expect((res._json as { details?: string }).details).toBeDefined()
    })
  })

  describe('CORS Headers', () => {
    it('should set specific origin instead of wildcard', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ bugs: [] })),
      })

      const req = createMockRequest({
        headers: { origin: 'https://bugzilla-kanban.vercel.app' },
      })
      const res = createMockResponse()

      await handler(req, res)

      expect(res._headers['Access-Control-Allow-Origin']).toBe('https://bugzilla-kanban.vercel.app')
      expect(res._headers['Access-Control-Allow-Origin']).not.toBe('*')
    })

    it('should handle OPTIONS preflight with proper CORS headers', async () => {
      const req = createMockRequest({
        method: 'OPTIONS',
        headers: { origin: 'https://bugzilla-kanban.vercel.app' },
      })
      const res = createMockResponse()

      await handler(req, res)

      expect(res._status).toBe(204)
      expect(res._headers['Access-Control-Allow-Origin']).toBe('https://bugzilla-kanban.vercel.app')
      expect(res._headers['Access-Control-Allow-Methods']).toBeDefined()
      expect(res._headers['Access-Control-Allow-Headers']).toBeDefined()
    })
  })
})
