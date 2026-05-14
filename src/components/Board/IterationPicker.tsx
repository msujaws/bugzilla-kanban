import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePopupPosition } from '@/hooks/use-popup-position'
import { useListboxKeyboard } from '@/hooks/use-listbox-keyboard'
import { PickerPortal } from './PickerPortal'

interface AnchorPosition {
  x: number
  y: number
}

const POPUP_WIDTH = 192
const POPUP_HEIGHT = 220
const CLEAR_LABEL = '---'

interface IterationPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (iteration: string | undefined) => void
  iterationOptions: string[]
  currentIteration?: string
  anchorPosition?: AnchorPosition
  listboxId?: string
}

export function IterationPicker({
  isOpen,
  onClose,
  onSelect,
  iterationOptions,
  currentIteration,
  anchorPosition,
  listboxId,
}: IterationPickerProps) {
  const adjustedPosition = usePopupPosition({
    anchorPosition,
    popupWidth: POPUP_WIDTH,
    popupHeight: POPUP_HEIGHT,
  })

  // Stable, label-keyed option list (mirrors the PointsPicker pattern so the
  // listbox hook receives a consistent reference set).
  const options = useMemo(
    () => [
      { value: undefined as string | undefined, label: CLEAR_LABEL },
      ...iterationOptions.map((iteration) => ({
        value: iteration as string | undefined,
        label: iteration,
      })),
    ],
    [iterationOptions],
  )

  const handleSelect = (value: string | undefined) => {
    onSelect(value)
    onClose()
  }

  const { focusedIndex, getOptionId, listboxProps } = useListboxKeyboard({
    options: options.map((opt) => ({ value: opt.label, label: opt.label })),
    isOpen,
    onSelect: (label) => {
      const option = options.find((opt) => opt.label === label)
      if (option) handleSelect(option.value)
    },
    onClose,
    currentValue: currentIteration ?? CLEAR_LABEL,
  })

  return (
    <PickerPortal>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-testid="iteration-picker-backdrop"
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
              <div className="border-b border-bg-tertiary px-4 py-2">
                <p className="text-xs text-text-tertiary">Iteration</p>
              </div>

              <ul
                id={listboxId}
                role="listbox"
                aria-label="Select iteration"
                className="max-h-64 overflow-y-auto"
                {...listboxProps}
              >
                {options.map((option, index) => {
                  const isSelected =
                    (currentIteration ?? CLEAR_LABEL) === (option.value ?? CLEAR_LABEL)
                  const isFocused = focusedIndex === index
                  return (
                    <li
                      key={option.label}
                      id={getOptionId(index)}
                      role="option"
                      aria-selected={isSelected}
                      aria-label={
                        option.value === undefined
                          ? `Clear iteration${isSelected ? ', currently selected' : ''}`
                          : `Iteration ${option.label}${isSelected ? ', currently selected' : ''}`
                      }
                      onClick={() => {
                        handleSelect(option.value)
                      }}
                      className={`flex cursor-pointer items-center justify-between px-4 py-2 transition-colors ${
                        isSelected ? 'bg-bg-tertiary-50' : ''
                      } ${isFocused ? 'ring-2 ring-inset ring-accent-primary' : 'hover:bg-bg-tertiary'}`}
                    >
                      <span className="text-sm font-medium text-text-primary">{option.label}</span>
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
