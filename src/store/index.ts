import { create, type StateCreator } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createNotificationsSlice, type NotificationsSlice } from './slices/notifications-slice'
import { createAuthSlice, type AuthSlice } from './slices/auth-slice'
import { createBugsSlice, type BugsSlice } from './slices/bugs-slice'
import { createStagedSlice, type StagedSlice } from './slices/staged-slice'
import { createUISlice, type UISlice } from './slices/ui-slice'

// Combined store type
export type AppStore = NotificationsSlice & AuthSlice & BugsSlice & StagedSlice & UISlice

// Combined slice creator
const createSlices: StateCreator<AppStore> = (...args) => ({
  ...createNotificationsSlice(...args),
  ...createAuthSlice(...args),
  ...createBugsSlice(...args),
  ...createStagedSlice(...args),
  ...createUISlice(...args),
})

// Create the store - only enable devtools in development
// In production, devtools are disabled to prevent API key exposure
export const useStore = import.meta.env.DEV
  ? create<AppStore>()(devtools(createSlices, { name: 'BugzillaKanbanStore' }))
  : create<AppStore>()(createSlices)
