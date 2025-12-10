'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getAdminCreditPackage, updateCreditPackage, type AdminCreditPackage } from '@/lib/api/admin-credit-package'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { useAuthStore } from '@/stores/authStore'
import { IoArrowBack } from 'react-icons/io5'

export default function EditCreditPackagePage() {
  const router = useRouter()
  const params = useParams()
  const packageUuid = params.uuid as string
  const { accessToken, _hasHydrated, user } = useAuthStore()

  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [originalData, setOriginalData] = useState<AdminCreditPackage | null>(null)

  const [formData, setFormData] = useState({
    displayName: '',
    bonusRate: 0,
    maxBonus: null as number | null,
    description: '',
  })

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

  // 패키지 데이터 조회
  useEffect(() => {
    if (isCheckingAuth) return

    const fetchPackage = async () => {
      try {
        const result = await getAdminCreditPackage(packageUuid)
        if (result.success && result.data) {
          const pkg = result.data
          setOriginalData(pkg)
          setFormData({
            displayName: pkg.displayName,
            bonusRate: pkg.bonusRate,
            maxBonus: pkg.maxBonus,
            description: pkg.description || '',
          })
        } else {
          showErrorToast(null, '패키지를 찾을 수 없습니다')
          router.push('/admin/credit-packages')
        }
      } catch (error) {
        showErrorToast(error, '패키지 조회에 실패했습니다')
        router.push('/admin/credit-packages')
      } finally {
        setLoading(false)
      }
    }

    fetchPackage()
  }, [isCheckingAuth, packageUuid, router])

  // 입력 변경 핸들러
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Validation
      if (!originalData) {
        throw new Error('패키지 정보를 불러오는 중입니다')
      }

      if (originalData.unitAmount === 10000 && formData.bonusRate > 0) {
        throw new Error('1만원권에는 보너스를 적용할 수 없습니다')
      }

      if (formData.bonusRate < 0 || formData.bonusRate > 100) {
        throw new Error('보너스율은 0~100% 사이여야 합니다')
      }

      // API 호출
      const result = await updateCreditPackage(packageUuid, {
        displayName: formData.displayName || undefined,
        bonusRate: formData.bonusRate,
        maxBonus: formData.maxBonus || null,
        description: formData.description || undefined,
      })

      if (result.success) {
        showSuccessToast('패키지가 수정되었습니다')
        router.push('/admin/credit-packages')
      } else {
        showErrorToast(null, result.message || '패키지 수정에 실패했습니다')
      }
    } catch (error: any) {
      showErrorToast(error, error.message || '패키지 수정 중 오류가 발생했습니다')
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

  if (!originalData) {
    return null
  }

  const isBonusDisabled = originalData.unitAmount === 10000

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <IoArrowBack className="text-xl" />
            돌아가기
          </button>
          <h1 className="text-3xl font-bold text-gray-900">패키지 수정</h1>
          <p className="mt-2 text-sm text-gray-600">
            크레딧 충전 패키지를 수정합니다
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* 읽기 전용 정보 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">변경 불가 정보</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">코드:</span>
              <span className="text-gray-900 font-medium">{originalData.code}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">단위 금액:</span>
              <span className="text-gray-900 font-medium">{originalData.unitAmount.toLocaleString()}원</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              단위 금액은 변경할 수 없습니다. 다른 금액의 패키지가 필요하면 새로 생성하세요.
            </p>
          </div>

          {/* 표시 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              표시 이름
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              placeholder="예: 3만원 특별 패키지"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              비워두면 기본 이름이 사용됩니다 (예: 3만원권)
            </p>
          </div>

          {/* 보너스율 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              보너스율 (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.bonusRate}
              onChange={(e) => handleChange('bonusRate', parseFloat(e.target.value) || 0)}
              disabled={isBonusDisabled}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {isBonusDisabled && (
              <p className="mt-1 text-xs text-yellow-600">
                1만원권에는 보너스를 적용할 수 없습니다
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              0~100% 사이의 값을 입력하세요
            </p>
          </div>

          {/* 최대 보너스 한도 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              최대 보너스 한도 (원)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={formData.maxBonus || ''}
              onChange={(e) => handleChange('maxBonus', parseInt(e.target.value) || null)}
              placeholder="무제한"
              disabled={isBonusDisabled}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              비워두면 무제한
            </p>
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="패키지 설명을 입력하세요"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          {/* 미리보기 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">변경 사항 미리보기</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">표시명:</span>
                <span className="text-blue-900">{formData.displayName || `${(originalData.unitAmount / 10000).toFixed(0)}만원권`}</span>
              </div>
              {!isBonusDisabled && formData.bonusRate > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-blue-700 font-medium">보너스율:</span>
                    <span className="text-green-700 font-bold">{formData.bonusRate}%</span>
                  </div>
                  {formData.maxBonus && (
                    <div className="flex justify-between">
                      <span className="text-blue-700 font-medium">최대 보너스:</span>
                      <span className="text-blue-900">{formData.maxBonus.toLocaleString()}원</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">설명:</span>
                <span className="text-blue-900">{formData.description || '(없음)'}</span>
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
              {submitting ? '수정 중...' : '수정하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
