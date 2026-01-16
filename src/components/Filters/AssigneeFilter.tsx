import { useState, useEffect, useRef, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Assignee } from '@/hooks/use-board-assignees'

interface AssigneeFilterProps {
  assignees: Assignee[]
  selectedAssignee: string | null
  onSelect: (email: string | null) => void
  disabled?: boolean
}

export function AssigneeFilter({
  assignees,
  selectedAssignee,
  onSelect,
  disabled = false,
}: AssigneeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  // Find selected assignee's display name
  const selectedDisplayName = selectedAssignee
    ? (assignees.find((a) => a.email === selectedAssignee)?.displayName ?? selectedAssignee)
    : 'All Assignees'

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (email: string | null) => {
    onSelect(email)
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
        }}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        className="flex min-w-[160px] items-center gap-2 rounded border border-bg-tertiary bg-bg-primary px-3 py-2 text-sm text-text-primary transition-colors hover:bg-bg-tertiary focus:border-accent-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="material-icons text-base text-text-secondary">person</span>
        <span className="flex-1 truncate text-left">{selectedDisplayName}</span>
        <span className="material-icons text-base text-text-secondary">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-lg bg-bg-secondary shadow-2xl ring-1 ring-bg-tertiary"
          >
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Filter by assignee"
              className="max-h-64 overflow-y-auto"
            >
              {/* All Assignees option */}
              <li
                role="option"
                aria-selected={selectedAssignee === null}
                onClick={() => {
                  handleSelect(null)
                }}
                className={`flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors hover:bg-bg-tertiary ${
                  selectedAssignee === null ? 'bg-bg-tertiary/50' : ''
                }`}
              >
                <span className="material-icons text-text-tertiary">group</span>
                <span className="flex-1 text-sm font-medium text-text-primary">All Assignees</span>
                {selectedAssignee === null && (
                  <span className="material-icons text-accent-success">check</span>
                )}
              </li>

              {/* Divider */}
              <li className="border-t border-bg-tertiary" role="separator" />

              {/* Assignee list */}
              {assignees.map((assignee) => {
                const isSelected = assignee.email === selectedAssignee
                return (
                  <li
                    key={assignee.email}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      handleSelect(assignee.email)
                    }}
                    className={`flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors hover:bg-bg-tertiary ${
                      isSelected ? 'bg-bg-tertiary/50' : ''
                    }`}
                  >
                    <span className="material-icons text-text-tertiary">account_circle</span>
                    <span className="flex-1 truncate text-sm font-medium text-text-primary">
                      {assignee.displayName}
                    </span>
                    <span className="text-xs text-text-tertiary">({assignee.count})</span>
                    {isSelected && (
                      <span className="material-icons text-accent-success">check</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
