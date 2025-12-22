import axiosInstance from '@/lib/axios'

// ==================== Types ====================

export interface FileInfo {
  uuid: string
  originalFilename: string
  fileUrl: string
  fileSize: number
  mimeType: string
  fileExtension: string
  thumbnailUrl?: string
}

export interface FilterOptionInfo {
  id: number
  filterKey: string
  value: string
  displayName: string
}

export interface CompanySummary {
  uuid?: string
  companyUuid?: string
  companyName: string
  slug?: string
  phone?: string
  logoUrl?: string
  address?: string
  contactPhone?: string
  contactEmail?: string
  averageRating?: number
  reviewCount?: number
}

export interface PromotionInfo {
  promotionUuid: string
  promotionType: 'STANDARD' | 'PREMIUM'
  monthlyPrice: number
  weight: number
  startDate: string
  endDate: string
  remainingDays: number
  autoRenew: boolean
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
}

export interface ReviewSummary {
  reviewUuid: string
  userName: string
  rating: number
  content: string
  createdAt: string
  reply?: string
  repliedAt?: string
  images?: FileInfo[]
}

export interface Portfolio {
  uuid: string
  title: string
  description?: string
  content?: string
  category?: string
  projectType?: string
  projectScale?: string
  projectDuration?: number
  projectDate?: string
  budgetRange?: string
  actualCost?: number
  images: FileInfo[]
  videos?: FileInfo[]
  thumbnailUrl?: string
  tags?: string[]
  relatedLink?: string
  copyrightOwner?: string
  copyrightLicense?: string
  copyrightAttribution?: string
  viewCount: number
  likeCount: number
  commentCount: number
  bookmarkCount: number
  isFeatured: boolean
  isPublic: boolean
  displayOrder?: number
  isBookmarked: boolean
  isLiked: boolean
  createdAt: string
  updatedAt: string
  filterOptions?: FilterOptionInfo[]
  company?: CompanySummary
  promotion?: PromotionInfo
  reviews?: ReviewSummary[]
}

export interface PortfolioListItem {
  uuid: string
  title: string
  description?: string
  content?: string
  category?: string
  thumbnailUrl?: string
  images: FileInfo[]
  videos?: FileInfo[]
  tags?: string[]
  viewCount: number
  likeCount: number
  commentCount?: number
  bookmarkCount?: number
  isBookmarked: boolean
  isLiked: boolean
  createdAt: string
  updatedAt?: string
  filterOptions?: FilterOptionInfo[]
  company?: CompanySummary
  promotion?: PromotionInfo
}

export interface PortfolioCreateRequest {
  title: string
  description?: string
  content?: string
  category?: string
  projectType?: string
  projectScale?: string
  projectDuration?: number
  projectDate?: string
  budgetRange?: string
  actualCost?: number
  imageUuids: string[]
  videoUuids?: string[]
  thumbnailUuid?: string
  tags?: string[]
  relatedLink?: string
  copyrightOwner?: string
  copyrightLicense?: string
  copyrightAttribution?: string
  isPublic?: boolean
  displayOrder?: number
  filterOptionIds?: number[]
  promotionType?: string
  promotionMonths?: number
  autoRenew?: boolean
}

export interface PortfolioUpdateRequest {
  title?: string
  description?: string
  content?: string
  category?: string
  projectType?: string
  projectScale?: string
  projectDuration?: number
  projectDate?: string
  budgetRange?: string
  actualCost?: number
  imageUuids?: string[]
  videoUuids?: string[]
  thumbnailUuid?: string
  tags?: string[]
  relatedLink?: string
  copyrightOwner?: string
  copyrightLicense?: string
  copyrightAttribution?: string
  isPublic?: boolean
  displayOrder?: number
  filterOptionIds?: number[]
  promotionType?: string
  promotionMonths?: number
  autoRenew?: boolean
  cancelPromotion?: boolean
}

export interface PortfolioSearchParams {
  keyword?: string
  filterOptionIds?: number[]
  companyUuid?: string
  onlyBookmarked?: boolean
  onlyMyPosts?: boolean
  page?: number
  size?: number
  sort?: string
}

