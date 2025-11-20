// 상담 상태
export type ConsultationStatus = 'SUBMITTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

// 상담 목록 아이템
export interface ConsultationListItem {
  uuid: string
  name: string
  phone: string
  subject: string
  messagePreview: string
  status: ConsultationStatus
  hasResponse: boolean
  isMyConsultation: boolean
  createdAt: string
  updatedAt: string
}

// 상담 상세
export interface Consultation {
  uuid: string
  name: string
  phone: string
  email?: string
  subject?: string
  message: string
  preferredContactMethod?: string
  preferredContactTime?: string
  personalInfoConsent: boolean
  personalInfoConsentAt: string
  thirdPartyConsent: boolean
  thirdPartyConsentAt: string
  termsOfServiceConsent: boolean
  termsOfServiceConsentAt: string
  marketingConsent: boolean
  marketingConsentAt?: string
  status: ConsultationStatus
  responseMessage?: string
  respondedAt?: string
  completedAt?: string
  completionNotes?: string
  cancellationReason?: string
  assignedCompanyUuid?: string
  assignedCompanyName?: string
  assignedAt?: string
  createdAt: string
  updatedAt: string
  isMember: boolean
}

// 상담 신청 요청
export interface CreateConsultationRequest {
  name: string
  phone: string
  email?: string
  password?: string  // 비회원 필수
  subject?: string
  message: string
  preferredContactMethod?: string
  preferredContactTime?: string
  personalInfoConsent: boolean
  thirdPartyConsent: boolean
  termsOfServiceConsent: boolean
  marketingConsent?: boolean
  consentVersion?: string
}

// 상담 수정 요청
export interface UpdateConsultationRequest {
  password?: string  // 비회원용
  name: string
  phone: string
  email?: string
  subject?: string
  message: string
  preferredContactMethod?: string
  preferredContactTime?: string
}

// 상담 조회 요청 (비밀번호 인증)
export interface VerifyConsultationRequest {
  password?: string
}

// 페이지 응답
export interface PageResponse<T> {
  content: T[]
  pageable: {
    pageNumber: number
    pageSize: number
    offset: number
  }
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
  size: number
  number: number
  numberOfElements: number
  empty: boolean
}

// API 응답
export interface ApiResponse<T> {
  success: boolean
  data?: T
  errorCode?: string
  message?: string
}

// 관리자 - 상담 상태 변경 요청
export interface AdminUpdateStatusRequest {
  status: ConsultationStatus
  notes?: string
}

// 관리자 - 상담 답변 작성 요청
export interface AdminResponseRequest {
  responseMessage: string
}
