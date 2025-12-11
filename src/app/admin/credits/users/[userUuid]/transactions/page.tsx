'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { getAdminUserCredit, getUserCreditTransactions, type AdminUserCredit, type AdminCreditTransaction } from '@/lib/api/admin-credit'
import { showErrorToast } from '@/lib/errorHandler'
import { useAuthStore } from '@/stores/authStore'
import { IoArrowBack, IoFilter } from 'react-icons/io5'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

export default function UserTransactionsPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const userUuid = params.userUuid as string
  const { accessToken, _hasHydrated, user } = useAuthStore()

  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(true)
  const [credit, setCredit] = useState<AdminUserCredit | null>(null)
  const [transactions, setTransactions] = useState<AdminCreditTransaction[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const [page, setPage] = useState(parseInt(searchParams.get('page') || '0'))
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '')

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
  }, [isCheckingAuth, userUuid, page, searchParams])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [creditRes, transactionsRes] = await Promise.all([
        getAdminUserCredit(userUuid),
        getUserCreditTransactions(userUuid, {
          page,
          size: 20,
        }),
      ])

      if (creditRes.success && creditRes.data) {
        setCredit(creditRes.data)
      }

      if (transactionsRes.success && transactionsRes.data) {
        setTransactions(transactionsRes.data.content)
        setTotalPages(transactionsRes.data.totalPages)
        setTotalElements(transactionsRes.data.totalElements)
      }
    } catch (error) {
      showErrorToast(error, '데이터를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleTypeFilter = (type: string) => {
    const params = new URLSearchParams()
    if (type) {
      params.set('type', type)
    }
    params.set('page', '0')
    router.push(`/admin/credits/users/${userUuid}/transactions?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    router.push(`/admin/credits/users/${userUuid}/transactions?${params.toString()}`)
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

  if (!credit) return null

  return (
    <AdminGuard>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/admin/credits/users/${userUuid}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <IoArrowBack className="text-xl" />
            돌아가기
          </button>
          <h1 className="text-3xl font-bold text-gray-900">거래 내역</h1>
          <p className="mt-2 text-sm text-gray-600">{credit.userEmail}</p>
        </div>

        {/* 사용자 정보 */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-blue-100 text-sm mb-1">가용 크레딧</p>
              <p className="text-3xl font-bold">{credit.availableCredits.toLocaleString()}원</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm mb-1">총 적립</p>
              <p className="text-2xl font-bold">+{credit.totalEarned.toLocaleString()}원</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm mb-1">총 사용</p>
              <p className="text-2xl font-bold">-{credit.totalSpent.toLocaleString()}원</p>
            </div>
          </div>
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
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              총 {totalElements}건의 거래
            </h2>
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">거래 내역이 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {transactions.map((tx) => (
                <div key={tx.transactionUuid} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTransactionTypeClass(tx.transactionType)}`}>
                          {getTransactionTypeLabel(tx.transactionType)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(tx.createdAt), 'yyyy년 MM월 dd일 HH:mm:ss', { locale: ko })}
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium mb-2">{tx.reason}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>거래 후 잔액: {tx.balanceAfter.toLocaleString()}원</span>
                        {tx.entityType && (
                          <span>연결: {tx.entityType}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`text-xl font-bold ${
                        tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}원
                      </p>
                    </div>
                  </div>
                </div>
              ))}
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
