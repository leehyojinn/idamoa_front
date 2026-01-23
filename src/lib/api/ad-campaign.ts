/**
 * 광고 캠페인 API
 */

import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'

// ========================================
// Types
// ========================================

export type AdType = 'SEARCH' | 'FEATURED' | 'BANNER'
export type AdCampaignStatus = 'PENDING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'

export interface AdCampaign {
  uuid: string
  companyUuid: string
  name: string
  description?: string
  adType: AdType
  status: AdCampaignStatus
  startDate: string
  endDate: string
  durationDays: number
  remainingDays: number
  totalSpent: number
  priorityScore: number
  autoRenew: boolean
  createdAt: string
}

export interface AdCampaignListResponse {
  content: AdCampaign[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface CreateAdCampaignRequest {
  companyUuid: string
  name: string
  description?: string
  adType: AdType
  durationDays: number
  paymentAmount: number
  autoRenew?: boolean
}

export interface AdCampaignPaymentRequest {
  amount: number
}

// ========================================
// API Functions
// ========================================

/**
 * 광고 캠페인 생성
 */
export const createAdCampaign = async (
  data: CreateAdCampaignRequest
): Promise<ApiResponse<AdCampaign>> => {
  const response = await axiosInstance.post('/ad-campaigns', data)
  return response.data
}

/**
 * 내 활성 캠페인 조회
 */
export const getMyAdCampaign = async (): Promise<ApiResponse<AdCampaign | null>> => {
  const response = await axiosInstance.get('/ad-campaigns/my')
  return response.data
}

/**
 * 캠페인 이력 조회
 */
export const getAdCampaignHistory = async (
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<AdCampaignListResponse>> => {
  const response = await axiosInstance.get('/ad-campaigns/my/history', {
    params: { page, size }
  })
  return response.data
}

/**
 * 캠페인 상세 조회
 */
export const getAdCampaign = async (
  campaignUuid: string
): Promise<ApiResponse<AdCampaign>> => {
  const response = await axiosInstance.get(`/ad-campaigns/${campaignUuid}`)
  return response.data
}

/**
 * 추가 결제
 */
export const addCampaignPayment = async (
  campaignUuid: string,
  data: AdCampaignPaymentRequest
): Promise<ApiResponse<AdCampaign>> => {
  const response = await axiosInstance.post(`/ad-campaigns/${campaignUuid}/payments`, data)
  return response.data
}

/**
 * 자동 갱신 설정
 */
export const setAutoRenew = async (
  campaignUuid: string,
  autoRenew: boolean
): Promise<ApiResponse<AdCampaign>> => {
  const response = await axiosInstance.patch(`/ad-campaigns/${campaignUuid}/auto-renew`, null, {
    params: { autoRenew }
  })
  return response.data
}

/**
 * 캠페인 취소
 */
export const cancelAdCampaign = async (
  campaignUuid: string
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete(`/ad-campaigns/${campaignUuid}`)
  return response.data
}

// ========================================
// 광고 가격 정보
// ========================================

export interface AdPriceInfo {
  durationDays: number
  minAmount: number
  label: string
}

export const AD_PRICE_OPTIONS: AdPriceInfo[] = [
  { durationDays: 7, minAmount: 3500, label: '7일' },
  { durationDays: 14, minAmount: 7000, label: '14일' },
  { durationDays: 30, minAmount: 15000, label: '30일' },
]

export const AD_TYPE_LABELS: Record<AdType, string> = {
  SEARCH: '검색 광고',
  FEATURED: '프리미엄 노출',
  BANNER: '배너 광고',
}

export const AD_STATUS_LABELS: Record<AdCampaignStatus, string> = {
  PENDING: '대기중',
  ACTIVE: '진행중',
  PAUSED: '일시중지',
  COMPLETED: '완료',
  CANCELLED: '취소됨',
}
