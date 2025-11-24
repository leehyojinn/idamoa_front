/**
 * 제휴/광고 문의 API
 */

import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'

// ========================================
// Types
// ========================================

export type InquiryType = 'PARTNERSHIP' | 'ADVERTISEMENT' | 'OTHER'
export type InquiryStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface InquiryResponse {
  id: number
  uuid: string
  inquiryType: InquiryType
  name: string
  email: string
  phone: string
  content: string
  status: InquiryStatus
  createdAt: string
  updatedAt: string
}

export interface InquiryListItem {
  id: number
  uuid: string
  inquiryType: InquiryType
  name: string
  email: string
  status: InquiryStatus
  createdAt: string
}

export interface InquiryListResponse {
  content: InquiryListItem[]
  pageable: {
    pageNumber: number
    pageSize: number
  }
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  size: number
  number: number
}

export interface CreateInquiryRequest {
  inquiryType: InquiryType
  name: string
  email: string
  phone: string
  content: string
}

// 라벨 정의
export const INQUIRY_TYPE_LABELS: Record<InquiryType, string> = {
  PARTNERSHIP: '제휴 문의',
  ADVERTISEMENT: '광고 문의',
  OTHER: '기타 문의',
}

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  PENDING: '접수 대기',
  IN_PROGRESS: '처리 중',
  COMPLETED: '처리 완료',
  CANCELLED: '취소됨',
}

export const INQUIRY_STATUS_COLORS: Record<InquiryStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
}

// ========================================
// 일반 사용자 API
// ========================================

/**
 * 문의 작성 (회원/비회원 모두 가능)
 */
export const createInquiry = async (
  data: CreateInquiryRequest
): Promise<ApiResponse<InquiryResponse>> => {
  const response = await axiosInstance.post('/inquiries', data)
  return response.data
}

// ========================================
// 관리자 API
// ========================================

/**
 * 문의 목록 조회 (관리자)
 */
export const adminGetInquiries = async (params?: {
  status?: InquiryStatus
  page?: number
  size?: number
}): Promise<ApiResponse<InquiryListResponse>> => {
  const queryParams = new URLSearchParams()

  if (params?.status) queryParams.append('status', params.status)
  if (params?.page !== undefined) queryParams.append('page', params.page.toString())
  if (params?.size !== undefined) queryParams.append('size', params.size.toString())
  queryParams.append('sort', 'createdAt,desc')

  const url = `/admin/inquiries${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  const response = await axiosInstance.get(url)
  return response.data
}

/**
 * 문의 상세 조회 (관리자)
 */
export const adminGetInquiry = async (
  inquiryUuid: string
): Promise<ApiResponse<InquiryResponse>> => {
  const response = await axiosInstance.get(`/admin/inquiries/${inquiryUuid}`)
  return response.data
}

/**
 * 문의 상태 변경 (관리자)
 */
export const adminChangeInquiryStatus = async (
  inquiryUuid: string,
  status: InquiryStatus
): Promise<ApiResponse<InquiryResponse>> => {
  const response = await axiosInstance.patch(
    `/admin/inquiries/${inquiryUuid}/status`,
    null,
    { params: { status } }
  )
  return response.data
}

/**
 * 문의 삭제 (관리자)
 */
export const adminDeleteInquiry = async (
  inquiryUuid: string
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete(`/admin/inquiries/${inquiryUuid}`)
  return response.data
}
