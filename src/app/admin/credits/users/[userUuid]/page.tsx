'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getAdminUserCredit, getUserCreditTransactions, type AdminUserCredit, type AdminCreditTransaction } from '@/lib/api/admin-credit'
import { showErrorToast } from '@/lib/errorHandler'
import { useAuthStore } from '@/stores/authStore'
import { IoArrowBack, IoCash, IoAdd, IoRemove, IoList } from 'react-icons/io5'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

export default function UserCreditDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userUuid = params.userUuid as string
  const { accessToken, _hasHydrated, user } = useAuthStore()

  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(true)
  const [credit, setCredit] = useState<AdminUserCredit | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<AdminCreditTransaction[]>([])

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
  }, [isCheckingAuth, userUuid])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [creditRes, transactionsRes] = await Promise.all([
        getAdminUserCredit(userUuid),
        getUserCreditTransactions(userUuid, { page: 0, size: 5 }),
      ])

      if (creditRes.success && creditRes.data) {
        setCredit(creditRes.data)
      }

      if (transactionsRes.success && transactionsRes.data) {
        setRecentTransactions(transactionsRes.data.content)
      }
    } catch (error) {
      showErrorToast(error, '데이터를 불러오는데 실패했습니다')
      router.push('/admin/credits/users')
    } finally {
      setLoading(false)
    }
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
      return 'text-green-600'
    }
    return 'text-red-600'
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
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <IoArrowBack className="text-xl" />
            돌아가기
          </button>
          <h1 className="text-3xl font-bold text-gray-900">사용자 크레딧 상세</h1>
          <p className="mt-2 text-sm text-gray-600">{credit.userEmail}</p>
        </div>

        {/* 크레딧 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-primary-500 to-primary rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <IoCash className="text-3xl" />
              <h3 className="text-lg font-semibold">가용 크레딧</h3>
            </div>
            <p className="text-4xl font-bold">{credit.availableCredits.toLocaleString()}원</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">총 적립</h3>
            <p className="text-3xl font-bold text-green-600">+{credit.totalEarned.toLocaleString()}원</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">총 사용</h3>
            <p className="text-3xl font-bold text-red-600">-{credit.totalSpent.toLocaleString()}원</p>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">관리 작업</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push(`/admin/credits/users/${userUuid}/grant`)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <IoAdd className="text-xl" />
              크레딧 지급
            </button>
            <button
              onClick={() => router.push(`/admin/credits/users/${userUuid}/deduct`)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <IoRemove className="text-xl" />
              크레딧 차감
            </button>
            <button
              onClick={() => router.push(`/admin/credits/users/${userUuid}/transactions`)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <IoList className="text-xl" />
              전체 거래 내역
            </button>
          </div>
        </div>

        {/* 최근 거래 내역 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">최근 거래 내역 (5건)</h2>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">거래 내역이 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentTransactions.map((tx) => (
                <div key={tx.transactionUuid} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tx.transactionType === 'EARN' || tx.transactionType === 'REFUND' || tx.transactionType === 'ADMIN_GRANT'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {getTransactionTypeLabel(tx.transactionType)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(tx.createdAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium">{tx.reason}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        잔액: {tx.balanceAfter.toLocaleString()}원
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`text-lg font-bold ${getTransactionTypeClass(tx.transactionType)}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}원
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
      <Footer />
    </AdminGuard>
  )
}
