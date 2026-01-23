'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FaStar, FaHeart, FaEye, FaImages, FaArrowLeft, FaPlus } from 'react-icons/fa'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuthStore } from '@/stores/authStore'
import { useMyPortfoliosDashboard } from '@/hooks/useCompanyDashboard'
import { showErrorToast } from '@/lib/errorHandler'

export default function CompanyPortfoliosPage() {
  const router = useRouter()
  const { accessToken, _hasHydrated } = useAuthStore()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [page, setPage] = useState(0)
  const size = 12

  const { data: portfoliosResponse, isLoading } = useMyPortfoliosDashboard(page, size)
  const portfolios = portfoliosResponse?.data?.content || []
  const totalPages = portfoliosResponse?.data?.totalPages || 0
  const totalElements = portfoliosResponse?.data?.totalElements || 0

  useEffect(() => {
    if (!_hasHydrated) return
    if (!accessToken) {
      showErrorToast(null, '로그인이 필요한 페이지입니다')
      router.push('/login')
      return
    }
    setIsCheckingAuth(false)
  }, [router, accessToken, _hasHydrated])

  if (isCheckingAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/mypage/company-dashboard')}
              className="p-2 rounded-lg bg-white shadow-sm hover:bg-gray-50"
            >
              <FaArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaImages className="text-purple-500" />
                내 포트폴리오
              </h1>
              <p className="text-gray-600 mt-1">총 {totalElements}개</p>
            </div>
          </div>
          <Link
            href="/portfolios/create"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <FaPlus className="w-4 h-4" />
            포트폴리오 등록
          </Link>
        </div>

        {/* 포트폴리오 목록 */}
        {portfolios.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {portfolios.map((portfolio: any) => (
                <Link
                  key={portfolio.uuid}
                  href={`/portfolios/${portfolio.uuid}`}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-[4/3]">
                    {portfolio.thumbnailUrl ? (
                      <Image
                        src={portfolio.thumbnailUrl}
                        alt={portfolio.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <FaImages className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    {portfolio.promotion && (
                      <span className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                        우대
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 truncate">{portfolio.title}</h3>
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <FaEye className="w-3 h-3" /> {portfolio.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaHeart className="w-3 h-3" /> {portfolio.likeCount}
                        </span>
                      </div>
                      {portfolio.avgRating !== null && (
                        <span className="flex items-center gap-1 text-yellow-500">
                          <FaStar className="w-3 h-3" /> {portfolio.avgRating?.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <span className="px-4 py-2 text-gray-600">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <FaImages className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">등록된 포트폴리오가 없습니다</p>
            <Link
              href="/portfolios/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <FaPlus className="w-4 h-4" />
              첫 포트폴리오 등록하기
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
