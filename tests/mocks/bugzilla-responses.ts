// Mock responses for Bugzilla API calls
// These will be used in tests to simulate API responses

export const mockBugResponse = {
  id: 123_456,
  summary: 'Test bug summary',
  status: 'NEW',
  assigned_to: 'test@example.com',
  priority: 'P1',
  severity: 'S1',
  component: 'Test Component',
  whiteboard: '[kanban]',
  last_change_time: '2026-01-12T00:00:00Z',
}

export const mockBugsResponse = {
  bugs: [
    {
      id: 123_456,
      summary: 'First test bug',
      status: 'NEW',
      assigned_to: 'dev1@example.com',
      priority: 'P1',
      severity: 'S1',
      component: 'Frontend',
      whiteboard: '[kanban]',
    },
    {
      id: 123_457,
      summary: 'Second test bug',
      status: 'ASSIGNED',
      assigned_to: 'dev2@example.com',
      priority: 'P2',
      severity: 'S2',
      component: 'Backend',
      whiteboard: '[kanban]',
    },
  ],
}

export const mockErrorResponse = {
  error: true,
  message: 'Invalid API key',
  code: 401,
}
