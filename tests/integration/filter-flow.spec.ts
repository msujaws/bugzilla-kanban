import { test, expect } from '@playwright/test'

// Mock bug responses for different filter scenarios
const allBugsResponse = {
  bugs: [
    {
      id: 100001,
      summary: 'Frontend bug with kanban tag',
      status: 'NEW',
      assigned_to: 'dev1@example.com',
      priority: 'P1',
      severity: 'normal',
      component: 'Frontend',
      whiteboard: '[kanban]',
      last_change_time: '2026-01-12T00:00:00Z',
    },
    {
      id: 100002,
      summary: 'Backend bug with kanban tag',
      status: 'ASSIGNED',
      assigned_to: 'dev2@example.com',
      priority: 'P2',
      severity: 'major',
      component: 'Backend',
      whiteboard: '[kanban]',
      last_change_time: '2026-01-12T00:00:00Z',
    },
    {
      id: 100003,
      summary: 'API bug without tag',
      status: 'IN_PROGRESS',
      assigned_to: 'dev3@example.com',
      priority: 'P3',
      severity: 'minor',
      component: 'API',
      whiteboard: '',
      last_change_time: '2026-01-12T00:00:00Z',
    },
  ],
}

const frontendBugsResponse = {
  bugs: [allBugsResponse.bugs[0]],
}

const kanbanTagBugsResponse = {
  bugs: [allBugsResponse.bugs[0], allBugsResponse.bugs[1]],
}

// Helper to set up authenticated state
async function setupAuthenticated(page: import('@playwright/test').Page) {
  await page.route('**/api/bugzilla/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ bugs: [] }),
    })
  })

  await page.goto('/')
  const modal = page.getByRole('dialog')
  if (await modal.isVisible()) {
    await page.getByPlaceholder('Enter your Bugzilla API key').fill('test-key')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(modal).not.toBeVisible({ timeout: 10000 })
  }
}

test.describe('Filter Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('should load bugs when whiteboard tag is entered', async ({ page }) => {
    let requestCount = 0
    await page.route('**/api/bugzilla/**', async (route) => {
      const url = route.request().url()
      requestCount++
      // First request is validation, return minimal response
      if (requestCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ bugs: [] }),
        })
        return
      }
      // Check if whiteboard filter is applied
      if (url.includes('whiteboard=kanban')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(kanbanTagBugsResponse),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(allBugsResponse),
        })
      }
    })

    await page.goto('/')
    // Enter API key to close modal
    await page.getByPlaceholder('Enter your Bugzilla API key').fill('test-key')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })

    // Find and fill the whiteboard tag filter
    const whiteboardInput = page.getByPlaceholder('e.g., [kanban] or bug-triage')
    await expect(whiteboardInput).toBeVisible()
    await whiteboardInput.fill('kanban')
    await page.getByRole('button', { name: 'Apply Filters' }).click()

    // Should show the filtered bugs
    await expect(page.getByText('Frontend bug with kanban tag')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Backend bug with kanban tag')).toBeVisible()
  })

  test('should load bugs when component is entered', async ({ page }) => {
    let requestCount = 0
    await page.route('**/api/bugzilla/**', async (route) => {
      const url = route.request().url()
      requestCount++
      if (requestCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ bugs: [] }),
        })
        return
      }
      if (url.includes('component=Frontend')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(frontendBugsResponse),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(allBugsResponse),
        })
      }
    })

    await page.goto('/')
    await page.getByPlaceholder('Enter your Bugzilla API key').fill('test-key')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })

    // Find and fill the component filter
    const componentInput = page.getByPlaceholder('e.g., Core, UI, Backend')
    await expect(componentInput).toBeVisible()
    await componentInput.fill('Frontend')
    await page.getByRole('button', { name: 'Apply Filters' }).click()

    // Should show only Frontend bugs
    await expect(page.getByText('Frontend bug with kanban tag')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Backend bug with kanban tag')).not.toBeVisible()
  })

  test('should apply combined filters (whiteboard + component)', async ({ page }) => {
    let requestCount = 0
    await page.route('**/api/bugzilla/**', async (route) => {
      const url = route.request().url()
      requestCount++
      if (requestCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ bugs: [] }),
        })
        return
      }
      // Return matching bugs based on filters
      if (url.includes('whiteboard=kanban') && url.includes('component=Frontend')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(frontendBugsResponse),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ bugs: [] }),
        })
      }
    })

    await page.goto('/')
    await page.getByPlaceholder('Enter your Bugzilla API key').fill('test-key')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })

    // Apply both filters
    const whiteboardInput = page.getByPlaceholder('e.g., [kanban] or bug-triage')
    const componentInput = page.getByPlaceholder('e.g., Core, UI, Backend')

    await whiteboardInput.fill('kanban')
    await componentInput.fill('Frontend')
    await page.getByRole('button', { name: 'Apply Filters' }).click()

    // Wait for request with both filters
    await page.waitForResponse(
      (response) =>
        response.url().includes('whiteboard=kanban') &&
        response.url().includes('component=Frontend'),
    )

    // Should show only the matching bug
    await expect(page.getByText('Frontend bug with kanban tag')).toBeVisible({ timeout: 10000 })
  })

  test('should show empty state when no bugs match filters', async ({ page }) => {
    await page.route('**/api/bugzilla/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ bugs: [] }),
      })
    })

    await page.goto('/')
    await page.getByPlaceholder('Enter your Bugzilla API key').fill('test-key')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })

    // Apply a filter that returns no results
    const whiteboardInput = page.getByPlaceholder('e.g., [kanban] or bug-triage')
    await whiteboardInput.fill('nonexistent-tag')
    await page.getByRole('button', { name: 'Apply Filters' }).click()

    // Wait for response
    await page.waitForResponse('**/api/bugzilla/**')

    // All columns should be empty (show empty state message)
    const backlogColumn = page.getByRole('region', { name: 'Backlog column' })
    await expect(backlogColumn).toBeVisible()
    // Should show empty state text in at least one column
    await expect(backlogColumn.getByText('No bugs here!')).toBeVisible()
  })

  test('should clear filters and reload', async ({ page }) => {
    let requestWithFilter = false
    let requestWithoutFilter = false

    await page.route('**/api/bugzilla/**', async (route) => {
      const url = route.request().url()
      if (url.includes('whiteboard=') && !url.includes('whiteboard=&')) {
        requestWithFilter = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(kanbanTagBugsResponse),
        })
      } else {
        requestWithoutFilter = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(allBugsResponse),
        })
      }
    })

    await page.goto('/')
    await page.getByPlaceholder('Enter your Bugzilla API key').fill('test-key')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })

    // Apply filter
    const whiteboardInput = page.getByPlaceholder('e.g., [kanban] or bug-triage')
    await whiteboardInput.fill('kanban')
    await page.getByRole('button', { name: 'Apply Filters' }).click()
    await page.waitForResponse('**/api/bugzilla/**')

    // Clear filter
    await page.getByRole('button', { name: 'Clear' }).click()
    await page.getByRole('button', { name: 'Apply Filters' }).click()
    await page.waitForResponse('**/api/bugzilla/**')

    // Both types of requests should have been made
    expect(requestWithFilter).toBe(true)
    expect(requestWithoutFilter).toBe(true)
  })
})
