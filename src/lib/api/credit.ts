import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'

/**
 * Spring Boot Page 응답 형식
 */
export interface CreditPaginatedResponse<T> {
  content: T[]
  pageable: {
    pageNumber: number
    pageSize: number
    sort: { sorted: boolean; unsorted: boolean; empty: boolean }
    offset: number
    paged: boolean
    unpaged: boolean
  }
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
  size: number
  number: number
  numberOfElements: number
  empty: boolean
}

/**
 * 크레딧 잔액
 */
export interface CreditBalance {
  balance: number
  currency: string
}

/**
 * 크레딧 패키지
 */
export interface CreditPackage {
  uuid: string
  code: string
  displayName: string
  unitAmount: number
  bonusRate: number
  maxBonus: number | null
  bonusEligible: boolean
  description: string
  isActive: boolean
}

/**
 * 거래 유형
 */
export type TransactionType = 'EARN' | 'SPEND' | 'EXPIRE' | 'REFUND'

/**
 * 크레딧 거래 내역
 */
export interface CreditTransaction {
  uuid: string
  transactionType: TransactionType
  amount: number
  balanceAfter: number
  reason: string
  entityType: string
  createdAt: string
}

/**
 * 결제 수단
 */
export type PaymentMethod = 'KAKAOPAY' | 'TOSS' | 'CARD'

/**
 * 크레딧 충전 요청
 */
export interface CreditPurchaseRequest {
  packageCode: string
  quantity: number
  paymentMethod: PaymentMethod
  successUrl: string
  failUrl: string
}

/**
 * 크레딧 충전 응답
 */
export interface CreditPurchaseResponse {
  paymentUuid: string
  orderId: string
  paymentUrl: string | null
  paymentAmount: number
  totalCredits: number
  bonusCredits: number
  packageDisplayName: string
}

/**
 * 크레딧 환불 요청
 */
export interface CreditRefundRequest {
  refundAmount: number
  refundReason: string
  bankName: string
  accountNumber: string
  accountHolder: string
}

/**
 * 크레딧 환불 응답
 */
export interface CreditRefundResponse {
  refundUuid: string
  requestedAmount: number
  feeAmount: number
  actualRefundAmount: number
  status: 'PENDING' | 'COMPLETED' | 'REJECTED'
  refundReason: string
  createdAt: string
  processedAt: string | null
}

/**
 * 크레딧 잔액 조회
 */
export const getCreditBalance = async (): Promise<ApiResponse<CreditBalance>> => {
  const response = await axiosInstance.get('/credits/balance')
  return response.data
}

/**
 * 충전 패키지 목록 조회
 */
export const getCreditPackages = async (): Promise<ApiResponse<CreditPackage[]>> => {
  const response = await axiosInstance.get('/credits/packages')
  return response.data
}

/**
 * 크레딧 거래 내역 조회
 */
export const getCreditTransactions = async (
  page = 0,
  size = 20,
  sort = 'createdAt,desc'
): Promise<ApiResponse<CreditPaginatedResponse<CreditTransaction>>> => {
  const response = await axiosInstance.get('/credits/transactions', {
    params: { page, size, sort },
  })
  return response.data
}

/**
 * 크레딧 충전 요청
 */
export const purchaseCredit = async (
  data: CreditPurchaseRequest
): Promise<ApiResponse<CreditPurchaseResponse>> => {
  const response = await axiosInstance.post('/credits/purchase', data)
  return response.data
}

/**
 * 크레딧 충전 완료 콜백
 */
export const completeCreditPurchase = async (
  orderId: string,
  pgToken: string
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.post('/credits/purchase/complete', null, {
    params: { orderId, pgToken },
  })
  return response.data
}

/**
 * 크레딧 환불 요청
 */
export const refundCredit = async (
  data: CreditRefundRequest
): Promise<ApiResponse<CreditRefundResponse>> => {
  const response = await axiosInstance.post('/credits/refund', data)
  return response.data
}

/**
 * 보너스 크레딧 계산
 *
 * @param unitAmount 패키지 단위 금액
 * @param quantity 수량
 * @param bonusRate 보너스 비율 (%)
 * @param maxBonus 최대 보너스 금액 (null이면 무제한)
 * @returns 결제 금액, 보너스 크레딧, 총 크레딧
 */
export const calculateBonus = (
  unitAmount: number,
  quantity: number,
  bonusRate: number,
  maxBonus: number | null
): { paymentAmount: number; bonusCredits: number; totalCredits: number } => {
  const paymentAmount = unitAmount * quantity
  let bonusCredits = Math.floor(paymentAmount * (bonusRate / 100))

  if (maxBonus !== null && bonusCredits > maxBonus) {
    bonusCredits = maxBonus
  }

  const totalCredits = paymentAmount + bonusCredits
  return { paymentAmount, bonusCredits, totalCredits }
}

/**
 * 환불 수수료 계산
 *
 * @param refundAmount 환불 요청 금액
 * @returns 수수료, 실제 환불 금액
 */
export const calculateRefundFee = (
  refundAmount: number
): { feeAmount: number; actualRefundAmount: number } => {
  // 10% 수수료, 100원 단위 올림
  const feeAmount = Math.ceil((refundAmount * 0.1) / 100) * 100
  const actualRefundAmount = refundAmount - feeAmount
  return { feeAmount, actualRefundAmount }
}
