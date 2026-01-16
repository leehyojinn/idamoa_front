import axiosInstance from '@/lib/axios'

// ========== Types ==========

// 부모 카테고리 정보 (간략)
export interface ParentCategoryInfo {
  uuid: string
  name: string
  slug: string
}

// 관리자용 카테고리 (계층 구조 지원)
export interface AdminCommunityCategory {
  uuid: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  displayOrder: number
  isActive: boolean
  allowAnonymous: boolean
  requireLogin: boolean
  allowAttachments: boolean
  maxAttachments: number
  createdAt: string
  // 계층 구조 필드
  depth: number
  parent: ParentCategoryInfo | null
  children: AdminCommunityCategory[] | null
}

// 카테고리 생성 요청
export interface AdminCommunityCategoryCreateRequest {
  name: string
  slug: string
  description?: string
  icon?: string
  displayOrder?: number
  isActive?: boolean
  allowAnonymous?: boolean
  requireLogin?: boolean
  allowAttachments?: boolean
  maxAttachments?: number
  parentUuid?: string // 부모 카테고리 UUID
}

// 카테고리 수정 요청
export interface AdminCommunityCategoryUpdateRequest {
  name?: string
  description?: string
  icon?: string
  displayOrder?: number
  isActive?: boolean
  allowAnonymous?: boolean
  requireLogin?: boolean
  allowAttachments?: boolean
  maxAttachments?: number
  parentUuid?: string // 새 부모 카테고리 UUID
  changeParent?: boolean // 부모 변경 여부 (true일 때만 parentUuid 적용)
}

// 관리자용 게시글 목록 아이템
export interface AdminCommunityPostListItem {
  uuid: string
  title: string
  categoryName: string
  categorySlug: string
  authorName: string
  isAnonymous: boolean
  viewCount: number
  likeCount: number
  dislikeCount: number
  commentCount: number
  isPinned: boolean
  isNotice: boolean
  hasAttachments: boolean
  createdAt: string
  isHiddenByAdmin: boolean
}

// 관리자용 게시글 상세
export interface AdminCommunityPostDetail {
  uuid: string
  title: string
  content: string
  contentType: 'TEXT' | 'HTML'
  categoryUuid: string
  categoryName: string
  categorySlug: string
  userId: number
  userEmail: string
  realAuthorName: string
  isAnonymous: boolean
  viewCount: number
  likeCount: number
  dislikeCount: number
  commentCount: number
  isPinned: boolean
  isNotice: boolean
  isPublished: boolean
  isDeleted: boolean
  ipAddress: string
  attachments: AdminCommunityFile[]
  createdAt: string
  updatedAt: string | null
  deletedAt: string | null
}

// 첨부파일
export interface AdminCommunityFile {
  uuid: string
  originalFilename: string
  fileUrl: string
  fileSize: number
  mimeType: string
  fileExtension: string
  attachmentType: 'IMAGE' | 'DOCUMENT' | 'OTHER'
  displayOrder: number
}

// 게시글 수정 요청 (관리자)
export interface AdminCommunityPostUpdateRequest {
  title?: string
  content?: string
  contentType?: 'TEXT' | 'HTML'
  isPinned?: boolean
  isNotice?: boolean
  isPublished?: boolean
}

// 관리자용 댓글
export interface AdminCommunityComment {
  uuid: string
  content: string
  authorName: string
  isAnonymous: boolean
  depth: number
  likeCount: number
  dislikeCount: number
  createdAt: string
  updatedAt: string | null
  isDeleted: boolean
  isHiddenByAdmin: boolean
  children: AdminCommunityComment[]
}

// 페이지 응답
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

// API 응답
export interface ApiResponse<T> {
  success: boolean
  data?: T
  errorCode?: string | null
  message?: string | null
}

// 게시글 검색 파라미터
export interface AdminCommunityPostSearchParams {
  categorySlug?: string
  keyword?: string
  page?: number
  size?: number
  sort?: string
}

// 댓글 검색 파라미터
export interface AdminCommunityCommentSearchParams {
  keyword?: string
  page?: number
  size?: number
  sort?: string
}

// 카테고리 검색 파라미터
export interface AdminCommunityCategorySearchParams {
  keyword?: string
  page?: number
  size?: number
  sort?: string
}

// ========== Category API Functions ==========

