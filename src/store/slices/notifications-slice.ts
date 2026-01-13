import type { StateCreator } from 'zustand'
import type { Toast, ToastType } from '@/types'

export interface NotificationsSlice {
  toasts: Toast[]
  addToast: (type: ToastType, message: string) => void
  removeToast: (id: string) => void
  clearAllToasts: () => void
}

export const createNotificationsSlice: StateCreator<NotificationsSlice> = (set, _get) => ({
  toasts: [],

  addToast: (type: ToastType, message: string) => {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).slice(2, 9)
    const id = `toast-${timestamp}-${random}`

    const toast: Toast = {
      id,
      type,
      message,
      dismissible: true,
      // Error toasts don't auto-dismiss, success and info do
      autoClose: type === 'error' ? undefined : 3000,
    }

    set((state) => ({
      toasts: [...state.toasts, toast],
    }))
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }))
  },

  clearAllToasts: () => {
    set({ toasts: [] })
  },
})
