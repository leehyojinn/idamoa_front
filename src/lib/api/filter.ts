import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'
import type {
  FilterCategory,
  FilterOption,
  FilterCategoryCreateRequest,
  FilterCategoryUpdateRequest,
  FilterOptionCreateRequest,
  FilterOptionUpdateRequest,
} from '@/types/filter'

interface PageResponse<T> {
  content: T[]
  pageable: {
    pageNumber: number
    pageSize: number
  }
  totalElements: number
  totalPages: number
}

// ========== 필터 카테고리 API ==========

// 카테고리 목록 조회
export async function getFilterCategories(params?: {
  entityType?: string
  isActive?: boolean
  page?: number
  size?: number
}): Promise<PageResponse<FilterCategory>> {
  const response = await axiosInstance.get<ApiResponse<PageResponse<FilterCategory>>>(
    '/admin/filters/categories',
    { params }
  )
  return response.data.data
}

// 카테고리 상세 조회
export async function getFilterCategory(categoryId: number): Promise<FilterCategory> {
  const response = await axiosInstance.get<ApiResponse<FilterCategory>>(
    `/admin/filters/categories/${categoryId}`
  )
  return response.data.data
}

// 카테고리 생성
export async function createFilterCategory(
  data: FilterCategoryCreateRequest
): Promise<FilterCategory> {
  const response = await axiosInstance.post<ApiResponse<FilterCategory>>(
    '/admin/filters/categories',
    data
  )
  return response.data.data
}

// 카테고리 수정
export async function updateFilterCategory(
  categoryId: number,
  data: FilterCategoryUpdateRequest
): Promise<FilterCategory> {
  const response = await axiosInstance.put<ApiResponse<FilterCategory>>(
    `/admin/filters/categories/${categoryId}`,
    data
  )
  return response.data.data
}

// 카테고리 삭제
export async function deleteFilterCategory(categoryId: number): Promise<void> {
  await axiosInstance.delete(`/admin/filters/categories/${categoryId}`)
}

// 카테고리 활성화/비활성화
export async function updateFilterCategoryActive(
  categoryId: number,
  isActive: boolean
): Promise<FilterCategory> {
  const response = await axiosInstance.patch<ApiResponse<FilterCategory>>(
    `/admin/filters/categories/${categoryId}/active`,
    null,
    { params: { isActive } }
  )
  return response.data.data
}

// ========== 필터 옵션 API ==========

// 옵션 목록 조회
export async function getFilterOptions(params?: {
  categoryId?: number
  isActive?: boolean
  parentId?: number
  page?: number
  size?: number
}): Promise<PageResponse<FilterOption>> {
  const response = await axiosInstance.get<ApiResponse<PageResponse<FilterOption>>>(
    `/admin/filters/options`,
    { params }
  )
  return response.data.data
}

// 옵션 상세 조회
export async function getFilterOption(optionId: number): Promise<FilterOption> {
  const response = await axiosInstance.get<ApiResponse<FilterOption>>(
    `/admin/filters/options/${optionId}`
  )
  return response.data.data
}

// 옵션 생성
export async function createFilterOption(
  data: FilterOptionCreateRequest & { categoryId: number }
): Promise<FilterOption> {
  const response = await axiosInstance.post<ApiResponse<FilterOption>>(
    `/admin/filters/options`,
    data
  )
  return response.data.data
}

// 옵션 수정
export async function updateFilterOption(
  optionId: number,
  data: FilterOptionUpdateRequest
): Promise<FilterOption> {
  const response = await axiosInstance.put<ApiResponse<FilterOption>>(
    `/admin/filters/options/${optionId}`,
    data
  )
  return response.data.data
}

// 옵션 삭제
export async function deleteFilterOption(optionId: number): Promise<void> {
  await axiosInstance.delete(`/admin/filters/options/${optionId}`)
}

// 옵션 활성화/비활성화
export async function updateFilterOptionActive(
  optionId: number,
  isActive: boolean
): Promise<FilterOption> {
  const response = await axiosInstance.patch<ApiResponse<FilterOption>>(
    `/admin/filters/options/${optionId}/active`,
    null,
    { params: { isActive } }
  )
  return response.data.data
}
