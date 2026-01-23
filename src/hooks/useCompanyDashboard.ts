/**
 * 업체 대시보드용 React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// API imports
import { getMyCompany } from '@/lib/api/company'
import { getMyPortfolios } from '@/lib/api/portfolio'
import { getMyProposals } from '@/lib/api/proposal'
import { getCompanyReviews } from '@/lib/api/review'
import { getCompanyConsultations } from '@/lib/api/consultation'
import { getCompanyPortfolioConsultations } from '@/lib/api/portfolio-consultation'
import type { PortfolioConsultationStatus } from '@/types/portfolio-consultation'
import { getCreditBalance } from '@/lib/api/credit'
import { getTotalUnreadCount as getChatUnreadCount } from '@/lib/api/directChat'
import { getUnreadCount as getNotificationUnreadCount } from '@/lib/api/notification'
import {
  getMyAdCampaign,
  getAdCampaignHistory,
  createAdCampaign,
  setAutoRenew,
  cancelAdCampaign,
  type CreateAdCampaignRequest,
} from '@/lib/api/ad-campaign'

// ========================================
// 업체 정보
// ========================================

export function useMyCompanyDashboard() {
  return useQuery({
    queryKey: ['companies', 'my', 'dashboard'],
    queryFn: getMyCompany,
    staleTime: 5 * 60 * 1000, // 5분
  })
}

// ========================================
// 포트폴리오
// ========================================

export function useMyPortfoliosDashboard(page = 0, size = 5) {
  return useQuery({
    queryKey: ['portfolios', 'my', 'dashboard', page, size],
    queryFn: () => getMyPortfolios({ page, size }),
    staleTime: 5 * 60 * 1000,
  })
}

// ========================================
// 제안
// ========================================

export function useMyProposalsDashboard(page = 0, size = 5) {
  return useQuery({
    queryKey: ['proposals', 'my', 'dashboard', page, size],
    queryFn: () => getMyProposals(page, size),
    staleTime: 5 * 60 * 1000,
  })
}

// ========================================
// 상담
// ========================================

export function useCompanyConsultationsDashboard(
  companyUuid: string,
  status?: 'SUBMITTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
  page = 0,
  size = 5
) {
  return useQuery({
    queryKey: ['consultations', 'company', companyUuid, status, page, size],
    queryFn: () => getCompanyConsultations(companyUuid, { status, page, size }),
    enabled: !!companyUuid,
    staleTime: 2 * 60 * 1000, // 2분
  })
}

// ========================================
// 포트폴리오 견적상담
// ========================================

export function useCompanyPortfolioConsultationsDashboard(
  companyUuid: string,
  status?: PortfolioConsultationStatus,
  page = 0,
  size = 5
) {
  return useQuery({
    queryKey: ['portfolioConsultations', 'company', companyUuid, status, page, size],
    queryFn: () => getCompanyPortfolioConsultations(companyUuid, { status, page, size }),
    enabled: !!companyUuid,
    staleTime: 2 * 60 * 1000, // 2분
  })
}

// ========================================
// 리뷰
// ========================================

export function useCompanyReviewsDashboard(companyUuid: string, page = 0, size = 5) {
  return useQuery({
    queryKey: ['reviews', 'company', companyUuid, page, size],
    queryFn: () => getCompanyReviews(companyUuid, page, size),
    enabled: !!companyUuid,
    staleTime: 5 * 60 * 1000,
  })
}

// ========================================
// 광고 캠페인
// ========================================

export function useMyAdCampaign() {
  return useQuery({
    queryKey: ['adCampaigns', 'my'],
    queryFn: getMyAdCampaign,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAdCampaignHistory(page = 0, size = 20) {
  return useQuery({
    queryKey: ['adCampaigns', 'history', page, size],
    queryFn: () => getAdCampaignHistory(page, size),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateAdCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAdCampaignRequest) => createAdCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adCampaigns'] })
      queryClient.invalidateQueries({ queryKey: ['credits', 'balance'] })
    },
  })
}

export function useSetAutoRenew() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ campaignUuid, autoRenew }: { campaignUuid: string; autoRenew: boolean }) =>
      setAutoRenew(campaignUuid, autoRenew),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adCampaigns'] })
    },
  })
}

export function useCancelAdCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (campaignUuid: string) => cancelAdCampaign(campaignUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adCampaigns'] })
    },
  })
}

// ========================================
// 크레딧
// ========================================

export function useCreditBalanceDashboard() {
  return useQuery({
    queryKey: ['credits', 'balance', 'dashboard'],
    queryFn: getCreditBalance,
    staleTime: 2 * 60 * 1000,
  })
}

// ========================================
// 알림
// ========================================

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: getNotificationUnreadCount,
    staleTime: 30 * 1000, // 30초
    refetchInterval: 60 * 1000, // 1분마다 갱신
  })
}

// ========================================
// 채팅
// ========================================

export function useUnreadChatCount() {
  return useQuery({
    queryKey: ['directChat', 'unreadCount'],
    queryFn: getChatUnreadCount,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}
