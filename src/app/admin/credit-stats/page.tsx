'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAdminCreditStats, getAdminCreditBalanceStats, type AdminCreditStats, type AdminCreditBalanceStats } from '@/lib/api/admin-credit'
import { showErrorToast } from '@/lib/errorHandler'
import { useAuthStore } from '@/stores/authStore'
import { IoCash, IoPeople, IoCard, IoRefresh, IoCheckmarkCircle, IoCloseCircle, IoTime } from 'react-icons/io5'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

export default function CreditStatsPage() {
  const router = useRouter()
  const { accessToken, _hasHydrated, user } = useAuthStore()

  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminCreditStats | null>(null)
  const [balanceStats, setBalanceStats] = useState<AdminCreditBalanceStats | null>(null)

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
  }, [isCheckingAuth])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsRes, balanceRes] = await Promise.all([
        getAdminCreditStats(),
        getAdminCreditBalanceStats(),
      ])

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data)
      }

      if (balanceRes.success && balanceRes.data) {
        setBalanceStats(balanceRes.data)
      }
    } catch (error) {
      showErrorToast(error, '통계를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
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

  if (!stats || !balanceStats) return null

  return (
    <AdminGuard>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">크레딧 통계</h1>
            <p className="mt-2 text-sm text-gray-600">
              크레딧 시스템의 전체 통계를 확인합니다
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <IoRefresh className="text-lg" />
            새로고침
          </button>
        </div>

        {/* 사용자 통계 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">사용자 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow">
              <div className="flex items-center gap-3 mb-2">
                <IoPeople className="text-3xl text-primary" />
                <h3 className="text-sm font-medium text-gray-600">총 사용자</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}명</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <div className="flex items-center gap-3 mb-2">
                <IoCash className="text-3xl text-green-600" />
                <h3 className="text-sm font-medium text-gray-600">크레딧 보유 사용자</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{balanceStats.usersWithCredits.toLocaleString()}명</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <div className="flex items-center gap-3 mb-2">
                <IoCard className="text-3xl text-purple-600" />
                <h3 className="text-sm font-medium text-gray-600">활성 패키지</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.activePackageCount.toLocaleString()}개</p>
            </div>
          </div>
        </div>

        {/* 크레딧 잔액 통계 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">크레딧 잔액 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-primary-500 to-primary rounded-xl p-6 text-white shadow-lg">
              <h3 className="text-primary-100 text-sm mb-2">총 가용 크레딧</h3>
              <p className="text-4xl font-bold">{balanceStats.totalAvailableCredits.toLocaleString()}원</p>
              <p className="text-primary-100 text-sm mt-2">현재 사용자들이 보유한 총 크레딧</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <h3 className="text-sm font-medium text-gray-600 mb-2">총 적립 크레딧</h3>
              <p className="text-3xl font-bold text-green-600">+{balanceStats.totalEarnedCredits.toLocaleString()}원</p>
              <p className="text-gray-500 text-sm mt-2">누적 적립 금액</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <h3 className="text-sm font-medium text-gray-600 mb-2">총 사용 크레딧</h3>
              <p className="text-3xl font-bold text-red-600">-{balanceStats.totalSpentCredits.toLocaleString()}원</p>
              <p className="text-gray-500 text-sm mt-2">누적 사용 금액</p>
            </div>
          </div>
        </div>

        {/* 결제 통계 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">결제 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow">
              <h3 className="text-sm font-medium text-gray-600 mb-2">총 결제 건수</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.totalPaymentCount.toLocaleString()}건</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <h3 className="text-sm font-medium text-gray-600 mb-2">총 결제 금액</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.totalPaymentAmount.toLocaleString()}원</p>
            </div>
          </div>
        </div>

        {/* 환불 통계 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">환불 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <IoTime className="text-2xl" />
                <h3 className="text-orange-100 text-sm">대기중</h3>
              </div>
              <p className="text-3xl font-bold">{stats.pendingRefundCount.toLocaleString()}건</p>
              <p className="text-orange-100 text-sm mt-2">{stats.pendingRefundAmount.toLocaleString()}원</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <div className="flex items-center gap-2 mb-2">
                <IoCheckmarkCircle className="text-2xl text-green-600" />
                <h3 className="text-sm font-medium text-gray-600">완료</h3>
              </div>
              <p className="text-3xl font-bold text-green-600">{stats.completedRefundCount.toLocaleString()}건</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <div className="flex items-center gap-2 mb-2">
                <IoCloseCircle className="text-2xl text-red-600" />
                <h3 className="text-sm font-medium text-gray-600">거부</h3>
              </div>
              <p className="text-3xl font-bold text-red-600">{stats.rejectedRefundCount.toLocaleString()}건</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <h3 className="text-sm font-medium text-gray-600 mb-2">총 환불 금액</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.totalRefundedAmount.toLocaleString()}원</p>
            </div>
          </div>
        </div>

        {/* 요약 */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-8 text-white shadow-lg">
          <h2 className="text-2xl font-bold mb-6">시스템 요약</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-purple-100 text-sm mb-1">크레딧 순환율</p>
              <p className="text-3xl font-bold">
                {balanceStats.totalEarnedCredits > 0
                  ? ((balanceStats.totalSpentCredits / balanceStats.totalEarnedCredits) * 100).toFixed(1)
                  : 0}%
              </p>
              <p className="text-purple-100 text-sm mt-1">총 적립 대비 사용 비율</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm mb-1">1인당 평균 보유 크레딧</p>
              <p className="text-3xl font-bold">
                {balanceStats.usersWithCredits > 0
                  ? Math.round(balanceStats.totalAvailableCredits / balanceStats.usersWithCredits).toLocaleString()
                  : 0}원
              </p>
              <p className="text-purple-100 text-sm mt-1">크레딧 보유 사용자 기준</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm mb-1">환불 처리율</p>
              <p className="text-3xl font-bold">
                {(stats.pendingRefundCount + stats.completedRefundCount + stats.rejectedRefundCount) > 0
                  ? ((stats.completedRefundCount / (stats.pendingRefundCount + stats.completedRefundCount + stats.rejectedRefundCount)) * 100).toFixed(1)
                  : 0}%
              </p>
              <p className="text-purple-100 text-sm mt-1">완료된 환불 비율</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm mb-1">1건당 평균 결제 금액</p>
              <p className="text-3xl font-bold">
                {stats.totalPaymentCount > 0
                  ? Math.round(stats.totalPaymentAmount / stats.totalPaymentCount).toLocaleString()
                  : 0}원
              </p>
              <p className="text-purple-100 text-sm mt-1">결제 건수 기준</p>
            </div>
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/admin/credits/users')}
              className="px-6 py-3 bg-primary-800 text-white rounded-lg hover:bg-primary transition-colors"
            >
              사용자 크레딧 관리
            </button>
            <button
              onClick={() => router.push('/admin/credits/transactions')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              거래 내역 조회
            </button>
            <button
              onClick={() => router.push('/admin/credit-packages')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              패키지 관리
            </button>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </AdminGuard>
  )
}
