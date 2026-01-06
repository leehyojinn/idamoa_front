'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiClock, FiMessageSquare, FiEdit, FiTrash2, FiUser, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import {
  getMyInquiry,
  deleteMyInquiry,
  GENERAL_INQUIRY_TYPE_LABELS,
  GENERAL_INQUIRY_STATUS_LABELS,
  GENERAL_INQUIRY_STATUS_COLORS,
  type GeneralInquiryResponse,
} from '@/lib/api/inquiry'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/hooks/useAuth'

export default function MyInquiryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const uuid = params.uuid as string

  const [inquiry, setInquiry] = useState<GeneralInquiryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchInquiry = useCallback(async () => {
    if (!user) {
      router.push('/login')
      return
    }

    setIsLoading(true)
    try {
      const result = await getMyInquiry(uuid)
      if (result.success && result.data) {
        setInquiry(result.data)
      }
    } catch (error) {
      showErrorToast(error, '문의 조회에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [uuid, user, router])

  useEffect(() => {
    fetchInquiry()
  }, [fetchInquiry])

  const handleDelete = async () => {
    if (!inquiry) return
    if (inquiry.status !== 'PENDING') {
      showErrorToast(null, 'PENDING 상태일 때만 삭제할 수 있습니다')
      return
    }
    if (!confirm(`정말로 "${inquiry.title}" 문의를 삭제하시겠습니까?`)) return

    try {
      await deleteMyInquiry(uuid)
      showSuccessToast('문의가 삭제되었습니다')
      router.push('/inquiries/my')
    } catch (error) {
      showErrorToast(error, '문의 삭제에 실패했습니다')
    }
  }

  if (!user) {
    return null
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-5xl min-h-[calc(100vh-64px-200px)]">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary mb-4"></div>
            <p className="text-gray-600 text-lg">문의 내용을 불러오는 중...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!inquiry) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-5xl min-h-[calc(100vh-64px-200px)]">
          <Link
            href="/inquiries/my"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            목록으로
          </Link>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiMessageSquare className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">문의 내용을 불러올 수 없습니다</h3>
            <p className="text-gray-600">요청하신 문의를 찾을 수 없습니다</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const canEdit = inquiry.status === 'PENDING'

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl min-h-[calc(100vh-64px-200px)]">
        <Link
          href="/inquiries/my"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium transition-colors group"
        >
          <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          목록으로
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 컨텐츠 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 문의 정보 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 border-b border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white text-gray-800 shadow-sm">
                        {GENERAL_INQUIRY_TYPE_LABELS[inquiry.inquiryType]}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${GENERAL_INQUIRY_STATUS_COLORS[inquiry.status]}`}>
                        {GENERAL_INQUIRY_STATUS_LABELS[inquiry.status]}
                      </span>
                      {inquiry.answer && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          <FiCheckCircle className="w-4 h-4" />
                          답변완료
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">{inquiry.title}</h1>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiClock className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">작성일:</span>
                  <span>{new Date(inquiry.createdAt).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>

              {/* 문의 내용 */}
              <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-primary rounded-full"></div>
                  문의 내용
                </h2>
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{inquiry.content}</p>
                </div>
              </div>
            </div>

            {/* 관리자 답변 */}
            {inquiry.answer ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <FiCheckCircle className="w-5 h-5 text-white" />
                    </div>
                    관리자 답변
                  </h2>
                </div>
                <div className="p-6">
                  <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6 border border-primary-200">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed mb-4">{inquiry.answer.content}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-600 pt-4 border-t border-primary-200">
                      <FiUser className="w-4 h-4" />
                      <span className="font-medium">답변자:</span>
                      <span>관리자</span>
                      <span className="text-gray-400">•</span>
                      <FiClock className="w-4 h-4" />
                      <span>{new Date(inquiry.answer.createdAt).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex gap-3">
                  <FiAlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-900">
                    <p className="font-semibold mb-2">답변 대기 중입니다</p>
                    <ul className="space-y-1 ml-1">
                      <li>• 담당자가 확인 후 영업일 기준 1-2일 이내에 답변드립니다</li>
                      <li>• 답변이 등록되면 알림으로 안내해드립니다</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 수정/삭제 */}
            {canEdit && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-primary rounded-full"></div>
                  문의 관리
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push(`/inquiries/my/${uuid}/edit`)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                  >
                    <FiEdit className="w-5 h-5" />
                    수정하기
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center justify-center gap-2 bg-white border-2 border-red-300 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-50 hover:border-red-400 transition-all"
                  >
                    <FiTrash2 className="w-5 h-5" />
                    삭제하기
                  </button>
                  <p className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
                    답변이 등록되면 수정/삭제할 수 없습니다
                  </p>
                </div>
              </div>
            )}

            {/* 안내 */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-6">
              <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-primary-800 rounded-lg flex items-center justify-center">
                  <FiMessageSquare className="w-4 h-4 text-white" />
                </div>
                안내사항
              </h3>
              <ul className="text-sm text-primary-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary-700 mt-0.5">•</span>
                  <span>답변은 영업일 기준 1-2일 이내에 등록됩니다</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-700 mt-0.5">•</span>
                  <span>답변이 등록되면 알림으로 안내됩니다</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-700 mt-0.5">•</span>
                  <span>PENDING 상태에서만 수정/삭제 가능합니다</span>
                </li>
              </ul>
            </div>

            {/* 빠른 이동 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1.5 h-5 bg-gray-600 rounded-full"></div>
                빠른 이동
              </h3>
              <div className="space-y-2">
                <Link
                  href="/inquiries/my"
                  className="block w-full py-2.5 px-4 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  내 문의 목록
                </Link>
                <Link
                  href="/inquiries"
                  className="block w-full py-2.5 px-4 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  새 문의 작성
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
