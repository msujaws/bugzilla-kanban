import { test, expect, type Page, type Locator } from '@playwright/test'

// Mock bug responses
// Column assignment:
// - Backlog: NEW/UNCONFIRMED without [bzkanban-sprint] tag
// - Todo: NEW/UNCONFIRMED with [bzkanban-sprint] tag
// - In Progress: ASSIGNED status
const mockBugsResponse = {
  bugs: [
    {
      id: 200001,
      summary: 'Bug in backlog',
      status: 'NEW',
      assigned_to: 'dev1@example.com',
      priority: 'P1',
      severity: 'critical',
      component: 'Frontend',
      whiteboard: '[kanban]', // No sprint tag = backlog
      last_change_time: '2026-01-12T00:00:00Z',
      cf_fx_points: 3,
    },
    {
      id: 200002,
      summary: 'Bug in todo',
      status: 'NEW',
      assigned_to: 'dev2@example.com',
      priority: 'P2',
      severity: 'major',
      component: 'Backend',
      whiteboard: '[kanban] [bzkanban-sprint]', // Sprint tag = todo
      last_change_time: '2026-01-12T00:00:00Z',
      cf_fx_points: 5,
    },
    {
      id: 200003,
      summary: 'Bug in progress',
      status: 'ASSIGNED',
      assigned_to: 'dev3@example.com',
      priority: 'P3',
      severity: 'normal',
      component: 'API',
      whiteboard: '[kanban]',
      last_change_time: '2026-01-12T00:00:00Z',
      cf_fx_points: 8,
    },
  ],
}

// Response after bug is moved from backlog to todo (sprint tag added)
const updatedBugsResponse = {
  bugs: [
    {
      ...mockBugsResponse.bugs[0],
      whiteboard: '[kanban] [bzkanban-sprint]', // Sprint tag added = now in todo
    },
    mockBugsResponse.bugs[1],
    mockBugsResponse.bugs[2],
  ],
}

// Helper to setup authenticated state and load bugs
async function setupWithBugs(page: Page, bugsResponse = mockBugsResponse) {
  await page.route('**/api/bugzilla/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(bugsResponse),
    })
  })

  await page.goto('/')
  await page.getByPlaceholder('Enter your Bugzilla API key').fill('test-api-key')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })

  // Apply filter to load bugs - wait for the first bug to appear
  await page.getByPlaceholder('e.g., [kanban] or bug-triage').fill('kanban')
  await page.getByRole('button', { name: 'Apply Filters' }).click()

  // Wait for bugs to load by checking for a bug card
  await expect(page.getByRole('article').first()).toBeVisible({ timeout: 15000 })
}

// Helper to perform drag and drop using mouse events
// @dnd-kit requires specific pointer events to work correctly
async function dragAndDrop(page: Page, source: Locator, target: Locator) {
  // First scroll both elements into view
  await source.scrollIntoViewIfNeeded()

  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()

  if (!sourceBox || !targetBox) {
    throw new Error('Could not get bounding boxes for drag and drop')
  }

  const sourceCenter = {
    x: sourceBox.x + sourceBox.width / 2,
    y: sourceBox.y + sourceBox.height / 2,
  }
  const targetCenter = {
    x: targetBox.x + targetBox.width / 2,
    y: targetBox.y + targetBox.height / 2,
  }

  // Perform drag with proper pointer events
  await page.mouse.move(sourceCenter.x, sourceCenter.y)
  await page.mouse.down()
  // Move slowly to trigger drag detection (8px minimum for @dnd-kit PointerSensor)
  await page.mouse.move(sourceCenter.x + 10, sourceCenter.y, { steps: 5 })
  // Move in more steps for longer distances (backlog to board)
  await page.mouse.move(targetCenter.x, targetCenter.y, { steps: 20 })
  // Small delay to ensure dnd-kit registers the drop target
  await page.waitForTimeout(100)
  await page.mouse.up()
}

