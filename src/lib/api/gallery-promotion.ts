/**
 * 갤러리 우대등록 API
 */

import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'
import type { GalleryImage, CompanySummary } from './gallery'

// ===== 타입 정의 =====

export interface PromotionTypeSetting {
  uuid: string
  promotionType: string
  displayName: string
  price: number
  weight: number
  displayOrder: number
  isActive: boolean
  description: string
  createdAt: string
  updatedAt: string
}

export interface GalleryPromotion {
  promotionUuid: string
  promotionType: 'STANDARD' | 'PREMIUM'
  weight: number
  monthlyPrice: number
  startDate: string
  endDate: string
  autoRenew: boolean
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  remainingDays: number
}

export interface FeaturedGallery {
  uuid: string
  title: string
  images: GalleryImage[]
  viewCount: number
  likeCount: number
  company?: CompanySummary | null
  promotion?: {
    promotionType: 'STANDARD' | 'PREMIUM'
    weight: number
    endDate: string
    remainingDays: number
  }
}

export interface AdminGalleryPromotion {
  promotionUuid: string
  boardUuid: string
  boardTitle: string
  userEmail: string
  promotionType: string
  weight: number
  monthlyPrice: number
  startDate: string
  endDate: string
  autoRenew: boolean
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  remainingDays: number
  createdAt: string
}

// ===== 사용자 API =====

/**
 * 우대 가격 설정 조회
 */
export const getPromotionPrices = async (): Promise<ApiResponse<PromotionTypeSetting[]>> => {
  const response = await axiosInstance.get('/boards/gallery/promotion-prices')
  return response.data
}

/**
 * 우대 갤러리 조회 (Featured) - 메인페이지용
 */
export const getFeaturedGalleries = async (params?: {
  filterOptionIds?: number[]
  count?: number
}): Promise<ApiResponse<FeaturedGallery[]>> => {
  const response = await axiosInstance.get('/boards/gallery/featured', {
    params,
    paramsSerializer: {
      indexes: null,
    },
  })
  return response.data
}

/**
 * 내 우대 갤러리 목록
 */
export const getMyPromotedGalleries = async (params?: {
  page?: number
  size?: number
  sort?: string
}): Promise<ApiResponse<{
  content: Array<{
    uuid: string
    title: string
    images: GalleryImage[]
    promotion: GalleryPromotion
  }>
  totalElements: number
  totalPages: number
}>> => {
  const response = await axiosInstance.get('/boards/gallery/promotions/my', { params })
  return response.data
}

// ===== 관리자 API =====

/**
 * 모든 우대 타입 설정 조회 (관리자)
 */
export const getAdminPromotionSettings = async (): Promise<ApiResponse<PromotionTypeSetting[]>> => {
  const response = await axiosInstance.get('/admin/gallery-promotion-settings')
  return response.data
}

/**
 * 특정 우대 타입 설정 조회 (관리자)
 */
export const getAdminPromotionSetting = async (uuid: string): Promise<ApiResponse<PromotionTypeSetting>> => {
  const response = await axiosInstance.get(`/admin/gallery-promotion-settings/${uuid}`)
  return response.data
}

/**
 * 새 우대 타입 생성 (관리자)
 */
export const createAdminPromotionSetting = async (data: {
  promotionType: string
  displayName: string
  price: number
  weight: number
  displayOrder?: number
  description?: string
}): Promise<ApiResponse<PromotionTypeSetting>> => {
  const response = await axiosInstance.post('/admin/gallery-promotion-settings', data)
  return response.data
}

/**
 * 우대 타입 설정 수정 (관리자)
 */
export const updateAdminPromotionSetting = async (
  uuid: string,
  data: Partial<{
    displayName: string
    price: number
    weight: number
    displayOrder: number
    isActive: boolean
    description: string
  }>
): Promise<ApiResponse<PromotionTypeSetting>> => {
  const response = await axiosInstance.put(`/admin/gallery-promotion-settings/${uuid}`, data)
  return response.data
}

/**
 * 우대 타입 비활성화 (관리자)
 */
export const deleteAdminPromotionSetting = async (uuid: string): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete(`/admin/gallery-promotion-settings/${uuid}`)
  return response.data
}

/**
 * 활성 우대 갤러리 목록 조회 (관리자)
 */
export const getAdminActivePromotions = async (): Promise<ApiResponse<AdminGalleryPromotion[]>> => {
  const response = await axiosInstance.get('/admin/gallery-promotion-settings/promotions')
  return response.data
}
