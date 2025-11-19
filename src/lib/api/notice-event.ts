import axiosInstance from '@/lib/axios'

// Types
export interface NoticeThumbnail {
  uuid: string
  fileName: string
  fileUrl: string
  fileSize: number
  contentType: string
}

export interface NoticeEvent {
  uuid: string
  title: string
  content: string
  boardType: 'NOTICE' | 'EVENT' | 'FAQ'
  categoryId?: number
  categoryName?: string
  thumbnail?: NoticeThumbnail
  viewCount: number
  likeCount: number
  commentCount: number
  isPinned: boolean
  isFeatured: boolean
  isPublished: boolean
  publishedAt: string
  tags: string[]
  userId: number
  userEmail: string
  userName: string
  createdAt: string
  updatedAt: string
  eventStartDate?: string | null
  eventEndDate?: string | null
  isEventEnded?: boolean | null
}

export interface NoticeEventListItem {
  uuid: string
  title: string
  boardType: 'NOTICE' | 'EVENT' | 'FAQ'
  categoryId?: number
  categoryName?: string
  thumbnail?: NoticeThumbnail
  viewCount: number
  likeCount: number
  commentCount: number
  isPinned: boolean
  isPublished: boolean
  publishedAt: string
  tags: string[]
  createdAt: string
  eventStartDate?: string | null
  eventEndDate?: string | null
  isEventEnded?: boolean | null
}

export interface NoticeEventSearchParams {
  keyword?: string
  boardType?: 'NOTICE' | 'EVENT' | 'FAQ'
  eventStatus?: 'ACTIVE' | 'ENDED'
  page?: number
  size?: number
  sort?: string
}

export interface NoticeEventSearchResponse {
  content: NoticeEventListItem[]
  pageable: {
    pageNumber: number
    pageSize: number
    offset: number
    sort: {
      sorted: boolean
      unsorted: boolean
    }
  }
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  numberOfElements: number
  empty: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  errorCode?: string | null
  message?: string | null
}

// API Functions

/**
 * 공지사항/이벤트 단건 조회
 */
export async function getNoticeEvent(uuid: string): Promise<ApiResponse<NoticeEvent>> {
  try {
    const response = await axiosInstance.get(`/boards/notice-event/${uuid}`)
    return response.data
  } catch (error: any) {
    console.error('공지사항/이벤트 조회 실패:', error)
    throw error
  }
}

/**
 * 공지사항/이벤트 목록 조회 및 검색
 */
export async function searchNoticeEvents(params: NoticeEventSearchParams = {}): Promise<ApiResponse<NoticeEventSearchResponse>> {
  try {
    const queryParams = new URLSearchParams()

    if (params.keyword) queryParams.append('keyword', params.keyword)
    if (params.boardType) queryParams.append('boardType', params.boardType)
    if (params.eventStatus) queryParams.append('eventStatus', params.eventStatus)
    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())
    if (params.sort) queryParams.append('sort', params.sort)

    const url = `/boards/notice-event/search?${queryParams.toString()}`
    const response = await axiosInstance.get(url)
    return response.data
  } catch (error: any) {
    console.error('공지사항/이벤트 검색 실패:', error)
    throw error
  }
}

/**
 * 고정된 공지사항/이벤트 조회
 */
export async function getPinnedNoticeEvents(boardType?: 'NOTICE' | 'EVENT' | 'FAQ'): Promise<ApiResponse<NoticeEventListItem[]>> {
  try {
    const url = boardType
      ? `/boards/notice-event/pinned?boardType=${boardType}`
      : '/boards/notice-event/pinned'

    const response = await axiosInstance.get(url)
    return response.data
  } catch (error: any) {
    console.error('고정 공지사항/이벤트 조회 실패:', error)
    throw error
  }
}

/**
 * 공지사항 생성 (관리자 전용)
 */
export interface CreateNoticeRequest {
  title: string
  content: string
  categoryId?: number
  tags?: string[]
  isPublished?: boolean
  isPinned?: boolean
  thumbnailUuid?: string
}

export async function createNotice(data: CreateNoticeRequest): Promise<ApiResponse<NoticeEvent>> {
  try {
    const response = await axiosInstance.post('/admin/boards/notice', data)
    return response.data
  } catch (error: any) {
    console.error('공지사항 생성 실패:', error)
    throw error
  }
}

/**
 * 이벤트 생성 (관리자 전용)
 */
export interface CreateEventRequest {
  title: string
  content: string
  categoryId?: number
  tags?: string[]
  isPublished?: boolean
  isPinned?: boolean
  thumbnailUuid?: string
  eventStartDate: string
  eventEndDate: string
}

export async function createEvent(data: CreateEventRequest): Promise<ApiResponse<NoticeEvent>> {
  try {
    const response = await axiosInstance.post('/admin/boards/event', data)
    return response.data
  } catch (error: any) {
    console.error('이벤트 생성 실패:', error)
    throw error
  }
}

/**
 * 공지사항 수정 (관리자 전용)
 */
export interface UpdateNoticeRequest {
  title: string
  content: string
  categoryId?: number
  tags?: string[]
  isPublished?: boolean
  isPinned?: boolean
  thumbnailUuid?: string
}

export async function updateNotice(uuid: string, data: UpdateNoticeRequest): Promise<ApiResponse<NoticeEvent>> {
  try {
    const response = await axiosInstance.put(`/admin/boards/notice/${uuid}`, data)
    return response.data
  } catch (error: any) {
    console.error('공지사항 수정 실패:', error)
    throw error
  }
}

/**
 * 이벤트 수정 (관리자 전용)
 */
export interface UpdateEventRequest {
  title: string
  content: string
  categoryId?: number
  tags?: string[]
  isPublished?: boolean
  isPinned?: boolean
  thumbnailUuid?: string
  eventStartDate: string
  eventEndDate: string
}

export async function updateEvent(uuid: string, data: UpdateEventRequest): Promise<ApiResponse<NoticeEvent>> {
  try {
    const response = await axiosInstance.put(`/admin/boards/event/${uuid}`, data)
    return response.data
  } catch (error: any) {
    console.error('이벤트 수정 실패:', error)
    throw error
  }
}

/**
 * 공지사항 삭제 (관리자 전용)
 */
export async function deleteNotice(uuid: string): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.delete(`/admin/boards/notice/${uuid}`)

    // DELETE 요청은 204 No Content를 반환할 수 있으므로 status code로 판단
    if (response.status >= 200 && response.status < 300) {
      return {
        success: true,
        data: null,
        errorCode: null,
        message: null,
      }
    }

    // response.data가 있으면 그대로 반환
    return response.data
  } catch (error: any) {
    console.error('공지사항 삭제 실패:', error)
    throw error
  }
}

/**
 * 이벤트 삭제 (관리자 전용)
 */
export async function deleteEvent(uuid: string): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.delete(`/admin/boards/event/${uuid}`)

    // DELETE 요청은 204 No Content를 반환할 수 있으므로 status code로 판단
    if (response.status >= 200 && response.status < 300) {
      return {
        success: true,
        data: null,
        errorCode: null,
        message: null,
      }
    }

    // response.data가 있으면 그대로 반환
    return response.data
  } catch (error: any) {
    console.error('이벤트 삭제 실패:', error)
    throw error
  }
}
