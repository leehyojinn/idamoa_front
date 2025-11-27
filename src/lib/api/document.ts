import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'
import type {
  DocumentBoard,
  DocumentCreateRequest,
  DocumentUpdateRequest,
} from '@/types/document'

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

// ========== 자료실 게시글 API ==========

// 게시글 목록 조회
export async function getDocuments(params?: {
  keyword?: string
  page?: number
  size?: number
  sort?: string
}): Promise<PageResponse<DocumentBoard>> {
  const response = await axiosInstance.get<ApiResponse<PageResponse<DocumentBoard>>>(
    '/admin/boards/document',
    { params }
  )
  return response.data.data
}

// 게시글 상세 조회
export async function getDocument(documentUuid: string): Promise<DocumentBoard> {
  const response = await axiosInstance.get<ApiResponse<DocumentBoard>>(
    `/admin/boards/document/${documentUuid}`
  )
  return response.data.data
}

// 게시글 생성
export async function createDocument(
  data: DocumentCreateRequest
): Promise<DocumentBoard> {
  const response = await axiosInstance.post<ApiResponse<DocumentBoard>>(
    '/admin/boards/document',
    data
  )
  return response.data.data
}

// 게시글 수정
export async function updateDocument(
  documentUuid: string,
  data: DocumentUpdateRequest
): Promise<DocumentBoard> {
  const response = await axiosInstance.put<ApiResponse<DocumentBoard>>(
    `/admin/boards/document/${documentUuid}`,
    data
  )
  return response.data.data
}

// 게시글 삭제
export async function deleteDocument(documentUuid: string): Promise<void> {
  await axiosInstance.delete(`/admin/boards/document/${documentUuid}`)
}

// 게시/게시 취소 토글
export async function togglePublish(documentUuid: string): Promise<void> {
  await axiosInstance.patch(`/admin/boards/document/${documentUuid}/publish`)
}

// 고정/고정 해제 토글
export async function togglePin(documentUuid: string): Promise<void> {
  await axiosInstance.patch(`/admin/boards/document/${documentUuid}/pin`)
}

// 추천/추천 해제 토글
export async function toggleFeature(documentUuid: string): Promise<void> {
  await axiosInstance.patch(`/admin/boards/document/${documentUuid}/feature`)
}
