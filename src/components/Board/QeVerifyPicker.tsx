import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { QeVerifyStatus } from '@/lib/bugzilla/qe-verify'

interface AnchorPosition {
  x: number
  y: number
}

interface QeVerifyPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (status: QeVerifyStatus) => void
  currentStatus: QeVerifyStatus
  anchorPosition?: AnchorPosition
}

const QE_VERIFY_OPTIONS = [
  { value: 'unknown' as const, label: 'qe-verify: ---', description: 'Remove flag' },
  { value: 'minus' as const, label: 'qe-verify: -', description: 'Not needed' },
  { value: 'plus' as const, label: 'qe-verify: +', description: 'Verified' },
]

export function QeVerifyPicker({
  isOpen,
  onClose,
  onSelect,
  currentStatus,
  anchorPosition,
}: QeVerifyPickerProps) {
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

  const handleSelect = (status: QeVerifyStatus) => {
    onSelect(status)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-testid="qe-verify-picker-backdrop"
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
              <p className="text-xs text-text-tertiary">QE Verification</p>
            </div>

            {/* Options list */}
            <ul
              role="listbox"
              aria-label="Select QE verification"
              className="max-h-64 overflow-y-auto"
            >
              {QE_VERIFY_OPTIONS.map((option) => {
                const isSelected = currentStatus === option.value
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
