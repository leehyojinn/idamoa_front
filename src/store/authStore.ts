import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/navbar'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  clearAuth: () => void
  updateProfileStatus: (profileCompleted: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user
      }),

      clearAuth: () => set({
        user: null,
        isAuthenticated: false
      }),

      updateProfileStatus: (profileCompleted) => set((state) => ({
        user: state.user ? { ...state.user, profileCompleted } : null
      }))
    }),
    {
      name: 'auth-storage',
    }
  )
)
