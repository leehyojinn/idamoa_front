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
  logoImageUrl?: string
  coverImageUrl?: string
  galleryImageUrls?: string[]
}

export interface CompanyImage {
  id: number
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
  isLiked: boolean
  createdAt: string
  updatedAt: string
  images: CompanyImage[]
  filterOptions: FilterOption[]
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
