/**
 * 관리자 크레딧 관리 API
 */

import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'

// ========================================
// Types
// ========================================

export interface AdminUserCredit {
  userUuid: string
  userEmail: string
  userName: string | null
  userPhone: string | null
  userStatus: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'
  profileCompleted: boolean
  isDeleted: boolean
  availableCredits: number
  totalEarned: number
  totalSpent: number
  createdAt: string
  updatedAt: string
}

export type DeletedFilter = 'ALL' | 'ACTIVE' | 'DELETED'

export interface AdminCreditTransaction {
  transactionUuid: string
  userUuid: string
  userEmail: string
  userName: string
  transactionType: 'EARN' | 'SPEND' | 'REFUND' | 'ADMIN_GRANT' | 'ADMIN_DEDUCT' | 'EXPIRE'
  amount: number
  balanceAfter: number
  reason: string
  entityType: string
  entityId: number | null
  createdAt: string
}

export interface AdminCreditStats {
  totalUsers: number
  totalAvailableCredits: number
  totalEarnedCredits: number
  totalSpentCredits: number
  totalPaymentCount: number
  totalPaymentAmount: number
  pendingRefundCount: number
  completedRefundCount: number
  rejectedRefundCount: number
  totalRefundedAmount: number
  pendingRefundAmount: number
  activePackageCount: number
}

export interface AdminCreditBalanceStats {
  totalAvailableCredits: number
  totalEarnedCredits: number
  totalSpentCredits: number
  usersWithCredits: number
}

export interface AdminCreditPaginatedResponse<T> {
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
// 사용자 크레딧 관리 API
// ========================================

export interface GetUserCreditsParams {
  keyword?: string
  deletedFilter?: DeletedFilter
  page?: number
  size?: number
  sort?: string
}

/**
 * 사용자 크레딧 목록 조회
 * - keyword: 이메일/이름/전화번호 검색
 * - deletedFilter: ALL(전체), ACTIVE(탈퇴하지 않은 사용자), DELETED(탈퇴한 사용자)
 * - sort: created_at,desc (기본값), email
 */
export const getAdminUserCredits = async (
  params: GetUserCreditsParams = {}
): Promise<ApiResponse<AdminCreditPaginatedResponse<AdminUserCredit>>> => {
  const { keyword, deletedFilter = 'ALL', page = 0, size = 20, sort = 'created_at,desc' } = params

  const queryParams: Record<string, string> = {
    page: page.toString(),
    size: size.toString(),
    sort,
    deletedFilter,
  }

  if (keyword) {
    queryParams.keyword = keyword
  }

  const response = await axiosInstance.get('/admin/credits/users', {
    params: queryParams,
  })

  return response.data
}

/**
 * 특정 사용자 크레딧 조회
 */
export const getAdminUserCredit = async (
  userUuid: string
): Promise<ApiResponse<AdminUserCredit>> => {
  const response = await axiosInstance.get(`/admin/credits/users/${userUuid}`)
  return response.data
}

/**
 * 크레딧 지급 (관리자)
 */
export interface GrantCreditRequest {
  amount: number
  reason: string
}

export const grantCredit = async (
  userUuid: string,
  data: GrantCreditRequest
): Promise<ApiResponse<AdminUserCredit>> => {
  const response = await axiosInstance.post(`/admin/credits/users/${userUuid}/grant`, data)
  return response.data
}

/**
 * 크레딧 차감 (관리자)
 */
export interface DeductCreditRequest {
  amount: number
  reason: string
}

export const deductCredit = async (
  userUuid: string,
  data: DeductCreditRequest
): Promise<ApiResponse<AdminUserCredit>> => {
  const response = await axiosInstance.post(`/admin/credits/users/${userUuid}/deduct`, data)
  return response.data
}

// ========================================
// 거래 내역 관리 API
// ========================================

export interface GetTransactionsParams {
  type?: 'EARN' | 'SPEND' | 'REFUND' | 'ADMIN_GRANT' | 'ADMIN_DEDUCT' | 'EXPIRE'
  keyword?: string
  page?: number
  size?: number
  sort?: string
}

/**
 * 전체 거래 내역 조회
 */
export const getAdminCreditTransactions = async (
  params: GetTransactionsParams = {}
): Promise<ApiResponse<AdminCreditPaginatedResponse<AdminCreditTransaction>>> => {
  const { type, keyword, page = 0, size = 20, sort = 'created_at,desc' } = params

  const queryParams: Record<string, string> = {
    page: page.toString(),
    size: size.toString(),
    sort,
  }

  if (type) {
    queryParams.type = type
  }

  if (keyword) {
    queryParams.keyword = keyword
  }

  const response = await axiosInstance.get('/admin/credits/transactions', {
    params: queryParams,
  })

  return response.data
}

/**
 * 특정 사용자 거래 내역 조회
 */
export const getUserCreditTransactions = async (
  userUuid: string,
  params: { page?: number; size?: number; sort?: string } = {}
): Promise<ApiResponse<AdminCreditPaginatedResponse<AdminCreditTransaction>>> => {
  const { page = 0, size = 20, sort = 'created_at,desc' } = params

  const response = await axiosInstance.get(`/admin/credits/users/${userUuid}/transactions`, {
    params: {
      page: page.toString(),
      size: size.toString(),
      sort,
    },
  })

  return response.data
}

// ========================================
// 통계 API
// ========================================

/**
 * 종합 크레딧 통계
 */
export const getAdminCreditStats = async (): Promise<ApiResponse<AdminCreditStats>> => {
  const response = await axiosInstance.get('/admin/credit-stats')
  return response.data
}

/**
 * 크레딧 잔액 통계
 */
export const getAdminCreditBalanceStats = async (): Promise<ApiResponse<AdminCreditBalanceStats>> => {
  const response = await axiosInstance.get('/admin/credit-stats/balance')
  return response.data
}
