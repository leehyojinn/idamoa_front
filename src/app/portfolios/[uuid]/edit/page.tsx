'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PortfolioForm from '@/components/portfolio/PortfolioForm'
import { useAuthStore } from '@/stores/authStore'
import { getPortfolio, type Portfolio } from '@/lib/api/portfolio'
import { showErrorToast } from '@/lib/errorHandler'

interface Props {
  params: Promise<{ uuid: string }>
}

export default function EditPortfolioPage({ params }: Props) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user, accessToken, _hasHydrated } = useAuthStore()
  const isAuthenticated = !!accessToken
  const authLoading = !_hasHydrated
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      showErrorToast(null, '로그인이 필요합니다')
      router.push(`/login?redirect=/portfolios/${resolvedParams.uuid}/edit`)
    }
  }, [authLoading, isAuthenticated, router, resolvedParams.uuid])

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!isAuthenticated) return

      try {
        setIsLoading(true)
        const response = await getPortfolio(resolvedParams.uuid)
        if (response.success && response.data) {
          setPortfolio(response.data)
        }
      } catch (error: any) {
        if (error?.response?.status === 403) {
          showErrorToast(null, '수정 권한이 없습니다')
          router.push(`/portfolios/${resolvedParams.uuid}`)
        } else {
          showErrorToast(error, '포트폴리오를 불러오는데 실패했습니다')
          router.push('/')
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading && isAuthenticated) {
      fetchPortfolio()
    }
  }, [resolvedParams.uuid, authLoading, isAuthenticated, router])

  if (authLoading || isLoading) {
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

  if (!isAuthenticated || !portfolio) {
    return null
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <PortfolioForm portfolio={portfolio} isEdit />
        </div>
      </div>
      <Footer />
    </>
  )
}
