import type { VercelRequest, VercelResponse } from '@vercel/node'

const BUGZILLA_BASE_URL = 'https://bugzilla.mozilla.org/rest'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Get the path segments after /api/bugzilla/
  const { path } = req.query
  const pathSegments = Array.isArray(path) ? path : [path]
  const bugzillaPath = pathSegments.join('/')

  // Build the Bugzilla URL
  const url = new URL(`${BUGZILLA_BASE_URL}/${bugzillaPath}`)

  // Forward query parameters
  if (typeof req.url === 'string') {
    const reqUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
    for (const [key, value] of reqUrl.searchParams) {
      if (key !== 'path') {
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
    const data: unknown = await response.json()

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-BUGZILLA-API-KEY')

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
