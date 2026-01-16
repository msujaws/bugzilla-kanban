import type { VercelRequest, VercelResponse } from '@vercel/node'

const BUGZILLA_BASE_URL = 'https://bugzilla.mozilla.org/rest'

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://bugzilla-kanban.vercel.app',
  'https://boardzilla.vercel.app',
  // Allow localhost for development
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
]

// Allowed endpoint prefixes - whitelist only safe endpoints
const ALLOWED_ENDPOINTS = new Set(['bug', 'user', 'whoami'])

function isOriginAllowed(origin: string | undefined): boolean {
  // Same-origin requests (no origin header) are allowed
  if (!origin) return true

  for (const allowed of ALLOWED_ORIGINS) {
    if (typeof allowed === 'string') {
      if (origin === allowed) return true
    } else if (allowed.test(origin)) {
      return true
    }
  }
  return false
}

function isEndpointAllowed(path: string): boolean {
  // Reject path traversal attempts
  if (path.includes('..')) return false

  // Get the first path segment (endpoint)
  const firstSegment = path.split('/')[0]
  if (!firstSegment) return false
  return ALLOWED_ENDPOINTS.has(firstSegment)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin

  // Validate origin
  if (!isOriginAllowed(origin)) {
    res.status(403).json({
      error: true,
      message: 'Origin not allowed',
    })
    return
  }

  // Set CORS headers with specific origin (not wildcard)
  const allowedOrigin = origin ?? '*'
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-BUGZILLA-API-KEY')
  res.setHeader('Access-Control-Max-Age', '86400')

  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  // Get the path segments after /api/bugzilla/
  // Try from query first, fallback to parsing URL directly
  let bugzillaPath = ''

  const { path } = req.query
  if (path) {
    const pathSegments = Array.isArray(path) ? path : [path]
    bugzillaPath = pathSegments.filter(Boolean).join('/')
  }

  // Fallback: extract path from URL if query param is empty
  if (!bugzillaPath && req.url) {
    const match = req.url.match(/\/api\/bugzilla\/([^?]*)/)
    if (match?.[1]) {
      bugzillaPath = match[1]
    }
  }

  // Validate endpoint whitelist
  if (!isEndpointAllowed(bugzillaPath)) {
    res.status(403).json({
      error: true,
      message: 'Endpoint not allowed',
    })
    return
  }

  // Build the Bugzilla URL
  const url = new URL(`${BUGZILLA_BASE_URL}/${bugzillaPath}`)

  // Forward query parameters (exclude Vercel's catch-all route params)
  if (typeof req.url === 'string') {
    const reqUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
    for (const [key, value] of reqUrl.searchParams) {
      // Exclude both 'path' and '...path' (Vercel encodes catch-all routes as '...path')
      if (key !== 'path' && key !== '...path') {
        url.searchParams.append(key, value)
      }
    }
  }

  // Get API key from header
  const apiKey = req.headers['x-bugzilla-api-key'] as string | undefined

  try {
    const fetchOptions: RequestInit = {
      method: req.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-BUGZILLA-API-KEY': apiKey } : {}),
      },
    }

    // Forward body for POST/PUT requests
    if (req.method === 'POST' || req.method === 'PUT') {
      fetchOptions.body = JSON.stringify(req.body)
    }

    const response = await fetch(url.toString(), fetchOptions)

    // Get response as text first to handle non-JSON responses
    const responseText = await response.text()

    // Try to parse as JSON
    let data: unknown
    try {
      data = JSON.parse(responseText)
    } catch {
      // If response isn't JSON, return an error
      // Only include details in development for debugging
      console.error('Non-JSON response from Bugzilla:', responseText.slice(0, 500))
      const isProduction = process.env.NODE_ENV === 'production'
      res.status(502).json({
        error: true,
        message: 'Invalid response from Bugzilla API',
        ...(isProduction ? {} : { details: responseText.slice(0, 200) }),
      })
      return
    }

    // Return response with same status code
    res.status(response.status).json(data)
  } catch (error) {
    console.error('Bugzilla proxy error:', error)
    res.status(500).json({
      error: true,
      message: error instanceof Error ? error.message : 'Proxy error',
    })
  }
}
