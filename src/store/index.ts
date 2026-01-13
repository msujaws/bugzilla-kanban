import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createNotificationsSlice, type NotificationsSlice } from './slices/notifications-slice'

// Combined store type
export type AppStore = NotificationsSlice

// Create the store with all slices
export const useStore = create<AppStore>()(
  devtools(
    (...args) => ({
      ...createNotificationsSlice(...args),
    }),
    { name: 'BugzillaKanbanStore' },
  ),
)
