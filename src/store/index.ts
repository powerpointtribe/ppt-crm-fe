import { create } from 'zustand'
import { User } from '@/types'

interface AppState {
  currentUser: User | null
  sidebarCollapsed: boolean
  loading: boolean
  error: string | null
  // API loading state
  apiLoadingCount: number
  isApiLoading: boolean
  setCurrentUser: (user: User | null) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  // API loading actions
  startApiLoading: () => void
  stopApiLoading: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  sidebarCollapsed: false,
  loading: false,
  error: null,
  apiLoadingCount: 0,
  isApiLoading: false,
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
}))