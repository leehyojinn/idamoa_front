import axiosInstance from '@/lib/axios'

/**
 * 관리자 대시보드 API
 */

// ===== 타입 정의 =====

/**
 * 전체 요약 통계
 */
export interface DashboardOverview {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  newUsersThisMonth: number
  totalCompanies: number
  activeCompanies: number
  totalEstimateRequests: number
  estimateRequestsInProgress: number
  totalProposals: number
  proposalSelectionRate: number
  pendingConsultations: number
  pendingPlannerApplications: number
  totalInquiries: number
}

/**
 * 회원 상세 통계
 */
export interface UserStats {
  total: number
  newToday: number
  newThisMonth: number
  byStatus: Record<string, number>
  byRole: Record<string, number>
  verification: {
    emailVerified: number
    phoneVerified: number
    identityVerified: number
  }
  marketingAgreed: number
}

/**
 * 업체 상세 통계
 */
export interface CompanyStats {
  total: number
  newToday: number
  newThisMonth: number
  byStatus: Record<string, number>
  verified: number
  premium: number
  byPremiumTier: Record<string, number>
  averageRating: number
  totalReviews: number
}

/**
 * 견적요청 상세 통계
 */
export interface EstimateStats {
  total: number
  newToday: number
  newThisMonth: number
  byStatus: Record<string, number>
  publicRequests: number
  averageProposalsPerRequest: number
  totalViews: number
}

/**
 * 제안서 상세 통계
 */
export interface ProposalStats {
  total: number
  newToday: number
  newThisMonth: number
  byStatus: Record<string, number>
  selectionRate: number
  averagePrice: number
}

/**
 * 빠른상담 상세 통계
 */
export interface ConsultationStats {
  total: number
  newToday: number
  newThisMonth: number
  byStatus: Record<string, number>
  memberVsNonMember: {
    member: number
    nonMember: number
  }
  assigned: number
}

/**
 * 플래너 신청 상세 통계
 */
export interface PlannerApplicationStats {
  total: number
  newToday: number
  newThisMonth: number
  byStatus: Record<string, number>
}

/**
 * 문의 상세 통계
 */
export interface InquiryStats {
  total: number
  newToday: number
  newThisMonth: number
  byStatus: Record<string, number>
  byType: Record<string, number>
}

// API Response 타입
interface ApiResponse<T> {
  success: boolean
  data: T
  errorCode: string | null
  message: string | null
}

// ===== API 함수들 =====

/**
 * 전체 요약 통계 조회
 */
export const getDashboardOverview = async (): Promise<ApiResponse<DashboardOverview>> => {
  const response = await axiosInstance.get('/admin/dashboard/overview')
  return response.data
}

/**
 * 회원 상세 통계 조회
 */
export const getUserStats = async (): Promise<ApiResponse<UserStats>> => {
  const response = await axiosInstance.get('/admin/dashboard/users')
  return response.data
}

/**
 * 업체 상세 통계 조회
 */
export const getCompanyStats = async (): Promise<ApiResponse<CompanyStats>> => {
  const response = await axiosInstance.get('/admin/dashboard/companies')
  return response.data
}

/**
 * 견적요청 상세 통계 조회
 */
export const getEstimateStats = async (): Promise<ApiResponse<EstimateStats>> => {
  const response = await axiosInstance.get('/admin/dashboard/estimates')
  return response.data
}

/**
 * 제안서 상세 통계 조회
 */
export const getProposalStats = async (): Promise<ApiResponse<ProposalStats>> => {
  const response = await axiosInstance.get('/admin/dashboard/proposals')
  return response.data
}

/**
 * 빠른상담 상세 통계 조회
 */
export const getConsultationStats = async (): Promise<ApiResponse<ConsultationStats>> => {
  const response = await axiosInstance.get('/admin/dashboard/consultations')
  return response.data
}

/**
 * 플래너 신청 상세 통계 조회
 */
export const getPlannerApplicationStats = async (): Promise<ApiResponse<PlannerApplicationStats>> => {
  const response = await axiosInstance.get('/admin/dashboard/planner-applications')
  return response.data
}

/**
 * 문의 상세 통계 조회
 */
export const getInquiryStats = async (): Promise<ApiResponse<InquiryStats>> => {
  const response = await axiosInstance.get('/admin/dashboard/inquiries')
  return response.data
}
