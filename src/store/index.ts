import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createNotificationsSlice, type NotificationsSlice } from './slices/notifications-slice'
import { createAuthSlice, type AuthSlice } from './slices/auth-slice'

// Combined store type
export type AppStore = NotificationsSlice & AuthSlice

// Create the store with all slices
export const useStore = create<AppStore>()(
  devtools(
    (...args) => ({
      ...createNotificationsSlice(...args),
      ...createAuthSlice(...args),
    }),
    { name: 'BugzillaKanbanStore' },
  ),
)
