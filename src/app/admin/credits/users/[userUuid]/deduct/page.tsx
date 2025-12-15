'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getAdminUserCredit, deductCredit, type AdminUserCredit } from '@/lib/api/admin-credit'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { useAuthStore } from '@/stores/authStore'
import { IoArrowBack } from 'react-icons/io5'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

export default function DeductCreditPage() {
  const router = useRouter()
  const params = useParams()
  const userUuid = params.userUuid as string
  const { accessToken, _hasHydrated, user } = useAuthStore()

  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [credit, setCredit] = useState<AdminUserCredit | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const [formData, setFormData] = useState({
    amount: 10000,
    reason: '',
  })

  const presetReasons = [
    '부정 사용 크레딧 회수',
    '환불 후 크레딧 조정',
    '오류로 인한 과다 지급 회수',
    'CS 차감 조치',
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
    if (!credit || formData.amount > credit.availableCredits) {
      showErrorToast(null, '차감 금액이 가용 크레딧을 초과할 수 없습니다')
      return
    }
    if (!formData.reason.trim()) {
      showErrorToast(null, '차감 사유를 입력해주세요')
      return
    }

    setShowConfirm(true)
  }

  const handleConfirmDeduct = async () => {
    setSubmitting(true)
    try {
      const result = await deductCredit(userUuid, formData)
      if (result.success) {
        showSuccessToast(`크레딧 ${formData.amount.toLocaleString()}원이 차감되었습니다`)
        router.push(`/admin/credits/users/${userUuid}`)
      } else {
        showErrorToast(null, result.message || '크레딧 차감에 실패했습니다')
      }
    } catch (error) {
      showErrorToast(error, '크레딧 차감 중 오류가 발생했습니다')
    } finally {
      setSubmitting(false)
      setShowConfirm(false)
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

  const newBalance = credit.availableCredits - formData.amount
  const isInsufficientBalance = formData.amount > credit.availableCredits

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
          <h1 className="text-3xl font-bold text-gray-900">크레딧 차감</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">사용자</span>
              <span className="font-medium">{credit.userEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">현재 잔액</span>
              <span className="font-bold text-blue-600">{credit.availableCredits.toLocaleString()}원</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">차감 금액 *</label>
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
                  {amount >= 10000 ? `${amount / 10000}만` : amount}원
                </button>
              ))}
            </div>
            {isInsufficientBalance && (
              <p className="mt-2 text-sm text-red-600">⚠️ 차감 금액이 가용 크레딧을 초과합니다</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">차감 사유 *</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="차감 사유를 입력하세요"
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

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-red-900">차감 후 잔액 미리보기</h3>
            <div className="flex justify-between text-sm">
              <span className="text-red-700">현재 잔액</span>
              <span>{credit.availableCredits.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-red-700">차감 금액</span>
              <span className="text-red-600">-{formData.amount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-red-200">
              <span className="font-bold text-red-900">차감 후 잔액</span>
              <span className={`font-bold text-lg ${newBalance < 0 ? 'text-red-600' : 'text-red-600'}`}>
                {newBalance.toLocaleString()}원
              </span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">⚠️ 주의사항</h4>
            <ul className="space-y-1 text-sm text-yellow-800">
              <li>• 차감된 크레딧은 즉시 사용자 계정에 반영됩니다</li>
              <li>• 거래 내역에 관리자 차감(ADMIN_DEDUCT)으로 기록됩니다</li>
              <li>• 차감 후에는 취소할 수 없으므로 신중하게 확인하세요</li>
              <li>• 가용 크레딧보다 많은 금액을 차감할 수 없습니다</li>
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
              disabled={submitting || formData.amount <= 0 || !formData.reason.trim() || isInsufficientBalance}
              className="flex-1 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              차감하기
            </button>
          </div>
        </form>
      </div>

      {/* 확인 모달 */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">크레딧 차감 확인</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">사용자</span>
                <span className="font-medium">{credit.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">차감 금액</span>
                <span className="font-bold text-red-600">-{formData.amount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">차감 후 잔액</span>
                <span className="font-bold text-blue-600">{newBalance.toLocaleString()}원</span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-1">차감 사유</p>
                <p className="text-sm text-gray-900">{formData.reason}</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-6">
              <p className="text-sm text-red-800">
                ⚠️ 이 작업은 취소할 수 없습니다. 정말 차감하시겠습니까?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmDeduct}
                disabled={submitting}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {submitting ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      <Footer />
    </AdminGuard>
  )
}
