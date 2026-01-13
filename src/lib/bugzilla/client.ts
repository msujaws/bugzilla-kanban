import type { ApiKey, BugzillaBaseUrl, BugId } from '@/types/branded'
import { DEFAULT_BUGZILLA_URL, createBugId } from '@/types/branded'
import type {
  BugzillaBug,
  BugzillaSearchResponse,
  BugzillaErrorResponse,
  BugFilters,
  BugUpdate,
  BatchUpdateResult,
} from './types'

const DEFAULT_TIMEOUT = 30_000 // 30 seconds

export class BugzillaClient {
  private apiKey: ApiKey
  private baseUrl: BugzillaBaseUrl

  constructor(apiKey: ApiKey, baseUrl: BugzillaBaseUrl = DEFAULT_BUGZILLA_URL) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  /**
   * Fetch bugs from Bugzilla with optional filters
   */
  async getBugs(filters: BugFilters = {}): Promise<BugzillaBug[]> {
    // Build query string manually to support relative URLs
    const params = new URLSearchParams()

    if (filters.whiteboardTag) {
      params.append('whiteboard', filters.whiteboardTag)
    }

    if (filters.component) {
      params.append('component', filters.component)
    }

    if (filters.status && filters.status.length > 0) {
      for (const status of filters.status) {
        params.append('status', status)
      }
    }

    if (filters.limit !== undefined) {
      params.append('limit', filters.limit.toString())
    }

    const queryString = params.toString()
    const url = `${this.baseUrl}/bug${queryString ? `?${queryString}` : ''}`

    const response = await this.request<BugzillaSearchResponse>(url)
    return response.bugs
  }

  /**
   * Update a single bug
   */
  async updateBug(bugId: BugId, changes: Partial<BugzillaBug>): Promise<void> {
    const url = `${this.baseUrl}/bug/${bugId.toString()}`

    await this.request(url, {
      method: 'PUT',
      body: JSON.stringify(changes),
    })
  }

  /**
   * Update multiple bugs in batch
   */
  async batchUpdateBugs(updates: BugUpdate[]): Promise<BatchUpdateResult> {
    const result: BatchUpdateResult = {
      successful: [],
      failed: [],
    }

    if (updates.length === 0) {
      return result
    }

    // Process updates sequentially to avoid rate limiting
    for (const update of updates) {
      try {
        const bugId = createBugId(update.id)
        const changes: Partial<BugzillaBug> = {}
        if (update.status) {
          changes.status = update.status
        }
        if (update.resolution) {
          changes.resolution = update.resolution
        }
        if (update.assigned_to) {
          changes.assigned_to = update.assigned_to
        }
        await this.updateBug(bugId, changes)
        result.successful.push(update.id)
      } catch (error) {
        result.failed.push({
          id: update.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return result
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, DEFAULT_TIMEOUT)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'X-BUGZILLA-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string>),
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        await this.handleError(response)
      }

      return (await response.json()) as T
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout after 30 seconds')
      }

      throw error
    }
  }

  /**
   * Handle HTTP errors
   */
  private async handleError(response: Response): Promise<never> {
    let errorMessage = 'Bugzilla API error'

    try {
      const errorData = (await response.json()) as BugzillaErrorResponse
      errorMessage = errorData.message
    } catch {
      // Failed to parse error response, use default message
    }

    switch (response.status) {
      case 401: {
        throw new Error(`Unauthorized: ${errorMessage}`)
      }
      case 404: {
        throw new Error('Not Found')
      }
      case 400:
      case 500: {
        throw new Error(errorMessage)
      }
      default: {
        throw new Error(`${errorMessage} (${response.status.toString()})`)
      }
    }
  }
}
