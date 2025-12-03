/**
 * 회사 등록 API
 */

import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'

export interface CompanyRegistrationData {
  name: string
  slug?: string
  description: string
  detailContent?: string
  detailContentFormat?: string
  businessInfo?: Record<string, unknown>
  businessHours?: Record<string, unknown>
  businessHoursNote?: string
  serviceAreas?: string[]
  tags?: string[]
  keywords?: string[]
  filterOptionIds?: number[]
  primaryPhone: string
  secondaryPhone?: string
  emergencyContact?: string
  email: string
  websiteUrl?: string
  kakaoChatUrl?: string
  socialLinks?: Record<string, unknown>
  address: string
  postalCode: string
  latitude?: number
  longitude?: number
  logoImageUuid?: string
  coverImageUuid?: string
  galleryImageUuids?: string[]
}

export interface CompanyImage {
  id: number
  fileUuid: string
  imageUrl: string
  imageType: string
  isPrimary: boolean
  displayOrder: number
  title: string
}

export interface FilterOption {
  id: number
  code: string
  name: string
  categoryCode: string
  categoryName: string
}

export interface FilterGroup {
  categoryId: number
  categoryCode: string
  categoryName: string
  categoryDescription?: string
  options: FilterOption[]
}

export interface CompanyResponse {
  id: number
  uuid: string
  ownerId: number
  ownerEmail: string
  name: string
  slug: string
  description: string
  detailContent?: string
  detailContentFormat?: string
  businessInfo?: Record<string, unknown>
  businessHours?: Record<string, unknown>
  businessHoursNote?: string
  serviceAreas?: string[]
  tags?: string[]
  keywords?: string[]
  primaryPhone: string
  secondaryPhone?: string
  emergencyContact?: string
  email: string
  websiteUrl?: string
  kakaoChatUrl?: string
  socialLinks?: Record<string, unknown>
  address: string
  postalCode: string
  latitude?: number
  longitude?: number
  avgRating: number
  reviewCount: number
  viewCount: number
  likeCount: number
  portfolioCount: number
  completedProjects: number
  status: string
  featured: boolean
  verified: boolean
  verifiedAt?: string
  premiumUntil?: string
  isPremium: boolean
  premiumTier?: string
  isLiked: boolean
  createdAt: string
  updatedAt: string
  images: CompanyImage[]
  filterGroups: FilterGroup[]
}

/**
 * 회사 등록
 */
export const createCompany = async (
  data: CompanyRegistrationData
): Promise<ApiResponse<CompanyResponse>> => {
  const response = await axiosInstance.post('/companies', data)
  return response.data
}

/**
 * 업체 등록 여부 확인
 */
export const checkCompanyExists = async (): Promise<ApiResponse<{ hasCompany: boolean }>> => {
  const response = await axiosInstance.get('/companies/check')
  return response.data
}

/**
 * 내 회사 정보 조회
 */
export const getMyCompany = async (): Promise<ApiResponse<CompanyResponse>> => {
  const response = await axiosInstance.get('/companies/my')
  return response.data
}

/**
 * 회사 정보 수정
 */
export const updateCompany = async (
  companyUuid: string,
  data: Partial<CompanyRegistrationData>
): Promise<ApiResponse<CompanyResponse>> => {
  const response = await axiosInstance.put(`/companies/${companyUuid}`, data)
  return response.data
}

/**
 * 특정 회사 정보 조회 (UUID로)
 */
export const getCompanyByUuid = async (
  companyUuid: string
): Promise<ApiResponse<CompanyResponse>> => {
  const response = await axiosInstance.get(`/companies/${companyUuid}`)
  return response.data
}

/**
 * 활성 업체 목록 조회 (페이지네이션)
 */
export interface GetCompaniesParams {
  page?: number
  size?: number
  sort?: string
}

export interface CompanyListItem {
  id: number
  uuid: string
  name: string
  slug: string
  description: string
  primaryPhone: string
  address: string
  avgRating: number
  reviewCount: number
  viewCount: number
  likeCount: number
  completedProjects: number
  status: string
  featured: boolean
  verified: boolean
  isPremium: boolean
  premiumTier: string | null
  isLiked: boolean
  isDeleted?: boolean
  images: CompanyImage[]
  createdAt: string
}

