import type { StateCreator } from 'zustand'

export interface UISlice {
  assigneeFilter: string | null
  setAssigneeFilter: (email: string | null) => void
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  assigneeFilter: null,

  setAssigneeFilter: (email: string | null) => {
    set({ assigneeFilter: email })
  },
})
