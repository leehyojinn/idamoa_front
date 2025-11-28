import axiosInstance from '@/lib/axios'

// Types
export interface GalleryImage {
  uuid: string
  originalFilename: string
  fileUrl: string
  fileSize: number
  mimeType: string
  fileExtension: string
  thumbnailUrl?: string
}

export interface FilterOption {
  id: number
  uuid: string
  categoryCode: string
  categoryName: string
  code: string
  name: string
  shortName: string
  color: string
  icon: string
}

export interface FilterOption {
  id: number
  code: string
  name: string
  categoryCode: string
  categoryName: string
}

export interface FilterGroup {
  categoryId: number
  categoryCode: string
  categoryName: string
  categoryDescription?: string
  options: FilterOption[]
}

export interface Gallery {
  id?: number
  uuid: string
  title: string
  content: string | null  // 백엔드는 content 사용
  relatedLink?: string
  tags: string[]
  filterGroups?: FilterGroup[]
  images: GalleryImage[]
  viewCount: number
  likeCount: number  // 백엔드는 likeCount 사용
  userId: number  // 백엔드는 userId 사용
  userName: string  // 백엔드는 userName 사용
  userEmail?: string
  companyName?: string  // 업체명 (백엔드에서 제공 시)
  createdAt: string
  updatedAt: string
  isBookmarked?: boolean  // 백엔드는 isBookmarked 사용
  copyright?: {
    owner: string
    license: string
    attribution: string
  }
}

export interface GalleryListItem {
  uuid: string
  title: string
  content: string | null  // 백엔드는 content 사용
  relatedLink?: string
  tags: string[]
  images: GalleryImage[]
  viewCount: number
  likeCount: number  // 백엔드는 likeCount 사용
  userId: number  // 백엔드는 userId 사용
  userName: string  // 백엔드는 userName 사용
  userEmail?: string
  companyName?: string  // 업체명 (백엔드에서 제공 시)
  createdAt: string
  isBookmarked?: boolean  // 백엔드는 isBookmarked 사용
  filterOptions?: FilterOption[]  // 필터 옵션
  copyright?: {
    owner: string
    license: string
    attribution: string
  }
}

export interface GallerySearchParams {
  page?: number
  size?: number
  keyword?: string
  filterOptionIds?: number[]  // 필터 옵션 ID 배열
  tags?: string[]  // 기존 호환성 유지
  authorUuid?: string
  sortBy?: 'CREATED_AT' | 'VIEW_COUNT' | 'BOOKMARK_COUNT'
  sortDirection?: 'ASC' | 'DESC'
  onlyBookmarked?: boolean  // 북마크한 것만
  onlyMyPosts?: boolean  // 내 글만 (백엔드 파라미터 이름)
}

