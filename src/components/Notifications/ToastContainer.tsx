import { AnimatePresence } from 'framer-motion'
import { Toast } from './Toast'
import type { Toast as ToastType } from '@/types'

interface ToastContainerProps {
  toasts: ToastType[]
  removeToast: (id: string) => void
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2 max-w-md w-full px-4">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  )
}
