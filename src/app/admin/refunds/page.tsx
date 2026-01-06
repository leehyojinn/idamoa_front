'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  getAdminRefunds,
  getRefundStats,
  type AdminRefund,
  type RefundStatus,
  type RefundStats,
} from '@/lib/api/admin-refund'
import { showErrorToast } from '@/lib/errorHandler'
import { useAuthStore } from '@/stores/authStore'
import { IoSearch, IoTime, IoCheckmarkCircle, IoCloseCircle, IoCash } from 'react-icons/io5'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

export default function AdminRefundsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { accessToken, _hasHydrated, user } = useAuthStore()

  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(true)
  const [refunds, setRefunds] = useState<AdminRefund[]>([])
  const [stats, setStats] = useState<RefundStats | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [statusFilter, setStatusFilter] = useState<RefundStatus | ''>(
    (searchParams.get('status') as RefundStatus) || ''
  )
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '0'))

  // 인증 체크
  useEffect(() => {
    if (!_hasHydrated) return

    if (!accessToken || user?.currentRole !== 'ADMIN') {
      showErrorToast(null, '관리자 권한이 필요합니다')
      router.push('/admin')
      return
    }
    setIsCheckingAuth(false)
  }, [accessToken, _hasHydrated, user, router])

  // 데이터 로드
  useEffect(() => {
    if (isCheckingAuth) return
    fetchData()
    fetchStats()
  }, [isCheckingAuth, page, searchParams])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = {
        page,
        size: 20,
        sort: 'createdAt,desc',
      }

      const statusParam = searchParams.get('status') as RefundStatus
      if (statusParam) {
        params.status = statusParam
      }

      const keywordParam = searchParams.get('keyword')
      if (keywordParam) {
        params.keyword = keywordParam
      }

      const result = await getAdminRefunds(params)

      if (result.success && result.data) {
        setRefunds(result.data.content)
        setTotalPages(result.data.totalPages)
        setTotalElements(result.data.totalElements)
      }
    } catch (error) {
      showErrorToast(error, '데이터를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const result = await getRefundStats()
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (error) {
      showErrorToast(error, '통계 데이터를 불러오는데 실패했습니다')
    }
  }

  // 검색
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (keyword.trim()) {
      params.set('keyword', keyword.trim())
    }
    if (statusFilter) {
      params.set('status', statusFilter)
    }
    params.set('page', '0')
    router.push(`/admin/refunds?${params.toString()}`)
  }

  // 상태 필터 변경
  const handleStatusChange = (status: RefundStatus | '') => {
    setStatusFilter(status)
    const params = new URLSearchParams(searchParams)
    if (status) {
      params.set('status', status)
    } else {
      params.delete('status')
    }
    params.set('page', '0')
    router.push(`/admin/refunds?${params.toString()}`)
  }

  // 검색 초기화
  const handleClear = () => {
    setKeyword('')
    setStatusFilter('')
    router.push('/admin/refunds')
  }

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    router.push(`/admin/refunds?${params.toString()}`)
  }

  // 상태 뱃지
  const getStatusBadge = (status: RefundStatus) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      FAILED: 'bg-gray-100 text-gray-800',
    }

    const labels = {
      PENDING: '대기 중',
      COMPLETED: '완료',
      REJECTED: '거부됨',
      FAILED: '실패',
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    )
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

  if (isCheckingAuth || loading) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </div>
        <Footer />
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">환불 관리</h1>
            <p className="mt-2 text-sm text-gray-600">
              사용자 환불 요청을 조회하고 승인/거부 처리합니다
            </p>
          </div>

          {/* 통계 */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <IoTime className="text-2xl text-yellow-600" />
                  <div>
                    <p className="text-sm text-yellow-800">대기 중</p>
                    <p className="text-2xl font-bold text-yellow-900">{stats.pendingCount}건</p>
                    <p className="text-xs text-yellow-600">{stats.pendingAmount.toLocaleString()}원</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <IoCheckmarkCircle className="text-2xl text-green-600" />
                  <div>
                    <p className="text-sm text-green-800">승인 완료</p>
                    <p className="text-2xl font-bold text-green-900">{stats.completedCount}건</p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <IoCloseCircle className="text-2xl text-red-600" />
                  <div>
                    <p className="text-sm text-red-800">거부됨</p>
                    <p className="text-2xl font-bold text-red-900">{stats.rejectedCount}건</p>
                  </div>
                </div>
              </div>
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 md:col-span-2">
                <div className="flex items-center gap-2">
                  <IoCash className="text-2xl text-primary" />
                  <div>
                    <p className="text-sm text-primary-800">총 환불 완료 금액</p>
                    <p className="text-2xl font-bold text-primary">
                      {stats.totalRefundedAmount.toLocaleString()}원
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 검색 및 필터 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value as RefundStatus | '')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">전체 상태</option>
                <option value="PENDING">대기 중</option>
                <option value="COMPLETED">완료</option>
                <option value="REJECTED">거부됨</option>
                <option value="FAILED">실패</option>
              </select>
              <div className="flex-1 relative min-w-[200px]">
                <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="이메일 또는 환불 사유로 검색"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                검색
              </button>
              {(keyword || statusFilter) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  초기화
                </button>
              )}
            </form>
          </div>

          {/* 환불 목록 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {refunds.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500">환불 내역이 없습니다</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        신청자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        환불 금액
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        환불 계좌
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        신청일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {refunds.map((refund) => (
                      <tr key={refund.refundUuid} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {refund.userName || refund.userEmail}
                            </div>
                            <div className="text-sm text-gray-500">{refund.userEmail}</div>
                            <div className="text-xs text-gray-400 truncate max-w-xs">
                              {refund.refundReason}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-primary">
                            {refund.refundAmount.toLocaleString()}원
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{refund.bankName}</div>
                          <div className="text-xs text-gray-500">
                            {refund.accountNumber} ({refund.accountHolder})
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(refund.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(refund.status)}
                          {refund.rejectionReason && (
                            <div className="text-xs text-red-500 mt-1 truncate max-w-[150px]">
                              {refund.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {refund.status === 'PENDING' ? (
                            <button
                              onClick={() => router.push(`/admin/refunds/${refund.refundUuid}`)}
                              className="text-primary hover:text-primary"
                            >
                              처리하기
                            </button>
                          ) : (
                            <button
                              onClick={() => router.push(`/admin/refunds/${refund.refundUuid}`)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              상세보기
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    총 {totalElements}건 | {page + 1} / {totalPages} 페이지
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 0}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      이전
                    </button>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages - 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      다음
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </AdminGuard>
  )
}
