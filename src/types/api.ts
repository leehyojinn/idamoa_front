/**
 * 공통 API 응답 타입
 */

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  errorCode?: string
  message: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}
