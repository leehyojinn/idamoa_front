/**
 * 문의 API (일반 문의 + 제휴/광고 문의)
 */

import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'

// ========================================
// 일반 문의 Types
// ========================================

export type GeneralInquiryType = 'BUG' | 'PAYMENT_ERROR' | 'ACCOUNT_ISSUE' | 'SUGGESTION' | 'OTHER'
export type GeneralInquiryStatus = 'PENDING' | 'IN_PROGRESS' | 'ANSWERED' | 'CLOSED'

export interface GeneralInquiryAttachment {
  uuid: string
  fileName: string
  fileUrl: string
  fileSize: number
  createdAt: string
}

export interface GeneralInquiryAnswer {
  content: string
  adminEmail: string
  createdAt: string
  updatedAt: string
}

export interface GeneralInquiryResponse {
  uuid: string
  inquiryType: GeneralInquiryType
  title: string
  content: string
  status: GeneralInquiryStatus
  userEmail: string
  answer: GeneralInquiryAnswer | null
  attachments: GeneralInquiryAttachment[]
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface GeneralInquiryListItem {
  uuid: string
  inquiryType: GeneralInquiryType
  title: string
  status: GeneralInquiryStatus
  hasAnswer: boolean
  createdAt: string
  updatedAt: string
}

export interface GeneralInquiryListResponse {
  content: GeneralInquiryListItem[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface CreateGeneralInquiryRequest {
  inquiryType: GeneralInquiryType
  title: string
  content: string
  fileUuids?: string[]
}

export interface UpdateGeneralInquiryRequest {
  inquiryType?: GeneralInquiryType
  title?: string
  content?: string
}

export interface CreateGeneralInquiryAnswerRequest {
  content: string
}

// 일반 문의 라벨 정의
export const GENERAL_INQUIRY_TYPE_LABELS: Record<GeneralInquiryType, string> = {
  BUG: '버그 신고',
  PAYMENT_ERROR: '결제 오류',
  ACCOUNT_ISSUE: '계정 문제',
  SUGGESTION: '건의사항',
  OTHER: '기타',
}

export const GENERAL_INQUIRY_STATUS_LABELS: Record<GeneralInquiryStatus, string> = {
  PENDING: '대기중',
  IN_PROGRESS: '처리중',
  ANSWERED: '답변완료',
  CLOSED: '종료',
}

export const GENERAL_INQUIRY_STATUS_COLORS: Record<GeneralInquiryStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-primary-100 text-primary-800',
  ANSWERED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
}

// ========================================
// 제휴/광고 문의 Types
// ========================================

export type PartnershipType = 'PARTNERSHIP' | 'ADVERTISEMENT' | 'OTHER'
export type PartnershipStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface PartnershipInquiryResponse {
  uuid: string
  partnershipType: PartnershipType
  partnershipTypeDescription: string
  name: string
  email: string
  phone: string
  content: string
  status: PartnershipStatus
  statusDescription: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface PartnershipInquiryListItem {
  uuid: string
  partnershipType: PartnershipType
  partnershipTypeDescription: string
  name: string
  email: string
  phone: string
  status: PartnershipStatus
  statusDescription: string
  createdAt: string
}

export interface PartnershipInquiryListResponse {
  content: PartnershipInquiryListItem[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface CreatePartnershipInquiryRequest {
  partnershipType: PartnershipType
  name: string
  email: string
  phone: string
  content: string
}

// 제휴/광고 문의 라벨 정의
export const PARTNERSHIP_TYPE_LABELS: Record<PartnershipType, string> = {
  PARTNERSHIP: '사업 제휴',
  ADVERTISEMENT: '광고 문의',
  OTHER: '기타',
}

export const PARTNERSHIP_STATUS_LABELS: Record<PartnershipStatus, string> = {
  PENDING: '대기중',
  IN_PROGRESS: '처리중',
  COMPLETED: '완료',
  CANCELLED: '취소',
}

export const PARTNERSHIP_STATUS_COLORS: Record<PartnershipStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-primary-100 text-primary-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
}

// ========================================
// 일반 문의 API - 사용자용
// ========================================

/**
 * 일반 문의 작성
 */
export const createGeneralInquiry = async (
  data: CreateGeneralInquiryRequest
): Promise<ApiResponse<GeneralInquiryResponse>> => {
  const response = await axiosInstance.post('/inquiries', data)
  return response.data
}

/**
 * 내 문의 목록 조회
 */
export const getMyInquiries = async (params?: {
  page?: number
  size?: number
  sort?: string
}): Promise<ApiResponse<GeneralInquiryListResponse>> => {
  const response = await axiosInstance.get('/inquiries/my', { params })
  return response.data
}

/**
 * 내 문의 검색
 */
export const searchMyInquiries = async (params?: {
  keyword?: string
  inquiryType?: GeneralInquiryType
  status?: GeneralInquiryStatus
  startDate?: string
  endDate?: string
  page?: number
  size?: number
}): Promise<ApiResponse<GeneralInquiryListResponse>> => {
  const response = await axiosInstance.get('/inquiries/my/search', { params })
  return response.data
}

/**
 * 내 문의 상세 조회
 */
export const getMyInquiry = async (
  inquiryUuid: string
): Promise<ApiResponse<GeneralInquiryResponse>> => {
  const response = await axiosInstance.get(`/inquiries/my/${inquiryUuid}`)
  return response.data
}

/**
 * 내 문의 수정 (PENDING 상태만 가능)
 */
export const updateMyInquiry = async (
  inquiryUuid: string,
  data: UpdateGeneralInquiryRequest
): Promise<ApiResponse<GeneralInquiryResponse>> => {
  const response = await axiosInstance.put(`/inquiries/my/${inquiryUuid}`, data)
  return response.data
}

/**
 * 내 문의 삭제 (PENDING 상태만 가능)
 */
export const deleteMyInquiry = async (
  inquiryUuid: string
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete(`/inquiries/my/${inquiryUuid}`)
  return response.data
}

// ========================================
// 일반 문의 API - 관리자용
// ========================================

/**
 * 일반 문의 목록 조회/검색 (관리자)
 */
export const adminGetGeneralInquiries = async (params?: {
  keyword?: string
  inquiryType?: GeneralInquiryType
  status?: GeneralInquiryStatus
  userEmail?: string
  hasAnswer?: boolean
  page?: number
  size?: number
}): Promise<ApiResponse<GeneralInquiryListResponse>> => {
  const response = await axiosInstance.get('/admin/inquiries', { params })
  return response.data
}

/**
 * 일반 문의 상세 조회 (관리자)
 */
export const adminGetGeneralInquiry = async (
  inquiryUuid: string
): Promise<ApiResponse<GeneralInquiryResponse>> => {
  const response = await axiosInstance.get(`/admin/inquiries/${inquiryUuid}`)
  return response.data
}

/**
 * 일반 문의 상태 변경 (관리자)
 */
export const adminChangeGeneralInquiryStatus = async (
  inquiryUuid: string,
  status: GeneralInquiryStatus
): Promise<ApiResponse<GeneralInquiryResponse>> => {
  const response = await axiosInstance.put(
    `/admin/inquiries/${inquiryUuid}/status`,
    null,
    { params: { status } }
  )
  return response.data
}

/**
 * 일반 문의 답변 작성 (관리자)
 */
export const adminCreateGeneralInquiryAnswer = async (
  inquiryUuid: string,
  data: CreateGeneralInquiryAnswerRequest
): Promise<ApiResponse<GeneralInquiryAnswer>> => {
  const response = await axiosInstance.post(`/admin/inquiries/${inquiryUuid}/answer`, data)
  return response.data
}

/**
 * 일반 문의 답변 수정 (관리자)
 */
export const adminUpdateGeneralInquiryAnswer = async (
  inquiryUuid: string,
  data: CreateGeneralInquiryAnswerRequest
): Promise<ApiResponse<GeneralInquiryAnswer>> => {
  const response = await axiosInstance.put(`/admin/inquiries/${inquiryUuid}/answer`, data)
  return response.data
}

/**
 * 일반 문의 답변 삭제 (관리자)
 */
export const adminDeleteGeneralInquiryAnswer = async (
  inquiryUuid: string
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete(`/admin/inquiries/${inquiryUuid}/answer`)
  return response.data
}

/**
 * 일반 문의 삭제 (관리자)
 */
export const adminDeleteGeneralInquiry = async (
  inquiryUuid: string
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete(`/admin/inquiries/${inquiryUuid}`)
  return response.data
}

// ========================================
// 제휴/광고 문의 API - 공개 (비회원 가능)
// ========================================

/**
 * 제휴/광고 문의 작성 (회원/비회원 모두 가능)
 */
export const createPartnershipInquiry = async (
  data: CreatePartnershipInquiryRequest
): Promise<ApiResponse<PartnershipInquiryResponse>> => {
  const response = await axiosInstance.post('/partnership-inquiries', data)
  return response.data
}

// ========================================
// 제휴/광고 문의 API - 관리자용
// ========================================

/**
 * 제휴/광고 문의 목록 조회 (관리자)
 */
export const adminGetPartnershipInquiries = async (params?: {
  status?: PartnershipStatus
  type?: PartnershipType
  page?: number
  size?: number
}): Promise<ApiResponse<PartnershipInquiryListResponse>> => {
  const response = await axiosInstance.get('/admin/partnership-inquiries', { params })
  return response.data
}

/**
 * 제휴/광고 문의 상세 조회 (관리자)
 */
export const adminGetPartnershipInquiry = async (
  inquiryUuid: string
): Promise<ApiResponse<PartnershipInquiryResponse>> => {
  const response = await axiosInstance.get(`/admin/partnership-inquiries/${inquiryUuid}`)
  return response.data
}

/**
 * 제휴/광고 문의 상태 변경 (관리자)
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
 * 제휴/광고 문의 삭제 (관리자)
 */
export const adminDeletePartnershipInquiry = async (
  inquiryUuid: string
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete(`/admin/partnership-inquiries/${inquiryUuid}`)
  return response.data
}
