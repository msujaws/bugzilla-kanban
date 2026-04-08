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
  /** Dynamic status tracking flags for Firefox versions (e.g., cf_status_firefox150) */
  [key: `cf_status_firefox${number}`]: string | undefined
  /** Dynamic tracking flags for Firefox versions (e.g., cf_tracking_firefox150) */
  [key: `cf_tracking_firefox${number}`]: string | undefined
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
  /** Bugzilla sort order (e.g., 'changeddate DESC') */
  order?: string
  /** Additional fields to include in the API response (e.g., tracking flag fields) */
  extraFields?: string[]
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
  severity?: string
  flags?: BugUpdateFlag[]
  /** Dynamic status tracking flags for Firefox versions */
  [key: `cf_status_firefox${number}`]: string | undefined
  /** Dynamic tracking flags for Firefox versions */
  [key: `cf_tracking_firefox${number}`]: string | undefined
}

export interface BatchUpdateResult {
  successful: number[]
  failed: Array<{ id: number; error: string }>
}

export interface WhoAmIResponse {
  id: number
  real_name: string
  name: string
}
