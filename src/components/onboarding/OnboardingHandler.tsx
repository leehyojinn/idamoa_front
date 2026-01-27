'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { usePopupStore } from '@/stores/popupStore'
import CompanyDetailOnboardingModal from './CompanyDetailOnboardingModal'
import CompanyOnboardingModal from './CompanyOnboardingModal'

type OnboardingStep = 'none' | 'detail' | 'portfolio'

export default function OnboardingHandler() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('none')
  const { _hasHydrated } = useAuthStore()
  const { setOnboardingActive } = usePopupStore()

  useEffect(() => {
    // hydration 완료 후 실행
    if (!_hasHydrated) return

    // Step 1: 업체 상세정보 등록 팝업 (회원가입 직후)
    const shouldShowDetailOnboarding = localStorage.getItem('showCompanyOnboarding')
    // Step 2: 포트폴리오 등록 팝업 (상세정보 등록 완료 후)
    const shouldShowPortfolioOnboarding = localStorage.getItem('showPortfolioOnboarding')

    const timer = setTimeout(() => {
      if (shouldShowDetailOnboarding === 'true') {
        setCurrentStep('detail')
        setOnboardingActive(true)
      } else if (shouldShowPortfolioOnboarding === 'true') {
        setCurrentStep('portfolio')
        setOnboardingActive(true)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [_hasHydrated, setOnboardingActive])

  const handleCloseDetailOnboarding = () => {
    setCurrentStep('none')
    setOnboardingActive(false)
    localStorage.removeItem('showCompanyOnboarding')
  }

  const handleClosePortfolioOnboarding = () => {
    setCurrentStep('none')
    setOnboardingActive(false)
    localStorage.removeItem('showPortfolioOnboarding')
  }

  return (
    <>
      <CompanyDetailOnboardingModal
        isOpen={currentStep === 'detail'}
        onClose={handleCloseDetailOnboarding}
      />
      <CompanyOnboardingModal
        isOpen={currentStep === 'portfolio'}
        onClose={handleClosePortfolioOnboarding}
      />
    </>
  )
}
