'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiClock, FiUser, FiPhone, FiMail, FiMessageSquare } from 'react-icons/fi'
import { verifyConsultation, cancelConsultation, cancelConsultationWithPassword } from '@/lib/api/consultation'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { useAuth } from '@/hooks/useAuth'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import type { Consultation } from '@/types/consultation'

const STATUS_LABELS = {
  SUBMITTED: '접수됨',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  CANCELLED: '취소'
}

const STATUS_COLORS = {
  SUBMITTED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
}

export default function ConsultationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const uuid = params.uuid as string

  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [password, setPassword] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // 로그인한 회원은 자동으로 조회
  useEffect(() => {
    const autoVerify = async () => {
      if (user) {
        setIsVerifying(true)
        try {
          const result = await verifyConsultation(uuid)
          if (result.success && result.data) {
            setConsultation(result.data)
          }
        } catch (error: any) {
          showErrorToast(error, '상담 조회에 실패했습니다')
        } finally {
          setIsVerifying(false)
          setIsInitialLoading(false)
        }
      } else {
        setIsInitialLoading(false)
      }
    }

    autoVerify()
  }, [user, uuid])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)

    try {
      const result = await verifyConsultation(uuid, password || undefined)
      if (result.success && result.data) {
        setConsultation(result.data)
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        showErrorToast(error, '비밀번호가 일치하지 않습니다')
      } else {
        showErrorToast(error, '상담 조회에 실패했습니다')
      }
    } finally {
      setIsVerifying(false)
    }
  }

  const handleCancel = async () => {
    if (!consultation) return
    if (!confirm('정말로 이 상담을 취소하시겠습니까?')) return

    const reason = prompt('취소 사유를 입력해주세요 (선택):')

    setIsCancelling(true)
    try {
      if (user && consultation.isMember) {
        await cancelConsultation(uuid, reason || undefined)
      } else {
        const pw = prompt('비밀번호를 입력하세요 (4자리):')
        if (!pw) {
          setIsCancelling(false)
          return
        }
        await cancelConsultationWithPassword(uuid, pw, reason || undefined)
      }
      showSuccessToast('상담이 취소되었습니다')
      router.push('/consultations')
    } catch (error) {
      showErrorToast(error, '상담 취소에 실패했습니다')
    } finally {
      setIsCancelling(false)
    }
  }

  // 로딩 중
  if (isInitialLoading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-md min-h-[calc(100vh-64px-200px)]">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">상담 내용을 불러오는 중...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  // 비밀번호 입력 화면 (비로그인 사용자만)
  if (!consultation && !user) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-md min-h-[calc(100vh-64px-200px)]">
        <Link
          href="/consultations"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <FiArrowLeft />
          목록으로
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">상담 조회</h1>

        <form onSubmit={handleVerify} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              4자리 비밀번호
            </label>
            <input
              type="password"
              maxLength={4}
              pattern="\d{4}"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1234"
            />
            <p className="mt-2 text-sm text-gray-500">
              상담 신청 시 입력한 4자리 비밀번호를 입력해주세요
            </p>
          </div>

          <button
            type="submit"
            disabled={isVerifying || password.length !== 4}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? '조회 중...' : '조회하기'}
          </button>
        </form>
        </div>
        <Footer />
      </>
    )
  }

  // 상담 내용이 없는 경우 (접근 권한 없음)
  if (!consultation) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-md min-h-[calc(100vh-64px-200px)]">
          <Link
            href="/consultations"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <FiArrowLeft />
            목록으로
          </Link>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FiMessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">상담 내용을 불러올 수 없습니다</p>
            <p className="text-gray-400 text-sm">본인의 상담만 조회할 수 있습니다</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  // 상담 상세 화면
  const canCancel = consultation.status === 'SUBMITTED' || consultation.status === 'IN_PROGRESS'

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-64px-200px)]">
      <Link
        href="/consultations"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <FiArrowLeft />
        목록으로
      </Link>

      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {consultation.subject || '상담 문의'}
              </h1>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[consultation.status]}`}>
                {STATUS_LABELS[consultation.status]}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <FiUser className="text-gray-400" />
              <span className="font-medium">이름:</span>
              <span>{consultation.name}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <FiPhone className="text-gray-400" />
              <span className="font-medium">전화번호:</span>
              <span>{consultation.phone}</span>
            </div>
            {consultation.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <FiMail className="text-gray-400" />
                <span className="font-medium">이메일:</span>
                <span>{consultation.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <FiClock className="text-gray-400" />
              <span className="font-medium">신청일:</span>
              <span>{new Date(consultation.createdAt).toLocaleString('ko-KR')}</span>
            </div>
          </div>
        </div>

        {/* 상담 내용 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiMessageSquare />
            상담 내용
          </h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{consultation.message}</p>
          </div>

          {(consultation.preferredContactMethod || consultation.preferredContactTime) && (
            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {consultation.preferredContactMethod && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">선호 연락 방법</p>
                  <p className="text-gray-600">{consultation.preferredContactMethod}</p>
                </div>
              )}
              {consultation.preferredContactTime && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">선호 연락 시간</p>
                  <p className="text-gray-600">{consultation.preferredContactTime}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 관리자 답변 */}
        {consultation.responseMessage && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h2 className="text-lg font-bold text-blue-900 mb-4">관리자 답변</h2>
            <p className="text-blue-800 whitespace-pre-wrap mb-4">{consultation.responseMessage}</p>
            {consultation.respondedAt && (
              <p className="text-sm text-blue-600">
                답변일: {new Date(consultation.respondedAt).toLocaleString('ko-KR')}
              </p>
            )}
          </div>
        )}

        {/* 배정 업체 */}
        {consultation.assignedCompanyName && (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">배정 업체</h2>
            <p className="text-gray-700">{consultation.assignedCompanyName}</p>
            {consultation.assignedAt && (
              <p className="text-sm text-gray-500 mt-1">
                배정일: {new Date(consultation.assignedAt).toLocaleString('ko-KR')}
              </p>
            )}
          </div>
        )}

        {/* 취소 버튼 */}
        {canCancel && (
          <div className="flex justify-end">
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCancelling ? '취소 중...' : '상담 취소하기'}
            </button>
          </div>
        )}

        {/* 취소 정보 */}
        {consultation.status === 'CANCELLED' && consultation.cancellationReason && (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">취소 사유</h2>
            <p className="text-gray-700">{consultation.cancellationReason}</p>
          </div>
        )}
      </div>
      </div>
      <Footer />
    </>
  )
}
