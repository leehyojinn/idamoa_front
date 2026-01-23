'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaArrowLeft, FaFileInvoiceDollar, FaPhone, FaEnvelope } from 'react-icons/fa'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuthStore } from '@/stores/authStore'
import { useMyCompany } from '@/hooks/useCompany'
import { useCompanyPortfolioConsultationsDashboard } from '@/hooks/useCompanyDashboard'
import {
  CONSULTATION_STATUS_LABELS,
  CONSULTATION_STATUS_COLORS,
  CONTACT_METHOD_LABELS,
  type PortfolioConsultationStatus,
} from '@/types/portfolio-consultation'
import { showErrorToast } from '@/lib/errorHandler'

export default function PortfolioConsultationsPage() {
  const router = useRouter()
  const { accessToken, _hasHydrated } = useAuthStore()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<PortfolioConsultationStatus | undefined>(undefined)
  const pageSize = 10

  // 내 업체 정보
  const { data: companyResponse, isLoading: companyLoading } = useMyCompany()
  const company = companyResponse?.data

  // 포트폴리오 견적상담 목록
  const { data: consultationsResponse, isLoading: consultationsLoading } = useCompanyPortfolioConsultationsDashboard(
    company?.uuid || '',
    statusFilter,
    currentPage,
    pageSize
  )

  const consultations = consultationsResponse?.data?.content || []
  const totalPages = consultationsResponse?.data?.totalPages || 0
  const totalElements = consultationsResponse?.data?.totalElements || 0

  // 인증 체크
  useEffect(() => {
    if (!_hasHydrated) return

    if (!accessToken) {
      showErrorToast(null, '로그인이 필요한 페이지입니다')
      router.push('/login')
      return
    }
    setIsCheckingAuth(false)
  }, [router, accessToken, _hasHydrated])

  // 로딩 중
  if (isCheckingAuth || companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 업체 정보 없음
  if (!company) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">업체 정보가 없습니다</h2>
            <p className="text-gray-600 mb-6">업체 등록 후 이용할 수 있습니다</p>
            <button
              onClick={() => router.push('/mypage/company-register')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              업체 등록하기
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const statusOptions: { label: string; value: PortfolioConsultationStatus | undefined }[] = [
    { label: '전체', value: undefined },
    { label: '대기중', value: 'PENDING' },
    { label: '처리중', value: 'IN_PROGRESS' },
    { label: '답변완료', value: 'ANSWERED' },
    { label: '완료', value: 'COMPLETED' },
    { label: '취소', value: 'CANCELLED' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
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
              <FaFileInvoiceDollar className="text-red-500" />
              포트폴리오 견적상담
            </h1>
            <p className="text-gray-600 mt-1">총 {totalElements}건</p>
          </div>
        </div>

        {/* 상태 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.label}
                onClick={() => {
                  setStatusFilter(option.value)
                  setCurrentPage(0)
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === option.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 목록 */}
        <div className="bg-white rounded-lg shadow-sm">
          {consultationsLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">로딩 중...</p>
            </div>
          ) : consultations.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {consultations.map((consultation: any) => (
                <Link
                  key={consultation.uuid}
                  href={`/mypage/company-dashboard/portfolio-consultations/${consultation.uuid}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${CONSULTATION_STATUS_COLORS[consultation.status as keyof typeof CONSULTATION_STATUS_COLORS] || 'bg-gray-100 text-gray-700'}`}
                        >
                          {CONSULTATION_STATUS_LABELS[consultation.status as keyof typeof CONSULTATION_STATUS_LABELS] || consultation.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(consultation.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 truncate">{consultation.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        포트폴리오: {consultation.portfolioTitle}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FaPhone className="w-3 h-3" />
                          {consultation.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaEnvelope className="w-3 h-3" />
                          {consultation.email}
                        </span>
                        <span>
                          {CONTACT_METHOD_LABELS[consultation.contactMethod as keyof typeof CONTACT_METHOD_LABELS] || consultation.contactMethod}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-medium text-gray-900">{consultation.name}</p>
                      {consultation.answeredAt && (
                        <p className="text-xs text-green-600 mt-1">
                          답변: {new Date(consultation.answeredAt).toLocaleDateString('ko-KR')}
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
              <p>견적상담 내역이 없습니다</p>
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