// 카테고리 목록 조회 (관리자 - 플랫 리스트, 페이지네이션)
export async function getAdminCommunityCategories(params: AdminCommunityCategorySearchParams = {}): Promise<ApiResponse<PageResponse<AdminCommunityCategory>>> {
  try {
    const queryParams = new URLSearchParams()

    if (params.keyword) queryParams.append('keyword', params.keyword)
    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())
    if (params.sort) queryParams.append('sort', params.sort)

    const url = `/admin/community/categories${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await axiosInstance.get(url)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 카테고리 트리 조회 (관리자 - 비활성 포함)
export async function getAdminCommunityCategoryTree(): Promise<ApiResponse<AdminCommunityCategory[]>> {
  try {
    const response = await axiosInstance.get('/admin/community/categories/tree')
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 카테고리 상세 조회 (관리자)
export async function getAdminCommunityCategory(uuid: string): Promise<ApiResponse<AdminCommunityCategory>> {
  try {
    const response = await axiosInstance.get(`/admin/community/categories/${uuid}`)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 카테고리 생성
export async function createAdminCommunityCategory(data: AdminCommunityCategoryCreateRequest): Promise<ApiResponse<AdminCommunityCategory>> {
  try {
    const response = await axiosInstance.post('/admin/community/categories', data)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 카테고리 수정
export async function updateAdminCommunityCategory(uuid: string, data: AdminCommunityCategoryUpdateRequest): Promise<ApiResponse<AdminCommunityCategory>> {
  try {
    const response = await axiosInstance.put(`/admin/community/categories/${uuid}`, data)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 카테고리 삭제
export async function deleteAdminCommunityCategory(uuid: string): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.delete(`/admin/community/categories/${uuid}`)
    if (response.status >= 200 && response.status < 300) {
      return { success: true, data: null }
    }
    return response.data
  } catch (error: any) {
    throw error
  }
}

// ========== Post API Functions ==========

// 게시글 목록 조회 (관리자)
export async function getAdminCommunityPosts(params: AdminCommunityPostSearchParams = {}): Promise<ApiResponse<PageResponse<AdminCommunityPostListItem>>> {
  try {
    const queryParams = new URLSearchParams()

    if (params.categorySlug) queryParams.append('categorySlug', params.categorySlug)
    if (params.keyword) queryParams.append('keyword', params.keyword)
    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())
    if (params.sort) queryParams.append('sort', params.sort)

    const url = `/admin/community/posts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await axiosInstance.get(url)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 게시글 상세 조회 (관리자)
export async function getAdminCommunityPost(uuid: string): Promise<ApiResponse<AdminCommunityPostDetail>> {
  try {
    const response = await axiosInstance.get(`/admin/community/posts/${uuid}`)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 게시글 수정 (관리자)
export async function updateAdminCommunityPost(uuid: string, data: AdminCommunityPostUpdateRequest): Promise<ApiResponse<AdminCommunityPostDetail>> {
  try {
    const response = await axiosInstance.put(`/admin/community/posts/${uuid}`, data)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 게시글 삭제 (관리자)
export async function deleteAdminCommunityPost(uuid: string): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.delete(`/admin/community/posts/${uuid}`)
    if (response.status >= 200 && response.status < 300) {
      return { success: true, data: null }
    }
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 게시글 비공개
export async function hideAdminCommunityPost(uuid: string): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.post(`/admin/community/posts/${uuid}/hide`)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 게시글 공개
export async function showAdminCommunityPost(uuid: string): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.post(`/admin/community/posts/${uuid}/show`)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// ========== Comment API Functions ==========

// 댓글 목록 조회 (관리자)
export async function getAdminCommunityComments(params: AdminCommunityCommentSearchParams = {}): Promise<ApiResponse<PageResponse<AdminCommunityComment>>> {
  try {
    const queryParams = new URLSearchParams()

    if (params.keyword) queryParams.append('keyword', params.keyword)
    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())
    if (params.sort) queryParams.append('sort', params.sort)

    const url = `/admin/community/comments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await axiosInstance.get(url)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 댓글 삭제 (관리자)
export async function deleteAdminCommunityComment(uuid: string): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.delete(`/admin/community/comments/${uuid}`)
    if (response.status >= 200 && response.status < 300) {
      return { success: true, data: null }
    }
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 댓글 비공개
export async function hideAdminCommunityComment(uuid: string): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.post(`/admin/community/comments/${uuid}/hide`)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 댓글 공개
export async function showAdminCommunityComment(uuid: string): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.post(`/admin/community/comments/${uuid}/show`)
    return response.data
  } catch (error: any) {
    throw error
  }
}
