'use client'

import { useState } from 'react'
import { purchaseCredit, type PaymentMethod } from '@/lib/api/credit'

interface PurchaseRequest {
  packageCode: string
  quantity: number
  paymentMethod: PaymentMethod
  successUrl: string
  failUrl: string
}

interface PurchaseResponse {
  paymentUuid: string
  orderId: string
  paymentUrl: string | null
  paymentAmount: number
  totalCredits: number
  bonusCredits: number
  packageDisplayName: string
}

// Toss Payments SDK 타입 정의
declare global {
  interface Window {
    TossPayments: (clientKey: string) => {
      requestPayment: (method: string, options: {
        amount: number
        orderId: string
        orderName: string
        customerName?: string
        successUrl: string
        failUrl: string
      }) => Promise<void>
    }
  }
}

export function useCreditPurchase() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const purchaseCredits = async (request: PurchaseRequest) => {
    setLoading(true)
    setError(null)

    try {
      console.log('=== 크레딧 충전 요청 시작 ===')
      console.log('요청 데이터:', request)

      // 1. 백엔드에 충전 요청
      const result = await purchaseCredit(request)

      console.log('=== 백엔드 응답 ===')
      console.log('응답 데이터:', result)

      if (!result.success) {
        throw new Error(result.message || '충전 요청 실패')
      }

      const data: PurchaseResponse = result.data!

      // 2. 결제 수단에 따라 처리
      if (request.paymentMethod === 'TOSS') {
        console.log('Toss Payments SDK로 결제 진행')
        await processTossPayment(data, request)
      } else if (request.paymentMethod === 'KAKAOPAY') {
        console.log('카카오페이로 리다이렉트:', data.paymentUrl)
        // 카카오페이는 paymentUrl로 리다이렉트
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl
        } else {
          throw new Error('결제 URL이 없습니다.')
        }
      } else if (request.paymentMethod === 'CARD') {
        console.log('카드 결제로 리다이렉트:', data.paymentUrl)
        // 일반 카드 결제도 paymentUrl로 리다이렉트
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl
        } else {
          throw new Error('결제 URL이 없습니다.')
        }
      }

    } catch (err: any) {
      // 서버 에러 메시지 추출
      const serverMessage = err?.response?.data?.message
      const errorMessage = serverMessage || (err instanceof Error ? err.message : '알 수 없는 오류')
      setError(errorMessage)
      console.error('=== 충전 실패 ===')
      console.error('오류:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const processTossPayment = async (
    data: PurchaseResponse,
    request: PurchaseRequest
  ) => {
    try {
      // Toss Payments 클라이언트 키 (환경변수로 관리)
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY

      if (!clientKey) {
        throw new Error('Toss Payments 클라이언트 키가 설정되지 않았습니다.')
      }

      console.log('Toss Payments SDK 초기화')
      console.log('클라이언트 키:', clientKey)

      // Toss Payments SDK가 로드되었는지 확인
      if (typeof window.TossPayments === 'undefined') {
        throw new Error('Toss Payments SDK가 로드되지 않았습니다.')
      }

      const tossPayments = window.TossPayments(clientKey)

      console.log('결제 요청 데이터:', {
        amount: data.paymentAmount,
        orderId: data.orderId,
        orderName: data.packageDisplayName,
        successUrl: request.successUrl,
        failUrl: request.failUrl,
      })

      // 결제 요청
      await tossPayments.requestPayment('카드', {
        amount: data.paymentAmount,
        orderId: data.orderId,
        orderName: data.packageDisplayName,
        customerName: '사용자', // 실제로는 로그인 정보 사용
        successUrl: request.successUrl,
        failUrl: request.failUrl,
      })

      console.log('Toss Payments 결제 요청 완료')

    } catch (err) {
      console.error('=== Toss 결제 실패 ===')
      console.error('오류:', err)
      throw err
    }
  }

  return {
    purchaseCredits,
    loading,
    error,
  }
}
