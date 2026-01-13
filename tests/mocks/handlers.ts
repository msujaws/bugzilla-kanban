import { http, HttpResponse } from 'msw'

// Default request handlers for Bugzilla API (via proxy)
export const handlers = [
  // Mock Bugzilla API endpoints here as needed
  http.get('/api/bugzilla/bug', () => {
    return HttpResponse.json({
      bugs: [],
    })
  }),
]
