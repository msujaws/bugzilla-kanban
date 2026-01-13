// Toast notification types
export type ToastType = 'error' | 'success' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  dismissible: boolean
  autoClose?: number // milliseconds, undefined = no auto-close
}

export interface ToastOptions {
  autoClose?: number
}
