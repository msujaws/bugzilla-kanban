import { useCallback, useState } from 'react'
import { ToastContainer } from './components/Notifications/ToastContainer'
import { ApiKeyInput } from './components/Auth/ApiKeyInput'
import { ApiKeyStatus } from './components/Auth/ApiKeyStatus'
import { FilterBar } from './components/Filters/FilterBar'
import { Board } from './components/Board/Board'
import { ApplyChangesButton } from './components/Board/ApplyChangesButton'
import { FAQModal } from './components/FAQ/FaqModal'
import { useStore } from './store'

function App() {
  // Local UI state
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showFAQModal, setShowFAQModal] = useState(false)

  // Auth state
  const apiKey = useStore((state) => state.apiKey)

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
  const applyChanges = useStore((state) => state.applyChanges)
  const getChangeCount = useStore((state) => state.getChangeCount)

  // Notifications state
  const toasts = useStore((state) => state.toasts)
  const removeToast = useStore((state) => state.removeToast)
  const addToast = useStore((state) => state.addToast)

  // Handle close modal
  const handleCloseModal = useCallback(() => {
    setShowApiKeyModal(false)
  }, [])

  // Handle open modal
  const handleOpenModal = useCallback(() => {
    setShowApiKeyModal(true)
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

  // Handle apply filters (fetch bugs)
  const handleApplyFilters = useCallback(() => {
    if (!apiKey) {
      addToast('error', 'Please enter your API key first! 🔑')
      return
    }
    fetchBugs(apiKey).catch(() => {
      // Error is handled in the store
    })
  }, [apiKey, fetchBugs, addToast])

  // Handle bug move (drag and drop)
  const handleBugMove = useCallback(
    (bugId: number, fromColumn: string, toColumn: string) => {
      stageChange(bugId, fromColumn, toColumn)
    },
    [stageChange],
  )

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
          <h1 className="mb-2 text-center text-4xl font-bold">Bugzilla Kanban</h1>
          <p className="mb-4 text-center text-text-secondary">Where bugs go to chill 😎</p>
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
        <ApiKeyInput isOpen={true} onClose={() => {}} />

        {/* FAQ Modal */}
        <FAQModal
          isOpen={showFAQModal}
          onClose={() => {
            setShowFAQModal(false)
          }}
        />

        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="border-b border-bg-tertiary bg-bg-secondary px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bugzilla Kanban</h1>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-text-secondary">Where bugs go to chill 😎</span>
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
            </div>
          </div>
          <ApiKeyStatus onOpenModal={handleOpenModal} />
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {/* Filter bar */}
        <div className="mb-6">
          <FilterBar
            whiteboardTag={filters.whiteboardTag}
            component={filters.component}
            onWhiteboardTagChange={handleWhiteboardTagChange}
            onComponentChange={handleComponentChange}
            onApplyFilters={handleApplyFilters}
            isLoading={isLoadingBugs}
          />
        </div>

        {/* Error message */}
        {bugsError && (
          <div className="mb-6 rounded-lg bg-accent-error/20 p-4 text-accent-error">
            <span className="material-icons mr-2 align-middle">error</span>
            {bugsError}
          </div>
        )}

        {/* Board */}
        <Board
          bugs={bugs}
          stagedChanges={changes}
          onBugMove={handleBugMove}
          isLoading={isLoadingBugs}
        />
      </main>

      {/* Apply changes button */}
      <ApplyChangesButton
        changeCount={getChangeCount()}
        isApplying={isApplying}
        onApply={handleApplyChanges}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* API Key Modal */}
      <ApiKeyInput isOpen={showApiKeyModal} onClose={handleCloseModal} />

      {/* FAQ Modal */}
      <FAQModal
        isOpen={showFAQModal}
        onClose={() => {
          setShowFAQModal(false)
        }}
      />
    </div>
  )
}

export default App
