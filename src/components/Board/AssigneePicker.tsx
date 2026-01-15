import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Assignee } from '@/hooks/use-board-assignees'
import { usePopupPosition } from '@/hooks/use-popup-position'

interface AnchorPosition {
  x: number
  y: number
}

const POPUP_WIDTH = 288 // w-72
const POPUP_HEIGHT = 300 // estimate for header + list

interface AssigneePickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (email: string) => void
  assignees: Assignee[]
  currentAssignee: string
  anchorPosition?: AnchorPosition
}

export function AssigneePicker({
  isOpen,
  onClose,
  onSelect,
  assignees,
  currentAssignee,
  anchorPosition,
}: AssigneePickerProps) {
  const adjustedPosition = usePopupPosition({
    anchorPosition,
    popupWidth: POPUP_WIDTH,
    popupHeight: POPUP_HEIGHT,
  })

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleSelect = (email: string) => {
    onSelect(email)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-testid="assignee-picker-backdrop"
          className="fixed inset-0 z-40"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              onClose()
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`absolute z-50 max-h-64 w-72 overflow-hidden rounded-lg bg-bg-secondary shadow-2xl ring-1 ring-bg-tertiary ${
              adjustedPosition ? '' : 'left-4 right-4 top-16 sm:left-auto sm:right-4'
            }`}
            style={
              adjustedPosition
                ? {
                    left: `${adjustedPosition.x.toString()}px`,
                    top: `${adjustedPosition.y.toString()}px`,
                  }
                : undefined
            }
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            {/* Header */}
            <div className="border-b border-bg-tertiary px-4 py-2">
              <p className="text-xs text-text-tertiary">Assignees on this board</p>
            </div>

            {/* Assignee list */}
            <ul role="listbox" aria-label="Select assignee" className="max-h-48 overflow-y-auto">
              {assignees.length === 0 ? (
                <li className="px-4 py-3 text-center text-sm text-text-tertiary">
                  No assignees found
                </li>
              ) : (
                assignees.map((assignee) => {
                  const isSelected = assignee.email === currentAssignee
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
                      {/* Account circle icon */}
                      <span className="material-icons text-text-tertiary">account_circle</span>

                      {/* Name and count */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {assignee.displayName}
                        </p>
                      </div>

                      {/* Checkmark for current */}
                      {isSelected && (
                        <span className="material-icons text-accent-success">check</span>
                      )}
                    </li>
                  )
                })
              )}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
