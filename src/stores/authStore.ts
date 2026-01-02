import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/types/navbar'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  accessToken: string | null
  _hasHydrated: boolean // localStorage 로딩 완료 여부
  setUser: (user: User | null) => void
  setAccessToken: (token: string | null) => void
  setHasHydrated: (hasHydrated: boolean) => void
  clearAuth: () => void
  updateProfileStatus: (profileCompleted: boolean) => void
  updateUserRole: (role: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      _hasHydrated: false,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user
      }),

      setAccessToken: (token) => set({
        accessToken: token,
        isAuthenticated: !!token
      }),

      setHasHydrated: (hasHydrated) => set({
        _hasHydrated: hasHydrated
      }),

      clearAuth: () => set({
        user: null,
        isAuthenticated: false,
        accessToken: null
      }),

      updateProfileStatus: (profileCompleted) => set((state) => ({
        user: state.user ? { ...state.user, profileCompleted } : null
      })),

      updateUserRole: (role) => set((state) => ({
        user: state.user ? { ...state.user, currentRole: role } : null
      }))
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken
      })
    }
  )
)
