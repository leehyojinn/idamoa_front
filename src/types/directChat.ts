/**
 * Direct Chat Types
 */

// 사용자 정보
export interface ChatUser {
  uuid: string
  email: string
  nickname: string
  profileImageUrl?: string
  isOnline: boolean
}

// 채팅방
export interface ChatRoom {
  uuid: string
  otherUser: ChatUser
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: number
}

// 첨부파일
export interface ChatAttachment {
  uuid: string
  fileUuid: string
  originalFilename: string
  fileUrl: string
  fileSize: number
  mimeType: string
}

// 메시지 타입
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'

// 메시지
export interface ChatMessage {
  uuid: string
  content: string
  messageType: MessageType
  senderUuid: string
  senderNickname: string
  isMine: boolean
  attachments: ChatAttachment[]
  createdAt: string
}

// 페이지네이션된 메시지 응답
export interface PaginatedMessages {
  content: ChatMessage[]
  totalPages: number
  totalElements: number
  size: number
  number: number
}

// 타이핑 상태
export interface TypingStatus {
  roomUuid: string
  userUuid: string
  nickname: string
  isTyping: boolean
}

// 채팅방 생성 요청
export interface CreateChatRoomRequest {
  targetUserUuid: string
}

// 메시지 전송 요청
export interface SendMessageRequest {
  content: string
  messageType: MessageType
  fileUuids?: string[]
}

// 파일 업로드 관련
export interface PresignedUrlRequest {
  filename: string
  mimeType: string
  fileSize: number
  entityType: 'CHAT_ATTACHMENT'
}

export interface PresignedUrlResponse {
  presignedUrl: string
  uploadId: string
  fileKey: string
  expiresIn: number
}

export interface FileCompleteRequest {
  uploadId: string
  fileKey: string
}

export interface FileCompleteResponse {
  uuid: string
  fileUrl: string
  originalFilename: string
  fileSize: number
  mimeType: string
}

// 미읽음 수
export interface UnreadCountResponse {
  unreadCount: number
}
