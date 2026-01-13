import { useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Toast as ToastType } from '@/types'

interface ToastProps {
  toast: ToastType
  onClose: (id: string) => void
}

const toastConfig = {
  success: {
    icon: 'check_circle',
    borderColor: 'border-accent-success',
    iconColor: 'text-accent-success',
  },
  error: {
    icon: 'error',
    borderColor: 'border-accent-error',
    iconColor: 'text-accent-error',
  },
  info: {
    icon: 'info',
    borderColor: 'border-accent-primary',
    iconColor: 'text-accent-primary',
  },
}

export function Toast({ toast, onClose }: ToastProps) {
  const config = toastConfig[toast.type]

  // Auto-close timer
  useEffect(() => {
    if (toast.autoClose) {
      const timer = setTimeout(() => {
        onClose(toast.id)
      }, toast.autoClose)

      return () => {
        clearTimeout(timer)
      }
    }
  }, [toast.id, toast.autoClose, onClose])

  const handleClose = () => {
    onClose(toast.id)
  }

  return (
    <motion.div
      role="alert"
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 500 }}
      className={`
        flex items-start gap-3 w-full max-w-md
        bg-bg-secondary/95 backdrop-blur-sm
        border-l-4 ${config.borderColor}
        rounded-lg shadow-lg
        p-4
      `}
    >
      {/* Icon */}
      <span className={`material-icons ${config.iconColor} text-2xl flex-shrink-0`}>
        {config.icon}
      </span>

      {/* Message */}
      <p className="text-text-primary text-sm flex-1 pt-0.5">{toast.message}</p>

      {/* Close button */}
      {toast.dismissible && (
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close notification"
          className="
            material-icons text-text-secondary hover:text-text-primary
            text-xl flex-shrink-0
            transition-colors duration-200
            cursor-pointer
          "
        >
          close
        </button>
      )}
    </motion.div>
  )
}
