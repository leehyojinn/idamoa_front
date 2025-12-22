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
  keyword?: string
  sort?: string  // 예: 'displayOrder,asc' 또는 'createdAt,desc'
  page?: number
  size?: number
}): Promise<PageResponse<FilterCategory>> {
  console.log('[getFilterCategories] params:', params)
  const response = await axiosInstance.get<ApiResponse<PageResponse<FilterCategory>>>(
    '/admin/filters/categories',
    { params }
  )
  console.log('[getFilterCategories] response:', response.data)
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

// ========== 공개 필터 API ==========

export interface PublicFilterCategory {
  id: number
  uuid: string
  code: string
  name: string
  filterType: 'SINGLE_SELECT' | 'MULTI_SELECT' | 'HIERARCHICAL'
  description?: string
  displayOrder: number
  isRequired: boolean
  options: PublicFilterOption[]
}

export interface PublicFilterOption {
  id: number
  uuid: string
  code: string
  name: string
  description?: string
  displayOrder: number
  icon?: string
  color?: string
  isActive?: boolean
  isDeleted?: boolean
  usageCount?: number
  parentId?: number | null
  children?: PublicFilterOption[]
}

// 모든 활성 필터 카테고리 조회 (인증 불필요)
export async function getPublicFilters(entityType?: string): Promise<PublicFilterCategory[]> {
  const params: Record<string, string> = {}
  if (entityType) {
    params.entityType = entityType
  }

  const response = await axiosInstance.get<ApiResponse<PublicFilterCategory[]>>('/filters', {
    params: Object.keys(params).length > 0 ? params : undefined
  })

  // entityType이 지정된 경우 프론트엔드에서 필터링
  let filteredData = response.data.data
  if (entityType) {
    filteredData = response.data.data.filter((filter: any) => filter.entityType === entityType)
  }

  return filteredData
}

// 필수 필터 카테고리 조회 (인증 불필요)
export async function getRequiredFilters(entityType?: string): Promise<PublicFilterCategory[]> {
  const response = await axiosInstance.get<ApiResponse<PublicFilterCategory[]>>('/filters/required', {
    params: entityType ? { entityType } : undefined
  })
  return response.data.data
}

// 특정 필터 카테고리 조회 (인증 불필요)
export async function getPublicFilterByCode(categoryCode: string): Promise<PublicFilterCategory> {
  const response = await axiosInstance.get<ApiResponse<PublicFilterCategory>>(`/filters/${categoryCode}`)
  return response.data.data
}

// 필터 카테고리의 옵션만 조회 (인증 불필요)
export async function getPublicFilterOptions(categoryCode: string): Promise<PublicFilterOption[]> {
  const response = await axiosInstance.get<ApiResponse<PublicFilterOption[]>>(`/filters/${categoryCode}/options`)
  return response.data.data
}

// ========== 필터 옵션 마이그레이션 API ==========

// 마이그레이션용 전체 옵션 정보
export interface MigrationFilterOption {
  id: number
  code: string
  name: string
  shortName: string
  categoryId: number
  categoryCode: string
  categoryName: string
  depth: number
  path: string
  displayOrder: number
  isActive: boolean
  isDefault: boolean
  usageCount: number
  childrenCount: number
}

// 마이그레이션 미리보기 요청
export interface MigrationPreviewRequest {
  sourceOptionId: number
  targetOptionId: number
  deactivateSource?: boolean
  deleteSource?: boolean
}

// 마이그레이션 실행 요청
export interface MigrationExecuteRequest {
  sourceOptionId: number
  targetOptionId: number
  deactivateSource?: boolean
  deleteSource?: boolean
}

// 옵션 정보 (미리보기/결과용)
export interface MigrationOptionInfo {
  id: number
  code: string
  name: string
  categoryCode: string
  categoryName: string
  usageCount: number
}

// 영향받는 업체 정보
export interface AffectedCompanyInfo {
  id: number
  name: string
  hasDuplicate: boolean
}

// 마이그레이션 미리보기 응답
export interface MigrationPreviewResponse {
  sourceOption: MigrationOptionInfo
  targetOption: MigrationOptionInfo
  affectedCompanyCount: number
  affectedBoardCount: number
  duplicateCompanyCount: number
  duplicateBoardCount: number
  affectedCompanySamples: AffectedCompanyInfo[]
}

// 마이그레이션 결과 응답
export interface MigrationResultResponse {
  sourceOptionCode: string
  sourceOptionName: string
  targetOptionCode: string
  targetOptionName: string
  migratedCompanyCount: number
  migratedBoardCount: number
  skippedCompanyCount: number
  skippedBoardCount: number
  sourceDeactivated: boolean
  sourceDeleted: boolean
  completedAt: string
  processingTimeMs: number
}

// 마이그레이션용 전체 옵션 목록 조회
export async function getAllFilterOptionsForMigration(): Promise<MigrationFilterOption[]> {
  const response = await axiosInstance.get<ApiResponse<MigrationFilterOption[]>>(
    '/admin/filters/options/all'
  )
  return response.data.data
}

// 마이그레이션 미리보기
export async function previewFilterMigration(
  data: MigrationPreviewRequest
): Promise<MigrationPreviewResponse> {
  const response = await axiosInstance.post<ApiResponse<MigrationPreviewResponse>>(
    '/admin/filters/options/migrate/preview',
    data
  )
  return response.data.data
}

// 마이그레이션 실행
export async function executeFilterMigration(
  data: MigrationExecuteRequest
): Promise<MigrationResultResponse> {
  const response = await axiosInstance.post<ApiResponse<MigrationResultResponse>>(
    '/admin/filters/options/migrate',
    data
  )
  return response.data.data
}
