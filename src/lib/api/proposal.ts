/**
 * 견적 제안 API
 */

import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'

// ========================================
// Types
// ========================================

export interface ProposalAttachment {
  id?: number
  fileUrl: string
  fileType: 'DRAWING' | 'PHOTO' | 'DOCUMENT' | 'ESTIMATE'
  fileDescription: string
  displayOrder: number
  createdAt?: string
  originalFilename?: string
  mimeType?: string
  fileSize?: number
}

export interface Proposal {
  id: number
  uuid: string
  title: string
  description: string
  price: number
  status: 'SUBMITTED' | 'VIEWED' | 'SELECTED' | 'REJECTED' | 'WITHDRAWN'
  isSelected: boolean
  selectedAt?: string
  validUntil?: string
  attachments?: ProposalAttachment[]
  pricingDetails?: Record<string, any>
  timeline?: Record<string, any>
  proposedStartDate?: string
  proposedEndDate?: string
  companyId: number
  companyName: string
  companyUuid?: string
  companySlug?: string
  requestId: number
  requestUuid: string
  requestTitle: string
  createdAt: string
  updatedAt: string
}

export interface ProposalListResponse {
  content: Proposal[]
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

export interface CreateProposalRequest {
  title: string
  description: string
  price: number
  validUntil?: string
  pricingDetails?: Record<string, any>
  timeline?: Record<string, any>
  proposedStartDate?: string
  proposedEndDate?: string
  attachments?: ProposalAttachment[]
}

export interface UpdateProposalRequest {
  title?: string
  description?: string
  price?: number
  validUntil?: string
  pricingDetails?: Record<string, any>
  timeline?: Record<string, any>
  proposedStartDate?: string
  proposedEndDate?: string
  attachments?: ProposalAttachment[]
}

// ========================================
// API Functions
// ========================================

/**
 * 제안 제출
 */
export const createProposal = async (
  requestUuid: string,
  data: CreateProposalRequest
): Promise<ApiResponse<Proposal>> => {
  const response = await axiosInstance.post(`/proposals/request/${requestUuid}`, data)
  return response.data
}

/**
 * 제안 상세 조회
 */
export const getProposal = async (
  proposalUuid: string
): Promise<ApiResponse<Proposal>> => {
  const response = await axiosInstance.get(`/proposals/${proposalUuid}`)
  return response.data
}

/**
 * 제안 수정
 */
export const updateProposal = async (
  proposalUuid: string,
  data: UpdateProposalRequest
): Promise<ApiResponse<Proposal>> => {
  const response = await axiosInstance.put(`/proposals/${proposalUuid}`, data)
  return response.data
}

/**
 * 제안 수락
 */
export const acceptProposal = async (
  proposalUuid: string
): Promise<ApiResponse<Proposal>> => {
  const response = await axiosInstance.post(`/proposals/${proposalUuid}/accept`)
  return response.data
}

/**
 * 제안 거절
 */
export const rejectProposal = async (
  proposalUuid: string,
  reason?: string
): Promise<ApiResponse<Proposal>> => {
  const response = await axiosInstance.post(`/proposals/${proposalUuid}/reject`, null, {
    params: reason ? { reason } : undefined
  })
  return response.data
}

/**
 * 제안 철회
 */
export const withdrawProposal = async (
  proposalUuid: string
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete(`/proposals/${proposalUuid}/withdraw`)
  return response.data
}

/**
 * 내 제안 목록
 */
export const getMyProposals = async (
  page: number = 0,
  size: number = 20,
  sort: string = 'createdAt,desc'
): Promise<ApiResponse<ProposalListResponse>> => {
  const response = await axiosInstance.get('/proposals/my', {
    params: { page, size, sort }
  })
  return response.data
}

/**
 * 견적 요청별 제안 조회
 */
export const getProposalsByRequest = async (
  requestUuid: string
): Promise<ApiResponse<Proposal[] | { proposalCount: number }>> => {
  const response = await axiosInstance.get(`/proposals/request/${requestUuid}`)
  return response.data
}
