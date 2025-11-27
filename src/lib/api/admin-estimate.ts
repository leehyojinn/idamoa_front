import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'

// ========== 타입 정의 ==========

export interface EstimateRequestListItem {
  id: number
  uuid: string
  title: string
  location: string
  budgetMin: number
  budgetMax: number
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'
  visibility: string
  proposalCount: number
  viewCount: number
  expiresAt: string
  createdAt: string
  isDeleted?: boolean
}

export interface EstimateImageDto {
  uuid: string
  url: string
  description?: string
  displayOrder: number
}

export interface AttachmentResponse {
  uuid: string
  originalFilename: string
  fileUrl: string
  fileSize: number
  mimeType: string
}

export interface AdminEstimateRequest {
  id: number
  uuid: string
  userId: number
  userEmail: string
  userName: string
  title: string
  description: string
  category: string
  requirements: Record<string, any>
  tags: string[]
  requiredSkills: string[]
  budgetMin: number
  budgetMax: number
  desiredStartDate: string
  desiredEndDate: string
  location: string
  address: string
  latitude: number
  longitude: number
  images: EstimateImageDto[]
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'
  isPublic: boolean
  proposalCount: number
  viewCount: number
  expiresAt: string
  createdAt: string
  updatedAt: string
  metadata: Record<string, any>
  clientName: string
  businessType: string
  areaPyeong: number
  contactName: string
  contactPhone: string
  submissionDeadline: string
  attachments: AttachmentResponse[]
  isDeleted: boolean
  deletedAt?: string
}

export interface ProposalResponse {
  id: number
  uuid: string
  title: string
  description: string
  price: number
  status: string
  isSelected: boolean
  selectedAt?: string
  validUntil: string
  attachments: AttachmentResponse[]
  pricingDetails: Record<string, any>
  timeline: Record<string, any>
  companyId: number
  companyUuid: string
  companyName: string
  requestId: number
  requestUuid: string
  requestTitle: string
  createdAt: string
  updatedAt: string
  isDeleted?: boolean
}

interface PageResponse<T> {
  content: T[]
  pageable: {
    pageNumber: number
    pageSize: number
  }
  totalElements: number
  totalPages: number
  number: number
  size: number
}

// ========== 견적 요청 API ==========

// 견적 요청 목록 조회
export async function getEstimateRequests(params?: {
  status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'
  page?: number
  size?: number
  sort?: string
}): Promise<PageResponse<EstimateRequestListItem>> {
  const response = await axiosInstance.get<ApiResponse<PageResponse<EstimateRequestListItem>>>(
    '/admin/estimate-requests',
    { params }
  )
  return response.data.data
}

// 견적 요청 상세 조회
export async function getEstimateRequest(requestId: number): Promise<AdminEstimateRequest> {
  const response = await axiosInstance.get<ApiResponse<AdminEstimateRequest>>(
    `/admin/estimate-requests/${requestId}`
  )
  return response.data.data
}

// 견적 요청 삭제
export async function deleteEstimateRequest(requestId: number): Promise<void> {
  await axiosInstance.delete(`/admin/estimate-requests/${requestId}`)
}

// 견적 요청 상태 변경
export async function changeEstimateRequestStatus(
  requestId: number,
  status: 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'
): Promise<AdminEstimateRequest> {
  const response = await axiosInstance.patch<ApiResponse<AdminEstimateRequest>>(
    `/admin/estimate-requests/${requestId}/status`,
    null,
    { params: { status } }
  )
  return response.data.data
}

// ========== 견적 제안 API ==========

// 견적 제안 목록 조회
export async function getProposals(params?: {
  page?: number
  size?: number
  sort?: string
}): Promise<PageResponse<ProposalResponse>> {
  const response = await axiosInstance.get<ApiResponse<PageResponse<ProposalResponse>>>(
    '/admin/proposals',
    { params }
  )
  return response.data.data
}

// 견적 제안 삭제
export async function deleteProposal(proposalId: number): Promise<void> {
  await axiosInstance.delete(`/admin/proposals/${proposalId}`)
}