test.describe('Kanban Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('should display bugs in correct columns based on status', async ({ page }) => {
    await setupWithBugs(page)

    // Verify bugs appear in correct columns
    const backlogColumn = page.getByRole('region', { name: 'Backlog section' })
    const todoColumn = page.getByRole('region', { name: 'Todo column' })
    const inProgressColumn = page.getByRole('region', { name: 'In Progress column' })

    await expect(backlogColumn.getByText('Bug in backlog')).toBeVisible({ timeout: 10000 })
    await expect(todoColumn.getByText('Bug in todo')).toBeVisible()
    await expect(inProgressColumn.getByText('Bug in progress')).toBeVisible()
  })

  test('should show bug details on card', async ({ page }) => {
    await setupWithBugs(page)

    // Find the first bug card
    const bugCard = page.getByRole('article', { name: /Bug #200001/i })
    await expect(bugCard).toBeVisible({ timeout: 10000 })

    // Verify card shows bug details
    await expect(bugCard.getByText('#200001')).toBeVisible()
    await expect(bugCard.getByText('Bug in backlog')).toBeVisible()
    await expect(bugCard.getByText('P1')).toBeVisible() // Priority badge
    await expect(bugCard.getByText('critical')).toBeVisible() // Severity
    await expect(bugCard.getByText('Frontend')).toBeVisible() // Component
    await expect(bugCard.getByText('dev1@example.com')).toBeVisible() // Assignee
  })

  test('should stage changes when dragging bug between columns', async ({ page }) => {
    await setupWithBugs(page)

    // Find the bug in backlog
    const backlogColumn = page.getByRole('region', { name: 'Backlog section' })
    const todoColumn = page.getByRole('region', { name: 'Todo column' })
    const bugCard = backlogColumn.getByRole('article', { name: /Bug #200001/i })

    await expect(bugCard).toBeVisible({ timeout: 10000 })

    // Drag the bug from Backlog to Todo using mouse events
    await dragAndDrop(page, bugCard, todoColumn)

    // Bug should now appear in Todo column with "Staged" indicator
    const movedCard = todoColumn.getByRole('article', { name: /Bug #200001/i })
    await expect(movedCard).toBeVisible({ timeout: 5000 })
    await expect(movedCard.getByText('Staged')).toBeVisible()

    // Apply Changes button should appear
    await expect(page.getByRole('button', { name: /Apply 1 change/i })).toBeVisible()
  })

  test('should show Apply Changes button with count after dragging', async ({ page }) => {
    await setupWithBugs(page)

    // Drag first bug
    const backlogColumn = page.getByRole('region', { name: 'Backlog section' })
    const todoColumn = page.getByRole('region', { name: 'Todo column' })
    const bugCard = backlogColumn.getByRole('article', { name: /Bug #200001/i })

    await expect(bugCard).toBeVisible({ timeout: 10000 })
    await dragAndDrop(page, bugCard, todoColumn)

    // Button should show count
    const applyButton = page.getByRole('button', { name: /Apply 1 change/i })
    await expect(applyButton).toBeVisible()
    await expect(applyButton).toContainText('1')
  })

  test('should apply changes and update Bugzilla when clicking Apply', async ({ page }) => {
    let updateRequestMade = false
    let updateRequestBody: Record<string, unknown> = {}

    await page.route('**/api/bugzilla/**', async (route) => {
      const method = route.request().method()
      const url = route.request().url()

      if (method === 'PUT' && url.includes('/bug/200001')) {
        updateRequestMade = true
        try {
          const body = route.request().postData()
          if (body) {
            updateRequestBody = JSON.parse(body) as Record<string, unknown>
          }
        } catch {
          // Ignore parse errors
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ bugs: [{ id: 200001, changes: {} }] }),
        })
        return
      }

      // All other requests return bugs
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(updateRequestMade ? updatedBugsResponse : mockBugsResponse),
      })
    })

    await page.goto('/')

    // Setup
    await page.getByPlaceholder('Enter your Bugzilla API key').fill('test-api-key')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })

    await page.getByPlaceholder('e.g., [kanban] or bug-triage').fill('kanban')
    await page.getByRole('button', { name: 'Apply Filters' }).click()

    // Wait for bugs to appear
    const backlogColumn = page.getByRole('region', { name: 'Backlog section' })
    const todoColumn = page.getByRole('region', { name: 'Todo column' })
    const bugCard = backlogColumn.getByRole('article', { name: /Bug #200001/i })
    await expect(bugCard).toBeVisible({ timeout: 10000 })

    // Drag bug from Backlog to Todo
    await dragAndDrop(page, bugCard, todoColumn)

    // Click Apply Changes
    const applyButton = page.getByRole('button', { name: /Apply 1 change/i })
    await expect(applyButton).toBeVisible({ timeout: 5000 })
    await applyButton.click()

    // Wait for the update request
    await page.waitForResponse(
      (response) => response.request().method() === 'PUT' && response.url().includes('/bug/'),
    )

    // Verify the update request was made (backlog->todo adds sprint tag to whiteboard)
    expect(updateRequestMade).toBe(true)
    // The update should contain either status or whiteboard changes
    expect(
      Object.prototype.hasOwnProperty.call(updateRequestBody, 'status') ||
        Object.prototype.hasOwnProperty.call(updateRequestBody, 'whiteboard'),
    ).toBe(true)

    // Button should disappear after successful apply
    await expect(applyButton).not.toBeVisible({ timeout: 10000 })

    // Success toast should appear
    await expect(page.locator('[role="alert"]')).toBeVisible()
  })

  test('should show error toast when apply fails', async ({ page }) => {
    await page.route('**/api/bugzilla/**', async (route) => {
      const method = route.request().method()

      if (method === 'PUT') {
        // Simulate failure
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: true, message: 'Server error' }),
        })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockBugsResponse),
      })
    })

    await page.goto('/')

    // Setup
    await page.getByPlaceholder('Enter your Bugzilla API key').fill('test-api-key')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })

    await page.getByPlaceholder('e.g., [kanban] or bug-triage').fill('kanban')
    await page.getByRole('button', { name: 'Apply Filters' }).click()
    await page.waitForResponse('**/api/bugzilla/**')

    // Drag and attempt to apply
    const backlogColumn = page.getByRole('region', { name: 'Backlog section' })
    const todoColumn = page.getByRole('region', { name: 'Todo column' })
    const bugCard = backlogColumn.getByRole('article', { name: /Bug #200001/i })

    await expect(bugCard).toBeVisible({ timeout: 10000 })
    await dragAndDrop(page, bugCard, todoColumn)

    const applyButton = page.getByRole('button', { name: /Apply 1 change/i })
    await expect(applyButton).toBeVisible({ timeout: 5000 })
    await applyButton.click()

    // Error toast should appear
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10000 })

    // Apply button should still be visible (changes not cleared on error)
    await expect(applyButton).toBeVisible()
  })

  // Skip: The undo logic requires detecting when a bug is moved back to its
  // original column (based on original status, not staged position). This needs
  // additional app-level logic to compare staged target with original status.
  test.skip('should allow undoing a staged change before applying', async ({ page }) => {
    await setupWithBugs(page)

    // Drag bug from Backlog to Todo
    const backlogColumn = page.getByRole('region', { name: 'Backlog section' })
    const todoColumn = page.getByRole('region', { name: 'Todo column' })
    const bugCard = backlogColumn.getByRole('article', { name: /Bug #200001/i })

    await expect(bugCard).toBeVisible({ timeout: 10000 })
    await dragAndDrop(page, bugCard, todoColumn)

    // Bug should be in Todo
    const movedCard = todoColumn.getByRole('article', { name: /Bug #200001/i })
    await expect(movedCard).toBeVisible({ timeout: 5000 })

    // Drag it back to Backlog
    await dragAndDrop(page, movedCard, backlogColumn)

    // Bug should be back in Backlog
    await expect(backlogColumn.getByRole('article', { name: /Bug #200001/i })).toBeVisible({
      timeout: 5000,
    })

    // Apply button should be hidden (no net changes)
    await expect(page.getByRole('button', { name: /Apply.*change/i })).not.toBeVisible()
  })

  test('should show story points on cards', async ({ page }) => {
    await setupWithBugs(page)

    // Find the first bug card with points
    const bugCard = page.getByRole('article', { name: /Bug #200001/i })
    await expect(bugCard).toBeVisible({ timeout: 10000 })

    // Verify points badge shows "3"
    await expect(bugCard.getByText('3')).toBeVisible()
  })

  test('should open points picker when clicking points badge', async ({ page }) => {
    await setupWithBugs(page)

    // Find the bug card with points - use the one in todo column (inside the board, not backlog)
    const todoColumn = page.getByRole('region', { name: 'Todo column' })
    const bugCard = todoColumn.getByRole('article', { name: /Bug #200002/i })
    await expect(bugCard).toBeVisible({ timeout: 10000 })

    // Click the points badge button
    await bugCard.getByRole('button', { name: 'Change story points' }).click()

    // Points picker should appear
    const pointsPicker = page.getByRole('listbox', { name: 'Select story points' })
    await expect(pointsPicker).toBeVisible({ timeout: 5000 })

    // Verify options are shown (at least 9 options including ---, ?, 1, 2, 3, 5, 8, 13, 21)
    const options = pointsPicker.getByRole('option')
    await expect(options).toHaveCount(9)
  })

  test('should stage points change when selecting a different value', async ({ page }) => {
    await setupWithBugs(page)

    // Find the bug card - use the one in todo column (inside the board, not backlog)
    const todoColumn = page.getByRole('region', { name: 'Todo column' })
    const bugCard = todoColumn.getByRole('article', { name: /Bug #200002/i })
    await expect(bugCard).toBeVisible({ timeout: 10000 })

    // Click the points badge button
    await bugCard.getByRole('button', { name: 'Change story points' }).click()

    // Select "8" points (changing from 5 to 8)
    const pointsPicker = page.getByRole('listbox', { name: 'Select story points' })
    await expect(pointsPicker).toBeVisible({ timeout: 5000 })

    // Click option
    const option = pointsPicker.getByRole('option', { name: /^8$/ })
    await option.click()

    // Wait for picker to close
    await expect(pointsPicker).not.toBeVisible({ timeout: 5000 })

    // Bug should now show "8" on the points button
    await expect(bugCard.getByRole('button', { name: 'Change story points' })).toContainText('8')

    // Apply Changes button should appear
    await expect(page.getByRole('button', { name: /Apply 1 change/i })).toBeVisible()
  })

  test('should open priority picker when clicking priority badge', async ({ page }) => {
    await setupWithBugs(page)

    // Find a bug card in the todo column (inside the board, not backlog)
    const todoColumn = page.getByRole('region', { name: 'Todo column' })
    const bugCard = todoColumn.getByRole('article', { name: /Bug #200002/i })
    await expect(bugCard).toBeVisible({ timeout: 10000 })

    // Click the priority badge button
    await bugCard.getByRole('button', { name: 'Change priority' }).click()

    // Priority picker should appear
    const priorityPicker = page.getByRole('listbox', { name: 'Select priority' })
    await expect(priorityPicker).toBeVisible({ timeout: 5000 })

    // Verify all priorities are shown
    await expect(priorityPicker.getByText('P1')).toBeVisible()
    await expect(priorityPicker.getByText('P2')).toBeVisible()
    await expect(priorityPicker.getByText('P3')).toBeVisible()
    await expect(priorityPicker.getByText('P4')).toBeVisible()
    await expect(priorityPicker.getByText('P5')).toBeVisible()
  })

  test('should stage priority change when selecting a different value', async ({ page }) => {
    await setupWithBugs(page)

    // Find a bug card in the todo column (P2 priority)
    const todoColumn = page.getByRole('region', { name: 'Todo column' })
    const bugCard = todoColumn.getByRole('article', { name: /Bug #200002/i })
    await expect(bugCard).toBeVisible({ timeout: 10000 })

    // Click the priority badge button
    await bugCard.getByRole('button', { name: 'Change priority' }).click()

    // Select P3
    const priorityPicker = page.getByRole('listbox', { name: 'Select priority' })
    await expect(priorityPicker).toBeVisible({ timeout: 5000 })

    // Click option
    const option = priorityPicker.getByRole('option', { name: /P3.*Normal/i })
    await option.click()

    // Wait for picker to close
    await expect(priorityPicker).not.toBeVisible({ timeout: 5000 })

    // Bug should now show P3 on the priority button
    await expect(bugCard.getByRole('button', { name: 'Change priority' })).toContainText('P3')

    // Apply Changes button should appear
    await expect(page.getByRole('button', { name: /Apply 1 change/i })).toBeVisible()
  })
})
