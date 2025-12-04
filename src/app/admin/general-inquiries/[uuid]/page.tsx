'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiClock, FiUser, FiMessageSquare, FiSave, FiEdit, FiTrash2 } from 'react-icons/fi'
import {
  adminGetGeneralInquiry,
  adminChangeGeneralInquiryStatus,
  adminCreateGeneralInquiryAnswer,
  adminUpdateGeneralInquiryAnswer,
  adminDeleteGeneralInquiryAnswer,
  adminDeleteGeneralInquiry,
  GENERAL_INQUIRY_TYPE_LABELS,
  GENERAL_INQUIRY_STATUS_LABELS,
  GENERAL_INQUIRY_STATUS_COLORS,
  type GeneralInquiryResponse,
  type GeneralInquiryStatus,
} from '@/lib/api/inquiry'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

export default function AdminGeneralInquiryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const uuid = params.uuid as string

  const [inquiry, setInquiry] = useState<GeneralInquiryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<GeneralInquiryStatus>('PENDING')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [answerContent, setAnswerContent] = useState('')
  const [isEditingAnswer, setIsEditingAnswer] = useState(false)

  const fetchInquiry = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await adminGetGeneralInquiry(uuid)
      if (result.success && result.data) {
        setInquiry(result.data)
        setSelectedStatus(result.data.status)
        setAnswerContent(result.data.answer?.content || '')
      }
    } catch (error) {
      showErrorToast(error, '문의 조회에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [uuid])

  useEffect(() => {
    fetchInquiry()
  }, [fetchInquiry])

  const handleStatusUpdate = async () => {
    if (!inquiry) return

    setIsSubmitting(true)
    try {
      await adminChangeGeneralInquiryStatus(uuid, selectedStatus)
      showSuccessToast('문의 상태가 변경되었습니다')
      fetchInquiry()
    } catch (error) {
      showErrorToast(error, '상태 변경에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateAnswer = async () => {
    if (!answerContent.trim()) {
      showErrorToast(null, '답변 내용을 입력해주세요')
      return
    }

    setIsSubmitting(true)
    try {
      await adminCreateGeneralInquiryAnswer(uuid, { content: answerContent })
      showSuccessToast('답변이 작성되었습니다')
      setAnswerContent('')
      fetchInquiry()
    } catch (error) {
      showErrorToast(error, '답변 작성에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateAnswer = async () => {
    if (!answerContent.trim()) {
      showErrorToast(null, '답변 내용을 입력해주세요')
      return
    }

    setIsSubmitting(true)
    try {
      await adminUpdateGeneralInquiryAnswer(uuid, { content: answerContent })
      showSuccessToast('답변이 수정되었습니다')
      setIsEditingAnswer(false)
      fetchInquiry()
    } catch (error) {
      showErrorToast(error, '답변 수정에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAnswer = async () => {
    if (!confirm('정말로 답변을 삭제하시겠습니까?')) return

    setIsSubmitting(true)
    try {
      await adminDeleteGeneralInquiryAnswer(uuid)
      showSuccessToast('답변이 삭제되었습니다')
      setAnswerContent('')
      setIsEditingAnswer(false)
      fetchInquiry()
    } catch (error) {
      showErrorToast(error, '답변 삭제에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!inquiry) return
    if (!confirm(`정말로 "${inquiry.title}" 문의를 삭제하시겠습니까?`)) return

    try {
      await adminDeleteGeneralInquiry(uuid)
      showSuccessToast('문의가 삭제되었습니다')
      router.push('/admin/general-inquiries')
    } catch (error) {
      showErrorToast(error, '문의 삭제에 실패했습니다')
    }
  }

  if (isLoading) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-5xl min-h-[calc(100vh-64px-200px)]">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">문의 내용을 불러오는 중...</p>
          </div>
        </div>
        <Footer />
      </AdminGuard>
    )
  }

  if (!inquiry) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-5xl min-h-[calc(100vh-64px-200px)]">
          <Link
            href="/admin/general-inquiries"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <FiArrowLeft />
            목록으로
          </Link>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FiMessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">문의 내용을 불러올 수 없습니다</p>
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
        <Link
          href="/admin/general-inquiries"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <FiArrowLeft />
          목록으로
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 컨텐츠 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 문의 정보 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      {GENERAL_INQUIRY_TYPE_LABELS[inquiry.inquiryType]}
                    </span>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${GENERAL_INQUIRY_STATUS_COLORS[inquiry.status]}`}>
                      {GENERAL_INQUIRY_STATUS_LABELS[inquiry.status]}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{inquiry.title}</h1>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <FiUser className="text-gray-400" />
                  <span className="font-medium">작성자:</span>
                  <span>{inquiry.userEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <FiClock className="text-gray-400" />
                  <span className="font-medium">작성일:</span>
                  <span>{new Date(inquiry.createdAt).toLocaleString('ko-KR')}</span>
                </div>
              </div>
            </div>

            {/* 문의 내용 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiMessageSquare />
                문의 내용
              </h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{inquiry.content}</p>
              </div>
            </div>

            {/* 답변 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FiMessageSquare />
                  관리자 답변
                </h2>
                {inquiry.answer && !isEditingAnswer && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditingAnswer(true)}
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                    >
                      <FiEdit />
                      수정
                    </button>
                    <button
                      onClick={handleDeleteAnswer}
                      disabled={isSubmitting}
                      className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm"
                    >
                      <FiTrash2 />
                      삭제
                    </button>
                  </div>
                )}
              </div>

              {inquiry.answer && !isEditingAnswer ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap mb-2">{inquiry.answer.content}</p>
                  <div className="text-sm text-gray-500">
                    답변일: {new Date(inquiry.answer.createdAt).toLocaleString('ko-KR')} / {inquiry.answer.adminEmail}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={answerContent}
                    onChange={(e) => setAnswerContent(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="답변 내용을 입력해주세요"
                  />
                  <div className="flex gap-2">
                    {isEditingAnswer ? (
                      <>
                        <button
                          onClick={handleUpdateAnswer}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingAnswer(false)
                            setAnswerContent(inquiry.answer?.content || '')
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                        >
                          취소
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleCreateAnswer}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        답변 작성
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 상태 변경 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">상태 관리</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    문의 상태
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as GeneralInquiryStatus)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="PENDING">대기중</option>
                    <option value="IN_PROGRESS">처리중</option>
                    <option value="ANSWERED">답변완료</option>
                    <option value="CLOSED">종료</option>
                  </select>
                </div>
                <button
                  onClick={handleStatusUpdate}
                  disabled={isSubmitting || selectedStatus === inquiry.status}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSave />
                  상태 변경
                </button>
              </div>
            </div>

            {/* 삭제 */}
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
              <h3 className="text-lg font-bold text-red-900 mb-4">위험 구역</h3>
              <button
                onClick={handleDelete}
                className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                문의 삭제
              </button>
              <p className="text-xs text-gray-500 mt-2">
                삭제된 문의는 복구할 수 없습니다
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </AdminGuard>
  )
}
