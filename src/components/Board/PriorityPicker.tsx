import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePopupPosition } from '@/hooks/use-popup-position'

interface AnchorPosition {
  x: number
  y: number
}

const POPUP_WIDTH = 192 // w-48
const POPUP_HEIGHT = 300 // estimate for header + list

interface PriorityPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (priority: string) => void
  currentPriority: string
  anchorPosition?: AnchorPosition
  listboxId?: string
}

const PRIORITY_OPTIONS = [
  { value: 'P1', label: 'P1', description: 'Highest', color: 'bg-red-500' },
  { value: 'P2', label: 'P2', description: 'High', color: 'bg-orange-500' },
  { value: 'P3', label: 'P3', description: 'Normal', color: 'bg-yellow-500' },
  { value: 'P4', label: 'P4', description: 'Low', color: 'bg-blue-500' },
  { value: 'P5', label: 'P5', description: 'Lowest', color: 'bg-gray-500' },
] as const

export function PriorityPicker({
  isOpen,
  onClose,
  onSelect,
  currentPriority,
  anchorPosition,
  listboxId,
}: PriorityPickerProps) {
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

  const handleSelect = (priority: string) => {
    onSelect(priority)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-testid="priority-picker-backdrop"
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
            className={`absolute z-50 w-48 overflow-hidden rounded-lg bg-bg-secondary shadow-2xl ring-1 ring-bg-tertiary ${
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
              <p className="text-xs text-text-tertiary">Priority</p>
            </div>

            {/* Priority list */}
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Select priority"
              className="max-h-64 overflow-y-auto"
            >
              {PRIORITY_OPTIONS.map((option) => {
                const isSelected = currentPriority === option.value
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      handleSelect(option.value)
                    }}
                    className={`flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors hover:bg-bg-tertiary ${
                      isSelected ? 'bg-bg-tertiary/50' : ''
                    }`}
                  >
                    {/* Color indicator */}
                    <span className={`h-3 w-3 rounded-full ${option.color}`} />

                    {/* Label and description */}
                    <div className="flex-1">
                      <span className="text-sm font-medium text-text-primary">{option.label}</span>
                      <span className="ml-2 text-xs text-text-tertiary">{option.description}</span>
                    </div>

                    {/* Checkmark for current */}
                    {isSelected && (
                      <span className="material-icons text-accent-success">check</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
