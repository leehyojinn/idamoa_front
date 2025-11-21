import axiosInstance from '@/lib/axios'

// Types
export interface DocumentFile {
  uuid: string
  originalFilename: string
  fileUrl: string
  fileSize: number
  mimeType: string
  fileExtension: string
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

export interface Document {
  uuid: string
  title: string
  content: string
  boardType: string
  categoryId: number | null
  categoryName: string | null
  files: DocumentFile[]
  thumbnail: DocumentFile | null
  isPaid: boolean
  price: number | null
  viewCount: number
  likeCount: number
  commentCount: number
  downloadCount: number
  isPinned: boolean
  isFeatured: boolean
  isPublished: boolean
  publishedAt: string
  filterOptions: FilterOption[]
  tags: string[]
  userId: number
  userEmail: string
  userName: string
  createdAt: string
  updatedAt: string
  isBookmarked: boolean
  hasDownloaded: boolean
}

export interface DocumentListItem {
  uuid: string
  title: string
  content: string
  boardType: string
  categoryId: number | null
  categoryName: string | null
  files: DocumentFile[]
  thumbnail: DocumentFile | null
  isPaid: boolean
  price: number | null
  viewCount: number
  likeCount: number
  commentCount: number
  downloadCount: number
  isPinned: boolean
  isFeatured: boolean
  isPublished: boolean
  publishedAt: string
  filterOptions: FilterOption[]
  tags: string[]
  userId: number
  userEmail: string
  userName: string
  createdAt: string
  updatedAt: string
  isBookmarked: boolean
  hasDownloaded: boolean
}

export interface DocumentSearchParams {
  page?: number
  size?: number
  keyword?: string
  tags?: string[]
  filterOptionIds?: number[]
  onlyBookmarked?: boolean
  onlyMyPosts?: boolean
  sortBy?: 'publishedAt' | 'viewCount' | 'downloadCount' | 'createdAt'
  sortDirection?: 'ASC' | 'DESC'
}

export interface DocumentSearchResponse {
  content: DocumentListItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface CreateDocumentRequest {
  title: string
  content: string
  fileUuids: string[]
  categoryId?: number
  thumbnailUuid?: string
  isPaid?: boolean
  price?: number
  filterOptionIds?: number[]
  tags?: string[]
  isPublished?: boolean
  isPrivate?: boolean
}

export interface UpdateDocumentRequest {
  title?: string
  content?: string
  categoryId?: number
  fileUuids?: string[]
  thumbnailUuid?: string
  isPaid?: boolean
  price?: number
  filterOptionIds?: number[]
  tags?: string[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// API Functions

/**
 * 자료실 게시글 생성
 */
export async function createDocument(data: CreateDocumentRequest): Promise<ApiResponse<Document>> {
  try {
    const response = await axiosInstance.post('/boards/document', data)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('자료 생성 실패:', error)
    throw error
  }
}

/**
 * 자료실 게시글 상세 조회
 */
export async function getDocument(uuid: string): Promise<ApiResponse<Document>> {
  try {
    const response = await axiosInstance.get(`/boards/document/${uuid}`)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('자료 조회 실패:', error)
    throw error
  }
}

/**
 * 자료실 게시글 검색
 */
export async function searchDocuments(params: DocumentSearchParams = {}): Promise<ApiResponse<DocumentSearchResponse>> {
  try {
    const queryParams = new URLSearchParams()

    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())
    if (params.keyword) queryParams.append('keyword', params.keyword)

    // tags
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach(tag => queryParams.append('tags', tag))
    }

    // filterOptionIds
    if (params.filterOptionIds && params.filterOptionIds.length > 0) {
      params.filterOptionIds.forEach(id => queryParams.append('filterOptionIds', id.toString()))
    }

    // sort 파라미터
    if (params.sortBy && params.sortDirection) {
      queryParams.append('sort', `${params.sortBy},${params.sortDirection}`)
    }

    if (params.onlyBookmarked) queryParams.append('onlyBookmarked', 'true')
    if (params.onlyMyPosts) queryParams.append('onlyMyPosts', 'true')

    const url = `/boards/document/search?${queryParams.toString()}`
    const response = await axiosInstance.get(url)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    throw error
  }
}

/**
 * 자료실 게시글 수정
 */
export async function updateDocument(uuid: string, data: UpdateDocumentRequest): Promise<ApiResponse<Document>> {
  try {
    const response = await axiosInstance.put(`/boards/document/${uuid}`, data)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('자료 수정 실패:', error)
    throw error
  }
}

/**
 * 자료실 게시글 삭제
 */
export async function deleteDocument(uuid: string): Promise<ApiResponse<void>> {
  try {
    await axiosInstance.delete(`/boards/document/${uuid}`)
    return { success: true }
  } catch (error: any) {
    console.error('자료 삭제 실패:', error)
    throw error
  }
}

/**
 * 북마크 상태 조회
 */
export async function checkDocumentBookmark(uuid: string): Promise<ApiResponse<boolean>> {
  try {
    const response = await axiosInstance.get(`/boards/document/${uuid}/bookmark`)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('북마크 조회 실패:', error)
    throw error
  }
}

/**
 * 북마크 토글
 */
export async function toggleDocumentBookmark(uuid: string): Promise<ApiResponse<boolean>> {
  try {
    const response = await axiosInstance.post(`/boards/document/${uuid}/bookmark`)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('북마크 토글 실패:', error)
    throw error
  }
}

/**
 * 내가 작성한 자료 목록
 */
export async function getMyDocuments(params: { page?: number; size?: number } = {}): Promise<ApiResponse<DocumentSearchResponse>> {
  try {
    const queryParams = new URLSearchParams()
    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())

    const url = `/boards/document/my?${queryParams.toString()}`
    const response = await axiosInstance.get(url)
    return { success: true, data: response.data.data }
  } catch (error: any) {
    throw error
  }
}
