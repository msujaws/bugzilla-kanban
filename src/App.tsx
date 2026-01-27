import { useCallback, useEffect, useState, useRef, lazy, Suspense } from 'react'
import { ToastContainer } from './components/Notifications/ToastContainer'
import { ApiKeyInput } from './components/Auth/ApiKeyInput'
import { ApiKeyStatus } from './components/Auth/ApiKeyStatus'
import { FilterBar } from './components/Filters/FilterBar'
import { Board } from './components/Board/Board'
import { EmptyBoardWelcome } from './components/Board/EmptyBoardWelcome'
import { ApplyChangesButton } from './components/Board/ApplyChangesButton'

// Lazy load modals to improve initial bundle size
const FAQModal = lazy(() =>
  import('./components/FAQ/FaqModal').then((m) => ({ default: m.FAQModal })),
)
const OriginStoryModal = lazy(() =>
  import('./components/OriginStory/OriginStoryModal').then((m) => ({
    default: m.OriginStoryModal,
  })),
)
import { useStore } from './store'
import { useUrlFilters } from './hooks/use-url-filters'
import { saveFilters, getFilters } from './lib/storage/filter-storage'
import { saveTheme, getTheme, type Theme } from './lib/storage/theme-storage'
import { useBoardAssignees } from './hooks/use-board-assignees'
import { addSprintTag, removeSprintTag } from './lib/bugzilla/sprint-tag'
import { getQeVerifyStatus, type QeVerifyStatus } from './lib/bugzilla/qe-verify'

