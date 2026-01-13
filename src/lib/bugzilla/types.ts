/**
 * Bugzilla API types based on bugzilla.mozilla.org REST API
 */

export interface BugzillaBug {
  id: number
  summary: string
  status: string
  assigned_to: string
  assigned_to_detail?: {
    email: string
    name: string
    real_name: string
  }
  priority: string
  severity: string
  component: string
  whiteboard: string
  last_change_time: string
  creation_time: string
}

export interface BugzillaSearchResponse {
  bugs: BugzillaBug[]
}

export interface BugzillaErrorResponse {
  error: boolean
  message: string
  code: number
}

export interface BugFilters {
  whiteboardTag?: string
  component?: string
  status?: string[]
  limit?: number
}

export interface BugUpdate {
  id: number
  status: string
}

export interface BatchUpdateResult {
  successful: number[]
  failed: Array<{ id: number; error: string }>
}
