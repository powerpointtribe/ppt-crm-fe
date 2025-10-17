import { create } from 'zustand'
import { User } from '@/types'

interface AppState {
  currentUser: User | null
  sidebarCollapsed: boolean
  loading: boolean
  error: string | null
  setCurrentUser: (user: User | null) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  sidebarCollapsed: false,
  loading: false,
  error: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))