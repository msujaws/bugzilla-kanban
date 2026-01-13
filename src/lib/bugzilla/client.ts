import type {
  BugzillaBug,
  BugzillaSearchResponse,
  BugzillaErrorResponse,
  BugFilters,
  BugUpdate,
  BatchUpdateResult,
} from './types'

const DEFAULT_TIMEOUT = 30_000 // 30 seconds
const BASE_URL = 'https://bugzilla.mozilla.org/rest'

export class BugzillaClient {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl: string = BASE_URL) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  /**
   * Fetch bugs from Bugzilla with optional filters
   */
  async getBugs(filters: BugFilters = {}): Promise<BugzillaBug[]> {
    const url = new URL(`${this.baseUrl}/bug`)

    // Add filters to query params
    if (filters.whiteboardTag) {
      url.searchParams.append('whiteboard', filters.whiteboardTag)
    }

    if (filters.component) {
      url.searchParams.append('component', filters.component)
    }

    if (filters.status && filters.status.length > 0) {
      for (const status of filters.status) {
        url.searchParams.append('status', status)
      }
    }

    const response = await this.request<BugzillaSearchResponse>(url.toString())
    return response.bugs
  }

  /**
   * Update a single bug
   */
  async updateBug(bugId: number, changes: Partial<BugzillaBug>): Promise<void> {
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
        await this.updateBug(update.id, { status: update.status })
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
