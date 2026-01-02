'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { FiPlus, FiEdit2, FiTrash2, FiXCircle, FiChevronLeft, FiChevronRight, FiSave, FiX } from 'react-icons/fi'
import {
  useAdminCompanyPartnerships,
  useAdminToggleCompanyPartnershipStatus,
  useAdminDeleteCompanyPartnership,
  useAdminReorderCompanyPartnerships,
} from '@/hooks/usePartnership'
import { COMPANY_PARTNERSHIP_STATUS_LABELS, type CompanyPartnershipStatus } from '@/types/partnership'
import AdminGuard from '@/components/auth/AdminGuard'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import toast from 'react-hot-toast'

export default function AdminCompanyPartnershipsPage() {
  const [status, setStatus] = useState<CompanyPartnershipStatus | undefined>()
  const [page, setPage] = useState(0)
  const [isReorderMode, setIsReorderMode] = useState(false)
  const [orderMap, setOrderMap] = useState<Record<string, number>>({})

  const { data, isLoading, error } = useAdminCompanyPartnerships({ status, page, size: 20 })
  const toggleStatusMutation = useAdminToggleCompanyPartnershipStatus()
  const deleteMutation = useAdminDeleteCompanyPartnership()
  const reorderMutation = useAdminReorderCompanyPartnerships()

  // 데이터가 로드되면 순서 맵 초기화
  useEffect(() => {
    if (data?.content) {
      const initialOrderMap: Record<string, number> = {}
      data.content.forEach((p) => {
        initialOrderMap[p.uuid] = p.displayOrder
      })
      setOrderMap(initialOrderMap)
    }
  }, [data])

  const handleToggleStatus = (uuid: string, companyName: string, currentStatus: string) => {
    const action = currentStatus === 'ACTIVE' ? '비활성화' : '재활성화'
    if (confirm(`"${companyName}" 제휴를 ${action}하시겠습니까?`)) {
      toggleStatusMutation.mutate(uuid)
    }
  }

  const handleDelete = (uuid: string, companyName: string) => {
    if (confirm(`"${companyName}" 제휴를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.`)) {
      deleteMutation.mutate(uuid)
    }
  }

  const handleOrderChange = (uuid: string, value: string) => {
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0) {
      setOrderMap((prev) => ({ ...prev, [uuid]: numValue }))
    }
  }

  const handleSaveOrder = () => {
    const orders = Object.entries(orderMap).map(([partnershipUuid, displayOrder]) => ({
      partnershipUuid,
      displayOrder,
    }))

    reorderMutation.mutate(
      { orders },
      {
        onSuccess: () => {
          toast.success('순서가 저장되었습니다.')
          setIsReorderMode(false)
        },
        onError: () => {
          toast.error('순서 저장에 실패했습니다.')
        },
      }
    )
  }

  const handleCancelReorder = () => {
    // 원래 순서로 복원
    if (data?.content) {
      const initialOrderMap: Record<string, number> = {}
      data.content.forEach((p) => {
        initialOrderMap[p.uuid] = p.displayOrder
      })
      setOrderMap(initialOrderMap)
    }
    setIsReorderMode(false)
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
            <div className="flex items-center gap-3">
              {isReorderMode ? (
                <>
                  <button
                    onClick={handleCancelReorder}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                    취소
                  </button>
                  <button
                    onClick={handleSaveOrder}
                    disabled={reorderMutation.isPending}
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    <FiSave className="w-5 h-5" />
                    {reorderMutation.isPending ? '저장 중...' : '순서 저장'}
                  </button>
                </>
              ) : (
                <>
                  {data && data.content.length > 0 && (
                    <button
                      onClick={() => setIsReorderMode(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <FiEdit2 className="w-5 h-5" />
                      순서 변경
                    </button>
                  )}
                  <Link
                    href="/admin/company-partnerships/create"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FiPlus className="w-5 h-5" />
                    제휴업체 등록
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* 순서 변경 모드 안내 */}
          {isReorderMode && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                순서를 변경하려면 순서 값을 직접 입력하세요. 숫자가 작을수록 먼저 노출됩니다.
              </p>
            </div>
          )}

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
                disabled={isReorderMode}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
                        {!isReorderMode && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            관리
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.content.map((partnership) => (
                        <tr key={partnership.uuid} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isReorderMode ? (
                              <input
                                type="number"
                                min="0"
                                value={orderMap[partnership.uuid] ?? partnership.displayOrder}
                                onChange={(e) => handleOrderChange(partnership.uuid, e.target.value)}
                                className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            ) : (
                              partnership.displayOrder
                            )}
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
                          {!isReorderMode && (
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/admin/company-partnerships/${partnership.uuid}/edit`}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="수정"
                                >
                                  <FiEdit2 className="w-4 h-4" />
                                </Link>
                                {(partnership.status === 'ACTIVE' || partnership.status === 'CANCELLED') && (
                                  <button
                                    onClick={() => handleToggleStatus(partnership.uuid, partnership.companyName, partnership.status)}
                                    className={`p-2 rounded-lg transition-colors ${
                                      partnership.status === 'ACTIVE'
                                        ? 'text-orange-600 hover:bg-orange-50'
                                        : 'text-green-600 hover:bg-green-50'
                                    }`}
                                    disabled={toggleStatusMutation.isPending}
                                    title={partnership.status === 'ACTIVE' ? '비활성화' : '재활성화'}
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
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 페이지네이션 */}
              {!isReorderMode && data.totalPages > 1 && (
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
