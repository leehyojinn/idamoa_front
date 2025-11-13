import { create } from 'zustand'

interface PasswordResetState {
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
}

export const usePasswordResetStore = create<PasswordResetState>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
}))
