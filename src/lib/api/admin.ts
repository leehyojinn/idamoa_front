import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'

/**
 * 관리자 배정 관련 API
 */

// 플래너 신청에 관리자 배정
export async function assignPlannerAdmin(applicationUuid: string, adminId: number): Promise<ApiResponse<null>> {
  const response = await axiosInstance.patch<ApiResponse<null>>(
    `/admin/planner-applications/${applicationUuid}/assign`,
    { adminId }
  )
  return response.data
}

// 빠른상담에 업체 배정
export async function assignConsultationToCompany(
  consultationUuid: string,
  companyUuid: string
): Promise<ApiResponse<null>> {
  const response = await axiosInstance.put<ApiResponse<null>>(
    `/admin/consultations/${consultationUuid}/assign/${companyUuid}`
  )
  return response.data
}

// 관리자 사용자 목록 조회
interface AdminUser {
  id: number
  uuid: string
  email: string
  name: string
  roles: string[]
  status: string
}

interface PageResponse<T> {
  content: T[]
  pageable: {
    pageNumber: number
    pageSize: number
  }
  totalElements: number
  totalPages: number
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const response = await axiosInstance.get<ApiResponse<PageResponse<AdminUser>>>('/admin/users', {
    params: { role: 'ADMIN', status: 'ACTIVE', size: 100 },
  })
  return response.data.data.content
}

// 업체 검색
interface Company {
  uuid: string
  name: string
  slug: string
  description: string
  primaryPhone: string
  email: string
  address: string
  isActive: boolean
  featured: boolean
  averageRating: number
  totalReviews: number
}

export async function getCompanies(keyword?: string): Promise<Company[]> {
  const params: Record<string, string> = {
    sortBy: 'LATEST',
    size: '100',
  }
  if (keyword) {
    params.keyword = keyword
  }
  const response = await axiosInstance.get<ApiResponse<PageResponse<Company>>>('/companies/search', { params })
  return response.data.data.content
}
