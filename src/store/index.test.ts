import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from './index'

describe('Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({
      toasts: [],
    })
  })

  describe('notifications', () => {
    it('should add a toast', () => {
      const { addToast } = useStore.getState()

      addToast('success', 'Test message')

      const { toasts } = useStore.getState()
      expect(toasts).toHaveLength(1)
      expect(toasts[0]).toMatchObject({
        type: 'success',
        message: 'Test message',
        dismissible: true,
        autoClose: 3000,
      })
    })

    it('should remove a toast', () => {
      const { addToast, removeToast } = useStore.getState()

      addToast('success', 'Test message')
      const { toasts: toastsAfterAdd } = useStore.getState()
      const toast = toastsAfterAdd[0]

      expect(toast).toBeDefined()
      if (toast) {
        removeToast(toast.id)
      }

      const { toasts } = useStore.getState()
      expect(toasts).toHaveLength(0)
    })

    it('should clear all toasts', () => {
      const { addToast, clearAllToasts } = useStore.getState()

      addToast('success', 'First')
      addToast('error', 'Second')
      addToast('info', 'Third')

      const { toasts: toastsAfterAdd } = useStore.getState()
      expect(toastsAfterAdd).toHaveLength(3)

      clearAllToasts()

      const { toasts } = useStore.getState()
      expect(toasts).toHaveLength(0)
    })
  })
})