export interface PortfolioSearchResponse {
  content: PortfolioListItem[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export interface PromotionTypeSetting {
  uuid: string
  promotionType: string
  displayName: string
  price: number
  weight: number
  displayOrder: number
  isActive: boolean
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface PromotionPrice {
  promotionType: string
  displayName: string
  monthlyPrice: number
  weight: number
  description?: string
}

export interface PortfolioPromotion {
  uuid: string
  portfolioUuid: string
  portfolioTitle: string
  promotionType: string
  weight: number
  monthlyPrice: number
  startDate: string
  endDate: string
  autoRenew: boolean
  status: string
  createdAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// ==================== 사용자 API ====================

/**
 * 포트폴리오 생성
 */
export async function createPortfolio(data: PortfolioCreateRequest): Promise<ApiResponse<Portfolio>> {
  try {
    const response = await axiosInstance.post('/portfolios', data)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('포트폴리오 생성 실패:', error)
    throw error
  }
}

/**
 * 포트폴리오 상세 조회
 */
export async function getPortfolio(uuid: string): Promise<ApiResponse<Portfolio>> {
  try {
    const response = await axiosInstance.get(`/portfolios/${uuid}`)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('포트폴리오 조회 실패:', error)
    throw error
  }
}

/**
 * 포트폴리오 검색
 */
export async function searchPortfolios(params: PortfolioSearchParams = {}): Promise<ApiResponse<PortfolioSearchResponse>> {
  try {
    const queryParams = new URLSearchParams()

    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())
    if (params.keyword) queryParams.append('keyword', params.keyword)

    // filterOptionIds
    if (params.filterOptionIds && params.filterOptionIds.length > 0) {
      params.filterOptionIds.forEach(id => queryParams.append('filterOptionIds', id.toString()))
    }

    // companyUuid
    if (params.companyUuid) queryParams.append('companyUuid', params.companyUuid)

    // sort
    if (params.sort) queryParams.append('sort', params.sort)

    if (params.onlyBookmarked) queryParams.append('onlyBookmarked', 'true')
    if (params.onlyMyPosts) queryParams.append('onlyMyPosts', 'true')

    const url = `/portfolios/search?${queryParams.toString()}`
    const response = await axiosInstance.get(url)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    throw error
  }
}

/**
 * 업체별 포트폴리오 조회
 */
export async function getPortfoliosByCompany(
  companyUuid: string,
  params?: { page?: number; size?: number; sort?: string }
): Promise<ApiResponse<PortfolioSearchResponse>> {
  try {
    const response = await axiosInstance.get(`/portfolios/company/${companyUuid}`, { params })
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('업체 포트폴리오 조회 실패:', error)
    throw error
  }
}

/**
 * 내 포트폴리오 목록
 */
export async function getMyPortfolios(
  params?: { page?: number; size?: number; sort?: string; promotedOnly?: boolean }
): Promise<ApiResponse<PortfolioSearchResponse>> {
  try {
    const response = await axiosInstance.get('/portfolios/my', { params })
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('내 포트폴리오 조회 실패:', error)
    throw error
  }
}

/**
 * 포트폴리오 수정
 */
export async function updatePortfolio(uuid: string, data: PortfolioUpdateRequest): Promise<ApiResponse<Portfolio>> {
  try {
    const response = await axiosInstance.put(`/portfolios/${uuid}`, data)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('포트폴리오 수정 실패:', error)
    throw error
  }
}

/**
 * 포트폴리오 삭제
 */
export async function deletePortfolio(uuid: string): Promise<ApiResponse<void>> {
  try {
    await axiosInstance.delete(`/portfolios/${uuid}`)
    return { success: true }
  } catch (error: any) {
    console.error('포트폴리오 삭제 실패:', error)
    throw error
  }
}

/**
 * 우대 포트폴리오 조회
 */
export async function getFeaturedPortfolios(params?: {
  filterOptionIds?: number[]
  count?: number
}): Promise<ApiResponse<PortfolioListItem[]>> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.count) queryParams.append('count', params.count.toString())
    if (params?.filterOptionIds && params.filterOptionIds.length > 0) {
      params.filterOptionIds.forEach(id => queryParams.append('filterOptionIds', id.toString()))
    }

    const url = `/portfolios/featured${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await axiosInstance.get(url)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('우대 포트폴리오 조회 실패:', error)
    throw error
  }
}

/**
 * 북마크 토글
 */
export async function toggleBookmark(portfolioUuid: string): Promise<ApiResponse<boolean>> {
  try {
    const response = await axiosInstance.post(`/portfolios/${portfolioUuid}/bookmark`)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('북마크 토글 실패:', error)
    throw error
  }
}

/**
 * 좋아요 토글
 */
export async function toggleLike(portfolioUuid: string): Promise<ApiResponse<boolean>> {
  try {
    const response = await axiosInstance.post(`/portfolios/${portfolioUuid}/like`)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('좋아요 토글 실패:', error)
    throw error
  }
}

/**
 * 프로모션 가격 조회
 */
export async function getPromotionPrices(): Promise<ApiResponse<PromotionPrice[]>> {
  try {
    // 공개 API 시도
    const response = await axiosInstance.get('/portfolios/promotion-prices')
    const data = response.data.data || response.data

    // PromotionTypeSetting -> PromotionPrice 변환
    if (Array.isArray(data)) {
      const prices: PromotionPrice[] = data.map((item: any) => ({
        promotionType: item.promotionType,
        displayName: item.displayName || item.promotionType,
        monthlyPrice: item.monthlyPrice || item.price || 0,
        weight: item.weight || 1,
        description: item.description,
      }))
      return { success: true, data: prices }
    }

    return { success: true, data: [] }
  } catch (error: any) {
    console.error('프로모션 가격 조회 실패:', error)
    // 에러시 빈 배열 반환
    return { success: true, data: [] }
  }
}

// ==================== 관리자 API ====================

/**
 * [관리자] 전체 포트폴리오 목록 조회
 */
export async function adminGetAllPortfolios(params?: {
  keyword?: string
  page?: number
  size?: number
  sort?: string
}): Promise<ApiResponse<PortfolioSearchResponse>> {
  try {
    const response = await axiosInstance.get('/admin/portfolios', { params })
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('관리자 포트폴리오 목록 조회 실패:', error)
    throw error
  }
}

/**
 * [관리자] 포트폴리오 상세 조회
 */
export async function adminGetPortfolio(uuid: string): Promise<ApiResponse<Portfolio>> {
  try {
    const response = await axiosInstance.get(`/admin/portfolios/${uuid}`)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('관리자 포트폴리오 조회 실패:', error)
    throw error
  }
}

/**
 * [관리자] 포트폴리오 삭제
 */
export async function adminDeletePortfolio(uuid: string): Promise<ApiResponse<void>> {
  try {
    await axiosInstance.delete(`/admin/portfolios/${uuid}`)
    return { success: true }
  } catch (error: any) {
    console.error('관리자 포트폴리오 삭제 실패:', error)
    throw error
  }
}

/**
 * [관리자] 프로모션 타입 설정 목록 조회
 */
export async function adminGetPromotionSettings(): Promise<ApiResponse<PromotionTypeSetting[]>> {
  try {
    const response = await axiosInstance.get('/admin/portfolio-promotion-settings')
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('프로모션 설정 조회 실패:', error)
    throw error
  }
}

/**
 * [관리자] 프로모션 타입 설정 상세 조회
 */
export async function adminGetPromotionSetting(uuid: string): Promise<ApiResponse<PromotionTypeSetting>> {
  try {
    const response = await axiosInstance.get(`/admin/portfolio-promotion-settings/${uuid}`)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('프로모션 설정 상세 조회 실패:', error)
    throw error
  }
}

/**
 * [관리자] 프로모션 타입 생성
 */
export async function adminCreatePromotionSetting(data: {
  promotionType: string
  displayName: string
  price: number
  weight: number
  displayOrder?: number
  description?: string
}): Promise<ApiResponse<PromotionTypeSetting>> {
  try {
    const response = await axiosInstance.post('/admin/portfolio-promotion-settings', data)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('프로모션 타입 생성 실패:', error)
    throw error
  }
}

/**
 * [관리자] 프로모션 타입 수정
 */
export async function adminUpdatePromotionSetting(
  uuid: string,
  data: Partial<{
    displayName: string
    price: number
    weight: number
    displayOrder: number
    isActive: boolean
    description: string
  }>
): Promise<ApiResponse<PromotionTypeSetting>> {
  try {
    const response = await axiosInstance.put(`/admin/portfolio-promotion-settings/${uuid}`, data)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('프로모션 타입 수정 실패:', error)
    throw error
  }
}

/**
 * [관리자] 프로모션 타입 비활성화
 */
export async function adminDeactivatePromotionSetting(uuid: string): Promise<ApiResponse<void>> {
  try {
    await axiosInstance.delete(`/admin/portfolio-promotion-settings/${uuid}`)
    return { success: true }
  } catch (error: any) {
    console.error('프로모션 타입 비활성화 실패:', error)
    throw error
  }
}

/**
 * [관리자] 프로모션 목록 조회 (상태별)
 */
export async function adminGetPromotions(status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'): Promise<ApiResponse<PortfolioPromotion[]>> {
  try {
    const response = await axiosInstance.get('/admin/portfolio-promotion-settings/promotions', {
      params: status ? { status } : undefined
    })
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('프로모션 목록 조회 실패:', error)
    throw error
  }
}
