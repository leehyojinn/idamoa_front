/**
 * 리뷰 API
 */

import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'

// ========================================
// Types
// ========================================

export interface ReviewResponse {
  id: number
  uuid: string
  companyId: number
  companyName: string
  userId: number
  userEmail: string
  rating: number
  title?: string
  content: string
  images: string[]
  reply?: string
  repliedAt?: string
  likeCount: number
  reportCount: number
  status: string
  createdAt: string
  updatedAt: string
}

export interface ReviewListResponse {
  content: ReviewResponse[]
  pageable: {
    pageNumber: number
    pageSize: number
  }
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
}

export interface CreateReviewRequest {
  rating: number
  title?: string
  content: string
  imageUuids?: string[]
}

export interface UpdateReviewRequest {
  rating: number
  title?: string
  content: string
  imageUuids?: string[]
}

export interface ReplyRequest {
  reply: string
}

// ========================================
// API Functions
// ========================================

/**
 * 업체 리뷰 목록 조회
 */
export const getCompanyReviews = async (
  companyUuid: string,
  page: number = 0,
  size: number = 20,
  sort: string = 'createdAt,DESC'
): Promise<ApiResponse<ReviewListResponse>> => {
  const response = await axiosInstance.get(`/companies/${companyUuid}/reviews`, {
    params: { page, size, sort },
  })
  return response.data
}

/**
 * 리뷰 상세 조회
 */
export const getReview = async (
  reviewUuid: string
): Promise<ApiResponse<ReviewResponse>> => {
  const response = await axiosInstance.get(`/reviews/${reviewUuid}`)
  return response.data
}

/**
 * 리뷰 작성
 */
export const createReview = async (
  companyUuid: string,
  data: CreateReviewRequest
): Promise<ApiResponse<ReviewResponse>> => {
  const response = await axiosInstance.post(`/companies/${companyUuid}/reviews`, data)
  return response.data
}

/**
 * 리뷰 수정
 */
export const updateReview = async (
  reviewUuid: string,
  data: UpdateReviewRequest
): Promise<ApiResponse<ReviewResponse>> => {
  const response = await axiosInstance.put(`/reviews/${reviewUuid}`, data)
  return response.data
}

/**
 * 리뷰 삭제
 */
export const deleteReview = async (
  reviewUuid: string
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete(`/reviews/${reviewUuid}`)
  return response.data
}

/**
 * 업체 답변 작성
 */
export const createReply = async (
  reviewUuid: string,
  data: ReplyRequest
): Promise<ApiResponse<ReviewResponse>> => {
  const response = await axiosInstance.post(`/reviews/${reviewUuid}/reply`, data)
  return response.data
}

/**
 * 업체 답변 수정
 */
export const updateReply = async (
  reviewUuid: string,
  data: ReplyRequest
): Promise<ApiResponse<ReviewResponse>> => {
  const response = await axiosInstance.put(`/reviews/${reviewUuid}/reply`, data)
  return response.data
}

/**
 * 업체 답변 삭제
 */
export const deleteReply = async (
  reviewUuid: string
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete(`/reviews/${reviewUuid}/reply`)
  return response.data
}
