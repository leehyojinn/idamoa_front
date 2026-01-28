import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'

// ========== 타입 정의 ==========

export type PortfolioConsultationStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'ANSWERED'
  | 'COMPLETED'
  | 'CANCELLED'

export type ContactMethod = 'PHONE' | 'EMAIL' | 'KAKAO' | 'ANY'

export interface PortfolioConsultation {
  uuid: string
  portfolioUuid: string
  portfolioTitle: string
  companyUuid: string
  companyName: string
  userUuid: string | null
  userEmail: string | null
  name: string
  phone: string
  email: string
  title: string
  content: string
  contactMethod: ContactMethod
  availableTime: string | null
  status: PortfolioConsultationStatus
  companyMemo: string | null
  answer: string | null
  answeredAt: string | null
  answeredByUuid: string | null
  answeredByEmail: string | null
  isDeleted: boolean
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PortfolioConsultationUpdateRequest {
  name?: string
  phone?: string
  email?: string
  title?: string
  content?: string
  contactMethod?: ContactMethod
  availableTime?: string
}

export interface AdminConsultationFilters {
  status?: PortfolioConsultationStatus
  isDeleted?: boolean
  keyword?: string
  page?: number
  size?: number
  sort?: string
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
  first: boolean
  last: boolean
}

// ========== API 함수 ==========

// 목록 조회
export async function getAdminPortfolioConsultations(
  params: AdminConsultationFilters = {}
): Promise<PageResponse<PortfolioConsultation>> {
  const response = await axiosInstance.get<ApiResponse<PageResponse<PortfolioConsultation>>>(
    '/admin/portfolio-consultations',
    { params }
  )
  return response.data.data
}

// 상세 조회
export async function getAdminPortfolioConsultation(
  uuid: string
): Promise<PortfolioConsultation> {
  const response = await axiosInstance.get<ApiResponse<PortfolioConsultation>>(
    `/admin/portfolio-consultations/${uuid}`
  )
  return response.data.data
}

// 수정
export async function updateAdminPortfolioConsultation(
  uuid: string,
  data: PortfolioConsultationUpdateRequest
): Promise<PortfolioConsultation> {
  const response = await axiosInstance.put<ApiResponse<PortfolioConsultation>>(
    `/admin/portfolio-consultations/${uuid}`,
    data
  )
  return response.data.data
}

// 상태 변경
export async function updateAdminConsultationStatus(
  uuid: string,
  status: PortfolioConsultationStatus
): Promise<PortfolioConsultation> {
  const response = await axiosInstance.patch<ApiResponse<PortfolioConsultation>>(
    `/admin/portfolio-consultations/${uuid}/status`,
    { status }
  )
  return response.data.data
}

// 소프트 삭제
export async function deleteAdminPortfolioConsultation(uuid: string): Promise<void> {
  await axiosInstance.delete(`/admin/portfolio-consultations/${uuid}`)
}

// 복구
export async function restoreAdminPortfolioConsultation(
  uuid: string
): Promise<PortfolioConsultation> {
  const response = await axiosInstance.post<ApiResponse<PortfolioConsultation>>(
    `/admin/portfolio-consultations/${uuid}/restore`
  )
  return response.data.data
}

// 영구 삭제
export async function hardDeleteAdminPortfolioConsultation(uuid: string): Promise<void> {
  await axiosInstance.delete(`/admin/portfolio-consultations/${uuid}/permanent`)
}

// 상태 라벨
export const STATUS_LABELS: Record<PortfolioConsultationStatus, string> = {
  PENDING: '대기중',
  IN_PROGRESS: '처리중',
  ANSWERED: '답변완료',
  COMPLETED: '완료',
  CANCELLED: '취소',
}

// 상태 배지 스타일
export const STATUS_BADGE_STYLES: Record<PortfolioConsultationStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  ANSWERED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

// 연락방법 라벨
export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  PHONE: '전화',
  EMAIL: '이메일',
  KAKAO: '카카오톡',
  ANY: '무관',
}
