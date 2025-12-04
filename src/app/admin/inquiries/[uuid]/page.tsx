'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiClock, FiUser, FiPhone, FiMail, FiMessageSquare, FiSave } from 'react-icons/fi'
import {
  adminGetPartnershipInquiry,
  adminChangePartnershipInquiryStatus,
  adminDeletePartnershipInquiry,
  PARTNERSHIP_TYPE_LABELS,
  PARTNERSHIP_STATUS_LABELS,
  PARTNERSHIP_STATUS_COLORS,
  type PartnershipInquiryResponse,
  type PartnershipStatus,
} from '@/lib/api/inquiry'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

export default function AdminInquiryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const uuid = params.uuid as string

  const [inquiry, setInquiry] = useState<PartnershipInquiryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<PartnershipStatus>('PENDING')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchInquiry = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await adminGetPartnershipInquiry(uuid)
      if (result.success && result.data) {
        setInquiry(result.data)
        setSelectedStatus(result.data.status)
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
      await adminChangePartnershipInquiryStatus(uuid, selectedStatus)
      showSuccessToast('문의 상태가 변경되었습니다')
      fetchInquiry()
    } catch (error) {
      showErrorToast(error, '상태 변경에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!inquiry) return
    if (!confirm(`정말로 "${inquiry.name}"의 문의를 삭제하시겠습니까?`)) return

    try {
      await adminDeletePartnershipInquiry(uuid)
      showSuccessToast('문의가 삭제되었습니다')
      router.push('/admin/inquiries')
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
            href="/admin/inquiries"
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
          href="/admin/inquiries"
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
                    <span className="text-lg font-semibold text-gray-900">
                      {PARTNERSHIP_TYPE_LABELS[inquiry.partnershipType]}
                    </span>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${PARTNERSHIP_STATUS_COLORS[inquiry.status]}`}>
                      {PARTNERSHIP_STATUS_LABELS[inquiry.status]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <FiUser className="text-gray-400" />
                  <span className="font-medium">이름:</span>
                  <span>{inquiry.name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <FiPhone className="text-gray-400" />
                  <span className="font-medium">연락처:</span>
                  <span>{inquiry.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <FiMail className="text-gray-400" />
                  <span className="font-medium">이메일:</span>
                  <span>{inquiry.email}</span>
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
                    onChange={(e) => setSelectedStatus(e.target.value as PartnershipStatus)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="PENDING">대기중</option>
                    <option value="IN_PROGRESS">처리중</option>
                    <option value="COMPLETED">완료</option>
                    <option value="CANCELLED">취소</option>
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
