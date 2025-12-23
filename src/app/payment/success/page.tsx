'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { completeCreditPurchase, getCreditBalance } from '@/lib/api/credit'
import { showErrorToast } from '@/lib/errorHandler'
import { IoCheckmarkCircle, IoClose } from 'react-icons/io5'

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [processing, setProcessing] = useState(true)
  const [success, setSuccess] = useState(false)
  const [balance, setBalance] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    completePayment()
  }, [])

  const completePayment = async () => {
    try {
      // Toss Payments 콜백 파라미터 추출
      const orderId = searchParams.get('orderId')
      const paymentKey = searchParams.get('paymentKey') // Toss는 paymentKey 사용
      const amount = searchParams.get('amount')

      console.log('=== 결제 성공 콜백 ===')
      console.log('orderId:', orderId)
      console.log('paymentKey:', paymentKey)
      console.log('amount:', amount)

      if (!orderId || !paymentKey) {
        throw new Error('필수 파라미터가 누락되었습니다.')
      }

      // 백엔드 완료 API 호출 (paymentKey를 pgToken으로 전달)
      console.log('백엔드 완료 API 호출 중...')
      const response = await completeCreditPurchase(orderId, paymentKey)

      console.log('=== 백엔드 응답 ===')
      console.log('응답:', response)

      if (!response.success) {
        throw new Error(response.message || '충전 완료 처리 실패')
      }

      setSuccess(true)

      // 잔액 조회
      const balanceRes = await getCreditBalance()
      if (balanceRes.success && balanceRes.data) {
        setBalance(balanceRes.data.balance)
      }

      // 2초 후 크레딧 페이지로 리다이렉트
      setTimeout(() => {
        router.push('/mypage/credits/transactions')
      }, 2000)

    } catch (err: any) {
      // 서버 에러 메시지 우선 추출
      const serverMessage = err?.response?.data?.message
      const errorMessage = serverMessage || (err instanceof Error ? err.message : '알 수 없는 오류')
      setError(errorMessage)
      console.error('=== 결제 완료 처리 실패 ===')
      console.error('오류:', err)
      showErrorToast(err, '결제 처리 중 오류가 발생했습니다')
    } finally {
      setProcessing(false)
    }
  }

  if (processing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar showQuickmenu={false} />
        <main className="flex-1 bg-gray-50 flex items-center justify-center py-12 px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">결제 처리 중...</h2>
            <p className="text-gray-600">잠시만 기다려 주세요</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!success || error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar showQuickmenu={false} />
        <main className="flex-1 bg-gray-50 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IoClose className="text-4xl text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">결제 처리 실패</h2>
            <p className="text-gray-600 mb-6">{error || '결제 처리에 실패했습니다'}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/mypage/credits/purchase')}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                다시 시도
              </button>
              <button
                type="button"
                onClick={() => router.push('/mypage')}
                className="flex-1 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                마이페이지
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar showQuickmenu={false} />
      <main className="flex-1 bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          {/* 성공 아이콘 */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <IoCheckmarkCircle className="text-4xl text-green-600" />
          </div>

          {/* 제목 */}
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            충전 완료!
          </h2>
          <p className="text-gray-600 text-center mb-6">
            크레딧이 성공적으로 충전되었습니다
          </p>

          {/* 충전 후 잔액 */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 mb-6 text-white">
            <p className="text-sm opacity-90 text-center mb-2">현재 크레딧 잔액</p>
            <p className="text-3xl font-bold text-center">{balance.toLocaleString()} 원</p>
          </div>

          {/* 안내 */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-900 text-center">
              충전된 크레딧은 다양한 서비스 이용 시 사용하실 수 있습니다<br />
              잠시 후 거래 내역 페이지로 이동합니다...
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  )
}
