'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { FiPlus, FiEdit2, FiTrash2, FiXCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import {
  useAdminCompanyPartnerships,
  useAdminCancelCompanyPartnership,
  useAdminDeleteCompanyPartnership,
} from '@/hooks/usePartnership'
import { COMPANY_PARTNERSHIP_STATUS_LABELS, type CompanyPartnershipStatus } from '@/types/partnership'
import AdminGuard from '@/components/auth/AdminGuard'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function AdminCompanyPartnershipsPage() {
  const [status, setStatus] = useState<CompanyPartnershipStatus | undefined>()
  const [page, setPage] = useState(0)

  const { data, isLoading, error } = useAdminCompanyPartnerships({ status, page, size: 20 })
  const cancelMutation = useAdminCancelCompanyPartnership()
  const deleteMutation = useAdminDeleteCompanyPartnership()

  const handleCancel = (uuid: string, companyName: string) => {
    if (confirm(`"${companyName}" 제휴를 취소하시겠습니까?`)) {
      cancelMutation.mutate(uuid)
    }
  }

  const handleDelete = (uuid: string, companyName: string) => {
    if (confirm(`"${companyName}" 제휴를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.`)) {
      deleteMutation.mutate(uuid)
    }
  }

  const getStatusBadgeClass = (status: CompanyPartnershipStatus) => {
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

  return (
    <AdminGuard>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">제휴업체 관리</h1>
              <p className="text-sm text-gray-600 mt-1">제휴업체 목록을 관리합니다.</p>
            </div>
            <Link
              href="/admin/company-partnerships/create"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-5 h-5" />
              제휴업체 등록
            </Link>
          </div>

          {/* 필터 */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">상태 필터:</label>
              <select
                value={status || ''}
                onChange={(e) => {
                  setStatus((e.target.value as CompanyPartnershipStatus) || undefined)
                  setPage(0)
                }}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">전체</option>
                {(Object.keys(COMPANY_PARTNERSHIP_STATUS_LABELS) as CompanyPartnershipStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {COMPANY_PARTNERSHIP_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 테이블 */}
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-red-500">
              데이터를 불러오지 못했습니다.
            </div>
          ) : !data || data.content.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              등록된 제휴업체가 없습니다.
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          순서
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          업체명
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          시작일
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          만료일
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          등록자
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          관리
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.content.map((partnership) => (
                        <tr key={partnership.uuid} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {partnership.displayOrder}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Link
                              href={`/admin/company-partnerships/${partnership.uuid}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {partnership.companyName}
                            </Link>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {format(new Date(partnership.startDate), 'yyyy-MM-dd')}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {format(new Date(partnership.endDate), 'yyyy-MM-dd')}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                                partnership.status
                              )}`}
                            >
                              {COMPANY_PARTNERSHIP_STATUS_LABELS[partnership.status]}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {partnership.registeredByEmail || '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/company-partnerships/${partnership.uuid}/edit`}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="수정"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </Link>
                              {partnership.status === 'ACTIVE' && (
                                <button
                                  onClick={() => handleCancel(partnership.uuid, partnership.companyName)}
                                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                  disabled={cancelMutation.isPending}
                                  title="취소"
                                >
                                  <FiXCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(partnership.uuid, partnership.companyName)}
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
