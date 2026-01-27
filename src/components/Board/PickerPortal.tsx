import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

interface PickerPortalProps {
  children: ReactNode
}

/**
 * Renders picker content to document.body via React Portal.
 * This is necessary because cards use CSS transform for virtual scrolling,
 * which creates a new containing block for position:fixed elements.
 * Without the portal, fixed-position picker backdrops would be constrained
 * to the transformed card instead of covering the viewport.
 */
export function PickerPortal({ children }: PickerPortalProps) {
  return createPortal(children, document.body)
}
