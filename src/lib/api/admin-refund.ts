/**
 * 관리자 환불 관리 API
 */

import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'

// ========================================
// Types
// ========================================

export type RefundStatus = 'PENDING' | 'COMPLETED' | 'REJECTED' | 'FAILED'

export interface AdminRefund {
  refundUuid: string
  paymentUuid: string
  userUuid: string
  userEmail: string
  userName: string
  refundAmount: number
  refundReason: string
  status: RefundStatus
  bankName: string
  accountNumber: string
  accountHolder: string
  rejectionReason: string | null
  createdAt: string
  processedAt: string | null
}

export interface RefundStats {
  pendingCount: number
  completedCount: number
  rejectedCount: number
  totalRefundedAmount: number
  pendingAmount: number
}

export interface RefundRejectRequest {
  rejectionReason: string
}

export interface AdminRefundPaginatedResponse<T> {
  content: T[]
  pageable: {
    pageNumber: number
    pageSize: number
    sort: {
      sorted: boolean
      unsorted: boolean
      empty: boolean
    }
    offset: number
    paged: boolean
    unpaged: boolean
  }
  totalPages: number
  totalElements: number
  last: boolean
  first: boolean
  size: number
  number: number
  numberOfElements: number
  empty: boolean
}

// ========================================
// API Functions
// ========================================

export interface GetRefundsParams {
  status?: RefundStatus
  keyword?: string
  page?: number
  size?: number
  sort?: string
}

/**
 * 환불 목록 조회
 */
export const getAdminRefunds = async (
  params: GetRefundsParams = {}
): Promise<ApiResponse<AdminRefundPaginatedResponse<AdminRefund>>> => {
  const { status, keyword, page = 0, size = 20, sort = 'createdAt,desc' } = params

  const queryParams: Record<string, string> = {
    page: page.toString(),
    size: size.toString(),
    sort,
  }

  if (status) {
    queryParams.status = status
  }

  if (keyword) {
    queryParams.keyword = keyword
  }

  const response = await axiosInstance.get('/admin/refunds', {
    params: queryParams,
  })

  return response.data
}

/**
 * 대기 중인 환불 목록 조회
 */
export const getPendingRefunds = async (
  params: { page?: number; size?: number; sort?: string } = {}
): Promise<ApiResponse<AdminRefundPaginatedResponse<AdminRefund>>> => {
  const { page = 0, size = 20, sort = 'createdAt,asc' } = params

  const response = await axiosInstance.get('/admin/refunds/pending', {
    params: {
      page: page.toString(),
      size: size.toString(),
      sort,
    },
  })

  return response.data
}

/**
 * 처리 완료된 환불 목록 조회
 */
export const getCompletedRefunds = async (
  params: { page?: number; size?: number } = {}
): Promise<ApiResponse<AdminRefundPaginatedResponse<AdminRefund>>> => {
  const { page = 0, size = 20 } = params

  const response = await axiosInstance.get('/admin/refunds/completed', {
    params: {
      page: page.toString(),
      size: size.toString(),
    },
  })

  return response.data
}

/**
 * 환불 상세 조회
 */
export const getAdminRefund = async (
  refundUuid: string
): Promise<ApiResponse<AdminRefund>> => {
  const response = await axiosInstance.get(`/admin/refunds/${refundUuid}`)
  return response.data
}

/**
 * 환불 승인
 */
export const approveRefund = async (
  refundUuid: string
): Promise<ApiResponse<AdminRefund>> => {
  const response = await axiosInstance.post(`/admin/refunds/${refundUuid}/approve`)
  return response.data
}

/**
 * 환불 거부
 */
export const rejectRefund = async (
  refundUuid: string,
  data: RefundRejectRequest
): Promise<ApiResponse<AdminRefund>> => {
  const response = await axiosInstance.post(`/admin/refunds/${refundUuid}/reject`, data)
  return response.data
}

/**
 * 환불 통계 조회
 */
export const getRefundStats = async (): Promise<ApiResponse<RefundStats>> => {
  const response = await axiosInstance.get('/admin/refunds/stats')
  return response.data
}
