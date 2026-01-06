'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getAdminUserCredit, grantCredit, type AdminUserCredit } from '@/lib/api/admin-credit'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { useAuthStore } from '@/stores/authStore'
import { IoArrowBack } from 'react-icons/io5'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

export default function GrantCreditPage() {
  const router = useRouter()
  const params = useParams()
  const userUuid = params.userUuid as string
  const { accessToken, _hasHydrated, user } = useAuthStore()

  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [credit, setCredit] = useState<AdminUserCredit | null>(null)

  const [formData, setFormData] = useState({
    amount: 10000,
    reason: '',
  })

  const presetReasons = [
    '이벤트 당첨 크레딧 지급',
    '오류 보상 크레딧 지급',
    '프로모션 크레딧 지급',
    'CS 보상 크레딧 지급',
  ]

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
    fetchCredit()
  }, [isCheckingAuth, userUuid])

  const fetchCredit = async () => {
    try {
      const result = await getAdminUserCredit(userUuid)
      if (result.success && result.data) {
        setCredit(result.data)
      }
    } catch (error) {
      showErrorToast(error, '사용자 정보를 불러오는데 실패했습니다')
      router.push('/admin/credits/users')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.amount <= 0) {
      showErrorToast(null, '금액은 0보다 커야 합니다')
      return
    }
    if (!formData.reason.trim()) {
      showErrorToast(null, '지급 사유를 입력해주세요')
      return
    }

    setSubmitting(true)
    try {
      const result = await grantCredit(userUuid, formData)
      if (result.success) {
        showSuccessToast(`크레딧 ${formData.amount.toLocaleString()}원이 지급되었습니다`)
        router.push(`/admin/credits/users/${userUuid}`)
      } else {
        showErrorToast(null, result.message || '크레딧 지급에 실패했습니다')
      }
    } catch (error) {
      showErrorToast(error, '크레딧 지급 중 오류가 발생했습니다')
    } finally {
      setSubmitting(false)
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

  if (!credit) return null

  const newBalance = credit.availableCredits + formData.amount

  return (
    <AdminGuard>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <IoArrowBack className="text-xl" />
            돌아가기
          </button>
          <h1 className="text-3xl font-bold text-gray-900">크레딧 지급</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">사용자</span>
              <span className="font-medium">{credit.userEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">현재 잔액</span>
              <span className="font-bold text-primary">{credit.availableCredits.toLocaleString()}원</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">지급 금액 *</label>
            <input
              type="number"
              min="1"
              step="1"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
            <div className="flex gap-2 mt-2">
              {[1000, 5000, 10000, 50000, 100000].map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, amount }))}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  +{amount >= 10000 ? `${amount / 10000}만` : amount}원
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">지급 사유 *</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="지급 사유를 입력하세요"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              required
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {presetReasons.map(reason => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, reason }))}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-green-900">지급 후 잔액 미리보기</h3>
            <div className="flex justify-between text-sm">
              <span className="text-green-700">현재 잔액</span>
              <span>{credit.availableCredits.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-green-700">지급 금액</span>
              <span className="text-green-600">+{formData.amount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-green-200">
              <span className="font-bold text-green-900">지급 후 잔액</span>
              <span className="font-bold text-green-600 text-lg">{newBalance.toLocaleString()}원</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">⚠️ 주의사항</h4>
            <ul className="space-y-1 text-sm text-yellow-800">
              <li>• 지급된 크레딧은 즉시 사용자 계정에 반영됩니다</li>
              <li>• 거래 내역에 관리자 지급(ADMIN_GRANT)으로 기록됩니다</li>
              <li>• 지급 후에는 취소할 수 없으므로 신중하게 확인하세요</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting || formData.amount <= 0 || !formData.reason.trim()}
              className="flex-1 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '처리 중...' : '지급하기'}
            </button>
          </div>
        </form>
      </div>
      </div>
      <Footer />
    </AdminGuard>
  )
}
