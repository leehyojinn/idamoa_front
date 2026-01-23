/**
 * 업체 대시보드 타입 정의
 */

// ===== 광고 캠페인 =====
export type AdType = 'SEARCH' | 'FEATURED' | 'BANNER'
export type AdCampaignStatus = 'PENDING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'

export interface AdCampaign {
  uuid: string
  companyUuid: string
  name: string
  description?: string
  adType: AdType
  status: AdCampaignStatus
  startDate: string
  endDate: string
  durationDays: number
  remainingDays: number
  totalSpent: number
  priorityScore: number
  autoRenew: boolean
  createdAt: string
}

// ===== 다이렉트 채팅 =====
export interface ParticipantInfo {
  uuid: string
  email: string
  nickname: string
  profileImageUrl?: string
  isOnline: boolean
}

export interface DirectChatRoom {
  uuid: string
  otherUser: ParticipantInfo
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: number
  isActive: boolean
  createdAt: string
}

export interface DirectChatFile {
  uuid: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
}

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE'

export interface DirectChatMessage {
  uuid: string
  content?: string
  messageType: MessageType
  isMine: boolean
  isRead: boolean
  files: DirectChatFile[]
  createdAt: string
}

// ===== 크레딧 =====
export interface CreditBalance {
  balance: number
  pendingRefund?: number
}

export interface CreditPackage {
  code: string
  name: string
  unitAmount: number
  creditAmount: number
  bonusAmount: number
  description: string
}

export type TransactionType = 'CHARGE' | 'USE' | 'REFUND' | 'BONUS' | 'ADMIN_ADJUST'

export interface CreditTransaction {
  uuid: string
  transactionType: TransactionType
  amount: number
  balance: number
  description: string
  createdAt: string
}

// ===== 알림 =====
export type NotificationType =
  | 'CONSULTATION_NEW'
  | 'CONSULTATION_STATUS'
  | 'REVIEW_NEW'
  | 'PROPOSAL_VIEWED'
  | 'PROPOSAL_SELECTED'
  | 'PROPOSAL_REJECTED'
  | 'CHAT_MESSAGE'
  | 'CREDIT_CHARGE'
  | 'CREDIT_REFUND'
  | 'AD_EXPIRING'

export interface Notification {
  uuid: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, string>
  isRead: boolean
  createdAt: string
}

// ===== 공통 =====
export interface UnreadCountResponse {
  unreadCount: number
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

// ===== 대시보드 요약 =====
export interface CompanyDashboardSummary {
  company: {
    uuid: string
    name: string
    avgRating: number
    reviewCount: number
    viewCount: number
    likeCount: number
    portfolioCount: number
  }
  creditBalance: number
  pendingConsultations: number
  unreadNotifications: number
  unreadChats: number
  activeAdCampaign?: AdCampaign
}
