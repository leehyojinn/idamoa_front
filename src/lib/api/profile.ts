import axiosInstance from '@/lib/axios'

// ========================================
// Types
// ========================================

export type ProfileType = 'USER_PROFILE' | 'COMPANY'
export type ProfileVisibility = 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY'

export interface TokenInfo {
  grantType: string
  accessToken: string
  refreshToken: string
  profileCompleted: boolean
  currentRole: string
}

export interface ProfileData {
  profileType: ProfileType
  id: number
  name: string
  phone: string
  email: string
  address?: string
  postalCode?: string
  bio?: string
  // USER 전용 필드
  nickname?: string
  avatarUrl?: string
  profileVisibility?: ProfileVisibility
  // 프로필 생성 시에만 포함
  tokenInfo?: TokenInfo
}

export interface GetProfileResponse {
  success: boolean
  data: ProfileData | null
  errorCode: string | null
  message: string | null
}

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
 * 프로필 조회 (통합)
 * USER와 COMPANY 프로필을 자동으로 판단하여 반환
 */
export const getProfile = async (): Promise<GetProfileResponse> => {
  const response = await axiosInstance.get<GetProfileResponse>('/profile')
  return response.data
}

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
