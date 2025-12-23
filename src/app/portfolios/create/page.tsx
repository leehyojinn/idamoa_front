'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PortfolioForm from '@/components/portfolio/PortfolioForm'
import { useAuthStore } from '@/stores/authStore'
import { showErrorToast } from '@/lib/errorHandler'
import { getMyCompany } from '@/lib/api/company'

export default function CreatePortfolioPage() {
  const router = useRouter()
  const { user, accessToken, _hasHydrated } = useAuthStore()
  const isAuthenticated = !!accessToken
  const isLoading = !_hasHydrated
  const [showCompanyRequiredDialog, setShowCompanyRequiredDialog] = useState(false)
  const [showCompanyDetailsRequiredDialog, setShowCompanyDetailsRequiredDialog] = useState(false)
  const [isCheckingCompany, setIsCheckingCompany] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      showErrorToast(null, '로그인이 필요합니다')
      router.push('/login?redirect=/portfolios/create')
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      setIsCheckingCompany(false)
      return
    }

    const role = user?.currentRole

    // ADMIN은 바로 통과
    if (role === 'ADMIN') {
      setIsCheckingCompany(false)
      return
    }

    // COMPANY가 아니면 업체 등록 필요
    if (role !== 'COMPANY') {
      setShowCompanyRequiredDialog(true)
      setIsCheckingCompany(false)
      return
    }

    // COMPANY 역할이면 상세정보 확인
    const checkCompanyDetails = async () => {
      try {
        const response = await getMyCompany()
        if (!response.success || !response.data) {
          setShowCompanyDetailsRequiredDialog(true)
        }
      } catch (error) {
        setShowCompanyDetailsRequiredDialog(true)
      } finally {
        setIsCheckingCompany(false)
      }
    }

    checkCompanyDetails()
  }, [isLoading, isAuthenticated, user?.currentRole])

  const handleGoToCompanyRegister = () => {
    setShowCompanyRequiredDialog(false)
    router.push('/mypage/company-register')
  }

  const handleGoToCompanyProfileEdit = () => {
    setShowCompanyDetailsRequiredDialog(false)
    router.push('/mypage/company-profile-edit')
  }

  const handleGoBack = () => {
    setShowCompanyRequiredDialog(false)
    setShowCompanyDetailsRequiredDialog(false)
    router.back()
  }

  if (isLoading || isCheckingCompany) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  // 업체 등록 필요 다이얼로그
  if (showCompanyRequiredDialog) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
                  <svg
                    className="h-8 w-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  업체 등록이 필요합니다
                </h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  포트폴리오를 등록하려면 먼저 업체 정보를 등록해야 합니다.
                  <br />
                  업체 등록 페이지로 이동하시겠습니까?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleGoBack}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    돌아가기
                  </button>
                  <button
                    onClick={handleGoToCompanyRegister}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    업체 등록하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  // 업체 상세정보 등록 필요 다이얼로그
  if (showCompanyDetailsRequiredDialog) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
                  <svg
                    className="h-8 w-8 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  업체 상세정보 등록이 필요합니다
                </h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  포트폴리오를 등록하려면 먼저 업체 상세정보를 입력해야 합니다.
                  <br />
                  업체 정보 수정 페이지로 이동하시겠습니까?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleGoBack}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    돌아가기
                  </button>
                  <button
                    onClick={handleGoToCompanyProfileEdit}
                    className="flex-1 px-4 py-3 bg-yellow-500 text-white rounded-xl font-medium hover:bg-yellow-600 transition-colors"
                  >
                    상세정보 등록하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!isAuthenticated || (user?.currentRole !== 'COMPANY' && user?.currentRole !== 'ADMIN')) {
    return null
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <PortfolioForm />
        </div>
      </div>
      <Footer />
    </>
  )
}
