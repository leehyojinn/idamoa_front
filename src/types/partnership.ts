/**
 * Partnership API 타입 정의
 */

// ===== Enum Types =====

export type PartnershipType = 'PARTNERSHIP' | 'ADVERTISEMENT' | 'OTHER'
export type PartnershipStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type CompanyPartnershipStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED'

export const PARTNERSHIP_TYPE_LABELS: Record<PartnershipType, string> = {
  PARTNERSHIP: '제휴 문의',
  ADVERTISEMENT: '광고 문의',
  OTHER: '기타',
}

export const PARTNERSHIP_STATUS_LABELS: Record<PartnershipStatus, string> = {
  PENDING: '대기중',
  IN_PROGRESS: '처리중',
  COMPLETED: '완료',
  CANCELLED: '취소',
}

export const COMPANY_PARTNERSHIP_STATUS_LABELS: Record<CompanyPartnershipStatus, string> = {
  ACTIVE: '활성',
  EXPIRED: '만료',
  CANCELLED: '취소',
}

// ===== Company Partnership Types =====

export interface CompanyImage {
  id: number
  fileUuid: string
  imageUrl: string
  imageType: string
  description: string | null
  displayOrder: number
}

export interface CompanyPartnershipListItem {
  companyUuid: string
  companyName: string
  companySlug: string
  companyDescription: string | null
  primaryPhone: string | null
  address: string | null
  avgRating: number | null
  reviewCount: number
  viewCount: number
  likeCount: number
  completedProjects: number
  verified: boolean
  isPremium: boolean
  premiumTier: string | null
  images: CompanyImage[]
  displayOrder: number
}

export interface CompanyPartnershipResponse {
  uuid: string
  companyUuid: string
  companyName: string
  companySlug: string
  displayOrder: number
  startDate: string
  endDate: string
  status: CompanyPartnershipStatus
  adminMemo: string | null
  registeredByEmail: string | null
  createdAt: string
  updatedAt: string
}

export interface CompanyPartnershipCreateRequest {
  companyUuid: string
  startDate: string
  endDate: string
  displayOrder?: number
  adminMemo?: string
}

export interface CompanyPartnershipUpdateRequest {
  displayOrder?: number
  startDate?: string
  endDate?: string
  adminMemo?: string
}

export interface CompanyPartnershipReorderRequest {
  orders: {
    partnershipUuid: string
    displayOrder: number
  }[]
}

// ===== Partnership Inquiry Types =====

export interface PartnershipInquiryListItem {
  uuid: string
  partnershipType: PartnershipType
  partnershipTypeDescription: string
  name: string
  email: string
  status: PartnershipStatus
  statusDescription: string
  isDeleted: boolean
  createdAt: string
}

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

export interface PartnershipInquiryCreateRequest {
  partnershipType: PartnershipType
  name: string
  email: string
  phone: string
  content: string
}

// ===== Page Response =====

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first?: boolean
  last?: boolean
  empty?: boolean
}