export interface GallerySearchResponse {
  content: GalleryListItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface CreateGalleryRequest {
  title: string
  content: string
  relatedLink?: string
  tags?: string[]
  filterOptionIds?: number[]
  imageUuids: string[]
  copyright?: {
    owner: string
    license: string
    attribution: string
  }
}

export interface UpdateGalleryRequest {
  title?: string
  content?: string
  relatedLink?: string
  location?: string  // 테스트용 추가
  tags?: string[]
  filterOptionIds?: number[]
  imageUuids?: string[]
  copyright?: {
    owner: string
    license: string
    attribution: string
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// API Functions

/**
 * 갤러리 게시글 생성
 */
export async function createGallery(data: CreateGalleryRequest): Promise<ApiResponse<Gallery>> {
  try {
    const response = await axiosInstance.post('/boards/gallery', data)
    // Backend wraps response in { success: true, data: {...} }
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('갤러리 생성 실패:', error)
    throw error
  }
}

/**
 * 갤러리 게시글 상세 조회
 */
export async function getGallery(uuid: string): Promise<ApiResponse<Gallery>> {
  try {
    const response = await axiosInstance.get(`/boards/gallery/${uuid}`)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('갤러리 조회 실패:', error)
    throw error
  }
}

/**
 * 갤러리 게시글 검색
 */
export async function searchGalleries(params: GallerySearchParams = {}): Promise<ApiResponse<GallerySearchResponse>> {
  try {
    const queryParams = new URLSearchParams()

    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())
    if (params.keyword) queryParams.append('keyword', params.keyword)

    // filterOptionIds (API 문서 기준)
    if (params.filterOptionIds && params.filterOptionIds.length > 0) {
      params.filterOptionIds.forEach(id => queryParams.append('filterOptionIds', id.toString()))
    }

    if (params.authorUuid) queryParams.append('authorUuid', params.authorUuid)

    // sort 파라미터 조합 (API 문서: "publishedAt,DESC" 형식)
    if (params.sortBy && params.sortDirection) {
      // sortBy 변환 (API 문서 기준)
      let sortField: string = params.sortBy
      if (sortField === 'CREATED_AT') sortField = 'publishedAt'  // API 문서에서는 publishedAt 사용
      else if (sortField === 'VIEW_COUNT') sortField = 'viewCount'
      else if (sortField === 'BOOKMARK_COUNT') sortField = 'likeCount'

      queryParams.append('sort', `${sortField},${params.sortDirection}`)
    }

    if (params.onlyBookmarked) queryParams.append('onlyBookmarked', 'true')
    if (params.onlyMyPosts) queryParams.append('onlyMyPosts', 'true')

    const url = `/boards/gallery/search?${queryParams.toString()}`
    const response = await axiosInstance.get(url)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    throw error
  }
}

/**
 * 갤러리 게시글 수정
 */
export async function updateGallery(uuid: string, data: UpdateGalleryRequest): Promise<ApiResponse<Gallery>> {
  try {
    const response = await axiosInstance.put(`/boards/gallery/${uuid}`, data)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('갤러리 수정 실패:', error)
    throw error
  }
}

/**
 * 갤러리 게시글 삭제
 */
export async function deleteGallery(uuid: string): Promise<ApiResponse<void>> {
  try {
    await axiosInstance.delete(`/boards/gallery/${uuid}`)
    return { success: true }
  } catch (error: any) {
    console.error('갤러리 삭제 실패:', error)
    throw error
  }
}

/**
 * 북마크 상태 조회
 */
export async function checkBookmark(galleryUuid: string): Promise<ApiResponse<{ bookmarked: boolean }>> {
  try {
    const response = await axiosInstance.get(`/boards/gallery/${galleryUuid}/bookmark`)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('북마크 조회 실패:', error)
    throw error
  }
}

/**
 * 북마크 토글
 */
export async function toggleBookmark(galleryUuid: string): Promise<ApiResponse<boolean>> {
  try {
    const response = await axiosInstance.post(`/boards/gallery/${galleryUuid}/bookmark`)
    // response.data.data는 직접 boolean 값 (true: 추가됨, false: 제거됨)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('북마크 토글 실패:', error)
    throw error
  }
}

// ========== 관리자 API ==========

interface PageResponse<T> {
  content: T[]
  pageable: {
    pageNumber: number
    pageSize: number
  }
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface AdminGalleryBoard {
  uuid: string
  title: string
  content?: string
  boardType: 'GALLERY'
  categoryId?: number
  categoryName?: string
  images: GalleryImage[]
  relatedLink?: string
  copyright?: {
    owner: string
    license: string
    attribution: string
  }
  viewCount: number
  likeCount: number
  commentCount: number
  isPinned: boolean
  isFeatured: boolean
  isPublished: boolean
  publishedAt?: string
  filterOptions: FilterOption[]
  tags: string[]
  userId: number
  userEmail: string
  userName: string
  createdAt: string
  updatedAt: string
  isBookmarked: boolean
}

export interface AdminGalleryCreateRequest {
  title: string
  content?: string
  categoryId?: number
  imageUuids: string[]
  relatedLink?: string
  copyright?: {
    owner?: string
    license?: string
    attribution?: string
  }
  filterOptionIds?: number[]
  tags?: string[]
  isPublished?: boolean
  isPrivate?: boolean
}

export interface AdminGalleryUpdateRequest {
  title?: string
  content?: string
  categoryId?: number
  imageUuids?: string[]
  relatedLink?: string
  copyright?: {
    owner?: string
    license?: string
    attribution?: string
  }
  filterOptionIds?: number[]
  tags?: string[]
}

// 게시글 목록 조회 (관리자)
export async function getAdminGalleries(params?: {
  keyword?: string
  page?: number
  size?: number
  sort?: string
}): Promise<PageResponse<AdminGalleryBoard>> {
  const response = await axiosInstance.get('/admin/boards/gallery', { params })
  return response.data.data
}

// 게시글 상세 조회 (관리자)
export async function getAdminGallery(galleryUuid: string): Promise<AdminGalleryBoard> {
  const response = await axiosInstance.get(`/admin/boards/gallery/${galleryUuid}`)
  return response.data.data
}

// 게시글 생성 (관리자)
export async function createAdminGallery(
  data: AdminGalleryCreateRequest
): Promise<AdminGalleryBoard> {
  const response = await axiosInstance.post('/admin/boards/gallery', data)
  return response.data.data
}

// 게시글 수정 (관리자)
export async function updateAdminGallery(
  galleryUuid: string,
  data: AdminGalleryUpdateRequest
): Promise<AdminGalleryBoard> {
  const response = await axiosInstance.put(`/admin/boards/gallery/${galleryUuid}`, data)
  return response.data.data
}

// 게시글 삭제 (관리자)
export async function deleteAdminGallery(galleryUuid: string): Promise<void> {
  await axiosInstance.delete(`/admin/boards/gallery/${galleryUuid}`)
}

// 게시/게시 취소 토글 (관리자)
export async function toggleAdminPublish(galleryUuid: string): Promise<void> {
  await axiosInstance.patch(`/admin/boards/gallery/${galleryUuid}/publish`)
}

// 고정/고정 해제 토글 (관리자)
export async function toggleAdminPin(galleryUuid: string): Promise<void> {
  await axiosInstance.patch(`/admin/boards/gallery/${galleryUuid}/pin`)
}

// 추천/추천 해제 토글 (관리자)
export async function toggleAdminFeature(galleryUuid: string): Promise<void> {
  await axiosInstance.patch(`/admin/boards/gallery/${galleryUuid}/feature`)
}
