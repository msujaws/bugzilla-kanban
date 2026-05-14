import type { StateCreator } from 'zustand'

export type ViewMode = 'kanban' | 'gantt'

export interface UISlice {
  assigneeFilter?: string
  viewMode: ViewMode
  setAssigneeFilter: (email?: string) => void
  setViewMode: (mode: ViewMode) => void
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  assigneeFilter: undefined,
  viewMode: 'kanban',

  setAssigneeFilter: (email?: string) => {
    set({ assigneeFilter: email })
  },

  setViewMode: (mode: ViewMode) => {
    set({ viewMode: mode })
  },
})
