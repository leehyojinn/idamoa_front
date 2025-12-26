'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { FiArrowLeft, FiTrash2, FiPhone, FiMail } from 'react-icons/fi'
import {
  useAdminPartnershipInquiry,
  useAdminChangePartnershipInquiryStatus,
  useAdminDeletePartnershipInquiry,
} from '@/hooks/usePartnership'
import {
  PARTNERSHIP_TYPE_LABELS,
  PARTNERSHIP_STATUS_LABELS,
  type PartnershipStatus,
} from '@/types/partnership'
import AdminGuard from '@/components/auth/AdminGuard'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import toast from 'react-hot-toast'

interface PageProps {
  params: Promise<{ uuid: string }>
}

export default function AdminPartnershipInquiryDetailPage({ params }: PageProps) {
  const { uuid } = use(params)
  const router = useRouter()

  const { data: inquiry, isLoading, error } = useAdminPartnershipInquiry(uuid)
  const changeStatusMutation = useAdminChangePartnershipInquiryStatus()
  const deleteMutation = useAdminDeletePartnershipInquiry()

  const handleStatusChange = (newStatus: PartnershipStatus) => {
    if (confirm(`상태를 "${PARTNERSHIP_STATUS_LABELS[newStatus]}"으로 변경하시겠습니까?`)) {
      changeStatusMutation.mutate(
        { inquiryUuid: uuid, status: newStatus },
        {
          onSuccess: () => toast.success('상태가 변경되었습니다.'),
          onError: () => toast.error('상태 변경에 실패했습니다.'),
        }
      )
    }
  }

  const handleDelete = () => {
    if (confirm('이 문의를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.')) {
      deleteMutation.mutate(uuid, {
        onSuccess: () => {
          toast.success('문의가 삭제되었습니다.')
          router.push('/admin/partnership-inquiries')
        },
        onError: () => toast.error('문의 삭제에 실패했습니다.'),
      })
    }
  }

  const getStatusBadgeClass = (status: PartnershipStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
        </div>
        <Footer />
      </AdminGuard>
    )
  }

  if (error || !inquiry) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">문의 정보를 불러올 수 없습니다.</p>
            <Link href="/admin/partnership-inquiries" className="text-blue-600 hover:underline">
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 헤더 */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <FiArrowLeft className="w-4 h-4" />
              뒤로가기
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">문의 상세</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {PARTNERSHIP_TYPE_LABELS[inquiry.partnershipType]}
                </p>
              </div>
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
                  inquiry.status
                )}`}
              >
                {PARTNERSHIP_STATUS_LABELS[inquiry.status]}
              </span>
            </div>
          </div>

          {/* 상태 변경 버튼 */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">상태 변경</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PARTNERSHIP_STATUS_LABELS) as PartnershipStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={inquiry.status === s || changeStatusMutation.isPending}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    inquiry.status === s
                      ? 'bg-blue-600 text-white cursor-default'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                  }`}
                >
                  {PARTNERSHIP_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            {/* 문의자 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">이름</label>
                <p className="text-gray-900 font-medium">{inquiry.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">문의 유형</label>
                <p className="text-gray-900">{inquiry.partnershipTypeDescription}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">이메일</label>
                <a
                  href={`mailto:${inquiry.email}`}
                  className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <FiMail className="w-4 h-4" />
                  {inquiry.email}
                </a>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">연락처</label>
                <a
                  href={`tel:${inquiry.phone}`}
                  className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <FiPhone className="w-4 h-4" />
                  {inquiry.phone}
                </a>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">접수일</label>
                <p className="text-gray-900">
                  {format(new Date(inquiry.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">수정일</label>
                <p className="text-gray-900">
                  {format(new Date(inquiry.updatedAt), 'yyyy-MM-dd HH:mm:ss')}
                </p>
              </div>
            </div>

            {/* 문의 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">문의 내용</label>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 whitespace-pre-wrap">{inquiry.content}</p>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <a
                href={`mailto:${inquiry.email}`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FiMail className="w-4 h-4" />
                이메일 보내기
              </a>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
              >
                <FiTrash2 className="w-4 h-4" />
                삭제
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </AdminGuard>
  )
}
