import { http, HttpResponse } from 'msw'

// Default request handlers for Bugzilla API
export const handlers = [
  // Mock Bugzilla API endpoints here as needed
  http.get('https://bugzilla.mozilla.org/rest/bug', () => {
    return HttpResponse.json({
      bugs: [],
    })
  }),
]
