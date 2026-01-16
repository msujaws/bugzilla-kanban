import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFocusTrap } from '@/hooks/use-focus-trap'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface OriginStoryModalProps {
  isOpen: boolean
  onClose: () => void
}

export function OriginStoryModal({ isOpen, onClose }: OriginStoryModalProps) {
  const dialogReference = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  // Trap focus within dialog when open
  useFocusTrap(dialogReference, isOpen)

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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={prefersReducedMotion ? { duration: 0.01 } : undefined}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              onClose()
            }
          }}
        >
          <motion.div
            ref={dialogReference}
            initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0.01 } : undefined}
            role="dialog"
            aria-modal="true"
            aria-labelledby="origin-story-modal-title"
            className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg bg-bg-secondary shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-bg-tertiary px-6 py-4">
              <h2 id="origin-story-modal-title" className="text-xl font-bold text-text-primary">
                The Legend of Boardzilla
              </h2>
              <button
                onClick={onClose}
                className="rounded p-1 text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                aria-label="Close origin story"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            {/* Story Content */}
            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
              <div className="space-y-4 text-text-secondary">
                <p>
                  <img
                    src="/mascot.webp"
                    alt="Boardzilla the friendly dinosaur"
                    className="mr-4 mb-2 float-left w-32"
                  />
                  Long ago, in the vast digital realm of bugzilla.mozilla.org, there lived a small,
                  friendly dinosaur named Boardzilla. Unlike the other creatures who simply
                  catalogued bugs, Boardzilla had a rare gift: the ability to whisper to bugs. They
                  could hear the bugs' stories, understand their frustrations, and sense exactly
                  where each bug belonged.
                </p>

                <p>
                  Day after day, Boardzilla helped organize millions of bugs, fueled only by an
                  endless supply of sugar free Red Bull (the official beverage of bug wranglers
                  everywhere). Life was good, if a bit chaotic.
                </p>

                <p>
                  Then one fateful afternoon, during a particularly routine CSV export, something
                  unexpected happened. A developer clicked "Export All" and accidentally swept
                  Boardzilla right into the data stream! In a flash of ones and zeros, our hero
                  tumbled through the internet, emerging confused but curious in a brand new world.
                  A world of kanban boards and sprint planning.
                </p>

                <p>
                  At first, Boardzilla felt lost. But then they noticed developers struggling. Bugs
                  scattered everywhere, no clear workflow, chaos reigning supreme. And lurking in
                  the shadows was the nefarious Scope Creep, a sneaky villain who kept adding bugs
                  when no one was looking, making backlogs grow infinitely larger.
                </p>

                <p>
                  Boardzilla knew what they had to do. Drawing upon their bug-whispering powers and
                  fueled by that sweet Red Bull energy, they vowed to help developers everywhere
                  organize their work, honoring the open source spirit of sharing and collaboration
                  that Mozilla had taught them. And so Boardzilla became the guardian of this humble
                  kanban board, forever helping bugs find their rightful columns and keeping Scope
                  Creep at bay.
                </p>

                <p className="pt-2 text-center text-sm italic text-text-tertiary">
                  The end... or is it just the beginning?
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-bg-tertiary px-6 py-4">
              <p className="text-center text-sm text-text-tertiary">
                Shhh... you found the secret! Thanks for clicking on our mascot.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
