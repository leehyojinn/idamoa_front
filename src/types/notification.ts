/**
 * 알림 타입
 */
export type NotificationType =
  | 'ESTIMATE_NEW_PROPOSAL' // 견적 요청에 새 제안
  | 'ESTIMATE_PROPOSAL_ACCEPTED' // 제안 수락
  | 'ESTIMATE_PROPOSAL_REJECTED' // 제안 거절
  | 'ESTIMATE_STATUS_CHANGED' // 견적 상태 변경
  | 'COMPANY_VERIFICATION_APPROVED' // 업체 인증 승인
  | 'COMPANY_VERIFICATION_REJECTED' // 업체 인증 거절
  | 'SYSTEM_NOTICE' // 시스템 공지
  | 'POPUP_PUBLISHED' // 팝업 게시
  | 'POPUP_EXPIRED' // 팝업 만료

/**
 * 알림 채널
 */
export type NotificationChannel = 'EMAIL' | 'SMS' | 'KAKAO' | 'FCM'

/**
 * 알림 객체
 */
export interface Notification {
  uuid: string
  notificationType: NotificationType
  channel: NotificationChannel
  title: string
  content: string
  templateData: Record<string, string>
  isRead: boolean
  readAt: string | null
  createdAt: string
}

/**
 * 알림 목록 응답
 */
export interface NotificationListResponse {
  notifications: Notification[]
  totalCount: number
}

/**
 * 미읽음 알림 개수 응답
 */
export interface UnreadCountResponse {
  unreadCount: number
}

/**
 * WebSocket 알림 메시지
 */
export interface WebSocketNotificationMessage {
  type: 'NEW_NOTIFICATION' | 'READ_NOTIFICATION' | 'DELETE_NOTIFICATION'
  notification: Notification
}
