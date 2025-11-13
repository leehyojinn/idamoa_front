/**
 * Company API React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCompany,
  getMyCompany,
  updateCompany,
  getCompanyByUuid,
  type CompanyRegistrationData,
  type CompanyResponse,
} from '@/lib/api/company'
import type { ApiResponse } from '@/types/api'

// ========================================
// Query Keys
// ========================================

export const companyKeys = {
  all: ['companies'] as const,
  my: () => [...companyKeys.all, 'my'] as const,
  detail: (uuid: string) => [...companyKeys.all, 'detail', uuid] as const,
}

// ========================================
// Queries
// ========================================

/**
 * 내 회사 정보 조회
 */
export const useMyCompany = () => {
  return useQuery({
    queryKey: companyKeys.my(),
    queryFn: getMyCompany,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5분
  })
}

/**
 * 특정 회사 정보 조회 (UUID로)
 */
export const useCompanyByUuid = (companyUuid: string) => {
  return useQuery({
    queryKey: companyKeys.detail(companyUuid),
    queryFn: () => getCompanyByUuid(companyUuid),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5분
    enabled: !!companyUuid,
  })
}

// ========================================
// Mutations
// ========================================

/**
 * 회사 등록
 */
export const useCreateCompany = () => {
  const queryClient = useQueryClient()

  return useMutation<
    ApiResponse<CompanyResponse>,
    Error,
    CompanyRegistrationData
  >({
    mutationFn: createCompany,
    onSuccess: () => {
      // 내 회사 정보 쿼리 무효화 및 재조회
      queryClient.invalidateQueries({ queryKey: companyKeys.my() })
    },
  })
}

/**
 * 회사 정보 수정
 */
export const useUpdateCompany = (companyUuid: string) => {
  const queryClient = useQueryClient()

  return useMutation<
    ApiResponse<CompanyResponse>,
    Error,
    Partial<CompanyRegistrationData>
  >({
    mutationFn: (data) => updateCompany(companyUuid, data),
    onSuccess: () => {
      // 내 회사 정보 및 해당 회사 상세 정보 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: companyKeys.my() })
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(companyUuid) })
    },
  })
}
