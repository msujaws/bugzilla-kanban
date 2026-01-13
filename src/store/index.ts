import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createNotificationsSlice, type NotificationsSlice } from './slices/notifications-slice'
import { createAuthSlice, type AuthSlice } from './slices/auth-slice'
import { createBugsSlice, type BugsSlice } from './slices/bugs-slice'
import { createStagedSlice, type StagedSlice } from './slices/staged-slice'

// Combined store type
export type AppStore = NotificationsSlice & AuthSlice & BugsSlice & StagedSlice

// Create the store with all slices
export const useStore = create<AppStore>()(
  devtools(
    (...args) => ({
      ...createNotificationsSlice(...args),
      ...createAuthSlice(...args),
      ...createBugsSlice(...args),
      ...createStagedSlice(...args),
    }),
    { name: 'BugzillaKanbanStore' },
  ),
)
