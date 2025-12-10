'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { IoClose, IoAlertCircle } from 'react-icons/io5'

function PaymentFailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const errorCode = searchParams.get('code')
  const errorMessage = searchParams.get('message')
  const orderId = searchParams.get('orderId')

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar showQuickmenu={false} />

      <main className="flex-1 bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          {/* 실패 아이콘 */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <IoClose className="text-4xl text-red-600" />
          </div>

          {/* 제목 */}
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            결제 취소
          </h2>
          <p className="text-gray-600 text-center mb-6">
            결제가 취소되었습니다
          </p>

          {/* 에러 정보 */}
          {(errorCode || errorMessage) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <IoAlertCircle className="text-red-600 text-xl flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  {errorCode && (
                    <p className="text-sm text-red-900 mb-1">
                      <span className="font-semibold">에러 코드:</span> {errorCode}
                    </p>
                  )}
                  {errorMessage && (
                    <p className="text-sm text-red-900">
                      <span className="font-semibold">사유:</span> {errorMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 안내 메시지 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 text-center">
              결제를 취소하셨거나 처리 중 문제가 발생했습니다.<br />
              다시 시도하시거나 고객센터로 문의해 주세요.
            </p>
          </div>

          {/* 버튼 */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => router.push('/mypage/credits/purchase')}
              className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              다시 충전하기
            </button>
            <button
              type="button"
              onClick={() => router.push('/mypage')}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              마이페이지로 가기
            </button>
          </div>

          {/* 고객센터 안내 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-900 text-center">
              문제가 계속되면 고객센터로 문의해 주세요<br />
              (문의: contact@damoa.com)
            </p>
          </div>

          {/* 디버깅 정보 (개발 환경에서만) */}
          {process.env.NODE_ENV === 'development' && orderId && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
              <p>주문 ID: {orderId}</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function PaymentFailPage() {
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
      <PaymentFailContent />
    </Suspense>
  )
}
