/**
 * 회원 관리 API
 */

import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'

// ========================================
// Types & Interfaces
// ========================================

export interface User {
  id: number
  uuid: string
  email: string
  name: string
  phoneNumber?: string
  roles: string[]
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
  emailVerified: boolean
  emailVerifiedAt?: string
  phoneVerified: boolean
  phoneVerifiedAt?: string
  identityVerified: boolean
  termsAgreed: boolean
  privacyAgreed: boolean
  marketingAgreed: boolean
  profileCompleted: boolean
  lastLoginAt?: string
  loginCount: number
  failedLoginCount: number
  createdAt: string
  updatedAt: string
  isDeleted: boolean
  deletedAt?: string
}

export interface UserListItem {
  id: number
  uuid: string
  email: string
  name: string
  roles: string[]
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
  emailVerified: boolean
  phoneVerified: boolean
  identityVerified: boolean
  lastLoginAt?: string
  loginCount: number
  createdAt: string
  isDeleted: boolean
}

export interface UserListResponse {
  content: UserListItem[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

// ========================================
// 관리자 전용 API
// ========================================

/**
 * 전체 회원 목록 조회 (관리자 전용)
 */
export interface GetAdminUsersParams {
  keyword?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
  role?: 'USER' | 'COMPANY' | 'ADMIN'
  page?: number
  size?: number
}

export const getAdminUsers = async (
  params: GetAdminUsersParams = {}
): Promise<ApiResponse<UserListResponse>> => {
  const response = await axiosInstance.get('/admin/users', { params })
  return response.data
}

/**
 * 회원 상세 정보 조회 (관리자 전용)
 */
export const getAdminUser = async (
  userUuid: string
): Promise<ApiResponse<User>> => {
  const response = await axiosInstance.get(`/admin/users/${userUuid}`)
  return response.data
}

/**
 * 회원 상태 변경 (관리자 전용)
 */
export interface ChangeUserStatusRequest {
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
  reason?: string
}

export const changeUserStatus = async (
  userUuid: string,
  data: ChangeUserStatusRequest
): Promise<ApiResponse<User>> => {
  const response = await axiosInstance.patch(`/admin/users/${userUuid}/status`, data)
  return response.data
}

/**
 * 회원 역할 변경 (관리자 전용)
 */
export interface ChangeUserRolesRequest {
  roles: ('USER' | 'COMPANY' | 'ADMIN')[]
}

export const changeUserRoles = async (
  userUuid: string,
  data: ChangeUserRolesRequest
): Promise<ApiResponse<User>> => {
  const response = await axiosInstance.patch(`/admin/users/${userUuid}/roles`, data)
  return response.data
}

/**
 * 회원 삭제 (관리자 전용, Soft Delete)
 */
export const deleteAdminUser = async (
  userUuid: string
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete(`/admin/users/${userUuid}`)

  if (response.status >= 200 && response.status < 300) {
    return {
      success: true,
      data: null,
    }
  }

  return response.data
}
