'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaStar, FaArrowLeft, FaReply } from 'react-icons/fa'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuthStore } from '@/stores/authStore'
import { useMyCompany } from '@/hooks/useCompany'
import { useCompanyReviewsDashboard } from '@/hooks/useCompanyDashboard'
import { showErrorToast } from '@/lib/errorHandler'

export default function CompanyReviewsPage() {
  const router = useRouter()
  const { accessToken, _hasHydrated } = useAuthStore()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [page, setPage] = useState(0)
  const size = 10

  const { data: companyResponse, isLoading: companyLoading } = useMyCompany()
  const company = companyResponse?.data

  const { data: reviewsResponse, isLoading: reviewsLoading } = useCompanyReviewsDashboard(
    company?.uuid || '',
    page,
    size
  )
  const reviews = reviewsResponse?.data?.content || []
  const totalPages = reviewsResponse?.data?.totalPages || 0
  const totalElements = reviewsResponse?.data?.totalElements || 0

  useEffect(() => {
    if (!_hasHydrated) return
    if (!accessToken) {
      showErrorToast(null, '로그인이 필요한 페이지입니다')
      router.push('/login')
      return
    }
    setIsCheckingAuth(false)
  }, [router, accessToken, _hasHydrated])

  if (isCheckingAuth || companyLoading || reviewsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/mypage/company-dashboard')}
            className="p-2 rounded-lg bg-white shadow-sm hover:bg-gray-50"
          >
            <FaArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaStar className="text-yellow-500" />
              내 리뷰
            </h1>
            <p className="text-gray-600 mt-1">총 {totalElements}개</p>
          </div>
        </div>

        {/* 리뷰 목록 */}
        {reviews.length > 0 ? (
          <>
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <div
                  key={review.uuid}
                  className="bg-white rounded-lg shadow-sm p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {review.userName || '익명'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {review.rating}점
                        </span>
                      </div>
                    </div>
                    {!review.reply && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                        답글 필요
                      </span>
                    )}
                  </div>

                  <p className="text-gray-700 whitespace-pre-wrap">{review.content}</p>

                  {review.portfolioTitle && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-sm text-gray-500">
                        포트폴리오: {review.portfolioTitle}
                      </span>
                    </div>
                  )}

                  {review.reply && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FaReply className="w-3 h-3 text-primary" />
                        <span className="text-sm font-medium text-primary">업체 답변</span>
                        {review.replyCreatedAt && (
                          <span className="text-xs text-gray-500">
                            {formatDate(review.replyCreatedAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.reply}</p>
                    </div>
                  )}
                </div>
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
            <FaStar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">아직 리뷰가 없습니다</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
