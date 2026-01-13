import type { VercelRequest, VercelResponse } from '@vercel/node'

const BUGZILLA_BASE_URL = 'https://bugzilla.mozilla.org/rest'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*')
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
      // If response isn't JSON, return an error with the raw text
      console.error('Non-JSON response from Bugzilla:', responseText.slice(0, 500))
      res.status(502).json({
        error: true,
        message: 'Invalid response from Bugzilla API',
        details: responseText.slice(0, 200),
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
