import { create } from 'zustand'

interface PopupStore {
  // 온보딩 팝업이 활성화 상태인지
  isOnboardingActive: boolean
  setOnboardingActive: (active: boolean) => void
}

export const usePopupStore = create<PopupStore>((set) => ({
  isOnboardingActive: false,
  setOnboardingActive: (active) => set({ isOnboardingActive: active }),
}))
