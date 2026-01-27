import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { StagedChange } from '@/store/slices/staged-slice'
import type { BugzillaBug } from '@/lib/bugzilla/types'
import { StagedChangesPreview } from './StagedChangesPreview'

interface ApplyChangesButtonProps {
  changes: Map<number, StagedChange>
  bugs: BugzillaBug[]
  isApplying: boolean
  onApply: () => void
  onClear: () => void
}

export function ApplyChangesButton({
  changes,
  bugs,
  isApplying,
  onApply,
  onClear,
}: ApplyChangesButtonProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const changeCount = changes.size
  if (changeCount === 0) {
    // eslint-disable-next-line unicorn/no-null -- React expects null for "render nothing"
    return null
  }

  const changeText = changeCount === 1 ? '1 change' : `${changeCount.toString()} changes`

  const togglePreview = () => {
    setIsPreviewOpen((prev) => !prev)
  }

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Preview panel */}
        {isPreviewOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-80"
          >
            <StagedChangesPreview changes={changes} bugs={bugs} />
          </motion.div>
        )}

        {/* Button row */}
        <div className="flex items-center gap-3">
          {/* Preview toggle button */}
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={togglePreview}
            disabled={isApplying}
            aria-label={isPreviewOpen ? 'Hide preview' : 'Show preview'}
            aria-expanded={isPreviewOpen}
            className="flex items-center gap-2 rounded-full bg-bg-tertiary px-4 py-4 font-bold text-text-primary shadow-xl transition-colors hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="material-icons">{isPreviewOpen ? 'expand_more' : 'expand_less'}</span>
            <span>Preview</span>
          </motion.button>

          {/* Clear button */}
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClear}
            disabled={isApplying}
            aria-label={`Clear ${changeText}`}
            className="flex items-center gap-2 rounded-full bg-bg-tertiary px-4 py-4 font-bold text-text-primary shadow-xl transition-colors hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="material-icons">delete_sweep</span>
            <span>Clear</span>
          </motion.button>

          {/* Apply button */}
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onApply}
            disabled={isApplying}
            aria-label={`Apply ${changeText} to Bugzilla`}
            className="flex items-center gap-3 rounded-full bg-accent-success px-6 py-4 font-bold text-white shadow-2xl transition-colors hover:bg-accent-success/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isApplying ? (
              <>
                <span className="material-icons animate-spin">sync</span>
                <span>Applying...</span>
              </>
            ) : (
              <>
                <span className="material-icons">cloud_upload</span>
                <span>Apply {changeText}</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-sm">
                  {changeCount}
                </span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </AnimatePresence>
  )
}
