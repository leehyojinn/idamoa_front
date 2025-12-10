'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getAdminCreditTransactions, type AdminCreditTransaction } from '@/lib/api/admin-credit'
import { showErrorToast } from '@/lib/errorHandler'
import { useAuthStore } from '@/stores/authStore'
import { IoSearch, IoFilter, IoEye } from 'react-icons/io5'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

export default function AllTransactionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { accessToken, _hasHydrated, user } = useAuthStore()

  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<AdminCreditTransaction[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '0'))

  useEffect(() => {
    if (!_hasHydrated) return
    if (!accessToken || user?.currentRole !== 'ADMIN') {
      showErrorToast(null, '관리자 권한이 필요합니다')
      router.push('/admin')
      return
    }
    setIsCheckingAuth(false)
  }, [accessToken, _hasHydrated, user, router])

  useEffect(() => {
    if (isCheckingAuth) return
    fetchData()
  }, [isCheckingAuth, page, searchParams])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = {
        page,
        size: 20,
        sort: 'createdAt,desc',
      }

      const typeParam = searchParams.get('type')
      if (typeParam) {
        params.type = typeParam
      }

      const keywordParam = searchParams.get('keyword')
      if (keywordParam) {
        params.keyword = keywordParam
      }

      const result = await getAdminCreditTransactions(params)

      if (result.success && result.data) {
        setTransactions(result.data.content)
        setTotalPages(result.data.totalPages)
        setTotalElements(result.data.totalElements)
      }
    } catch (error) {
      showErrorToast(error, '데이터를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (keyword.trim()) {
      params.set('keyword', keyword.trim())
    } else {
      params.delete('keyword')
    }
    params.set('page', '0')
    router.push(`/admin/credits/transactions?${params.toString()}`)
  }

  const handleTypeFilter = (type: string) => {
    const params = new URLSearchParams(searchParams)
    if (type) {
      params.set('type', type)
    } else {
      params.delete('type')
    }
    params.set('page', '0')
    router.push(`/admin/credits/transactions?${params.toString()}`)
  }

  const handleClear = () => {
    setKeyword('')
    setTypeFilter('')
    router.push('/admin/credits/transactions')
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    router.push(`/admin/credits/transactions?${params.toString()}`)
  }

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      EARN: '적립',
      SPEND: '사용',
      REFUND: '환불',
      ADMIN_GRANT: '관리자 지급',
      ADMIN_DEDUCT: '관리자 차감',
      EXPIRE: '만료',
    }
    return labels[type] || type
  }

  const getTransactionTypeClass = (type: string) => {
    if (type === 'EARN' || type === 'REFUND' || type === 'ADMIN_GRANT') {
      return 'bg-green-100 text-green-700'
    }
    return 'bg-red-100 text-red-700'
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
          <h1 className="text-3xl font-bold text-gray-900">전체 거래 내역</h1>
          <p className="mt-2 text-sm text-gray-600">
            모든 사용자의 크레딧 거래 내역을 조회합니다
          </p>
        </div>

        {/* 통계 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm text-gray-600">총 거래 건수</p>
              <p className="text-2xl font-bold text-gray-900">{totalElements.toLocaleString()}건</p>
            </div>
          </div>
        </div>

        {/* 검색 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="이메일 또는 사유로 검색"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              검색
            </button>
            {(keyword || typeFilter) && (
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

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <IoFilter className="text-xl text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">거래 유형 필터</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleTypeFilter('')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !typeFilter
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            {['EARN', 'SPEND', 'REFUND', 'ADMIN_GRANT', 'ADMIN_DEDUCT', 'EXPIRE'].map(type => (
              <button
                key={type}
                onClick={() => handleTypeFilter(type)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  typeFilter === type
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getTransactionTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>

        {/* 거래 내역 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">거래 내역이 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      일시
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      유형
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사유
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      금액
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      거래 후 잔액
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx.transactionUuid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(tx.createdAt), 'MM/dd HH:mm', { locale: ko })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{tx.userEmail}</div>
                          <div className="text-xs text-gray-500">{tx.userName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeClass(tx.transactionType)}`}>
                          {getTransactionTypeLabel(tx.transactionType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-sm text-gray-900">
                        {tx.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-sm font-bold ${
                          tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}원
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {tx.balanceAfter.toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/admin/credits/users/${tx.userUuid}`)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1 justify-end ml-auto"
                        >
                          <IoEye />
                          상세
                        </button>
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
