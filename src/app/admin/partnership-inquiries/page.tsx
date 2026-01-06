'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { FiEye, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import {
  useAdminPartnershipInquiries,
  useAdminDeletePartnershipInquiry,
} from '@/hooks/usePartnership'
import {
  PARTNERSHIP_TYPE_LABELS,
  PARTNERSHIP_STATUS_LABELS,
  type PartnershipType,
  type PartnershipStatus,
} from '@/types/partnership'
import AdminGuard from '@/components/auth/AdminGuard'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import toast from 'react-hot-toast'

export default function AdminPartnershipInquiriesPage() {
  const [status, setStatus] = useState<PartnershipStatus | undefined>()
  const [type, setType] = useState<PartnershipType | undefined>()
  const [page, setPage] = useState(0)

  const { data, isLoading, error } = useAdminPartnershipInquiries({
    status,
    type,
    page,
    size: 20,
    sort: 'createdAt,desc',
  })
  const deleteMutation = useAdminDeletePartnershipInquiry()

  const handleDelete = (uuid: string) => {
    if (confirm('이 문의를 삭제하시겠습니까?')) {
      deleteMutation.mutate(uuid, {
        onSuccess: () => toast.success('문의가 삭제되었습니다.'),
        onError: () => toast.error('문의 삭제에 실패했습니다.'),
      })
    }
  }

  const getStatusBadgeClass = (status: PartnershipStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS':
        return 'bg-primary-100 text-primary-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeBadgeClass = (type: PartnershipType) => {
    switch (type) {
      case 'PARTNERSHIP':
        return 'bg-purple-100 text-purple-800'
      case 'ADVERTISEMENT':
        return 'bg-indigo-100 text-indigo-800'
      case 'OTHER':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 헤더 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">제휴/광고 문의 관리</h1>
            <p className="text-sm text-gray-600 mt-1">접수된 제휴 및 광고 문의를 관리합니다.</p>
          </div>

          {/* 필터 */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">상태:</label>
                <select
                  value={status || ''}
                  onChange={(e) => {
                    setStatus((e.target.value as PartnershipStatus) || undefined)
                    setPage(0)
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                >
                  <option value="">전체</option>
                  {(Object.keys(PARTNERSHIP_STATUS_LABELS) as PartnershipStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {PARTNERSHIP_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">유형:</label>
                <select
                  value={type || ''}
                  onChange={(e) => {
                    setType((e.target.value as PartnershipType) || undefined)
                    setPage(0)
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                >
                  <option value="">전체</option>
                  {(Object.keys(PARTNERSHIP_TYPE_LABELS) as PartnershipType[]).map((t) => (
                    <option key={t} value={t}>
                      {PARTNERSHIP_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 테이블 */}
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-red-500">
              데이터를 불러오지 못했습니다.
            </div>
          ) : !data || data.content.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              등록된 문의가 없습니다.
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          유형
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          이름
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          이메일
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          접수일
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          관리
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.content.map((inquiry) => (
                        <tr key={inquiry.uuid} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeClass(
                                inquiry.partnershipType
                              )}`}
                            >
                              {PARTNERSHIP_TYPE_LABELS[inquiry.partnershipType]}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {inquiry.name}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {inquiry.email}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                                inquiry.status
                              )}`}
                            >
                              {PARTNERSHIP_STATUS_LABELS[inquiry.status]}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {format(new Date(inquiry.createdAt), 'yyyy-MM-dd HH:mm')}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/partnership-inquiries/${inquiry.uuid}`}
                                className="p-2 text-primary hover:bg-primary-50 rounded-lg transition-colors"
                                title="상세보기"
                              >
                                <FiEye className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDelete(inquiry.uuid)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                disabled={deleteMutation.isPending}
                                title="삭제"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 페이지네이션 */}
              {data.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                    이전
                  </button>
                  <span className="text-sm text-gray-600">
                    {page + 1} / {data.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                    disabled={page >= data.totalPages - 1}
                    className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </AdminGuard>
  )
}
