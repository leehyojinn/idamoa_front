import axiosInstance from '@/lib/axios'

// ========== Types ==========

// 부모 카테고리 정보 (간략)
export interface ParentCategoryInfo {
  uuid: string
  name: string
  slug: string
}

// 카테고리 (계층 구조 지원)
export interface CommunityCategory {
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
  children: CommunityCategory[] | null
}

// 첨부파일
export interface CommunityFile {
  uuid: string
  originalFilename: string
  fileUrl: string
  fileSize: number
  mimeType: string
  fileExtension: string
  attachmentType: 'IMAGE' | 'DOCUMENT' | 'VIDEO'
  displayOrder: number
}

// 게시글 목록 아이템
export interface CommunityPostListItem {
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
  isLiked: boolean
  isDisliked: boolean
  isOwner: boolean
}

// 게시글 상세
export interface CommunityPostDetail {
  uuid: string
  title: string
  content: string
  contentType: 'TEXT' | 'HTML'
  categoryUuid: string
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
  isPublished: boolean
  isHiddenByAdmin: boolean
  attachments: CommunityFile[]
  createdAt: string
  updatedAt: string
  isLiked: boolean
  isDisliked: boolean
  isOwner: boolean
}

// 게시글 작성 요청
export interface CommunityPostCreateRequest {
  categoryUuid: string
  title: string
  content: string
  contentType?: 'TEXT' | 'HTML'
  isAnonymous?: boolean
  fileUuids?: string[]
}

// 게시글 수정 요청
export interface CommunityPostUpdateRequest {
  title?: string
  content?: string
  contentType?: 'TEXT' | 'HTML'
  isAnonymous?: boolean
  fileUuids?: string[]
}

// 댓글
export interface CommunityComment {
  uuid: string
  content: string
  authorName: string
  isAnonymous: boolean
  depth: number
  likeCount: number
  dislikeCount: number
  createdAt: string
  updatedAt: string
  isDeleted: boolean
  isHiddenByAdmin: boolean
  isLiked: boolean
  isDisliked: boolean
  isOwner: boolean
  children: CommunityComment[]
}

// 댓글 작성 요청
export interface CommunityCommentCreateRequest {
  content: string
  parentUuid?: string
  isAnonymous?: boolean
}

// 댓글 수정 요청
export interface CommunityCommentUpdateRequest {
  content: string
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

// 검색 파라미터
export interface CommunityPostSearchParams {
  categorySlug?: string
  keyword?: string
  page?: number
  size?: number
  sort?: string
}

// ========== API Functions ==========

// 카테고리 트리 조회 (활성화된 카테고리만)
export async function getCommunityCategories(): Promise<ApiResponse<CommunityCategory[]>> {
  try {
    const response = await axiosInstance.get('/community/categories')
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 카테고리 트리 조회 (별칭)
export async function getCommunityTree(): Promise<ApiResponse<CommunityCategory[]>> {
  try {
    const response = await axiosInstance.get('/community/categories/tree')
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 카테고리 상세 조회 (하위 카테고리 포함)
export async function getCommunityCategory(uuid: string): Promise<ApiResponse<CommunityCategory>> {
  try {
    const response = await axiosInstance.get(`/community/categories/${uuid}`)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 카테고리 슬러그로 조회
export async function getCommunityBySlug(slug: string): Promise<ApiResponse<CommunityCategory>> {
  try {
    const response = await axiosInstance.get(`/community/categories/slug/${slug}`)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 게시글 목록 조회
export async function getCommunityPosts(params: CommunityPostSearchParams = {}): Promise<ApiResponse<PageResponse<CommunityPostListItem>>> {
  try {
    const queryParams = new URLSearchParams()

    if (params.categorySlug) queryParams.append('categorySlug', params.categorySlug)
    if (params.keyword) queryParams.append('keyword', params.keyword)
    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())
    if (params.sort) queryParams.append('sort', params.sort)

    const url = `/community/posts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await axiosInstance.get(url)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 게시글 상세 조회
export async function getCommunityPost(uuid: string): Promise<ApiResponse<CommunityPostDetail>> {
  try {
    const response = await axiosInstance.get(`/community/posts/${uuid}`)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 게시글 작성
export async function createCommunityPost(data: CommunityPostCreateRequest): Promise<ApiResponse<CommunityPostDetail>> {
  try {
    const response = await axiosInstance.post('/community/posts', data)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 게시글 수정
export async function updateCommunityPost(uuid: string, data: CommunityPostUpdateRequest): Promise<ApiResponse<CommunityPostDetail>> {
  try {
    const response = await axiosInstance.put(`/community/posts/${uuid}`, data)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 게시글 삭제
export async function deleteCommunityPost(uuid: string): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.delete(`/community/posts/${uuid}`)
    if (response.status >= 200 && response.status < 300) {
      return { success: true, data: null }
    }
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 게시글 좋아요
export async function likeCommunityPost(uuid: string): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.post(`/community/posts/${uuid}/like`)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 게시글 싫어요
export async function dislikeCommunityPost(uuid: string): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.post(`/community/posts/${uuid}/dislike`)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 댓글 목록 조회
export async function getCommunityComments(postUuid: string): Promise<ApiResponse<CommunityComment[]>> {
  try {
    const response = await axiosInstance.get(`/community/posts/${postUuid}/comments`)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 댓글 작성
export async function createCommunityComment(postUuid: string, data: CommunityCommentCreateRequest): Promise<ApiResponse<CommunityComment>> {
  try {
    const response = await axiosInstance.post(`/community/posts/${postUuid}/comments`, data)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 댓글 수정
export async function updateCommunityComment(uuid: string, data: CommunityCommentUpdateRequest): Promise<ApiResponse<CommunityComment>> {
  try {
    const response = await axiosInstance.put(`/community/comments/${uuid}`, data)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 댓글 삭제
export async function deleteCommunityComment(uuid: string): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.delete(`/community/comments/${uuid}`)
    if (response.status >= 200 && response.status < 300) {
      return { success: true, data: null }
    }
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 댓글 좋아요
export async function likeCommunityComment(uuid: string): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.post(`/community/comments/${uuid}/like`)
    return response.data
  } catch (error: any) {
    throw error
  }
}

// 댓글 싫어요
export async function dislikeCommunityComment(uuid: string): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.post(`/community/comments/${uuid}/dislike`)
    return response.data
  } catch (error: any) {
    throw error
  }
}