export interface CompanyListResponse {
  content: CompanyListItem[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export const getCompanies = async (
  params: GetCompaniesParams = {}
): Promise<ApiResponse<CompanyListResponse>> => {
  const { page = 0, size = 20, sort = 'createdAt,DESC' } = params
  const response = await axiosInstance.get('/companies', {
    params: { page, size, sort },
  })
  return response.data
}

/**
 * 업체 검색 (키워드, 태그, 정렬)
 */
export interface SearchCompaniesParams {
  keyword?: string
  tags?: string[]
  serviceAreas?: string[]
  minRating?: number
  filterOptionIds?: number[]
  sortBy?: 'LATEST' | 'RATING' | 'REVIEW_COUNT' | 'POPULAR' | 'PREMIUM_TIER'
  page?: number
  size?: number
}

export const searchCompanies = async (
  params: SearchCompaniesParams = {}
): Promise<ApiResponse<CompanyListResponse>> => {
  const { keyword, tags, serviceAreas, minRating, filterOptionIds, sortBy, page = 0, size = 20 } = params
  const response = await axiosInstance.get('/companies/search', {
    params: { keyword, tags, serviceAreas, minRating, filterOptionIds, sortBy, page, size },
    paramsSerializer: {
      indexes: null, // tags=value&tags=value2 형태로 전송 (tags[]=value가 아님)
    },
  })
  return response.data
}

/**
 * 업체 검색 (필터 기반 - API 문서 기준)
 * filters 파라미터는 "카테고리ID:옵션ID1,옵션ID2&카테고리ID:옵션ID3,옵션ID4" 형식
 */
export interface SearchCompaniesWithFiltersParams {
  keyword?: string
  tags?: string[]
  minRating?: number
  filters?: Record<number, number[]>  // { categoryId: [optionIds] }
  sortBy?: 'LATEST' | 'RATING' | 'REVIEW_COUNT' | 'POPULAR' | 'PREMIUM_TIER'
  page?: number
  size?: number
}

export const searchCompaniesWithFilters = async (
  params: SearchCompaniesWithFiltersParams = {}
): Promise<ApiResponse<CompanyListResponse>> => {
  const { keyword, tags, minRating, filters, sortBy, page = 0, size = 20 } = params

  // filters 객체를 문자열로 변환: { 1: [1,2], 2: [10,11] } => "1:1,2&2:10,11"
  let filtersStr: string | undefined
  if (filters && Object.keys(filters).length > 0) {
    filtersStr = Object.entries(filters)
      .filter(([_, optionIds]) => optionIds.length > 0)
      .map(([categoryId, optionIds]) => `${categoryId}:${optionIds.join(',')}`)
      .join('&')
  }

  const response = await axiosInstance.get('/companies/search', {
    params: {
      keyword,
      tags,
      minRating,
      filters: filtersStr,
      sortBy,
      page,
      size
    },
    paramsSerializer: {
      indexes: null, // tags=value&tags=value2 형태로 전송
    },
  })

  return response.data
}

/**
 * Slug로 업체 정보 조회
 */
export const getCompanyBySlug = async (
  slug: string
): Promise<ApiResponse<CompanyResponse>> => {
  const response = await axiosInstance.get(`/companies/slug/${slug}`)
  return response.data
}

/**
 * 회사 삭제 (Soft Delete)
 */
export const deleteCompany = async (
  companyUuid: string
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete(`/companies/${companyUuid}`)
  return response.data
}

/**
 * 업체 좋아요 토글
 */
export interface ToggleLikeResponse {
  isLiked: boolean
  message: string
}

export const toggleCompanyLike = async (
  companyUuid: string
): Promise<ApiResponse<ToggleLikeResponse>> => {
  const response = await axiosInstance.post(`/companies/${companyUuid}/like`)
  return response.data
}

// ========================================
// 관리자 전용 API
// ========================================

/**
 * 업체 목록 조회 (관리자 전용)
 * 삭제된 업체도 포함됩니다
 */
export interface AdminCompanyListParams {
  page?: number
  size?: number
  sort?: string
}

export const getAdminCompanies = async (
  params: AdminCompanyListParams = {}
): Promise<ApiResponse<CompanyListResponse>> => {
  const response = await axiosInstance.get('/admin/companies', { params })
  return response.data
}

/**
 * 업체 조회 (관리자 전용)
 */
export const getAdminCompany = async (
  companyUuid: string
): Promise<ApiResponse<CompanyResponse>> => {
  const response = await axiosInstance.get(`/admin/companies/${companyUuid}`)
  return response.data
}

/**
 * 업체 등록 (관리자 전용)
 */
export interface AdminCreateCompanyParams {
  ownerId?: number
  data: CompanyRegistrationData
}

export const createAdminCompany = async (
  params: AdminCreateCompanyParams
): Promise<ApiResponse<CompanyResponse>> => {
  const { ownerId, data } = params
  const response = await axiosInstance.post('/admin/companies', data, {
    params: ownerId ? { ownerId } : undefined
  })
  return response.data
}

/**
 * 업체 수정 (관리자 전용)
 */
export interface AdminUpdateCompanyData extends Partial<CompanyRegistrationData> {
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  featured?: boolean
  verified?: boolean
}

export const updateAdminCompany = async (
  companyUuid: string,
  data: AdminUpdateCompanyData
): Promise<ApiResponse<CompanyResponse>> => {
  const response = await axiosInstance.put(`/admin/companies/${companyUuid}`, data)
  return response.data
}

/**
 * 업체 삭제 (관리자 전용)
 */
export const deleteAdminCompany = async (
  companyUuid: string
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete(`/admin/companies/${companyUuid}`)

  if (response.status >= 200 && response.status < 300) {
    return {
      success: true,
      data: null,
    }
  }

  return response.data
}

/**
 * 업체 상태 변경 (관리자 전용)
 */
export interface CompanyStatusResponse {
  uuid: string
  name: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  updatedAt: string
}

export const changeCompanyStatus = async (
  companyUuid: string,
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
): Promise<ApiResponse<CompanyStatusResponse>> => {
  const response = await axiosInstance.patch(
    `/admin/companies/${companyUuid}/status`,
    null,
    { params: { status } }
  )
  return response.data
}

/**
 * 업체 인증 (관리자 전용)
 */
export interface CompanyVerifyResponse {
  uuid: string
  name: string
  verified: boolean
  verifiedAt: string
}

export const verifyCompany = async (
  companyUuid: string
): Promise<ApiResponse<CompanyVerifyResponse>> => {
  const response = await axiosInstance.post(`/admin/companies/${companyUuid}/verify`)
  return response.data
}
