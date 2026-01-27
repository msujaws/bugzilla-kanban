import type { StateCreator } from 'zustand'

export interface UISlice {
  assigneeFilter?: string
  setAssigneeFilter: (email?: string) => void
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  assigneeFilter: undefined,

  setAssigneeFilter: (email?: string) => {
    set({ assigneeFilter: email })
  },
})
