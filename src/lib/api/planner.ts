import axiosInstance from '@/lib/axios'

// ========================================
// Types
// ========================================

export type PlannerApplicationStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
export type ConsultationMethod = 'VISIT' | 'PHONE' | 'SNS'
export type RequestType =
  | 'FULL_CONSULTING'
  | 'NEW_OPENING'
  | 'REMODELING'
  | 'OPERATION_CONSULTING'
  | 'LEGAL_INQUIRY'

// 희망 일정
export interface PreferredDate {
  priority: number
  preferredDate: string
  preferredTime: string
}

// 첨부파일
export interface Attachment {
  fileId: number
  fileUuid: string
  fileName: string
  fileUrl: string
  fileSize: number
}

// 신청서 생성 요청
export interface PlannerApplicationCreateRequest {
  title: string
  content: string
  consultationMethod: ConsultationMethod
  requestTypes: RequestType[]
  applicantName: string
  applicantPhone: string
  applicantEmail: string
  businessName?: string
  businessAddress?: string
  businessAreaSize?: string
  businessType?: string
  attachmentFileIds?: number[]
  preferredDates: PreferredDate[]
}

// 신청서 목록 응답 (내부용)
export interface PlannerApplicationListResponse {
  uuid: string
  title: string
  consultationMethod: ConsultationMethod
  requestTypes: RequestType[]
  applicantName: string
  status: PlannerApplicationStatus
  createdAt: string
}

// 공개 목록 응답 (민감정보 제외)
export interface PlannerApplicationPublicListResponse {
  uuid: string
  title: string
  consultationMethod: ConsultationMethod
  requestTypes: RequestType[]
  applicantName: string
  businessName?: string
  businessAddress?: string
  businessType?: string
  status: PlannerApplicationStatus
  createdAt: string
}

// 공개 상세 응답 (민감정보 제외)
export interface PlannerApplicationPublicDetailResponse {
  uuid: string
  title: string
  content: string
  consultationMethod: ConsultationMethod
  requestTypes: RequestType[]
  applicantName: string
  businessName?: string
  businessAddress?: string
  businessAreaSize?: string
  businessType?: string
  attachments: Attachment[]
  preferredDates: PreferredDate[]
  status: PlannerApplicationStatus
  adminResponse?: string
  createdAt: string
  updatedAt: string
}

// 신청서 상세 응답
export interface PlannerApplicationResponse {
  uuid: string
  userId: number
  title: string
  content: string
  consultationMethod: ConsultationMethod
  requestTypes: RequestType[]
  applicantName: string
  applicantPhone: string
  applicantEmail: string
  businessName?: string
  businessAddress?: string
  businessAreaSize?: string
  businessType?: string
  attachments: Attachment[]
  preferredDates: PreferredDate[]
  status: PlannerApplicationStatus
  adminResponse?: string
  adminMemo?: string
  assignedAdminId?: number
  assignedAdminName?: string
  createdAt: string
  updatedAt: string
}

// 페이지네이션 응답
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

// 라벨
export const STATUS_LABELS: Record<PlannerApplicationStatus, string> = {
  PENDING: '대기중',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  REJECTED: '거절',
}

export const STATUS_COLORS: Record<PlannerApplicationStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}

export const CONSULTATION_METHOD_LABELS: Record<ConsultationMethod, string> = {
  VISIT: '방문 상담',
  PHONE: '전화 상담',
  SNS: 'SNS 상담',
}

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  FULL_CONSULTING: '종합 컨설팅',
  NEW_OPENING: '신규 창업',
  REMODELING: '리모델링',
  OPERATION_CONSULTING: '운영 컨설팅',
  LEGAL_INQUIRY: '법률 자문',
}

// ========================================
// 사용자 API
// ========================================

/**
 * 플래너 신청서 생성
 */
export const createPlannerApplication = async (
  request: PlannerApplicationCreateRequest
): Promise<{ success: boolean; data: PlannerApplicationResponse }> => {
  const response = await axiosInstance.post('/planner-applications', request)
  return response.data
}

/**
 * 내 플래너 신청서 목록 조회
 */
export const getMyPlannerApplications = async (params?: {
  status?: PlannerApplicationStatus
  page?: number
  size?: number
}): Promise<{ success: boolean; data: PageResponse<PlannerApplicationListResponse> }> => {
  const response = await axiosInstance.get('/planner-applications/my', { params })
  return response.data
}

/**
 * 플래너 신청서 상세 조회
 */
