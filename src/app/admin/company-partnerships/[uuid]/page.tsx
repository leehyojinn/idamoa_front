'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { FiArrowLeft, FiEdit2, FiTrash2, FiXCircle } from 'react-icons/fi'
import {
  useAdminCompanyPartnership,
  useAdminCancelCompanyPartnership,
  useAdminDeleteCompanyPartnership,
} from '@/hooks/usePartnership'
import { COMPANY_PARTNERSHIP_STATUS_LABELS } from '@/types/partnership'
import AdminGuard from '@/components/auth/AdminGuard'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import toast from 'react-hot-toast'

interface PageProps {
  params: Promise<{ uuid: string }>
}

export default function AdminCompanyPartnershipDetailPage({ params }: PageProps) {
  const { uuid } = use(params)
  const router = useRouter()

  const { data: partnership, isLoading, error } = useAdminCompanyPartnership(uuid)
  const cancelMutation = useAdminCancelCompanyPartnership()
  const deleteMutation = useAdminDeleteCompanyPartnership()

  const handleCancel = () => {
    if (!partnership) return
    if (confirm(`"${partnership.companyName}" 제휴를 취소하시겠습니까?`)) {
      cancelMutation.mutate(uuid, {
        onSuccess: () => {
          toast.success('제휴가 취소되었습니다.')
        },
        onError: () => {
          toast.error('제휴 취소에 실패했습니다.')
        },
      })
    }
  }

  const handleDelete = () => {
    if (!partnership) return
    if (confirm(`"${partnership.companyName}" 제휴를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.`)) {
      deleteMutation.mutate(uuid, {
        onSuccess: () => {
          toast.success('제휴가 삭제되었습니다.')
          router.push('/admin/company-partnerships')
        },
        onError: () => {
          toast.error('제휴 삭제에 실패했습니다.')
        },
      })
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800'
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

  if (error || !partnership) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">제휴 정보를 불러올 수 없습니다.</p>
            <Link href="/admin/company-partnerships" className="text-blue-600 hover:underline">
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
                <h1 className="text-2xl font-bold text-gray-900">{partnership.companyName}</h1>
                <p className="text-sm text-gray-600 mt-1">제휴업체 상세 정보</p>
              </div>
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
                  partnership.status
                )}`}
              >
                {COMPANY_PARTNERSHIP_STATUS_LABELS[partnership.status]}
              </span>
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">업체명</label>
                <p className="text-gray-900">{partnership.companyName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">슬러그</label>
                <p className="text-gray-900">{partnership.companySlug}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">시작일</label>
                <p className="text-gray-900">{format(new Date(partnership.startDate), 'yyyy-MM-dd')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">만료일</label>
                <p className="text-gray-900">{format(new Date(partnership.endDate), 'yyyy-MM-dd')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">노출 순서</label>
                <p className="text-gray-900">{partnership.displayOrder}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">등록자</label>
                <p className="text-gray-900">{partnership.registeredByEmail || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">등록일</label>
                <p className="text-gray-900">
                  {format(new Date(partnership.createdAt), 'yyyy-MM-dd HH:mm')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">수정일</label>
                <p className="text-gray-900">
                  {format(new Date(partnership.updatedAt), 'yyyy-MM-dd HH:mm')}
                </p>
              </div>
            </div>

            {partnership.adminMemo && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">관리자 메모</label>
                <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
                  {partnership.adminMemo}
                </p>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link
                href={`/admin/company-partnerships/${uuid}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FiEdit2 className="w-4 h-4" />
                수정
              </Link>
              {partnership.status === 'ACTIVE' && (
                <button
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
                >
                  <FiXCircle className="w-4 h-4" />
                  취소
                </button>
              )}
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
