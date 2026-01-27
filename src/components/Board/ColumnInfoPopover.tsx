import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePopupPosition } from '@/hooks/use-popup-position'
import { PickerPortal } from './PickerPortal'

interface AnchorPosition {
  x: number
  y: number
}

const POPUP_WIDTH = 280
const POPUP_HEIGHT = 100

interface ColumnInfoPopoverProps {
  isOpen: boolean
  onClose: () => void
  description: string
  anchorPosition?: AnchorPosition
}

export function ColumnInfoPopover({
  isOpen,
  onClose,
  description,
  anchorPosition,
}: ColumnInfoPopoverProps) {
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

  return (
    <PickerPortal>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-testid="column-info-backdrop"
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
              role="dialog"
              aria-label="Column information"
              className={`absolute z-50 w-70 overflow-hidden rounded-lg bg-bg-secondary shadow-2xl ring-1 ring-bg-tertiary ${
                adjustedPosition ? '' : 'left-4 right-4 top-16 sm:left-auto sm:right-4'
              }`}
              style={
                adjustedPosition
                  ? {
                      left: `${adjustedPosition.x.toString()}px`,
                      top: `${adjustedPosition.y.toString()}px`,
                      width: `${POPUP_WIDTH.toString()}px`,
                    }
                  : undefined
              }
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              {/* Header */}
              <div className="border-b border-bg-tertiary px-4 py-2">
                <p className="text-xs font-medium text-text-secondary">Column Info</p>
              </div>

              {/* Description */}
              <div className="px-4 py-3">
                <p className="text-sm text-text-primary">{description}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PickerPortal>
  )
}
