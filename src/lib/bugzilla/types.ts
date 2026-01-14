/**
 * Bugzilla API types based on bugzilla.mozilla.org REST API
 */

export interface BugzillaFlag {
  name: string
  status: string
  setter?: string
  requestee?: string
}

export interface BugzillaBug {
  id: number
  summary: string
  status: string
  resolution?: string
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
  /** Security groups the bug belongs to. Non-empty means bug is restricted/confidential. */
  groups?: string[]
  /** Bug flags (e.g., qe-verify, needinfo) */
  flags?: BugzillaFlag[]
  /** Bug keywords (e.g., meta) */
  keywords?: string[]
  /** Story points (Firefox custom field) */
  cf_fx_points?: number | string
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

export interface BugUpdateFlag {
  name: string
  status: string
}

export interface BugUpdate {
  id: number
  status?: string
  resolution?: string
  assigned_to?: string
  whiteboard?: string
  cf_fx_points?: number | string
  priority?: string
  flags?: BugUpdateFlag[]
}

export interface BatchUpdateResult {
  successful: number[]
  failed: Array<{ id: number; error: string }>
}
