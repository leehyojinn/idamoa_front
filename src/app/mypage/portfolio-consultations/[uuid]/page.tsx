'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FaArrowLeft,
  FaFileInvoiceDollar,
  FaBuilding,
  FaImages,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaReply,
  FaTrash,
} from 'react-icons/fa'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuthStore } from '@/stores/authStore'
import {
  getMyPortfolioConsultation,
  deleteMyPortfolioConsultation,
} from '@/lib/api/portfolio-consultation'
import {
  CONSULTATION_STATUS_LABELS,
  CONSULTATION_STATUS_COLORS,
  CONTACT_METHOD_LABELS,
  type PortfolioConsultation,
} from '@/types/portfolio-consultation'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'

interface Props {
  params: Promise<{ uuid: string }>
}

export default function MyPortfolioConsultationDetailPage({ params }: Props) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { accessToken, _hasHydrated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [consultation, setConsultation] = useState<PortfolioConsultation | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 데이터 로드
  useEffect(() => {
    if (!_hasHydrated) return

    if (!accessToken) {
      showErrorToast(null, '로그인이 필요한 페이지입니다')
      router.push('/login')
      return
    }

    const fetchConsultation = async () => {
      try {
        setIsLoading(true)
        const response = await getMyPortfolioConsultation(resolvedParams.uuid)
        if (response.success && response.data) {
          setConsultation(response.data)
        }
      } catch (error) {
        showErrorToast(error, '상담 정보를 불러오는데 실패했습니다')
        router.push('/mypage/portfolio-consultations')
      } finally {
        setIsLoading(false)
      }
    }

    fetchConsultation()
  }, [accessToken, _hasHydrated, resolvedParams.uuid, router])

  // 삭제 처리
  const handleDelete = async () => {
    if (!consultation) return
    if (!confirm('정말로 이 상담 신청을 삭제하시겠습니까?')) return

    setIsDeleting(true)
    try {
      await deleteMyPortfolioConsultation(consultation.uuid)
      showSuccessToast('상담 신청이 삭제되었습니다')
      router.push('/mypage/portfolio-consultations')
    } catch (error) {
      showErrorToast(error, '삭제에 실패했습니다')
    } finally {
      setIsDeleting(false)
    }
  }

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

  if (!consultation) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">상담을 찾을 수 없습니다</h2>
            <Link
              href="/mypage/portfolio-consultations"
              className="text-primary hover:underline"
            >
              목록으로 돌아가기
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const canDelete = consultation.status !== 'ANSWERED' && consultation.status !== 'COMPLETED'

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaFileInvoiceDollar className="text-orange-500" />
                견적상담 상세
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${CONSULTATION_STATUS_COLORS[consultation.status] || 'bg-gray-100 text-gray-700'}`}
            >
              {CONSULTATION_STATUS_LABELS[consultation.status] || consultation.status}
            </span>
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="삭제"
              >
                <FaTrash className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* 상담 정보 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{consultation.title}</h2>

            {/* 포트폴리오 & 업체 정보 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <FaImages className="w-4 h-4" />
                  포트폴리오
                </div>
                <Link
                  href={`/portfolios/${consultation.portfolioUuid}`}
                  className="text-primary hover:underline font-medium"
                >
                  {consultation.portfolioTitle}
                </Link>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <FaBuilding className="w-4 h-4" />
                  업체
                </div>
                <p className="font-medium text-gray-900">{consultation.companyName}</p>
              </div>
            </div>

            {/* 상담 내용 */}
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap mb-6 border-t border-gray-100 pt-4">
              {consultation.content}
            </div>

            {/* 신청 정보 */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-medium text-gray-900 mb-3">신청 정보</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <FaPhone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">연락처:</span>
                  <span className="font-medium">{consultation.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FaEnvelope className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">이메일:</span>
                  <span className="font-medium">{consultation.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FaClock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">선호 연락방법:</span>
                  <span className="font-medium">
                    {CONTACT_METHOD_LABELS[consultation.contactMethod] || consultation.contactMethod}
                  </span>
                </div>
                {consultation.availableTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <FaClock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">연락 가능 시간:</span>
                    <span className="font-medium">{consultation.availableTime}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 날짜 정보 */}
            <div className="border-t border-gray-100 pt-4 mt-4 text-sm text-gray-500">
              <p>신청일: {new Date(consultation.createdAt).toLocaleString('ko-KR')}</p>
            </div>
          </div>

          {/* 답변 */}
          {consultation.answer && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaReply className="text-green-500" />
                업체 답변
              </h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{consultation.answer}</p>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                답변일: {consultation.answeredAt && new Date(consultation.answeredAt).toLocaleString('ko-KR')}
              </p>
            </div>
          )}

          {/* 답변 대기 중 */}
          {!consultation.answer && consultation.status !== 'CANCELLED' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <FaClock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-yellow-800 font-medium">업체 답변을 기다리고 있습니다</p>
              <p className="text-yellow-600 text-sm mt-1">답변이 등록되면 알림을 받으실 수 있습니다</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
