/**
 * Partnership API React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getActivePartnerships,
  createPartnershipInquiry,
  adminCreateCompanyPartnership,
  adminGetCompanyPartnerships,
  adminGetCompanyPartnership,
  adminUpdateCompanyPartnership,
  adminCancelCompanyPartnership,
  adminDeleteCompanyPartnership,
  adminReorderCompanyPartnerships,
  adminGetCompanyPartnershipHistory,
  adminGetPartnershipInquiries,
  adminGetPartnershipInquiry,
  adminChangePartnershipInquiryStatus,
  adminDeletePartnershipInquiry,
  type AdminCompanyPartnershipsParams,
  type AdminPartnershipInquiriesParams,
} from '@/lib/api/partnership'
import type {
  CompanyPartnershipCreateRequest,
  CompanyPartnershipUpdateRequest,
  CompanyPartnershipReorderRequest,
  PartnershipInquiryCreateRequest,
  PartnershipStatus,
} from '@/types/partnership'

// ===== Query Keys =====

export const partnershipKeys = {
  all: ['partnerships'] as const,
  active: () => [...partnershipKeys.all, 'active'] as const,
  admin: {
    all: ['admin', 'partnerships'] as const,
    list: (params?: AdminCompanyPartnershipsParams) =>
      [...partnershipKeys.admin.all, 'list', params] as const,
    detail: (uuid: string) => [...partnershipKeys.admin.all, 'detail', uuid] as const,
    history: (companyUuid: string) =>
      [...partnershipKeys.admin.all, 'history', companyUuid] as const,
  },
  inquiries: {
    all: ['partnership-inquiries'] as const,
    admin: {
      list: (params?: AdminPartnershipInquiriesParams) =>
        [...partnershipKeys.inquiries.all, 'admin', 'list', params] as const,
      detail: (uuid: string) =>
        [...partnershipKeys.inquiries.all, 'admin', 'detail', uuid] as const,
    },
  },
}

// ===== Public Hooks =====

/**
 * 활성 제휴업체 목록 조회
 */
export const useActivePartnerships = () => {
  return useQuery({
    queryKey: partnershipKeys.active(),
    queryFn: async () => {
      const response = await getActivePartnerships()
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5분
  })
}

/**
 * 제휴/광고 문의 생성
 */
export const useCreatePartnershipInquiry = () => {
  return useMutation({
    mutationFn: (data: PartnershipInquiryCreateRequest) => createPartnershipInquiry(data),
  })
}

// ===== Admin Company Partnership Hooks =====

/**
 * [관리자] 제휴업체 목록 조회
 */
export const useAdminCompanyPartnerships = (params?: AdminCompanyPartnershipsParams) => {
  return useQuery({
    queryKey: partnershipKeys.admin.list(params),
    queryFn: async () => {
      const response = await adminGetCompanyPartnerships(params || {})
      return response.data
    },
  })
}

/**
 * [관리자] 제휴업체 상세 조회
 */
export const useAdminCompanyPartnership = (uuid: string) => {
  return useQuery({
    queryKey: partnershipKeys.admin.detail(uuid),
    queryFn: async () => {
      const response = await adminGetCompanyPartnership(uuid)
      return response.data
    },
    enabled: !!uuid,
  })
}

/**
 * [관리자] 특정 업체 제휴 이력 조회
 */
export const useAdminCompanyPartnershipHistory = (companyUuid: string) => {
  return useQuery({
    queryKey: partnershipKeys.admin.history(companyUuid),
    queryFn: async () => {
      const response = await adminGetCompanyPartnershipHistory(companyUuid)
      return response.data
    },
    enabled: !!companyUuid,
  })
}

/**
 * [관리자] 제휴업체 등록
 */
export const useAdminCreateCompanyPartnership = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CompanyPartnershipCreateRequest) => adminCreateCompanyPartnership(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnershipKeys.admin.all })
      queryClient.invalidateQueries({ queryKey: partnershipKeys.active() })
    },
  })
}

/**
 * [관리자] 제휴업체 수정
 */
export const useAdminUpdateCompanyPartnership = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: CompanyPartnershipUpdateRequest }) =>
      adminUpdateCompanyPartnership(uuid, data),
    onSuccess: (_, { uuid }) => {
      queryClient.invalidateQueries({ queryKey: partnershipKeys.admin.all })
      queryClient.invalidateQueries({ queryKey: partnershipKeys.admin.detail(uuid) })
      queryClient.invalidateQueries({ queryKey: partnershipKeys.active() })
    },
  })
}

/**
 * [관리자] 제휴 취소
 */
export const useAdminCancelCompanyPartnership = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uuid: string) => adminCancelCompanyPartnership(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnershipKeys.admin.all })
      queryClient.invalidateQueries({ queryKey: partnershipKeys.active() })
    },
  })
}

/**
 * [관리자] 제휴 삭제
 */
export const useAdminDeleteCompanyPartnership = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uuid: string) => adminDeleteCompanyPartnership(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnershipKeys.admin.all })
      queryClient.invalidateQueries({ queryKey: partnershipKeys.active() })
    },
  })
}

/**
 * [관리자] 제휴 순서 일괄 변경
 */
export const useAdminReorderCompanyPartnerships = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CompanyPartnershipReorderRequest) => adminReorderCompanyPartnerships(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnershipKeys.admin.all })
      queryClient.invalidateQueries({ queryKey: partnershipKeys.active() })
    },
  })
}

// ===== Admin Partnership Inquiry Hooks =====

/**
 * [관리자] 제휴/광고 문의 목록 조회
 */
export const useAdminPartnershipInquiries = (params?: AdminPartnershipInquiriesParams) => {
  return useQuery({
    queryKey: partnershipKeys.inquiries.admin.list(params),
    queryFn: async () => {
      const response = await adminGetPartnershipInquiries(params || {})
      return response.data
    },
  })
}

/**
 * [관리자] 제휴/광고 문의 상세 조회
 */
export const useAdminPartnershipInquiry = (inquiryUuid: string) => {
  return useQuery({
    queryKey: partnershipKeys.inquiries.admin.detail(inquiryUuid),
    queryFn: async () => {
      const response = await adminGetPartnershipInquiry(inquiryUuid)
      return response.data
    },
    enabled: !!inquiryUuid,
  })
}

/**
 * [관리자] 제휴/광고 문의 상태 변경
 */
export const useAdminChangePartnershipInquiryStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ inquiryUuid, status }: { inquiryUuid: string; status: PartnershipStatus }) =>
      adminChangePartnershipInquiryStatus(inquiryUuid, status),
    onSuccess: (_, { inquiryUuid }) => {
      queryClient.invalidateQueries({ queryKey: partnershipKeys.inquiries.admin.list() })
      queryClient.invalidateQueries({
        queryKey: partnershipKeys.inquiries.admin.detail(inquiryUuid),
      })
    },
  })
}

/**
 * [관리자] 제휴/광고 문의 삭제
 */
export const useAdminDeletePartnershipInquiry = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (inquiryUuid: string) => adminDeletePartnershipInquiry(inquiryUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnershipKeys.inquiries.admin.list() })
    },
  })
}
