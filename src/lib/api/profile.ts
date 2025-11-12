import axiosInstance from '@/lib/axios'

// ========================================
// Types
// ========================================

export interface ProfileStatusResponse {
  success: boolean
  data: {
    profileCompleted: boolean
    profileType: string | null
    currentRole: string
  }
}

export interface CreateUserProfileRequest {
  name: string
  nickname?: string
  phone: string
  bio?: string
  address?: string
  postalCode?: string
}

export interface CreateUserProfileResponse {
  success: boolean
  data: {
    id: number
    userId: number
    name: string
    nickname: string | null
    phone: string
    bio: string | null
    address: string | null
    postalCode: string | null
    avatarUrl: string | null
    profileVisibility: string
    profileType: string
    createdAt: string
  }
}

export interface CreateCompanyProfileRequest {
  name: string
  description?: string
  primaryPhone: string
  email?: string
  address?: string
  postalCode?: string
}

export interface CreateCompanyProfileResponse {
  success: boolean
  data: {
    id: number
    uuid: string
    name: string
    description: string | null
    primaryPhone: string
    email: string | null
    address: string | null
    postalCode: string | null
    createdAt: string
  }
}

// ========================================
// API Functions
// ========================================

/**
 * 프로필 상태 확인
 */
export const getProfileStatus = async (): Promise<ProfileStatusResponse> => {
  const response = await axiosInstance.get('/users/profile/status')
  return response.data
}

/**
 * USER 프로필 생성
 */
export const createUserProfile = async (
  data: CreateUserProfileRequest
): Promise<CreateUserProfileResponse> => {
  const response = await axiosInstance.post('/users/profile', data)
  return response.data
}

/**
 * COMPANY 프로필 생성
 */
export const createCompanyProfile = async (
  data: CreateCompanyProfileRequest
): Promise<CreateCompanyProfileResponse> => {
  const response = await axiosInstance.post('/companies/profile', data)
  return response.data
}
