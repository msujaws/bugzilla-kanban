import type { KeyboardEvent } from 'react'

interface FilterBarProps {
  whiteboardTag: string
  component: string
  excludeMetaBugs: boolean
  onWhiteboardTagChange: (value: string) => void
  onComponentChange: (value: string) => void
  onExcludeMetaBugsChange: (value: boolean) => void
  onApplyFilters: () => void
  isLoading: boolean
}

export function FilterBar({
  whiteboardTag,
  component,
  excludeMetaBugs,
  onWhiteboardTagChange,
  onComponentChange,
  onExcludeMetaBugsChange,
  onApplyFilters,
  isLoading,
}: FilterBarProps) {
  const hasFilters = whiteboardTag !== '' || component !== '' || excludeMetaBugs

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      onApplyFilters()
    }
  }

  const handleClear = () => {
    onWhiteboardTagChange('')
    onComponentChange('')
    onExcludeMetaBugsChange(false)
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