function App() {
  // Local UI state
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showFAQModal, setShowFAQModal] = useState(false)
  const [showOriginStoryModal, setShowOriginStoryModal] = useState(false)
  const [theme, setTheme] = useState<Theme>('dark')

  // Auth state
  const apiKey = useStore((state) => state.apiKey)
  const loadApiKey = useStore((state) => state.loadApiKey)

  // Load persisted API key on mount
  useEffect(() => {
    void loadApiKey()
  }, [loadApiKey])

  // Load and apply theme on mount
  useEffect(() => {
    const savedTheme = getTheme()
    setTheme(savedTheme)
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light')
    }
  }, [])

  // Apply theme changes and persist
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
    saveTheme(theme)
  }, [theme])

  // URL filter persistence
  const { initialFilters, hasUrlFilters, updateUrl } = useUrlFilters()
  const hasInitializedFilters = useRef(false)
  const hasAutoFetched = useRef(false)

  // Bugs state
  const bugs = useStore((state) => state.bugs)
  const isLoadingBugs = useStore((state) => state.isLoading)
  const bugsError = useStore((state) => state.error)
  const filters = useStore((state) => state.filters)
  const setFilters = useStore((state) => state.setFilters)
  const fetchBugs = useStore((state) => state.fetchBugs)

  // Staged changes state
  const changes = useStore((state) => state.changes)
  const isApplying = useStore((state) => state.isApplying)
  const stageChange = useStore((state) => state.stageChange)
  const stageAssigneeChange = useStore((state) => state.stageAssigneeChange)
  const stageWhiteboardChange = useStore((state) => state.stageWhiteboardChange)
  const stagePointsChange = useStore((state) => state.stagePointsChange)
  const stagePriorityChange = useStore((state) => state.stagePriorityChange)
  const stageSeverityChange = useStore((state) => state.stageSeverityChange)
  const stageQeVerifyChange = useStore((state) => state.stageQeVerifyChange)
  const applyChanges = useStore((state) => state.applyChanges)
  const clearAllChanges = useStore((state) => state.clearAllChanges)

  // Notifications state
  const toasts = useStore((state) => state.toasts)
  const removeToast = useStore((state) => state.removeToast)
  const addToast = useStore((state) => state.addToast)

  // Assignee filter state
  const assigneeFilter = useStore((state) => state.assigneeFilter)
  const setAssigneeFilter = useStore((state) => state.setAssigneeFilter)

  // Compute if any filters are active (for empty state guidance)
  const hasActiveFilters =
    filters.whiteboardTag !== '' || filters.component !== '' || assigneeFilter !== null

  // Get all assignees from bugs for the filter dropdown
  const allAssignees = useBoardAssignees(bugs)

  // Warn user before leaving page with unsaved staged changes
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (changes.size > 0) {
        event.preventDefault()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [changes.size])

  // Initialize filters from URL or localStorage on mount
  useEffect(() => {
    if (hasInitializedFilters.current) {
      return
    }
    hasInitializedFilters.current = true

    // Apply filters from URL (takes precedence over localStorage)
    if (hasUrlFilters) {
      setFilters(initialFilters)
    } else {
      // Fall back to localStorage if no URL params
      const storedFilters = getFilters()
      if (storedFilters) {
        setFilters(storedFilters)
      }
    }
  }, [hasUrlFilters, initialFilters, setFilters])

  // Auto-fetch when URL has filters and API key becomes available
  useEffect(() => {
    if (!hasUrlFilters || hasAutoFetched.current || !apiKey) {
      return
    }
    hasAutoFetched.current = true
    void fetchBugs(apiKey)
  }, [hasUrlFilters, apiKey, fetchBugs])

  // Save filters to localStorage whenever they change
  useEffect(() => {
    // Only save after initial load is complete
    if (!hasInitializedFilters.current) {
      return
    }
    saveFilters(filters)
  }, [filters])

  // Handle close modal
  const handleCloseModal = useCallback(() => {
    setShowApiKeyModal(false)
  }, [])

  // Handle open modal
  const handleOpenModal = useCallback(() => {
    setShowApiKeyModal(true)
  }, [])

  // Handle open FAQ
  const handleOpenFAQ = useCallback(() => {
    setShowFAQModal(true)
  }, [])

  // Handle open origin story (easter egg)
  const handleOpenOriginStory = useCallback(() => {
    setShowOriginStoryModal(true)
  }, [])

  // Handle filter changes
  const handleWhiteboardTagChange = useCallback(
    (value: string) => {
      setFilters({ whiteboardTag: value })
    },
    [setFilters],
  )

  const handleComponentChange = useCallback(
    (value: string) => {
      setFilters({ component: value })
    },
    [setFilters],
  )

  const handleSortOrderChange = useCallback(
    (value: 'priority' | 'lastChanged') => {
      setFilters({ sortOrder: value })
    },
    [setFilters],
  )

  // Handle apply filters (fetch bugs and update URL)
  const handleApplyFilters = useCallback(() => {
    if (!apiKey) {
      addToast('error', 'Please enter your API key first! 🔑')
      return
    }
    // Update URL with current filters
    updateUrl(filters)
    fetchBugs(apiKey).catch(() => {
      // Error is handled in the store
    })
  }, [apiKey, fetchBugs, addToast, updateUrl, filters])

  // Handle bug move (drag and drop)
  const handleBugMove = useCallback(
    (bugId: number, fromColumn: string, toColumn: string) => {
      // Capture existing staged change before stageChange modifies the store
      const existingChange = changes.get(bugId)

      stageChange(bugId, fromColumn, toColumn)

      const bug = bugs.find((b) => b.id === bugId)
      if (bug) {
        // Handle sprint tag for backlog <-> todo moves
        const currentWhiteboard = bug.whiteboard

        // Moving from backlog to todo: add sprint tag
        if (fromColumn === 'backlog' && toColumn === 'todo') {
          const newWhiteboard = addSprintTag(currentWhiteboard)
          if (newWhiteboard !== currentWhiteboard) {
            stageWhiteboardChange(bugId, currentWhiteboard, newWhiteboard)
          }
        }

        // Moving from todo to backlog: remove sprint tag
        if (fromColumn === 'todo' && toColumn === 'backlog') {
          const newWhiteboard = removeSprintTag(currentWhiteboard)
          if (newWhiteboard !== currentWhiteboard) {
            stageWhiteboardChange(bugId, currentWhiteboard, newWhiteboard)
          }
        }

        // Handle qe-verify for moves to in-testing
        // Bug needs qe-verify+ to stay in in-testing column
        if (toColumn === 'in-testing') {
          const currentQeVerify = getQeVerifyStatus(bug.flags)
          if (currentQeVerify !== 'plus') {
            stageQeVerifyChange(bugId, currentQeVerify, 'plus')
          }
        } else if (existingChange?.qeVerify) {
          // Revert auto-staged qe-verify+ when moving away from in-testing
          // Check if status was also reverted (back to original column)
          const updatedChange = useStore.getState().changes.get(bugId)
          if (!updatedChange?.status) {
            const currentQeVerify = getQeVerifyStatus(bug.flags)
            stageQeVerifyChange(bugId, currentQeVerify, currentQeVerify)
          }
        }
      }
    },
    [stageChange, bugs, stageWhiteboardChange, stageQeVerifyChange, changes],
  )

  // Handle assignee change
  const handleAssigneeChange = useCallback(
    (bugId: number, newAssignee: string) => {
      const bug = bugs.find((b) => b.id === bugId)
      if (bug) {
        stageAssigneeChange(bugId, bug.assigned_to, newAssignee)
      }
    },
    [bugs, stageAssigneeChange],
  )

  // Handle points change
  const handlePointsChange = useCallback(
    (bugId: number, newPoints: number | string | undefined) => {
      const bug = bugs.find((b) => b.id === bugId)
      if (bug) {
        stagePointsChange(bugId, bug.cf_fx_points, newPoints)
      }
    },
    [bugs, stagePointsChange],
  )

  // Handle priority change
  const handlePriorityChange = useCallback(
    (bugId: number, newPriority: string) => {
      const bug = bugs.find((b) => b.id === bugId)
      if (bug) {
        stagePriorityChange(bugId, bug.priority, newPriority)
      }
    },
    [bugs, stagePriorityChange],
  )

  // Handle severity change
  const handleSeverityChange = useCallback(
    (bugId: number, newSeverity: string) => {
      const bug = bugs.find((b) => b.id === bugId)
      if (bug) {
        stageSeverityChange(bugId, bug.severity, newSeverity)
      }
    },
    [bugs, stageSeverityChange],
  )

  // Handle qe-verify change
  const handleQeVerifyChange = useCallback(
    (bugId: number, newStatus: QeVerifyStatus) => {
      const bug = bugs.find((b) => b.id === bugId)
      if (bug) {
        const currentStatus = getQeVerifyStatus(bug.flags)
        stageQeVerifyChange(bugId, currentStatus, newStatus)
      }
    },
    [bugs, stageQeVerifyChange],
  )

  // Handle invalid move attempt (e.g., unassigned bug out of backlog)
  const handleInvalidMove = useCallback(
    (_bugId: number, reason: string) => {
      addToast('error', reason)
    },
    [addToast],
  )

  // Handle clear staged changes
  const handleClearChanges = useCallback(() => {
    clearAllChanges()
    addToast('info', 'Staged changes cleared 🧹')
  }, [clearAllChanges, addToast])

  // Handle apply changes
  const handleApplyChanges = useCallback(() => {
    if (!apiKey) {
      addToast('error', 'No API key found. Please re-enter your key 🔑')
      return
    }
    applyChanges(apiKey)
      .then((result) => {
        if (result.failCount === 0) {
          addToast(
            'success',
            `Boom! ${result.successCount.toString()} changes applied like a boss 💥`,
          )
          // Refresh bugs after successful apply
          fetchBugs(apiKey).catch(() => {
            // Error handled in store
          })
        } else if (result.successCount > 0) {
          addToast(
            'info',
            `Applied ${result.successCount.toString()} changes, but ${result.failCount.toString()} failed 😅`,
          )
        } else {
          addToast(
            'error',
            `All ${result.failCount.toString()} changes failed. Check your permissions 🔒`,
          )
        }
      })
      .catch(() => {
        addToast('error', 'Uh oh, something went wrong applying changes 😅')
      })
  }, [apiKey, applyChanges, addToast, fetchBugs])

  // Show API key input if no key
  if (!apiKey) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary">
        <div className="container mx-auto px-4 py-8">
          <h1 className="mb-2 text-center text-4xl font-bold">BoardZilla</h1>
          <p className="mb-4 text-center text-text-secondary">
            Puttin' bugz in their place since '26 😎
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <a
              href="https://github.com/msujaws/bugzilla-kanban"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-tertiary transition-colors hover:text-accent-primary"
            >
              created by <span className="font-bold">@jaws</span>
            </a>
            <span className="text-text-tertiary">•</span>
            <button
              onClick={() => {
                setShowFAQModal(true)
              }}
              className="text-text-tertiary transition-colors hover:text-accent-primary"
            >
              FAQ
            </button>
          </div>
        </div>

        {/* Always show API key input when no key */}
        <ApiKeyInput isOpen={true} onClose={() => {}} onOpenFAQ={handleOpenFAQ} />

        {/* FAQ Modal */}
        <Suspense fallback={null}>
          <FAQModal
            isOpen={showFAQModal}
            onClose={() => {
              setShowFAQModal(false)
            }}
          />
        </Suspense>

        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-accent-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="border-b border-bg-tertiary bg-bg-secondary px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/mascot.webp"
              alt="BoardZilla mascot - a friendly dinosaur with kanban boards"
              className="h-16 w-auto"
              onClick={handleOpenOriginStory}
            />
            <div>
              <h1 className="text-2xl font-bold">BoardZilla</h1>
              <nav aria-label="Site navigation" className="flex items-center gap-3 text-sm">
                <span className="text-text-secondary">
                  Puttin' bugz in their place since '26 😎
                </span>
                <span className="text-text-tertiary">•</span>
                <a
                  href="https://github.com/msujaws/bugzilla-kanban"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-tertiary transition-colors hover:text-accent-primary"
                >
                  by <span className="font-bold">@jaws</span>
                </a>
                <span className="text-text-tertiary">•</span>
                <button
                  onClick={() => {
                    setShowFAQModal(true)
                  }}
                  className="text-text-tertiary transition-colors hover:text-accent-primary"
                >
                  FAQ
                </button>
                <span className="text-text-tertiary">•</span>
                <span className="flex items-center gap-1">
                  {theme === 'light' ? (
                    <span className="font-bold text-text-primary">☀️ Light</span>
                  ) : (
                    <button
                      onClick={() => {
                        setTheme('light')
                      }}
                      className="text-text-tertiary transition-colors hover:text-accent-primary"
                    >
                      ☀️ Light
                    </button>
                  )}
                  <span className="text-text-tertiary">|</span>
                  {theme === 'dark' ? (
                    <span className="font-bold text-text-primary">🌙 Dark</span>
                  ) : (
                    <button
                      onClick={() => {
                        setTheme('dark')
                      }}
                      className="text-text-tertiary transition-colors hover:text-accent-primary"
                    >
                      🌙 Dark
                    </button>
                  )}
                </span>
              </nav>
              {/* Keyboard hints */}
              <div className="mt-1 flex items-center gap-2 text-xs text-text-tertiary">
                <span>Drag & Drop with mouse, or use</span>
                <kbd className="rounded bg-bg-tertiary px-1.5 py-0.5 font-mono">Arrows</kbd>
                <span>to select,</span>
                <kbd className="rounded bg-bg-tertiary px-1.5 py-0.5 font-mono">Shift</kbd>
                <span>to grab/drop,</span>
                <kbd className="rounded bg-bg-tertiary px-1.5 py-0.5 font-mono">Shift+Enter</kbd>
                <span>to apply</span>
              </div>
            </div>
          </div>
          <ApiKeyStatus onOpenModal={handleOpenModal} />
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="container mx-auto py-6">
        {/* Filter bar */}
        <div className="mb-6">
          <FilterBar
            whiteboardTag={filters.whiteboardTag}
            component={filters.component}
            sortOrder={filters.sortOrder}
            onWhiteboardTagChange={handleWhiteboardTagChange}
            onComponentChange={handleComponentChange}
            onSortOrderChange={handleSortOrderChange}
            onApplyFilters={handleApplyFilters}
            isLoading={isLoadingBugs}
            assignees={allAssignees}
            selectedAssignee={assigneeFilter}
            onAssigneeChange={setAssigneeFilter}
          />
        </div>

        {/* Error message */}
        {bugsError && (
          <div className="mb-6 rounded-lg bg-accent-error/20 p-4 text-accent-error">
            <span className="material-icons mr-2 align-middle">error</span>
            {bugsError}
          </div>
        )}

        {/* Board or Welcome */}
        {bugs.length === 0 && !isLoadingBugs && !hasActiveFilters && !bugsError ? (
          <EmptyBoardWelcome />
        ) : (
          <Board
            bugs={bugs}
            stagedChanges={changes}
            onBugMove={handleBugMove}
            onAssigneeChange={handleAssigneeChange}
            onPointsChange={handlePointsChange}
            onPriorityChange={handlePriorityChange}
            onSeverityChange={handleSeverityChange}
            onQeVerifyChange={handleQeVerifyChange}
            onInvalidMove={handleInvalidMove}
            isLoading={isLoadingBugs}
            onApplyChanges={handleApplyChanges}
            onClearChanges={handleClearChanges}
            hasActiveFilters={hasActiveFilters}
          />
        )}
      </main>

      {/* Apply changes button */}
      <ApplyChangesButton
        changes={changes}
        bugs={bugs}
        isApplying={isApplying}
        onApply={handleApplyChanges}
        onClear={handleClearChanges}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* API Key Modal */}
      <ApiKeyInput isOpen={showApiKeyModal} onClose={handleCloseModal} onOpenFAQ={handleOpenFAQ} />

      {/* FAQ Modal */}
      <Suspense fallback={null}>
        <FAQModal
          isOpen={showFAQModal}
          onClose={() => {
            setShowFAQModal(false)
          }}
        />
      </Suspense>

      {/* Origin Story Modal (easter egg) */}
      <Suspense fallback={null}>
        <OriginStoryModal
          isOpen={showOriginStoryModal}
          onClose={() => {
            setShowOriginStoryModal(false)
          }}
        />
      </Suspense>
    </div>
  )
}

export default App
