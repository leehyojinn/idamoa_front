'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PortfolioForm from '@/components/portfolio/PortfolioForm'
import { useAuthStore } from '@/stores/authStore'
import { showErrorToast } from '@/lib/errorHandler'

export default function CreatePortfolioPage() {
  const router = useRouter()
  const { user, accessToken, _hasHydrated } = useAuthStore()
  const isAuthenticated = !!accessToken
  const isLoading = !_hasHydrated

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      showErrorToast(null, '로그인이 필요합니다')
      router.push('/login?redirect=/portfolios/create')
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    // COMPANY 역할이 아니면 업체 등록 필요
    if (!isLoading && isAuthenticated && user?.currentRole !== 'COMPANY' && user?.currentRole !== 'ADMIN') {
      showErrorToast(null, '포트폴리오를 등록하려면 먼저 업체 등록이 필요합니다')
      router.push('/mypage?message=company_required')
    }
  }, [isLoading, isAuthenticated, user, router])

  if (isLoading) {
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
