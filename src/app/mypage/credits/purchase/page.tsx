'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getCreditPackages, getCreditBalance, calculateBonus, type CreditPackage, type PaymentMethod } from '@/lib/api/credit'
import { showErrorToast } from '@/lib/errorHandler'
import { useAuthStore } from '@/stores/authStore'
import { IoCheckmarkCircle, IoCash } from 'react-icons/io5'
import { useCreditPurchase } from '@/hooks/useCreditPurchase'

export default function CreditPurchasePage() {
  const router = useRouter()
  const { accessToken, _hasHydrated } = useAuthStore()
  const { purchaseCredits, loading: purchasing } = useCreditPurchase()

  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(true)

  const [balance, setBalance] = useState(0)
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null)
  const [quantity, setQuantity] = useState(1)
  const paymentMethod: PaymentMethod = 'TOSS' // SDK에서 결제 수단 선택

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

  // 데이터 로드
  useEffect(() => {
    if (isCheckingAuth) return

    const fetchData = async () => {
      try {
        const [balanceRes, packagesRes] = await Promise.all([
          getCreditBalance(),
          getCreditPackages(),
        ])

        if (balanceRes.success && balanceRes.data) {
          setBalance(balanceRes.data.balance)
        }

        if (packagesRes.success && packagesRes.data) {
          const activePackages = packagesRes.data.filter(p => p.isActive)
          setPackages(activePackages)
          if (activePackages.length > 0) {
            setSelectedPackage(activePackages[0])
          }
        }
      } catch (error) {
        showErrorToast(error, '데이터를 불러오는데 실패했습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isCheckingAuth])

  // 보너스 계산
  const bonusInfo = selectedPackage
    ? calculateBonus(selectedPackage.unitAmount, quantity, selectedPackage.bonusRate, selectedPackage.maxBonus)
    : null

  // 충전 요청
  const handlePurchase = async () => {
    if (!selectedPackage) {
      showErrorToast(null, '패키지를 선택해주세요')
      return
    }

    if (quantity < 1) {
      showErrorToast(null, '수량은 1 이상이어야 합니다')
      return
    }

    try {
      const successUrl = `${window.location.origin}/payment/success`
      const failUrl = `${window.location.origin}/payment/fail`

      await purchaseCredits({
        packageCode: selectedPackage.code,
        quantity,
        paymentMethod,
        successUrl,
        failUrl,
      })
    } catch (error) {
      // 에러는 useCreditPurchase 훅에서 처리됨
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
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">크레딧 충전</h1>
            <p className="mt-2 text-sm text-gray-600">
              다양한 서비스 이용을 위한 크레딧을 충전하세요
            </p>
          </div>

          {/* 현재 잔액 */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 mb-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">현재 크레딧 잔액</p>
                <p className="text-3xl font-bold mt-1">{balance.toLocaleString()} 원</p>
              </div>
              <IoCash className="text-5xl opacity-20" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 패키지 선택 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 패키지 목록 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">충전 패키지</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packages.map((pkg) => {
                    const isSelected = selectedPackage?.uuid === pkg.uuid
                    return (
                      <button
                        key={pkg.uuid}
                        type="button"
                        onClick={() => setSelectedPackage(pkg)}
                        className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {pkg.bonusEligible && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            +{pkg.bonusRate}%
                          </div>
                        )}
                        <div className="mb-2">
                          <p className="text-lg font-bold text-gray-900">{pkg.displayName}</p>
                        </div>
                        <p className="text-2xl font-bold text-primary mb-1">
                          {pkg.unitAmount.toLocaleString()}원
                        </p>
                        <p className="text-xs text-gray-500">{pkg.description}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 수량 선택 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">수량 선택</h2>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 rounded-lg border-2 border-gray-300 hover:border-primary hover:text-primary font-bold text-xl"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 rounded-lg border-2 border-gray-300 hover:border-primary hover:text-primary font-bold text-xl"
                  >
                    +
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500 text-center">
                  수량이 많을수록 보너스가 증가합니다
                </p>
              </div>
            </div>

            {/* 결제 요약 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">결제 요약</h2>

                {bonusInfo && selectedPackage && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">선택한 패키지</span>
                      <span className="font-medium">{selectedPackage.displayName}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">수량</span>
                      <span className="font-medium">{quantity}개</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">결제 금액</span>
                      <span className="font-bold text-lg">{bonusInfo.paymentAmount.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">기본 크레딧</span>
                      <span className="font-medium">{bonusInfo.paymentAmount.toLocaleString()}</span>
                    </div>
                    {bonusInfo.bonusCredits > 0 && (
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-primary font-medium">보너스 크레딧</span>
                        <span className="text-primary font-bold">+{bonusInfo.bonusCredits.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-3 bg-primary/5 rounded-lg px-3">
                      <span className="text-primary font-bold">충전 예정 크레딧</span>
                      <span className="text-primary font-bold text-xl">
                        {bonusInfo.totalCredits.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePurchase}
                  disabled={purchasing || !selectedPackage}
                  className="w-full mt-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasing ? '처리 중...' : '충전하기'}
                </button>

                <p className="mt-4 text-xs text-gray-500 text-center">
                  결제 완료 후 즉시 크레딧이 충전됩니다<br />
                  결제 수단은 다음 단계에서 선택할 수 있습니다
                </p>
              </div>
            </div>
          </div>

          {/* 안내사항 */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">크레딧 이용 안내</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>1크레딧 = 1원으로 환산됩니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>3만원 이상 충전 시 보너스 크레딧이 지급됩니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>크레딧 유효기간은 충전일로부터 5년입니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>환불 시 10% 수수료가 부과됩니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>크레딧은 타 계정으로 양도할 수 없습니다</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
