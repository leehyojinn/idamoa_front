'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getCreditBalance, refundCredit, calculateRefundFee } from '@/lib/api/credit'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { useAuthStore } from '@/stores/authStore'
import { IoCash, IoAlertCircle } from 'react-icons/io5'

const BANKS = [
  '국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  '농협은행',
  'SC제일은행',
  '기업은행',
  '씨티은행',
  '카카오뱅크',
  '케이뱅크',
  '토스뱅크',
]

export default function RefundPage() {
  const router = useRouter()
  const { accessToken, _hasHydrated } = useAuthStore()

  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [balance, setBalance] = useState(0)
  const [formData, setFormData] = useState({
    refundAmount: 1000,
    refundReason: '',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  })

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

  // 잔액 조회
  useEffect(() => {
    if (isCheckingAuth) return

    const fetchBalance = async () => {
      try {
        const result = await getCreditBalance()
        if (result.success && result.data) {
          setBalance(result.data.balance)
        }
      } catch (error) {
        showErrorToast(error, '잔액을 불러오는데 실패했습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()
  }, [isCheckingAuth])

  // 수수료 계산
  const { feeAmount, actualRefundAmount } = calculateRefundFee(formData.refundAmount)

  // 입력 변경 핸들러
  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 환불 신청
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 유효성 검사
    if (formData.refundAmount < 1000) {
      showErrorToast(null, '최소 환불 금액은 1,000원입니다')
      return
    }

    if (formData.refundAmount > balance) {
      showErrorToast(null, '환불 금액이 보유 크레딧보다 많습니다')
      return
    }

    if (!formData.refundReason.trim()) {
      showErrorToast(null, '환불 사유를 입력해주세요')
      return
    }

    if (!formData.bankName || !formData.accountNumber || !formData.accountHolder) {
      showErrorToast(null, '환불 계좌 정보를 모두 입력해주세요')
      return
    }

    setSubmitting(true)

    try {
      const result = await refundCredit(formData)

      if (result.success) {
        showSuccessToast('환불 요청이 접수되었습니다.\n영업일 기준 3~5일 내에 처리됩니다.')
        setTimeout(() => {
          router.push('/mypage/credits/transactions')
        }, 1500)
      } else {
        showErrorToast(null, result.message || '환불 요청에 실패했습니다')
      }
    } catch (error) {
      showErrorToast(error, '환불 요청 중 오류가 발생했습니다')
    } finally {
      setSubmitting(false)
    }
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
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">크레딧 환불</h1>
            <p className="mt-2 text-sm text-gray-600">
              보유한 크레딧을 환불 신청하세요
            </p>
          </div>

          {/* 현재 잔액 */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 mb-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">환불 가능 크레딧</p>
                <p className="text-3xl font-bold mt-1">{balance.toLocaleString()} 원</p>
              </div>
              <IoCash className="text-5xl opacity-20" />
            </div>
          </div>

          {/* 환불 신청 폼 */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* 환불 금액 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                환불 금액 (최소 1,000원)
              </label>
              <input
                type="number"
                min="1000"
                step="100"
                value={formData.refundAmount}
                onChange={(e) => handleChange('refundAmount', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            {/* 수수료 정보 */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">환불 요청 금액</span>
                <span className="font-medium text-gray-900">{formData.refundAmount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-600">환불 수수료 (10%)</span>
                <span className="font-medium text-red-600">-{feeAmount.toLocaleString()}원</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between">
                <span className="font-bold text-gray-900">실제 환불 금액</span>
                <span className="font-bold text-primary text-lg">{actualRefundAmount.toLocaleString()}원</span>
              </div>
            </div>

            {/* 환불 사유 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                환불 사유 (최대 500자)
              </label>
              <textarea
                maxLength={500}
                rows={4}
                value={formData.refundReason}
                onChange={(e) => handleChange('refundReason', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="환불 사유를 입력해주세요"
                required
              />
              <div className="mt-1 text-right text-xs text-gray-500">
                {formData.refundReason.length} / 500
              </div>
            </div>

            {/* 환불 계좌 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">환불 계좌 정보</h3>

              {/* 은행명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  은행명
                </label>
                <select
                  value={formData.bankName}
                  onChange={(e) => handleChange('bankName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">선택하세요</option>
                  {BANKS.map(bank => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>

              {/* 계좌번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  계좌번호 (숫자와 하이픈만)
                </label>
                <input
                  type="text"
                  pattern="^[0-9-]+$"
                  value={formData.accountNumber}
                  onChange={(e) => handleChange('accountNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="123-45-678901"
                  required
                />
              </div>

              {/* 예금주 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  예금주명
                </label>
                <input
                  type="text"
                  value={formData.accountHolder}
                  onChange={(e) => handleChange('accountHolder', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="홍길동"
                  required
                />
              </div>
            </div>

            {/* 안내 사항 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <IoAlertCircle className="text-yellow-600 text-xl flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-900 mb-2">환불 안내</h4>
                  <ul className="space-y-1 text-sm text-yellow-800">
                    <li>• 환불 수수료 10%가 차감됩니다 (100원 단위 올림)</li>
                    <li>• 최소 환불 금액은 1,000원입니다</li>
                    <li>• 환불 처리 기간은 영업일 기준 3~5일입니다</li>
                    <li>• 환불은 입력하신 계좌로 입금됩니다</li>
                    <li>• 환불 신청 후 취소가 불가능합니다</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 버튼 */}
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
                disabled={submitting}
                className="flex-1 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '처리 중...' : '환불 신청'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
