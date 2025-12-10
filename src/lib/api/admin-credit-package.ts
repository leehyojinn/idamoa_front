/**
 * 관리자 크레딧 패키지 관리 API
 */

import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'

// ========================================
// Types
// ========================================

export interface AdminCreditPackage {
  uuid: string
  code: string
  displayName: string
  unitAmount: number
  bonusRate: number
  maxBonus: number | null
  bonusEligible: boolean
  description: string
  isActive: boolean
  displayOrder?: number
  createdAt?: string
  updatedAt?: string
}

export interface AdminCreditPackagePaginatedResponse {
  content: AdminCreditPackage[]
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

export interface GetAdminCreditPackagesParams {
  unitAmount?: number
  isActive?: boolean
  page?: number
  size?: number
  sort?: string
}

export interface CreateCreditPackageRequest {
  unitAmount: number
  bonusRate?: number
  maxBonus?: number | null
  description?: string
}

export interface UpdateCreditPackageRequest {
  displayName?: string
  bonusRate?: number
  maxBonus?: number | null
  description?: string
}

// ========================================
// 조회 API
// ========================================

/**
 * 패키지 목록 조회 (페이징, 필터)
 */
export const getAdminCreditPackages = async (
  params: GetAdminCreditPackagesParams = {}
): Promise<ApiResponse<AdminCreditPackagePaginatedResponse>> => {
  const { unitAmount, isActive, page = 0, size = 20, sort = 'displayOrder,asc' } = params

  const queryParams: Record<string, string> = {
    page: page.toString(),
    size: size.toString(),
    sort,
  }

  if (unitAmount !== undefined) {
    queryParams.unitAmount = unitAmount.toString()
  }

  if (isActive !== undefined) {
    queryParams.isActive = isActive.toString()
  }

  const response = await axiosInstance.get('/admin/credit-packages', {
    params: queryParams,
  })

  return response.data
}

/**
 * 패키지 상세 조회
 */
export const getAdminCreditPackage = async (
  packageUuid: string
): Promise<ApiResponse<AdminCreditPackage>> => {
  const response = await axiosInstance.get(`/admin/credit-packages/${packageUuid}`)
  return response.data
}

/**
 * 활성 패키지 목록 조회
 */
export const getActiveCreditPackages = async (): Promise<ApiResponse<AdminCreditPackage[]>> => {
  const response = await axiosInstance.get('/admin/credit-packages/active')
  return response.data
}

/**
 * 허용된 단위 금액 목록
 */
export const getUnitAmounts = async (): Promise<ApiResponse<number[]>> => {
  const response = await axiosInstance.get('/admin/credit-packages/unit-amounts')
  return response.data
}

// ========================================
// 생성/수정/삭제 API
// ========================================

/**
 * 패키지 생성
 */
export const createCreditPackage = async (
  data: CreateCreditPackageRequest
): Promise<ApiResponse<AdminCreditPackage>> => {
  const response = await axiosInstance.post('/admin/credit-packages', data)
  return response.data
}

/**
 * 패키지 수정
 */
export const updateCreditPackage = async (
  packageUuid: string,
  data: UpdateCreditPackageRequest
): Promise<ApiResponse<AdminCreditPackage>> => {
  const response = await axiosInstance.put(`/admin/credit-packages/${packageUuid}`, data)
  return response.data
}

/**
 * 활성화/비활성화 토글
 */
export const toggleCreditPackageActive = async (
  packageUuid: string
): Promise<ApiResponse<AdminCreditPackage>> => {
  const response = await axiosInstance.patch(`/admin/credit-packages/${packageUuid}/toggle-active`)
  return response.data
}

/**
 * 패키지 삭제 (Soft Delete)
 */
export const deleteCreditPackage = async (
  packageUuid: string
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete(`/admin/credit-packages/${packageUuid}`)
  return response.data
}

// ========================================
// 순서 및 보너스 관리 API
// ========================================

/**
 * 표시 순서 변경
 */
export const updateDisplayOrder = async (
  packageUuid: string,
  displayOrder: number
): Promise<ApiResponse<AdminCreditPackage>> => {
  const response = await axiosInstance.patch(
    `/admin/credit-packages/${packageUuid}/display-order`,
    null,
    { params: { displayOrder } }
  )
  return response.data
}

/**
 * 단위 금액별 보너스율 변경
 */
export const updateBonusRate = async (
  unitAmount: number,
  bonusRate: number,
  maxBonus?: number | null
): Promise<ApiResponse<AdminCreditPackage>> => {
  const params: Record<string, string> = {
    unitAmount: unitAmount.toString(),
    bonusRate: bonusRate.toString(),
  }

  if (maxBonus !== undefined && maxBonus !== null) {
    params.maxBonus = maxBonus.toString()
  }

  const response = await axiosInstance.patch('/admin/credit-packages/bonus-rate', null, { params })
  return response.data
}

// ========================================
// 통계 API
// ========================================

/**
 * 활성 패키지 수 조회
 */
export const getCreditPackageStats = async (): Promise<ApiResponse<number>> => {
  const response = await axiosInstance.get('/admin/credit-packages/stats/count')
  return response.data
}
