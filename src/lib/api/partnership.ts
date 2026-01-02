/**
 * Partnership API 클라이언트
 */

import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'
import type {
  CompanyPartnershipListItem,
  CompanyPartnershipResponse,
  CompanyPartnershipCreateRequest,
  CompanyPartnershipUpdateRequest,
  CompanyPartnershipReorderRequest,
  PartnershipInquiryListItem,
  PartnershipInquiryResponse,
  PartnershipInquiryCreateRequest,
  PartnershipStatus,
  PartnershipType,
  CompanyPartnershipStatus,
  PageResponse,
} from '@/types/partnership'

// ===== Public APIs =====

/**
 * 활성 제휴업체 목록 조회
 */
export const getActivePartnerships = async (): Promise<ApiResponse<CompanyPartnershipListItem[]>> => {
  const response = await axiosInstance.get('/partnerships')
  return response.data
}

/**
 * 제휴/광고 문의 생성
 */
export const createPartnershipInquiry = async (
  data: PartnershipInquiryCreateRequest
): Promise<ApiResponse<PartnershipInquiryResponse>> => {
  const response = await axiosInstance.post('/partnership-inquiries', data)
  return response.data
}

// ===== Admin Company Partnership APIs =====

/**
 * [관리자] 제휴업체 등록
 */
export const adminCreateCompanyPartnership = async (
  data: CompanyPartnershipCreateRequest
): Promise<ApiResponse<CompanyPartnershipResponse>> => {
  const response = await axiosInstance.post('/admin/company-partnerships', data)
  return response.data
}

/**
 * [관리자] 제휴업체 목록 조회
 */
export interface AdminCompanyPartnershipsParams {
  status?: CompanyPartnershipStatus
  page?: number
  size?: number
}

export const adminGetCompanyPartnerships = async (
  params: AdminCompanyPartnershipsParams = {}
): Promise<ApiResponse<PageResponse<CompanyPartnershipResponse>>> => {
  const response = await axiosInstance.get('/admin/company-partnerships', { params })
  return response.data
}

/**
 * [관리자] 제휴업체 상세 조회
 */
export const adminGetCompanyPartnership = async (
  uuid: string
): Promise<ApiResponse<CompanyPartnershipResponse>> => {
  const response = await axiosInstance.get(`/admin/company-partnerships/${uuid}`)
  return response.data
}

/**
 * [관리자] 제휴업체 수정
 */
export const adminUpdateCompanyPartnership = async (
  uuid: string,
  data: CompanyPartnershipUpdateRequest
): Promise<ApiResponse<CompanyPartnershipResponse>> => {
  const response = await axiosInstance.put(`/admin/company-partnerships/${uuid}`, data)
  return response.data
}

/**
 * [관리자] 제휴 상태 토글 (ACTIVE ↔ CANCELLED)
 */
export const adminToggleCompanyPartnershipStatus = async (
  uuid: string
): Promise<ApiResponse<CompanyPartnershipResponse>> => {
  const response = await axiosInstance.patch(`/admin/company-partnerships/${uuid}/toggle-status`)
  return response.data
}

/**
 * [관리자] 제휴 삭제
 */
export const adminDeleteCompanyPartnership = async (
  uuid: string
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete(`/admin/company-partnerships/${uuid}`)
  return response.data
}

/**
 * [관리자] 제휴 순서 일괄 변경
 */
export const adminReorderCompanyPartnerships = async (
  data: CompanyPartnershipReorderRequest
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.post('/admin/company-partnerships/reorder', data)
  return response.data
}

/**
 * [관리자] 특정 업체 제휴 이력 조회
 */
export const adminGetCompanyPartnershipHistory = async (
  companyUuid: string
): Promise<ApiResponse<CompanyPartnershipResponse[]>> => {
  const response = await axiosInstance.get(
    `/admin/company-partnerships/company/${companyUuid}/history`
  )
  return response.data
}

// ===== Admin Partnership Inquiry APIs =====

/**
 * [관리자] 제휴/광고 문의 목록 조회
 */
export interface AdminPartnershipInquiriesParams {
  status?: PartnershipStatus
  type?: PartnershipType
  page?: number
  size?: number
  sort?: string
}

export const adminGetPartnershipInquiries = async (
  params: AdminPartnershipInquiriesParams = {}
): Promise<ApiResponse<PageResponse<PartnershipInquiryListItem>>> => {
  const response = await axiosInstance.get('/admin/partnership-inquiries', { params })
  return response.data
}

/**
 * [관리자] 제휴/광고 문의 상세 조회
 */
export const adminGetPartnershipInquiry = async (
  inquiryUuid: string
): Promise<ApiResponse<PartnershipInquiryResponse>> => {
  const response = await axiosInstance.get(`/admin/partnership-inquiries/${inquiryUuid}`)
  return response.data
}

/**
 * [관리자] 제휴/광고 문의 상태 변경
 */
export const adminChangePartnershipInquiryStatus = async (
  inquiryUuid: string,
  status: PartnershipStatus
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.patch(
    `/admin/partnership-inquiries/${inquiryUuid}/status`,
    null,
    { params: { status } }
  )
  return response.data
}

/**
 * [관리자] 제휴/광고 문의 삭제
 */
export const adminDeletePartnershipInquiry = async (
  inquiryUuid: string
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete(`/admin/partnership-inquiries/${inquiryUuid}`)
  return response.data
}
