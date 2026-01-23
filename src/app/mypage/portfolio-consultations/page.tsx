'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaArrowLeft, FaFileInvoiceDollar, FaBuilding, FaImages } from 'react-icons/fa'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuthStore } from '@/stores/authStore'
import { getMyPortfolioConsultations } from '@/lib/api/portfolio-consultation'
import {
  CONSULTATION_STATUS_LABELS,
  CONSULTATION_STATUS_COLORS,
  type PortfolioConsultationListItem,
} from '@/types/portfolio-consultation'
import { showErrorToast } from '@/lib/errorHandler'

export default function MyPortfolioConsultationsPage() {
  const router = useRouter()
  const { accessToken, _hasHydrated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [consultations, setConsultations] = useState<PortfolioConsultationListItem[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const pageSize = 10

  // 데이터 로드
  useEffect(() => {
    if (!_hasHydrated) return

    if (!accessToken) {
      showErrorToast(null, '로그인이 필요한 페이지입니다')
      router.push('/login')
      return
    }

    const fetchConsultations = async () => {
      try {
        setIsLoading(true)
        const response = await getMyPortfolioConsultations({
          page: currentPage,
          size: pageSize,
        })
        if (response.success && response.data) {
          setConsultations(response.data.content || [])
          setTotalPages(response.data.totalPages || 0)
          setTotalElements(response.data.totalElements || 0)
        }
      } catch (error) {
        showErrorToast(error, '상담 목록을 불러오는데 실패했습니다')
      } finally {
        setIsLoading(false)
      }
    }

    fetchConsultations()
  }, [accessToken, _hasHydrated, currentPage, router])

  if (!_hasHydrated || isLoading) {
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

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaFileInvoiceDollar className="text-orange-500" />
              내 견적상담 신청
            </h1>
            <p className="text-gray-600 mt-1">총 {totalElements}건</p>
          </div>
        </div>

        {/* 목록 */}
        <div className="bg-white rounded-lg shadow-sm">
          {consultations.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {consultations.map((consultation) => (
                <Link
                  key={consultation.uuid}
                  href={`/mypage/portfolio-consultations/${consultation.uuid}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${CONSULTATION_STATUS_COLORS[consultation.status] || 'bg-gray-100 text-gray-700'}`}
                        >
                          {CONSULTATION_STATUS_LABELS[consultation.status] || consultation.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(consultation.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 truncate">{consultation.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FaImages className="w-3 h-3" />
                          {consultation.portfolioTitle}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaBuilding className="w-3 h-3" />
                          {consultation.companyName}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {consultation.answeredAt && (
                        <p className="text-xs text-green-600">
                          답변완료
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <FaFileInvoiceDollar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>신청한 견적상담이 없습니다</p>
              <Link
                href="/"
                className="inline-block mt-3 text-primary hover:underline text-sm"
              >
                포트폴리오 둘러보기
              </Link>
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              이전
            </button>
            <span className="px-4 py-2 text-gray-600">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              다음
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
