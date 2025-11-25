import axiosInstance from '@/lib/axios'

// ========================================
// Types
// ========================================

export type PopupPosition = 'CENTER' | 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT' | 'CUSTOM'

export interface Popup {
  uuid: string
  title: string
  content: string | null
  imageUuid: string | null
  imageUrl: string | null
  linkUrl: string | null
  width: number | null
  height: number | null
  position: PopupPosition | null
  offsetX: number | null
  offsetY: number | null
  displayStartDate: string | null
  displayEndDate: string | null
  displayOrder: number
  isActive: boolean
  viewCount: number
  clickCount: number
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

export interface PopupCreateRequest {
  title: string
  content?: string
  imageUuid?: string
  linkUrl?: string
  width?: number
  height?: number
  position?: PopupPosition
  offsetX?: number
  offsetY?: number
  displayStartDate?: string
  displayEndDate?: string
  displayOrder?: number
  isActive?: boolean
}

export interface PopupUpdateRequest {
  title: string
  content?: string
  imageUuid?: string
  linkUrl?: string
  width?: number
  height?: number
  position?: PopupPosition
  offsetX?: number
  offsetY?: number
  displayStartDate?: string
  displayEndDate?: string
  displayOrder?: number
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

// 라벨
export const POSITION_LABELS: Record<PopupPosition, string> = {
  CENTER: '중앙',
  TOP_LEFT: '좌측 상단',
  TOP_RIGHT: '우측 상단',
  BOTTOM_LEFT: '좌측 하단',
  BOTTOM_RIGHT: '우측 하단',
  CUSTOM: '사용자 정의',
}

// ========================================
// 공개 API
// ========================================

/**
 * 활성 팝업 목록 조회
 */
export const getActivePopups = async (): Promise<{ success: boolean; data: Popup[] }> => {
  const response = await axiosInstance.get('/popups/active')
  return response.data
}

/**
 * 팝업 조회수 증가
 */
export const incrementViewCount = async (uuid: string): Promise<{ success: boolean; data: null }> => {
  const response = await axiosInstance.post(`/popups/${uuid}/view`)
  return response.data
}

/**
 * 팝업 클릭수 증가
 */
export const incrementClickCount = async (uuid: string): Promise<{ success: boolean; data: null }> => {
  const response = await axiosInstance.post(`/popups/${uuid}/click`)
  return response.data
}

// ========================================
// 관리자 API
// ========================================

/**
 * 팝업 생성
 */
export const createPopup = async (request: PopupCreateRequest): Promise<{ success: boolean; data: Popup }> => {
  const response = await axiosInstance.post('/admin/popups', request)
  return response.data
}

/**
 * 팝업 목록 조회
 */
export const getPopups = async (params?: {
  page?: number
  size?: number
  sort?: string
}): Promise<{ success: boolean; data: PageResponse<Popup> }> => {
  const response = await axiosInstance.get('/admin/popups', { params })
  return response.data
}

/**
 * 팝업 조회
 */
export const getPopup = async (uuid: string): Promise<{ success: boolean; data: Popup }> => {
  const response = await axiosInstance.get(`/admin/popups/${uuid}`)
  return response.data
}

/**
 * 팝업 수정
 */
export const updatePopup = async (
  uuid: string,
  request: PopupUpdateRequest
): Promise<{ success: boolean; data: Popup }> => {
  const response = await axiosInstance.put(`/admin/popups/${uuid}`, request)
  return response.data
}

/**
 * 팝업 삭제
 */
export const deletePopup = async (uuid: string): Promise<{ success: boolean; data: null }> => {
  const response = await axiosInstance.delete(`/admin/popups/${uuid}`)
  return response.data
}

/**
 * 팝업 활성화
 */
export const activatePopup = async (uuid: string): Promise<{ success: boolean; data: Popup }> => {
  const response = await axiosInstance.patch(`/admin/popups/${uuid}/activate`)
  return response.data
}

/**
 * 팝업 비활성화
 */
export const deactivatePopup = async (uuid: string): Promise<{ success: boolean; data: Popup }> => {
  const response = await axiosInstance.patch(`/admin/popups/${uuid}/deactivate`)
  return response.data
}
