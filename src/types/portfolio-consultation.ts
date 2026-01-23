/**
 * 포트폴리오 기반 견적 상담 타입 정의
 */

// 연락 방법
export type ContactMethod = 'PHONE' | 'EMAIL' | 'KAKAO' | 'ANY'

// 상담 상태
export type PortfolioConsultationStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'ANSWERED'
  | 'COMPLETED'
  | 'CANCELLED'

// 포트폴리오 상담
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
  createdAt: string
  updatedAt: string
}

// 상담 목록 아이템 (요약)
export interface PortfolioConsultationListItem {
  uuid: string
  portfolioTitle: string
  companyName: string
  name: string
  phone: string
  email: string
  title: string
  status: PortfolioConsultationStatus
  companyMemo: string | null
  answer: string | null
  answeredAt: string | null
  createdAt: string
}

// 상담 생성 요청
export interface PortfolioConsultationCreateRequest {
  portfolioUuid: string
  name: string
  phone: string
  email: string
  title: string
  content: string
  contactMethod: ContactMethod
  availableTime?: string
}

// 상담 수정 요청
export interface PortfolioConsultationUpdateRequest {
  name?: string
  phone?: string
  email?: string
  title?: string
  content?: string
  contactMethod?: ContactMethod
  availableTime?: string
}

// 상담 답변 요청
export interface PortfolioConsultationAnswerRequest {
  answer: string
}

// 상담 메모 요청
export interface PortfolioConsultationMemoRequest {
  memo: string
}

// 상담 상태 변경 요청
export interface PortfolioConsultationStatusRequest {
  status: PortfolioConsultationStatus
}

// 연락 방법 라벨
export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  PHONE: '전화',
  EMAIL: '이메일',
  KAKAO: '카카오톡',
  ANY: '아무거나',
}

// 상담 상태 라벨
export const CONSULTATION_STATUS_LABELS: Record<PortfolioConsultationStatus, string> = {
  PENDING: '대기중',
  IN_PROGRESS: '처리중',
  ANSWERED: '답변완료',
  COMPLETED: '완료',
  CANCELLED: '취소',
}

// 상담 상태 색상
export const CONSULTATION_STATUS_COLORS: Record<PortfolioConsultationStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  ANSWERED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
}
