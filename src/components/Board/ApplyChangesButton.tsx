import { motion, AnimatePresence } from 'framer-motion'

interface ApplyChangesButtonProps {
  changeCount: number
  isApplying: boolean
  onApply: () => void
}

export function ApplyChangesButton({ changeCount, isApplying, onApply }: ApplyChangesButtonProps) {
  if (changeCount === 0) {
    // eslint-disable-next-line unicorn/no-null -- React expects null for "render nothing"
    return null
  }

  const changeText = changeCount === 1 ? '1 change' : `${changeCount.toString()} changes`

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onApply}
        disabled={isApplying}
        aria-label={`Apply ${changeText} to Bugzilla`}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-accent-success px-6 py-4 font-bold text-white shadow-2xl transition-colors hover:bg-accent-success/90 disabled:cursor-not-allowed disabled:opacity-70"
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
    </AnimatePresence>
  )
}
