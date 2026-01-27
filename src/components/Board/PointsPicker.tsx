import { motion, AnimatePresence } from 'framer-motion'
import { usePopupPosition } from '@/hooks/use-popup-position'
import { useListboxKeyboard } from '@/hooks/use-listbox-keyboard'
import { PickerPortal } from './PickerPortal'

interface AnchorPosition {
  x: number
  y: number
}

const POPUP_WIDTH = 192 // w-48
const POPUP_HEIGHT = 300 // estimate for header + list

interface PointsPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (points: number | string | undefined) => void
  currentPoints?: number | string
  anchorPosition?: AnchorPosition
  listboxId?: string
}

const POINTS_OPTIONS = [
  { value: undefined, label: '---' },
  { value: '?', label: '?' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 5, label: '5' },
  { value: 8, label: '8' },
  { value: 13, label: '13' },
  { value: 21, label: '21' },
] as const

export function PointsPicker({
  isOpen,
  onClose,
  onSelect,
  currentPoints,
  anchorPosition,
  listboxId,
}: PointsPickerProps) {
  const adjustedPosition = usePopupPosition({
    anchorPosition,
    popupWidth: POPUP_WIDTH,
    popupHeight: POPUP_HEIGHT,
  })

  const handleSelect = (points: number | string | undefined) => {
    onSelect(points)
    onClose()
  }

  // Use string labels as unique identifiers for the hook since values can be undefined
  const { focusedIndex, getOptionId, listboxProps } = useListboxKeyboard({
    options: POINTS_OPTIONS.map((opt) => ({ value: opt.label, label: opt.label })),
    isOpen,
    onSelect: (label) => {
      const option = POINTS_OPTIONS.find((opt) => opt.label === label)
      if (option) handleSelect(option.value)
    },
    onClose,
    currentValue: POINTS_OPTIONS.find((opt) => opt.value === currentPoints)?.label,
  })

  return (
    <PickerPortal>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-testid="points-picker-backdrop"
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
                <p className="text-xs text-text-tertiary">Story Points</p>
              </div>

              {/* Points list */}
              <ul
                id={listboxId}
                role="listbox"
                aria-label="Select story points"
                className="max-h-64 overflow-y-auto"
                {...listboxProps}
              >
                {POINTS_OPTIONS.map((option, index) => {
                  const isSelected = currentPoints === option.value
                  const isFocused = focusedIndex === index
                  // Create descriptive aria-label based on option type
                  const getAriaLabel = () => {
                    if (option.value === undefined)
                      return `Clear points${isSelected ? ', currently selected' : ''}`
                    if (option.value === '?')
                      return `Unknown points${isSelected ? ', currently selected' : ''}`
                    return `${String(option.value)} points${isSelected ? ', currently selected' : ''}`
                  }
                  return (
                    <li
                      key={option.label}
                      id={getOptionId(index)}
                      role="option"
                      aria-selected={isSelected}
                      aria-label={getAriaLabel()}
                      onClick={() => {
                        handleSelect(option.value)
                      }}
                      className={`flex cursor-pointer items-center justify-between px-4 py-2 transition-colors ${
                        isSelected ? 'bg-bg-tertiary-50' : ''
                      } ${isFocused ? 'ring-2 ring-inset ring-accent-primary' : 'hover:bg-bg-tertiary'}`}
                    >
                      <span className="text-sm font-medium text-text-primary">{option.label}</span>

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
    </PickerPortal>
  )
}
