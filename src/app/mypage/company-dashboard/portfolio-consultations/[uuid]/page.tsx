'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FaArrowLeft,
  FaFileInvoiceDollar,
  FaPhone,
  FaEnvelope,
  FaUser,
  FaClock,
  FaImages,
  FaStickyNote,
  FaReply,
} from 'react-icons/fa'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuthStore } from '@/stores/authStore'
import { useMyCompany } from '@/hooks/useCompany'
import {
  getCompanyPortfolioConsultation,
  submitCompanyPortfolioConsultationAnswer,
  updateCompanyPortfolioConsultationMemo,
  updateCompanyPortfolioConsultationStatus,
} from '@/lib/api/portfolio-consultation'
import {
  CONSULTATION_STATUS_LABELS,
  CONSULTATION_STATUS_COLORS,
  CONTACT_METHOD_LABELS,
  type PortfolioConsultation,
  type PortfolioConsultationStatus,
} from '@/types/portfolio-consultation'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'

interface Props {
  params: Promise<{ uuid: string }>
}

export default function PortfolioConsultationDetailPage({ params }: Props) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { accessToken, _hasHydrated } = useAuthStore()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [consultation, setConsultation] = useState<PortfolioConsultation | null>(null)

  // 답변 및 메모 상태
  const [answer, setAnswer] = useState('')
  const [memo, setMemo] = useState('')
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false)
  const [isSubmittingMemo, setIsSubmittingMemo] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // 내 업체 정보
  const { data: companyResponse, isLoading: companyLoading } = useMyCompany()
  const company = companyResponse?.data

  // 상담 상세 조회
  useEffect(() => {
    if (!company?.uuid) return

    const fetchConsultation = async () => {
      try {
        setIsLoading(true)
        const response = await getCompanyPortfolioConsultation(company.uuid, resolvedParams.uuid)
        if (response.success && response.data) {
          setConsultation(response.data)
          setMemo(response.data.companyMemo || '')
          setAnswer(response.data.answer || '')
        }
      } catch (error) {
        showErrorToast(error, '상담 정보를 불러오는데 실패했습니다')
        router.push('/mypage/company-dashboard/portfolio-consultations')
      } finally {
        setIsLoading(false)
      }
    }

    fetchConsultation()
  }, [company?.uuid, resolvedParams.uuid, router])

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

  // 답변 제출
  const handleSubmitAnswer = async () => {
    if (!company?.uuid || !consultation?.uuid || !answer.trim()) return

    setIsSubmittingAnswer(true)
    try {
      const response = await submitCompanyPortfolioConsultationAnswer(
        company.uuid,
        consultation.uuid,
        { answer: answer.trim() }
      )
      if (response.success && response.data) {
        setConsultation(response.data)
        showSuccessToast('답변이 등록되었습니다')
      }
    } catch (error) {
      showErrorToast(error, '답변 등록에 실패했습니다')
    } finally {
      setIsSubmittingAnswer(false)
    }
  }

  // 메모 저장
  const handleSaveMemo = async () => {
    if (!company?.uuid || !consultation?.uuid) return

    setIsSubmittingMemo(true)
    try {
      const response = await updateCompanyPortfolioConsultationMemo(
        company.uuid,
        consultation.uuid,
        { memo: memo.trim() }
      )
      if (response.success && response.data) {
        setConsultation(response.data)
        showSuccessToast('메모가 저장되었습니다')
      }
    } catch (error) {
      showErrorToast(error, '메모 저장에 실패했습니다')
    } finally {
      setIsSubmittingMemo(false)
    }
  }

  // 상태 변경
  const handleChangeStatus = async (newStatus: PortfolioConsultationStatus) => {
    if (!company?.uuid || !consultation?.uuid) return

    setIsUpdatingStatus(true)
    try {
      const response = await updateCompanyPortfolioConsultationStatus(
        company.uuid,
        consultation.uuid,
        { status: newStatus }
      )
      if (response.success && response.data) {
        setConsultation(response.data)
        showSuccessToast('상태가 변경되었습니다')
      }
    } catch (error) {
      showErrorToast(error, '상태 변경에 실패했습니다')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // 로딩 중
  if (isCheckingAuth || companyLoading || isLoading) {
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
          </div>
        </div>
        <Footer />
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
              href="/mypage/company-dashboard/portfolio-consultations"
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
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaFileInvoiceDollar className="text-red-500" />
              견적상담 상세
            </h1>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${CONSULTATION_STATUS_COLORS[consultation.status] || 'bg-gray-100 text-gray-700'}`}
          >
            {CONSULTATION_STATUS_LABELS[consultation.status] || consultation.status}
          </span>
        </div>

        <div className="space-y-6">
          {/* 상담 정보 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{consultation.title}</h2>

            {/* 포트폴리오 정보 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <FaImages className="w-4 h-4" />
                연결된 포트폴리오
              </div>
              <Link
                href={`/portfolios/${consultation.portfolioUuid}`}
                className="text-primary hover:underline font-medium"
              >
                {consultation.portfolioTitle}
              </Link>
            </div>

            {/* 상담 내용 */}
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap mb-6">
              {consultation.content}
            </div>

            {/* 신청자 정보 */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-medium text-gray-900 mb-3">신청자 정보</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <FaUser className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">이름:</span>
                  <span className="font-medium">{consultation.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FaPhone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">연락처:</span>
                  <a href={`tel:${consultation.phone}`} className="font-medium text-primary hover:underline">
                    {consultation.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FaEnvelope className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">이메일:</span>
                  <a href={`mailto:${consultation.email}`} className="font-medium text-primary hover:underline">
                    {consultation.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FaClock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">선호 연락방법:</span>
                  <span className="font-medium">
                    {CONTACT_METHOD_LABELS[consultation.contactMethod] || consultation.contactMethod}
                  </span>
                </div>
                {consultation.availableTime && (
                  <div className="flex items-center gap-2 text-sm sm:col-span-2">
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
              {consultation.answeredAt && (
                <p>답변일: {new Date(consultation.answeredAt).toLocaleString('ko-KR')}</p>
              )}
            </div>
          </div>

          {/* 상태 변경 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">상태 변경</h3>
            <div className="flex flex-wrap gap-2">
              {(['PENDING', 'IN_PROGRESS', 'ANSWERED', 'COMPLETED', 'CANCELLED'] as PortfolioConsultationStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => handleChangeStatus(status)}
                  disabled={isUpdatingStatus || consultation.status === status}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    consultation.status === status
                      ? CONSULTATION_STATUS_COLORS[status]
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {CONSULTATION_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          {/* 내부 메모 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaStickyNote className="text-yellow-500" />
              내부 메모
            </h3>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
              placeholder="내부 메모를 작성하세요 (고객에게 보이지 않음)"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleSaveMemo}
                disabled={isSubmittingMemo}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmittingMemo ? '저장 중...' : '메모 저장'}
              </button>
            </div>
          </div>

          {/* 답변 작성/표시 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaReply className="text-green-500" />
              {consultation.answer ? '답변 내용' : '답변 작성'}
            </h3>
            {consultation.answer ? (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{consultation.answer}</p>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  답변일: {consultation.answeredAt && new Date(consultation.answeredAt).toLocaleString('ko-KR')}
                </p>
              </div>
            ) : (
              <>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                  placeholder="고객에게 전달할 답변을 작성하세요"
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={isSubmittingAnswer || !answer.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmittingAnswer ? '제출 중...' : '답변 등록'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
