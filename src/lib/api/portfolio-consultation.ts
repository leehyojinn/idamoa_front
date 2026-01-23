/**
 * 포트폴리오 기반 견적 상담 API
 */

import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'
import type { PageResponse } from '@/types/consultation'
import type {
  PortfolioConsultation,
  PortfolioConsultationListItem,
  PortfolioConsultationCreateRequest,
  PortfolioConsultationUpdateRequest,
  PortfolioConsultationAnswerRequest,
  PortfolioConsultationMemoRequest,
  PortfolioConsultationStatusRequest,
  PortfolioConsultationStatus,
} from '@/types/portfolio-consultation'

// ==================== 사용자 API ====================

/**
 * 상담 신청 생성
 */
export async function createPortfolioConsultation(
  data: PortfolioConsultationCreateRequest
): Promise<ApiResponse<PortfolioConsultation>> {
  try {
    const response = await axiosInstance.post('/portfolio-consultations', data)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('상담 신청 실패:', error)
    throw error
  }
}

/**
 * 내 상담 목록 조회
 */
export async function getMyPortfolioConsultations(params?: {
  page?: number
  size?: number
}): Promise<ApiResponse<PageResponse<PortfolioConsultationListItem>>> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.page !== undefined) queryParams.append('page', params.page.toString())
    if (params?.size !== undefined) queryParams.append('size', params.size.toString())
    queryParams.append('sort', 'createdAt,desc')

    const url = `/portfolio-consultations/my${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await axiosInstance.get(url)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('내 상담 목록 조회 실패:', error)
    throw error
  }
}

/**
 * 내 상담 상세 조회
 */
export async function getMyPortfolioConsultation(
  uuid: string
): Promise<ApiResponse<PortfolioConsultation>> {
  try {
    const response = await axiosInstance.get(`/portfolio-consultations/my/${uuid}`)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('내 상담 상세 조회 실패:', error)
    throw error
  }
}

/**
 * 내 상담 수정 (PENDING 상태일 때만)
 */
export async function updateMyPortfolioConsultation(
  uuid: string,
  data: PortfolioConsultationUpdateRequest
): Promise<ApiResponse<PortfolioConsultation>> {
  try {
    const response = await axiosInstance.put(`/portfolio-consultations/my/${uuid}`, data)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('내 상담 수정 실패:', error)
    throw error
  }
}

/**
 * 내 상담 삭제 (ANSWERED, COMPLETED 상태에서는 불가)
 */
export async function deleteMyPortfolioConsultation(
  uuid: string
): Promise<ApiResponse<null>> {
  try {
    await axiosInstance.delete(`/portfolio-consultations/my/${uuid}`)
    return { success: true, data: null }
  } catch (error: any) {
    console.error('내 상담 삭제 실패:', error)
    throw error
  }
}

// ==================== 업체 API ====================

/**
 * 업체 상담 목록 조회
 */
export async function getCompanyPortfolioConsultations(
  companyUuid: string,
  params?: {
    status?: PortfolioConsultationStatus
    page?: number
    size?: number
  }
): Promise<ApiResponse<PageResponse<PortfolioConsultationListItem>>> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.page !== undefined) queryParams.append('page', params.page.toString())
    if (params?.size !== undefined) queryParams.append('size', params.size.toString())
    queryParams.append('sort', 'createdAt,desc')

    const url = `/companies/${companyUuid}/consultations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await axiosInstance.get(url)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('업체 상담 목록 조회 실패:', error)
    throw error
  }
}

/**
 * 업체 상담 상세 조회
 */
export async function getCompanyPortfolioConsultation(
  companyUuid: string,
  consultationUuid: string
): Promise<ApiResponse<PortfolioConsultation>> {
  try {
    const response = await axiosInstance.get(
      `/companies/${companyUuid}/consultations/${consultationUuid}`
    )
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('업체 상담 상세 조회 실패:', error)
    throw error
  }
}

/**
 * 업체 상담 상태 변경
 */
export async function updateCompanyPortfolioConsultationStatus(
  companyUuid: string,
  consultationUuid: string,
  data: PortfolioConsultationStatusRequest
): Promise<ApiResponse<PortfolioConsultation>> {
  try {
    const response = await axiosInstance.patch(
      `/companies/${companyUuid}/consultations/${consultationUuid}/status`,
      data
    )
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('업체 상담 상태 변경 실패:', error)
    throw error
  }
}

/**
 * 업체 상담 답변 등록
 */
export async function submitCompanyPortfolioConsultationAnswer(
  companyUuid: string,
  consultationUuid: string,
  data: PortfolioConsultationAnswerRequest
): Promise<ApiResponse<PortfolioConsultation>> {
  try {
    const response = await axiosInstance.patch(
      `/companies/${companyUuid}/consultations/${consultationUuid}/answer`,
      data
    )
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('업체 상담 답변 등록 실패:', error)
    throw error
  }
}

/**
 * 업체 상담 메모 등록
 */
export async function updateCompanyPortfolioConsultationMemo(
  companyUuid: string,
  consultationUuid: string,
  data: PortfolioConsultationMemoRequest
): Promise<ApiResponse<PortfolioConsultation>> {
  try {
    const response = await axiosInstance.patch(
      `/companies/${companyUuid}/consultations/${consultationUuid}/memo`,
      data
    )
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('업체 상담 메모 등록 실패:', error)
    throw error
  }
}