export const getPlannerApplication = async (
  applicationUuid: string
): Promise<{ success: boolean; data: PlannerApplicationResponse }> => {
  const response = await axiosInstance.get(`/planner-applications/${applicationUuid}`)
  return response.data
}

// ========================================
// 관리자 API
// ========================================

/**
 * [관리자] 전체 신청서 목록 조회
 */
export const adminGetPlannerApplications = async (params?: {
  status?: PlannerApplicationStatus
  page?: number
  size?: number
}): Promise<{ success: boolean; data: PageResponse<PlannerApplicationListResponse> }> => {
  const response = await axiosInstance.get('/admin/planner-applications', { params })
  return response.data
}

/**
 * [관리자] 신청서 상세 조회
 */
export const adminGetPlannerApplication = async (
  applicationUuid: string
): Promise<{ success: boolean; data: PlannerApplicationResponse }> => {
  const response = await axiosInstance.get(`/admin/planner-applications/${applicationUuid}`)
  return response.data
}

/**
 * [관리자] 신청서 상태 변경
 */
export const adminChangePlannerApplicationStatus = async (
  applicationUuid: string,
  status: PlannerApplicationStatus
): Promise<{ success: boolean; data: PlannerApplicationResponse }> => {
  const response = await axiosInstance.patch(`/admin/planner-applications/${applicationUuid}/status`, { status })
  return response.data
}

/**
 * [관리자] 답변 등록
 */
export const adminAddPlannerApplicationResponse = async (
  applicationUuid: string,
  responseText: string
): Promise<{ success: boolean; data: PlannerApplicationResponse }> => {
  const response = await axiosInstance.patch(`/admin/planner-applications/${applicationUuid}/response`, {
    response: responseText,
  })
  return response.data
}

/**
 * [관리자] 메모 등록
 */
export const adminAddPlannerApplicationMemo = async (
  applicationUuid: string,
  memo: string
): Promise<{ success: boolean; data: PlannerApplicationResponse }> => {
  const response = await axiosInstance.patch(`/admin/planner-applications/${applicationUuid}/memo`, { memo })
  return response.data
}

/**
 * [관리자] 담당자 배정
 */
export const adminAssignPlannerApplication = async (
  applicationUuid: string,
  adminId: number
): Promise<{ success: boolean; data: PlannerApplicationResponse }> => {
  const response = await axiosInstance.patch(`/admin/planner-applications/${applicationUuid}/assign`, { adminId })
  return response.data
}

/**
 * [관리자] 신청서 삭제
 */
export const adminDeletePlannerApplication = async (
  applicationUuid: string
): Promise<{ success: boolean; data: null }> => {
  const response = await axiosInstance.delete(`/admin/planner-applications/${applicationUuid}`)
  return response.data
}

// ========================================
// 공개 API (인증 불필요)
// ========================================

/**
 * 플래너 신청 목록 조회 (공개)
 */
export const getPublicPlannerApplications = async (params?: {
  status?: PlannerApplicationStatus
  page?: number
  size?: number
}): Promise<{ success: boolean; data: PageResponse<PlannerApplicationPublicListResponse> }> => {
  const response = await axiosInstance.get('/planner-applications/list', { params })
  return response.data
}

/**
 * 플래너 신청 상세 조회 (공개)
 */
export const getPublicPlannerApplication = async (
  applicationUuid: string
): Promise<{ success: boolean; data: PlannerApplicationPublicDetailResponse }> => {
  const response = await axiosInstance.get(`/planner-applications/detail/${applicationUuid}`)
  return response.data
}

/**
 * 내 플래너 신청서 상세 조회
 */
export const getMyPlannerApplication = async (
  applicationUuid: string
): Promise<{ success: boolean; data: PlannerApplicationResponse }> => {
  const response = await axiosInstance.get(`/planner-applications/my/${applicationUuid}`)
  return response.data
}

/**
 * 플래너 신청서 수정
 */
export const updatePlannerApplication = async (
  applicationUuid: string,
  request: PlannerApplicationCreateRequest
): Promise<{ success: boolean; data: PlannerApplicationResponse }> => {
  const response = await axiosInstance.put(`/planner-applications/${applicationUuid}`, request)
  return response.data
}

/**
 * 플래너 신청서 삭제
 */
export const deletePlannerApplication = async (
  applicationUuid: string
): Promise<{ success: boolean; data: null }> => {
  const response = await axiosInstance.delete(`/planner-applications/${applicationUuid}`)
  return response.data
}
