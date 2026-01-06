'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getCreditTransactions, getCreditBalance, type TransactionType } from '@/lib/api/credit'
import { showErrorToast } from '@/lib/errorHandler'
import { useAuthStore } from '@/stores/authStore'
import { IoCash, IoArrowUp, IoArrowDown, IoTimeOutline, IoRefreshOutline } from 'react-icons/io5'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function TransactionsPage() {
  const router = useRouter()
  const { accessToken, _hasHydrated } = useAuthStore()

  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // 인증 체크
  useEffect(() => {
    if (!_hasHydrated) return

    if (!accessToken) {
      showErrorToast(null, '로그인이 필요한 페이지입니다')
      router.push('/login')
      return
    }
    setIsCheckingAuth(false)
  }, [accessToken, _hasHydrated, router])

  // 초기 데이터 로드
  useEffect(() => {
    if (isCheckingAuth) return

    const fetchInitialData = async () => {
      try {
        const [balanceRes, transactionsRes] = await Promise.all([
          getCreditBalance(),
          getCreditTransactions(0, 20, 'createdAt,desc'),
        ])

        if (balanceRes.success && balanceRes.data) {
          setBalance(balanceRes.data.balance)
        }

        if (transactionsRes.success && transactionsRes.data) {
          setTransactions(transactionsRes.data.content)
          setTotalPages(transactionsRes.data.totalPages)
          setHasMore(!transactionsRes.data.last)
        }
      } catch (error) {
        showErrorToast(error, '데이터를 불러오는데 실패했습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [isCheckingAuth])

  // 더보기
  const loadMore = async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    const nextPage = currentPage + 1

    try {
      const result = await getCreditTransactions(nextPage, 20, 'createdAt,desc')

      if (result.success && result.data) {
        setTransactions([...transactions, ...result.data.content])
        setCurrentPage(nextPage)
        setHasMore(!result.data.last)
      }
    } catch (error) {
      showErrorToast(error, '데이터를 불러오는데 실패했습니다')
    } finally {
      setLoadingMore(false)
    }
  }

  // 거래 유형 라벨
  const getTransactionTypeLabel = (type: TransactionType) => {
    const labels = {
      EARN: '적립',
      SPEND: '사용',
      EXPIRE: '만료',
      REFUND: '환불',
    }
    return labels[type] || type
  }

  // 거래 유형 스타일
  const getTransactionTypeStyle = (type: TransactionType) => {
    if (type === 'EARN' || type === 'REFUND') {
      return 'bg-green-100 text-green-700'
    }
    return 'bg-red-100 text-red-700'
  }

  // 거래 유형 아이콘
  const getTransactionTypeIcon = (type: TransactionType) => {
    if (type === 'EARN' || type === 'REFUND') {
      return <IoArrowUp className="text-green-600" />
    }
    if (type === 'EXPIRE') {
      return <IoTimeOutline className="text-gray-600" />
    }
    return <IoArrowDown className="text-red-600" />
  }

  if (isCheckingAuth || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar showQuickmenu={false} />

      <main className="flex-1 bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">거래 내역</h1>
            <p className="mt-2 text-sm text-gray-600">
              크레딧 충전 및 사용 내역을 확인하세요
            </p>
          </div>

          {/* 현재 잔액 */}
          <div className="bg-gradient-to-br from-primary-500 to-primary rounded-xl p-6 mb-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">현재 크레딧 잔액</p>
                <p className="text-3xl font-bold mt-1">{balance.toLocaleString()} 원</p>
              </div>
              <IoCash className="text-5xl opacity-20" />
            </div>
          </div>

          {/* 거래 내역 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">거래 내역</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push('/mypage/credits/purchase')}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    충전하기
                  </button>
                  <button
                    onClick={() => router.push('/mypage/credits/refund')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    환불하기
                  </button>
                </div>
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500">거래 내역이 없습니다</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <div key={tx.uuid} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="mt-1">
                          {getTransactionTypeIcon(tx.transactionType)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeStyle(tx.transactionType)}`}>
                              {getTransactionTypeLabel(tx.transactionType)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(tx.createdAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                            </span>
                          </div>
                          <p className="text-gray-900 font-medium">{tx.reason}</p>
                          <p className="text-sm text-gray-500 mt-1">잔액: {tx.balanceAfter.toLocaleString()}원</p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className={`text-lg font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 더보기 버튼 */}
            {hasMore && (
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                >
                  {loadingMore ? '로딩 중...' : '더보기'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
