import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AnchorPosition {
  x: number
  y: number
}

interface SeverityPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (severity: string) => void
  currentSeverity: string
  anchorPosition?: AnchorPosition
}

const SEVERITY_OPTIONS = [
  { value: 'blocker', label: 'blocker', description: 'Blocks development', color: 'bg-red-700' },
  { value: 'critical', label: 'critical', description: 'Severe impact', color: 'bg-red-500' },
  { value: 'major', label: 'major', description: 'Major functionality', color: 'bg-orange-500' },
  { value: 'normal', label: 'normal', description: 'Default severity', color: 'bg-gray-500' },
  { value: 'minor', label: 'minor', description: 'Minor issue', color: 'bg-green-500' },
  { value: 'trivial', label: 'trivial', description: 'Trivial fix', color: 'bg-green-400' },
  {
    value: 'enhancement',
    label: 'enhancement',
    description: 'Feature request',
    color: 'bg-blue-500',
  },
] as const

export function SeverityPicker({
  isOpen,
  onClose,
  onSelect,
  currentSeverity,
  anchorPosition,
}: SeverityPickerProps) {
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

  const handleSelect = (severity: string) => {
    onSelect(severity)
    onClose()
  }

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
              anchorPosition ? '' : 'left-4 right-4 top-16 sm:left-auto sm:right-4'
            }`}
            style={
              anchorPosition
                ? {
                    left: `${anchorPosition.x.toString()}px`,
                    top: `${anchorPosition.y.toString()}px`,
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
            <ul role="listbox" aria-label="Select severity" className="max-h-64 overflow-y-auto">
              {SEVERITY_OPTIONS.map((option) => {
                const isSelected = currentSeverity === option.value
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
