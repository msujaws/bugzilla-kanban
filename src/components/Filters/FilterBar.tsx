import { type KeyboardEvent, useRef, useEffect, useCallback } from 'react'
import type { SortOrder } from '@/lib/bugzilla/sort-bugs'
import type { Assignee } from '@/hooks/use-board-assignees'
import { AssigneeFilter } from './AssigneeFilter'

const DEBOUNCE_DELAY = 300

interface FilterBarProps {
  whiteboardTag: string
  component: string
  sortOrder: SortOrder
  onWhiteboardTagChange: (value: string) => void
  onComponentChange: (value: string) => void
  onSortOrderChange: (value: SortOrder) => void
  onApplyFilters: () => void
  isLoading: boolean
  assignees?: Assignee[]
  selectedAssignee?: string | null
  onAssigneeChange?: (email: string | null) => void
  enableAutoApply?: boolean
}

export function FilterBar({
  whiteboardTag,
  component,
  sortOrder,
  onWhiteboardTagChange,
  onComponentChange,
  onSortOrderChange,
  onApplyFilters,
  isLoading,
  assignees = [],
  selectedAssignee = null,
  onAssigneeChange,
  enableAutoApply = false,
}: FilterBarProps) {
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const hasFilters =
    whiteboardTag !== '' ||
    component !== '' ||
    sortOrder !== 'priority' ||
    selectedAssignee !== null

  // Debounced auto-apply
  const debouncedApply = useCallback(() => {
    if (!enableAutoApply) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      onApplyFilters()
    }, DEBOUNCE_DELAY)
  }, [enableAutoApply, onApplyFilters])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      // Cancel any pending debounced apply and apply immediately
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      onApplyFilters()
    }
  }

  // Handle text input changes with debouncing
  const handleWhiteboardChange = (value: string) => {
    onWhiteboardTagChange(value)
    debouncedApply()
  }

  const handleComponentInputChange = (value: string) => {
    onComponentChange(value)
    debouncedApply()
  }

  const handleClear = () => {
    onWhiteboardTagChange('')
    onComponentChange('')
    onSortOrderChange('priority')
    if (onAssigneeChange) {
      onAssigneeChange(null)
    }
  }

  return (
    <div role="search" className="rounded-lg bg-bg-secondary p-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <span className="material-icons text-text-secondary">filter_list</span>
        <h2 className="text-lg font-bold text-text-primary">Filter your bugs</h2>
      </div>

      {/* Filter inputs */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Whiteboard tag input */}
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="whiteboard-filter" className="mb-1 block text-sm text-text-secondary">
            Whiteboard Tag
          </label>
          <input
            id="whiteboard-filter"
            type="text"
            value={whiteboardTag}
            onChange={(e) => {
              handleWhiteboardChange(e.target.value)
            }}
            onKeyDown={handleKeyDown}
            placeholder="e.g., [kanban] or bug-triage"
            disabled={isLoading}
            className="w-full rounded border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary placeholder-text-tertiary focus:border-accent-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Component input */}
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="component-filter" className="mb-1 block text-sm text-text-secondary">
            Component
          </label>
          <input
            id="component-filter"
            type="text"
            value={component}
            onChange={(e) => {
              handleComponentInputChange(e.target.value)
            }}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Core, UI, Backend"
            disabled={isLoading}
            className="w-full rounded border border-bg-tertiary bg-bg-primary px-3 py-2 text-text-primary placeholder-text-tertiary focus:border-accent-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Assignee filter */}
        {onAssigneeChange && (
          <div className="flex flex-col self-end">
            <label className="mb-1 block text-sm text-text-secondary">Assignee</label>
            <AssigneeFilter
              assignees={assignees}
              selectedAssignee={selectedAssignee}
              onSelect={onAssigneeChange}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Sort order */}
        <div className="flex items-center gap-2 self-end">
          <div role="group" aria-label="Sort order" className="flex">
            <button
              type="button"
              aria-pressed={sortOrder === 'priority'}
              onClick={() => {
                onSortOrderChange('priority')
              }}
              disabled={isLoading}
              className={`rounded-l border border-r-0 px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                sortOrder === 'priority'
                  ? 'border-accent-primary bg-accent-primary text-white'
                  : 'border-bg-tertiary bg-bg-primary text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              {sortOrder === 'priority' ? '↓ ' : ''}Priority
            </button>
            <button
              type="button"
              aria-pressed={sortOrder === 'lastChanged'}
              onClick={() => {
                onSortOrderChange('lastChanged')
              }}
              disabled={isLoading}
              className={`rounded-r border px-3 py-2 text-sm whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                sortOrder === 'lastChanged'
                  ? 'border-accent-primary bg-accent-primary text-white'
                  : 'border-bg-tertiary bg-bg-primary text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              {sortOrder === 'lastChanged' ? '↓ ' : ''}Last Changed
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {hasFilters && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="rounded border border-bg-tertiary bg-bg-tertiary px-4 py-2 text-sm font-bold text-text-primary transition-colors hover:bg-bg-tertiary/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-icons mr-1 text-sm align-middle">clear</span>
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onApplyFilters}
            disabled={isLoading}
            className="rounded border border-transparent bg-accent-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="material-icons mr-1 animate-spin text-sm align-middle">
                  refresh
                </span>
                Loading...
              </>
            ) : (
              <>
                <span className="material-icons mr-1 text-sm align-middle">search</span>
                Apply Filters
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active filter badges */}
      {hasFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-bg-tertiary pt-3">
          <span className="text-xs text-text-tertiary">Active filters:</span>
          {whiteboardTag && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-primary/20 px-2 py-1 text-xs text-accent-primary">
              {whiteboardTag}
              <button
                type="button"
                onClick={() => {
                  onWhiteboardTagChange('')
                }}
                className="ml-1 rounded-full hover:bg-accent-primary/30 focus:outline-none focus:ring-1 focus:ring-accent-primary"
                aria-label={`Remove ${whiteboardTag} filter`}
              >
                <span className="material-icons text-sm">close</span>
              </button>
            </span>
          )}
          {component && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-primary/20 px-2 py-1 text-xs text-accent-primary">
              {component}
              <button
                type="button"
                onClick={() => {
                  onComponentChange('')
                }}
                className="ml-1 rounded-full hover:bg-accent-primary/30 focus:outline-none focus:ring-1 focus:ring-accent-primary"
                aria-label={`Remove ${component} filter`}
              >
                <span className="material-icons text-sm">close</span>
              </button>
            </span>
          )}
          {selectedAssignee && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-primary/20 px-2 py-1 text-xs text-accent-primary">
              {assignees.find((a) => a.email === selectedAssignee)?.displayName ?? selectedAssignee}
              <button
                type="button"
                onClick={() => {
                  if (onAssigneeChange) {
                    onAssigneeChange(null)
                  }
                }}
                className="ml-1 rounded-full hover:bg-accent-primary/30 focus:outline-none focus:ring-1 focus:ring-accent-primary"
                aria-label={`Remove assignee filter`}
              >
                <span className="material-icons text-sm">close</span>
              </button>
            </span>
          )}
          {sortOrder !== 'priority' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-primary/20 px-2 py-1 text-xs text-accent-primary">
              Last Changed
              <button
                type="button"
                onClick={() => {
                  onSortOrderChange('priority')
                }}
                className="ml-1 rounded-full hover:bg-accent-primary/30 focus:outline-none focus:ring-1 focus:ring-accent-primary"
                aria-label={`Reset sort to priority`}
              >
                <span className="material-icons text-sm">close</span>
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
