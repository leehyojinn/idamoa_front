import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'
import type {
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
} from '@/types/notification'

/**
 * 알림 목록 조회
 * @param page - 페이지 번호 (0부터 시작)
 * @param size - 페이지 크기
 * @param isRead - 읽음 여부 필터 (선택)
 */
export async function getNotifications(
  page: number = 0,
  size: number = 20,
  isRead?: boolean
): Promise<NotificationListResponse> {
  const params: Record<string, string | number | boolean> = { page, size }
  if (isRead !== undefined) {
    params.isRead = isRead
  }

  const response = await axiosInstance.get<ApiResponse<NotificationListResponse>>('/notifications', { params })
  return response.data.data
}

/**
 * 미읽음 알림 개수 조회
 */
export async function getUnreadCount(): Promise<UnreadCountResponse> {
  const response = await axiosInstance.get<ApiResponse<UnreadCountResponse>>('/notifications/unread-count')
  return response.data.data
}

/**
 * 알림 상세 조회
 * @param uuid - 알림 UUID
 */
export async function getNotification(uuid: string): Promise<Notification> {
  const response = await axiosInstance.get<ApiResponse<Notification>>(`/notifications/${uuid}`)
  return response.data.data
}

/**
 * 알림 읽음 처리
 * @param uuid - 알림 UUID
 */
export async function markAsRead(uuid: string): Promise<ApiResponse<null>> {
  const response = await axiosInstance.patch<ApiResponse<null>>(`/notifications/${uuid}/read`)
  return response.data
}

/**
 * 알림 삭제
 * @param uuid - 알림 UUID
 */
export async function deleteNotification(uuid: string): Promise<ApiResponse<null>> {
  const response = await axiosInstance.delete<ApiResponse<null>>(`/notifications/${uuid}`)
  return response.data
}
