/**
 * Profile API React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getProfileStatus,
  createUserProfile,
  createCompanyProfile,
  type ProfileStatusResponse,
  type CreateUserProfileRequest,
  type CreateUserProfileResponse,
  type CreateCompanyProfileRequest,
  type CreateCompanyProfileResponse,
} from '@/lib/api/profile'

// ========================================
// Query Keys
// ========================================

export const profileKeys = {
  all: ['profile'] as const,
  status: () => [...profileKeys.all, 'status'] as const,
}

// ========================================
// Queries
// ========================================

/**
 * 프로필 상태 확인
 */
export const useProfileStatus = () => {
  return useQuery<ProfileStatusResponse, Error>({
    queryKey: profileKeys.status(),
    queryFn: getProfileStatus,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5분
  })
}

// ========================================
// Mutations
// ========================================

/**
 * USER 프로필 생성
 */
export const useCreateUserProfile = () => {
  const queryClient = useQueryClient()

  return useMutation<
    CreateUserProfileResponse,
    Error,
    CreateUserProfileRequest
  >({
    mutationFn: createUserProfile,
    onSuccess: () => {
      // 프로필 상태 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: profileKeys.status() })
    },
  })
}

/**
 * COMPANY 프로필 생성
 */
export const useCreateCompanyProfile = () => {
  const queryClient = useQueryClient()

  return useMutation<
    CreateCompanyProfileResponse,
    Error,
    CreateCompanyProfileRequest
  >({
    mutationFn: createCompanyProfile,
    onSuccess: () => {
      // 프로필 상태 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: profileKeys.status() })
    },
  })
}
