'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FiArrowLeft,
  FiUser,
  FiPhone,
  FiMail,
  FiMessageSquare,
  FiClock,
  FiTrash2,
  FiRotateCcw,
  FiExternalLink,
  FiAlertTriangle,
} from 'react-icons/fi'
import {
  getAdminPortfolioConsultation,
  updateAdminPortfolioConsultation,
  updateAdminConsultationStatus,
  deleteAdminPortfolioConsultation,
  restoreAdminPortfolioConsultation,
  hardDeleteAdminPortfolioConsultation,
  STATUS_LABELS,
  STATUS_BADGE_STYLES,
  CONTACT_METHOD_LABELS,
  type PortfolioConsultation,
  type PortfolioConsultationStatus,
  type PortfolioConsultationUpdateRequest,
} from '@/lib/api/admin-portfolio-consultation'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

const STATUS_OPTIONS: { value: PortfolioConsultationStatus; label: string }[] = [
  { value: 'PENDING', label: '대기중' },
  { value: 'IN_PROGRESS', label: '처리중' },
  { value: 'ANSWERED', label: '답변완료' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'CANCELLED', label: '취소' },
]

export default function AdminPortfolioConsultationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const uuid = params.uuid as string

  const [consultation, setConsultation] = useState<PortfolioConsultation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 수정 폼 상태
  const [editForm, setEditForm] = useState<PortfolioConsultationUpdateRequest>({})
  const [isEditing, setIsEditing] = useState(false)

  const fetchConsultation = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getAdminPortfolioConsultation(uuid)
      setConsultation(data)
      setEditForm({
        name: data.name,
        phone: data.phone,
        email: data.email,
        title: data.title,
        content: data.content,
        contactMethod: data.contactMethod,
        availableTime: data.availableTime || '',
      })
    } catch (error) {
      showErrorToast(error, '상담신청 조회에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [uuid])

  useEffect(() => {
    fetchConsultation()
  }, [fetchConsultation])

  const handleStatusUpdate = async (newStatus: PortfolioConsultationStatus) => {
    if (!consultation) return

    setIsSubmitting(true)
    try {
      await updateAdminConsultationStatus(uuid, newStatus)
      showSuccessToast('상태가 변경되었습니다')
      fetchConsultation()
    } catch (error) {
      showErrorToast(error, '상태 변경에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!consultation) return

    setIsSubmitting(true)
    try {
      await updateAdminPortfolioConsultation(uuid, editForm)
      showSuccessToast('상담신청이 수정되었습니다')
      setIsEditing(false)
      fetchConsultation()
    } catch (error) {
      showErrorToast(error, '수정에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!consultation) return
    if (!confirm(`정말로 "${consultation.name}"의 상담신청을 삭제하시겠습니까?`)) return

    try {
      await deleteAdminPortfolioConsultation(uuid)
      showSuccessToast('상담신청이 삭제되었습니다')
      fetchConsultation()
    } catch (error) {
      showErrorToast(error, '삭제에 실패했습니다')
    }
  }

  const handleRestore = async () => {
    if (!consultation) return

    try {
      await restoreAdminPortfolioConsultation(uuid)
      showSuccessToast('상담신청이 복구되었습니다')
      fetchConsultation()
    } catch (error) {
      showErrorToast(error, '복구에 실패했습니다')
    }
  }

  const handleHardDelete = async () => {
    if (!consultation) return
    if (
      !confirm(
        '정말로 영구 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다!'
      )
    )
      return

    try {
      await hardDeleteAdminPortfolioConsultation(uuid)
      showSuccessToast('상담신청이 영구 삭제되었습니다')
      router.push('/admin/portfolio-consultations')
    } catch (error) {
      showErrorToast(error, '영구 삭제에 실패했습니다')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-5xl min-h-[calc(100vh-64px-200px)]">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </div>
        <Footer />
      </AdminGuard>
    )
  }

  if (!consultation) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-5xl min-h-[calc(100vh-64px-200px)]">
          <div className="text-center py-12">
            <p className="text-gray-600">상담신청을 찾을 수 없습니다</p>
            <Link
              href="/admin/portfolio-consultations"
              className="mt-4 inline-block text-primary hover:underline"
            >
              목록으로 돌아가기
            </Link>
          </div>
        </div>
        <Footer />
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl min-h-[calc(100vh-64px-200px)]">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/portfolio-consultations"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">상담신청 상세</h1>
              <p className="text-gray-500 text-sm">UUID: {consultation.uuid}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {consultation.isDeleted ? (
              <>
                <button
                  onClick={handleRestore}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <FiRotateCcw className="w-4 h-4" />
                  복구
                </button>
                <button
                  onClick={handleHardDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <FiAlertTriangle className="w-4 h-4" />
                  영구삭제
                </button>
              </>
            ) : (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <FiTrash2 className="w-4 h-4" />
                삭제
              </button>
            )}
          </div>
        </div>

        {/* 삭제 상태 경고 */}
        {consultation.isDeleted && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <FiAlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-medium text-red-800">삭제된 상담신청입니다</p>
              <p className="text-sm text-red-600">
                삭제일: {formatDate(consultation.deletedAt)}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 상세 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 상담 내용 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">상담 내용</h2>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                    <textarea
                      value={editForm.content || ''}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdate}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-primary hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">{consultation.title}</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{consultation.content}</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-4 text-sm text-primary hover:underline"
                  >
                    수정하기
                  </button>
                </>
              )}
            </div>

            {/* 답변 정보 */}
            {consultation.answer && (
              <div className="bg-green-50 rounded-lg border border-green-200 p-6">
                <h2 className="text-lg font-semibold text-green-800 mb-4">업체 답변</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{consultation.answer}</p>
                <div className="mt-4 text-sm text-gray-500">
                  <p>답변자: {consultation.answeredByEmail || '-'}</p>
                  <p>답변일: {formatDate(consultation.answeredAt)}</p>
                </div>
              </div>
            )}

            {/* 메모 */}
            {consultation.companyMemo && (
              <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
                <h2 className="text-lg font-semibold text-yellow-800 mb-4">업체 메모</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{consultation.companyMemo}</p>
              </div>
            )}
          </div>

          {/* 오른쪽: 사이드바 */}
          <div className="space-y-6">
            {/* 상태 변경 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">상태</h2>
              <select
                value={consultation.status}
                onChange={(e) => handleStatusUpdate(e.target.value as PortfolioConsultationStatus)}
                disabled={isSubmitting}
                className={`w-full px-4 py-2 rounded-lg font-medium border-0 ${
                  STATUS_BADGE_STYLES[consultation.status]
                }`}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 신청자 정보 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">신청자 정보</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FiUser className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{consultation.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FiPhone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${consultation.phone}`} className="text-primary hover:underline">
                    {consultation.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <FiMail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${consultation.email}`} className="text-primary hover:underline">
                    {consultation.email}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <FiMessageSquare className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {CONTACT_METHOD_LABELS[consultation.contactMethod]}
                  </span>
                </div>
                {consultation.availableTime && (
                  <div className="flex items-center gap-3">
                    <FiClock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{consultation.availableTime}</span>
                  </div>
                )}
                {consultation.userEmail && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-500">회원 이메일: {consultation.userEmail}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 포트폴리오 정보 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">포트폴리오 정보</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">포트폴리오</p>
                  <Link
                    href={`/portfolios/${consultation.portfolioUuid}`}
                    target="_blank"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {consultation.portfolioTitle}
                    <FiExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-gray-500">업체명</p>
                  <p className="text-gray-900">{consultation.companyName}</p>
                </div>
              </div>
            </div>

            {/* 날짜 정보 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">날짜 정보</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">신청일</span>
                  <span className="text-gray-900">{formatDate(consultation.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">수정일</span>
                  <span className="text-gray-900">{formatDate(consultation.updatedAt)}</span>
                </div>
                {consultation.answeredAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">답변일</span>
                    <span className="text-gray-900">{formatDate(consultation.answeredAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </AdminGuard>
  )
}
