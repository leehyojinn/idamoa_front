import axiosInstance from '@/lib/axios'
import type {
  Consultation,
  ConsultationListItem,
  ConsultationStatus,
  CreateConsultationRequest,
  UpdateConsultationRequest,
  VerifyConsultationRequest,
  PageResponse,
  ApiResponse,
  AdminUpdateStatusRequest,
  AdminResponseRequest,
} from '@/types/consultation'

/**
 * 상담 목록 조회 (Public)
 */
export async function getConsultations(params?: {
  status?: ConsultationStatus
  page?: number
  size?: number
  onlyMyPosts?: boolean
}): Promise<ApiResponse<PageResponse<ConsultationListItem>>> {
  try {
    const queryParams = new URLSearchParams()

    if (params?.status) queryParams.append('status', params.status)
    if (params?.page !== undefined) queryParams.append('page', params.page.toString())
    if (params?.size !== undefined) queryParams.append('size', params.size.toString())
    if (params?.onlyMyPosts) queryParams.append('onlyMyPosts', 'true')
    queryParams.append('sort', 'createdAt,DESC')

    const url = `/consultations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await axiosInstance.get(url)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('상담 목록 조회 실패:', error)
    throw error
  }
}

/**
 * 내 상담 목록 조회 (회원 전용)
 */
export async function getMyConsultations(params?: {
  page?: number
  size?: number
}): Promise<ApiResponse<PageResponse<ConsultationListItem>>> {
  try {
    const queryParams = new URLSearchParams()

    if (params?.page !== undefined) queryParams.append('page', params.page.toString())
    if (params?.size !== undefined) queryParams.append('size', params.size.toString())

    const url = `/consultations/my${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await axiosInstance.get(url)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('내 상담 목록 조회 실패:', error)
    throw error
  }
}

/**
 * 상담 상세 조회 (비밀번호 인증 또는 본인 인증)
 */
export async function verifyConsultation(
  uuid: string,
  password?: string
): Promise<ApiResponse<Consultation>> {
  try {
    const response = await axiosInstance.post(
      `/consultations/${uuid}/verify`,
      password ? { password } : {}
    )
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('상담 조회 실패:', error)
    throw error
  }
}

/**
 * 상담 신청
 */
export async function createConsultation(
  data: CreateConsultationRequest
): Promise<ApiResponse<Consultation>> {
  try {
    const response = await axiosInstance.post('/consultations', data)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('상담 신청 실패:', error)
    throw error
  }
}

/**
 * 상담 수정 (회원)
 */
export async function updateConsultation(
  uuid: string,
  data: Omit<UpdateConsultationRequest, 'password'>
): Promise<ApiResponse<Consultation>> {
  try {
    const response = await axiosInstance.put(`/consultations/${uuid}`, data)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('상담 수정 실패:', error)
    throw error
  }
}

/**
 * 상담 수정 (비회원)
 */
export async function updateConsultationWithPassword(
  uuid: string,
  data: UpdateConsultationRequest
): Promise<ApiResponse<Consultation>> {
  try {
    const response = await axiosInstance.put(
      `/consultations/${uuid}/with-password`,
      data
    )
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('상담 수정 실패:', error)
    throw error
  }
}

/**
 * 상담 취소 (회원)
 */
export async function cancelConsultation(
  uuid: string,
  reason?: string
): Promise<ApiResponse<void>> {
  try {
    const url = reason
      ? `/consultations/${uuid}?reason=${encodeURIComponent(reason)}`
      : `/consultations/${uuid}`
    await axiosInstance.delete(url)
    return { success: true }
  } catch (error: any) {
    console.error('상담 취소 실패:', error)
    throw error
  }
}

/**
 * 상담 취소 (비회원)
 */
export async function cancelConsultationWithPassword(
  uuid: string,
  password: string,
  reason?: string
): Promise<ApiResponse<void>> {
  try {
    const url = reason
      ? `/consultations/${uuid}/with-password?reason=${encodeURIComponent(reason)}`
      : `/consultations/${uuid}/with-password`
    await axiosInstance.delete(url, {
      data: { password }
    })
    return { success: true }
  } catch (error: any) {
    console.error('상담 취소 실패:', error)
    throw error
  }
}

// ========== 관리자 API ==========

/**
 * 전체 상담 목록 조회 (관리자)
 */
export async function adminGetConsultations(params?: {
  page?: number
  size?: number
}): Promise<ApiResponse<PageResponse<ConsultationListItem>>> {
  try {
    const queryParams = new URLSearchParams()

    if (params?.page !== undefined) queryParams.append('page', params.page.toString())
    if (params?.size !== undefined) queryParams.append('size', params.size.toString())

    const url = `/admin/consultations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await axiosInstance.get(url)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('관리자 상담 목록 조회 실패:', error)
    throw error
  }
}

/**
 * 상태별 상담 목록 조회 (관리자)
 */
export async function adminGetConsultationsByStatus(
  status: ConsultationStatus,
  params?: {
    page?: number
    size?: number
  }
): Promise<ApiResponse<PageResponse<ConsultationListItem>>> {
  try {
    const queryParams = new URLSearchParams()

    if (params?.page !== undefined) queryParams.append('page', params.page.toString())
    if (params?.size !== undefined) queryParams.append('size', params.size.toString())

    const url = `/admin/consultations/status/${status}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await axiosInstance.get(url)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('관리자 상태별 상담 목록 조회 실패:', error)
    throw error
  }
}

/**
 * 상담 상세 조회 (관리자)
 */
export async function adminGetConsultation(
  uuid: string
): Promise<ApiResponse<Consultation>> {
  try {
    const response = await axiosInstance.get(`/admin/consultations/${uuid}`)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('관리자 상담 상세 조회 실패:', error)
    throw error
  }
}

/**
 * 상담 상태 변경 (관리자)
 */
export async function adminUpdateStatus(
  uuid: string,
  data: AdminUpdateStatusRequest
): Promise<ApiResponse<void>> {
  try {
    await axiosInstance.put(`/admin/consultations/${uuid}/status`, data)
    return { success: true }
  } catch (error: any) {
    console.error('상담 상태 변경 실패:', error)
    throw error
  }
}

/**
 * 상담 답변 작성 (관리자)
 */
export async function adminCreateResponse(
  uuid: string,
  data: AdminResponseRequest
): Promise<ApiResponse<void>> {
  try {
    await axiosInstance.post(`/admin/consultations/${uuid}/response`, data)
    return { success: true }
  } catch (error: any) {
    console.error('상담 답변 작성 실패:', error)
    throw error
  }
}

/**
 * 업체 배정 (관리자)
 */
export async function adminAssignCompany(
  consultationUuid: string,
  companyUuid: string
): Promise<ApiResponse<void>> {
  try {
    await axiosInstance.put(`/admin/consultations/${consultationUuid}/assign/${companyUuid}`)
    return { success: true }
  } catch (error: any) {
    console.error('업체 배정 실패:', error)
    throw error
  }
}

/**
 * 상담 삭제 (관리자)
 */
export async function adminDeleteConsultation(
  uuid: string
): Promise<ApiResponse<void>> {
  try {
    await axiosInstance.delete(`/admin/consultations/${uuid}`)
    return { success: true }
  } catch (error: any) {
    console.error('상담 삭제 실패:', error)
    throw error
  }
}

// ========== 업체 API ==========

/**
 * 업체 상담 목록 조회
 */
export async function getCompanyConsultations(
  companyUuid: string,
  params?: {
    status?: ConsultationStatus
    page?: number
    size?: number
  }
): Promise<ApiResponse<PageResponse<ConsultationListItem>>> {
  try {
    const queryParams = new URLSearchParams()

    if (params?.status) queryParams.append('status', params.status)
    if (params?.page !== undefined) queryParams.append('page', params.page.toString())
    if (params?.size !== undefined) queryParams.append('size', params.size.toString())
    queryParams.append('sort', 'createdAt,DESC')

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
export async function getCompanyConsultation(
  companyUuid: string,
  consultationUuid: string
): Promise<ApiResponse<Consultation>> {
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
export async function updateCompanyConsultationStatus(
  companyUuid: string,
  consultationUuid: string,
  status: ConsultationStatus
): Promise<ApiResponse<void>> {
  try {
    await axiosInstance.patch(
      `/companies/${companyUuid}/consultations/${consultationUuid}/status`,
      { status }
    )
    return { success: true }
  } catch (error: any) {
    console.error('업체 상담 상태 변경 실패:', error)
    throw error
  }
}

/**
 * 업체 상담 답변 등록
 */
export async function createCompanyConsultationAnswer(
  companyUuid: string,
  consultationUuid: string,
  answer: string
): Promise<ApiResponse<void>> {
  try {
    await axiosInstance.patch(
      `/companies/${companyUuid}/consultations/${consultationUuid}/answer`,
      { answer }
    )
    return { success: true }
  } catch (error: any) {
    console.error('업체 상담 답변 등록 실패:', error)
    throw error
  }
}

/**
 * 업체 상담 메모 등록
 */
export async function createCompanyConsultationMemo(
  companyUuid: string,
  consultationUuid: string,
  memo: string
): Promise<ApiResponse<void>> {
  try {
    await axiosInstance.patch(
      `/companies/${companyUuid}/consultations/${consultationUuid}/memo`,
      { memo }
    )
    return { success: true }
  } catch (error: any) {
    console.error('업체 상담 메모 등록 실패:', error)
    throw error
  }
}
