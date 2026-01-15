import { useMemo } from 'react'

interface AnchorPosition {
  x: number
  y: number
}

interface UsePopupPositionOptions {
  anchorPosition: AnchorPosition | undefined
  popupWidth: number
  popupHeight: number
  padding?: number
}

/**
 * Calculates an adjusted position for a popup to keep it within the viewport.
 * Moves the popup just enough to prevent it from extending outside the viewport.
 */
export function usePopupPosition({
  anchorPosition,
  popupWidth,
  popupHeight,
  padding = 8,
}: UsePopupPositionOptions): AnchorPosition | undefined {
  return useMemo(() => {
    if (!anchorPosition) {
      return
    }

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let { x, y } = anchorPosition

    // Adjust for right overflow
    const rightOverflow = x + popupWidth - (viewportWidth - padding)
    if (rightOverflow > 0) {
      x = Math.max(padding, x - rightOverflow)
    }

    // Adjust for left overflow
    if (x < padding) {
      x = padding
    }

    // Adjust for bottom overflow
    const bottomOverflow = y + popupHeight - (viewportHeight - padding)
    if (bottomOverflow > 0) {
      y = Math.max(padding, y - bottomOverflow)
    }

    // Adjust for top overflow
    if (y < padding) {
      y = padding
    }

    return { x, y }
  }, [anchorPosition, popupWidth, popupHeight, padding])
}
