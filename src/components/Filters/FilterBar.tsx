import type { KeyboardEvent } from 'react'
import type { SortOrder } from '@/lib/bugzilla/sort-bugs'
import type { Assignee } from '@/hooks/use-board-assignees'
import { AssigneeFilter } from './AssigneeFilter'

interface FilterBarProps {
  whiteboardTag: string
  component: string
  excludeMetaBugs: boolean
  sortOrder: SortOrder
  onWhiteboardTagChange: (value: string) => void
  onComponentChange: (value: string) => void
  onExcludeMetaBugsChange: (value: boolean) => void
  onSortOrderChange: (value: SortOrder) => void
  onApplyFilters: () => void
  isLoading: boolean
  assignees?: Assignee[]
  selectedAssignee?: string | null
  onAssigneeChange?: (email: string | null) => void
}

export function FilterBar({
  whiteboardTag,
  component,
  excludeMetaBugs,
  sortOrder,
  onWhiteboardTagChange,
  onComponentChange,
  onExcludeMetaBugsChange,
  onSortOrderChange,
  onApplyFilters,
  isLoading,
  assignees = [],
  selectedAssignee = null,
  onAssigneeChange,
}: FilterBarProps) {
  const hasFilters =
    whiteboardTag !== '' ||
    component !== '' ||
    excludeMetaBugs ||
    sortOrder !== 'priority' ||
    selectedAssignee !== null

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      onApplyFilters()
    }
  }

  const handleClear = () => {
    onWhiteboardTagChange('')
    onComponentChange('')
    onExcludeMetaBugsChange(false)
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
        <h2 className="text-lg font-bold text-text-primary">Filter your bugs 🔍</h2>
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
              onWhiteboardTagChange(e.target.value)
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
              onComponentChange(e.target.value)
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

        {/* Exclude meta bugs checkbox */}
        <div className="flex items-center gap-2 self-end pb-2">
          <input
            id="exclude-meta"
            type="checkbox"
            checked={excludeMetaBugs}
            onChange={(e) => {
              onExcludeMetaBugsChange(e.target.checked)
            }}
            disabled={isLoading}
            className="h-4 w-4 rounded border-bg-tertiary bg-bg-primary text-accent-primary focus:ring-accent-primary disabled:cursor-not-allowed disabled:opacity-50"
          />
          <label htmlFor="exclude-meta" className="text-sm text-text-secondary whitespace-nowrap">
            Exclude meta bugs
          </label>
        </div>

        {/* Sort order */}
        <div className="flex items-center gap-3 self-end pb-2">
          <span className="text-sm text-text-secondary">Sort:</span>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="sortOrder"
              value="priority"
              checked={sortOrder === 'priority'}
              onChange={() => {
                onSortOrderChange('priority')
              }}
              disabled={isLoading}
              className="h-4 w-4 border-bg-tertiary bg-bg-primary text-accent-primary focus:ring-accent-primary disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span className="text-sm text-text-secondary">Priority</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="sortOrder"
              value="lastChanged"
              checked={sortOrder === 'lastChanged'}
              onChange={() => {
                onSortOrderChange('lastChanged')
              }}
              disabled={isLoading}
              className="h-4 w-4 border-bg-tertiary bg-bg-primary text-accent-primary focus:ring-accent-primary disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span className="text-sm text-text-secondary whitespace-nowrap">Last Changed</span>
          </label>
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
            className="rounded bg-accent-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
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
    </div>
  )
}
