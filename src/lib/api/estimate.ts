/**
 * 견적 요청 API
 */

import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'

// ========================================
// Types
// ========================================

export interface EstimateAttachment {
  id?: number
  fileUuid?: string
  fileUrl?: string
  fileType: 'DRAWING' | 'PHOTO' | 'DOCUMENT' | 'ESTIMATE'
  fileDescription: string
  displayOrder: number
  createdAt?: string
  originalFilename?: string
  mimeType?: string
  fileSize?: number
}

export interface EstimateProposal {
  id: number
  uuid: string
  companyId: number
  companyName: string
  status: string
  proposedAmount: number
  proposedDuration: number
  summary: string
  submittedAt: string
}

export interface EstimateRequest {
  id: number
  uuid: string
  userId: number
  userEmail: string
  title: string
  description: string
  requirements?: string | Record<string, any>
  tags?: string[]
  requiredSkills?: string[]
  budgetMin?: number
  budgetMax?: number
  desiredStartDate?: string
  desiredEndDate?: string
  desiredCompletionDate?: string
  location?: string
  address?: string
  siteAddress?: string
  siteCity?: string
  siteState?: string
  latitude?: number
  longitude?: number
  areaSqm?: number
  areaPyeong?: number
  estimateType?: string
  images?: string[]
  status: 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'MATCHED' | 'COMPLETED'
  visibility: 'PUBLIC' | 'PRIVATE'
  proposalCount: number
  viewCount: number
  expiresAt?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  metadata?: Record<string, unknown>
  clientName?: string
  businessType?: string
  contactName?: string
  contactPhone?: string
  submissionDeadline?: string
  attachments?: EstimateAttachment[]
}

export interface EstimateRequestDetail extends EstimateRequest {
  proposals?: {
    totalCount: number
    pendingCount?: number
    acceptedCount?: number
    rejectedCount?: number
    items?: EstimateProposal[]
    canViewDetails?: boolean
    message?: string
  }
}

export interface EstimateRequestListResponse {
  content: EstimateRequest[]
  pageable: {
    pageNumber: number
    pageSize: number
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

export interface CreateEstimateRequest {
  title: string
  description: string
  estimateType: string
  clientName?: string
  businessType?: string
  siteAddress?: string
  siteCity?: string
  siteState?: string
  areaSqm?: number
  areaPyeong?: number
  budgetMin?: number
  budgetMax?: number
  desiredStartDate?: string
  desiredCompletionDate?: string
  expiresAt?: string
  isPublic?: boolean
  status?: 'DRAFT' | 'PUBLISHED'
  contactName?: string
  contactPhone?: string
  attachments?: EstimateAttachment[]
}

export interface UpdateEstimateRequest {
  title?: string
  description?: string
  estimateType?: string
  clientName?: string
  businessType?: string
  siteAddress?: string
  siteCity?: string
  siteState?: string
  areaSqm?: number
  areaPyeong?: number
  budgetMin?: number
  budgetMax?: number
  desiredStartDate?: string
  desiredCompletionDate?: string
  expiresAt?: string
  isPublic?: boolean
  status?: 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'MATCHED' | 'COMPLETED'
  contactName?: string
  contactPhone?: string
  attachments?: EstimateAttachment[]
}

// ========================================
// API Functions
// ========================================

/**
 * 공개 견적 요청 목록 조회
 */
export const getEstimateRequests = async (
  page: number = 0,
  size: number = 20,
  sort: string = 'createdAt,desc'
): Promise<ApiResponse<EstimateRequestListResponse>> => {
  const response = await axiosInstance.get('/estimates/requests', {
    params: { page, size, sort },
  })
  return response.data
}

/**
 * 견적 요청 작성
 */
export const createEstimateRequest = async (
  data: CreateEstimateRequest
): Promise<ApiResponse<EstimateRequest>> => {
  const response = await axiosInstance.post('/estimates/requests', data)
  return response.data
}

/**
 * 견적 요청 상세 조회
 */
export const getEstimateRequest = async (
  requestUuid: string
): Promise<ApiResponse<EstimateRequestDetail>> => {
  const response = await axiosInstance.get(`/estimates/requests/${requestUuid}`)
  return response.data
}

/**
 * 견적 요청 수정
 */
export const updateEstimateRequest = async (
  requestUuid: string,
  data: UpdateEstimateRequest
): Promise<ApiResponse<EstimateRequest>> => {
  const response = await axiosInstance.put(`/estimates/requests/${requestUuid}`, data)
  return response.data
}

/**
 * 견적 요청 삭제
 */
export const deleteEstimateRequest = async (
  requestUuid: string
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete(`/estimates/requests/${requestUuid}`)
  return response.data
}

/**
 * 견적 요청 발행
 */
export const publishEstimateRequest = async (
  requestUuid: string
): Promise<ApiResponse<EstimateRequest>> => {
  const response = await axiosInstance.post(`/estimates/requests/${requestUuid}/publish`)
  return response.data
}

/**
 * 내 견적 요청 목록
 */
export const getMyEstimateRequests = async (
  page: number = 0,
  size: number = 20,
  sort: string = 'createdAt,desc'
): Promise<ApiResponse<EstimateRequestListResponse>> => {
  const response = await axiosInstance.get('/estimates/requests/my', {
    params: { page, size, sort },
  })
  return response.data
}
