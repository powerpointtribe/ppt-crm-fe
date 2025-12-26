import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'

export interface Branch {
  _id: string
  name: string
  slug: string
  isActive: boolean
}

interface AppState {
  currentUser: User | null
  sidebarCollapsed: boolean
  loading: boolean
  error: string | null
  // API loading state
  apiLoadingCount: number
  isApiLoading: boolean
  // Branch selection state
  selectedBranch: Branch | null // null means "All Branches"
  branches: Branch[]
  setCurrentUser: (user: User | null) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  // API loading actions
  startApiLoading: () => void
  stopApiLoading: () => void
  // Branch actions
  setSelectedBranch: (branch: Branch | null) => void
  setBranches: (branches: Branch[]) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      sidebarCollapsed: false,
      loading: false,
      error: null,
      apiLoadingCount: 0,
      isApiLoading: false,
      selectedBranch: null,
      branches: [],
      setCurrentUser: (user) => set({ currentUser: user }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      startApiLoading: () => set((state) => ({
        apiLoadingCount: state.apiLoadingCount + 1,
        isApiLoading: true
      })),
      stopApiLoading: () => set((state) => {
        const newCount = Math.max(0, state.apiLoadingCount - 1)
        return {
          apiLoadingCount: newCount,
          isApiLoading: newCount > 0
        }
      }),
      setSelectedBranch: (branch) => set({ selectedBranch: branch }),
      setBranches: (branches) => set({ branches }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        selectedBranch: state.selectedBranch,
      }),
    }
  )
)