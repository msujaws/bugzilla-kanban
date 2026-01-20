import { motion, AnimatePresence } from 'framer-motion'
import { usePopupPosition } from '@/hooks/use-popup-position'
import { useListboxKeyboard } from '@/hooks/use-listbox-keyboard'

interface AnchorPosition {
  x: number
  y: number
}

const POPUP_WIDTH = 192 // w-48
const POPUP_HEIGHT = 300 // estimate for header + list

interface SeverityPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (severity: string) => void
  currentSeverity: string
  anchorPosition?: AnchorPosition
  listboxId?: string
}

const SEVERITY_OPTIONS = [
  { value: 'S1', label: 'S1', description: 'Catastrophic', color: 'bg-severity-s1' },
  { value: 'S2', label: 'S2', description: 'Serious', color: 'bg-severity-s2' },
  { value: 'S3', label: 'S3', description: 'Normal', color: 'bg-severity-s3' },
  { value: 'S4', label: 'S4', description: 'Minor', color: 'bg-severity-s4' },
  { value: 'N/A', label: 'N/A', description: 'Not applicable', color: 'bg-severity-na' },
] as const

export function SeverityPicker({
  isOpen,
  onClose,
  onSelect,
  currentSeverity,
  anchorPosition,
  listboxId,
}: SeverityPickerProps) {
  const adjustedPosition = usePopupPosition({
    anchorPosition,
    popupWidth: POPUP_WIDTH,
    popupHeight: POPUP_HEIGHT,
  })

  const handleSelect = (severity: string) => {
    onSelect(severity)
    onClose()
  }

  const { focusedIndex, getOptionId, listboxProps } = useListboxKeyboard({
    options: SEVERITY_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label })),
    isOpen,
    onSelect: handleSelect,
    onClose,
    currentValue: currentSeverity,
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-testid="severity-picker-backdrop"
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
              <p className="text-xs text-text-tertiary">Severity</p>
            </div>

            {/* Severity list */}
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Select severity"
              className="max-h-64 overflow-y-auto"
              {...listboxProps}
            >
              {SEVERITY_OPTIONS.map((option, index) => {
                const isSelected = currentSeverity === option.value
                const isFocused = focusedIndex === index
                const ariaLabel = `Severity ${option.label}: ${option.description}${isSelected ? ', currently selected' : ''}`
                return (
                  <li
                    key={option.value}
                    id={getOptionId(index)}
                    role="option"
                    aria-selected={isSelected}
                    aria-label={ariaLabel}
                    onClick={() => {
                      handleSelect(option.value)
                    }}
                    className={`flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors ${
                      isSelected ? 'bg-bg-tertiary-50' : ''
                    } ${isFocused ? 'ring-2 ring-inset ring-accent-primary' : 'hover:bg-bg-tertiary'}`}
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
