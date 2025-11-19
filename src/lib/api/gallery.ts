import axiosInstance from '@/lib/axios'

// Types
export interface GalleryImage {
  uuid: string
  originalFilename: string
  fileUrl: string
  fileSize: number
  mimeType: string
  fileExtension: string
}

export interface Gallery {
  id?: number
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
  createdAt: string
  isBookmarked?: boolean  // 백엔드는 isBookmarked 사용
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
  tags?: string[]
  authorUuid?: string
  sortBy?: 'CREATED_AT' | 'VIEW_COUNT' | 'BOOKMARK_COUNT'
  sortDirection?: 'ASC' | 'DESC'
  onlyBookmarked?: boolean  // 북마크한 것만
  myOnly?: boolean  // 내 글만
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
  tags: string[]
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
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach(tag => queryParams.append('tags', tag))
    }
    if (params.authorUuid) queryParams.append('authorUuid', params.authorUuid)
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection)
    if (params.onlyBookmarked) queryParams.append('onlyBookmarked', 'true')
    if (params.myOnly) queryParams.append('myOnly', 'true')

    const url = `/boards/gallery/search?${queryParams.toString()}`
    const response = await axiosInstance.get(url)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('갤러리 검색 실패:', error)
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
