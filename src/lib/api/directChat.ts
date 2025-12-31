/**
 * Direct Chat API
 */

import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'
import type {
  ChatRoom,
  ChatMessage,
  PaginatedMessages,
  CreateChatRoomRequest,
  SendMessageRequest,
  PresignedUrlRequest,
  PresignedUrlResponse,
  FileCompleteRequest,
  FileCompleteResponse,
} from '@/types/directChat'

// ========================================
// 채팅방 관리
// ========================================

/**
 * 채팅방 생성 또는 기존 채팅방 조회
 */
export const createOrGetChatRoom = async (
  request: CreateChatRoomRequest
): Promise<ApiResponse<ChatRoom>> => {
  const response = await axiosInstance.post('/direct-chats/rooms', request)
  return response.data
}

/**
 * 내 채팅방 목록 조회
 */
export const getChatRooms = async (): Promise<ApiResponse<ChatRoom[]>> => {
  const response = await axiosInstance.get('/direct-chats/rooms')
  return response.data
}

/**
 * 채팅방 상세 조회
 */
export const getChatRoom = async (
  roomUuid: string
): Promise<ApiResponse<ChatRoom>> => {
  const response = await axiosInstance.get(`/direct-chats/rooms/${roomUuid}`)
  return response.data
}

/**
 * 채팅방 나가기
 */
export const leaveChatRoom = async (
  roomUuid: string
): Promise<ApiResponse<void>> => {
  const response = await axiosInstance.delete(`/direct-chats/rooms/${roomUuid}`)
  return response.data
}

// ========================================
// 메시지 관리
// ========================================

/**
 * 메시지 목록 조회 (페이징)
 */
export const getMessages = async (
  roomUuid: string,
  page: number = 0,
  size: number = 50
): Promise<ApiResponse<PaginatedMessages>> => {
  const response = await axiosInstance.get(
    `/direct-chats/rooms/${roomUuid}/messages`,
    { params: { page, size } }
  )
  return response.data
}

/**
 * 메시지 전송 (REST)
 */
export const sendMessage = async (
  roomUuid: string,
  request: SendMessageRequest
): Promise<ApiResponse<ChatMessage>> => {
  const response = await axiosInstance.post(
    `/direct-chats/rooms/${roomUuid}/messages`,
    request
  )
  return response.data
}

/**
 * 읽음 처리
 */
export const markAsRead = async (
  roomUuid: string
): Promise<ApiResponse<void>> => {
  const response = await axiosInstance.post(
    `/direct-chats/rooms/${roomUuid}/read`
  )
  return response.data
}

/**
 * 채팅방 미읽음 수 조회
 */
export const getRoomUnreadCount = async (
  roomUuid: string
): Promise<ApiResponse<number>> => {
  const response = await axiosInstance.get(
    `/direct-chats/rooms/${roomUuid}/unread-count`
  )
  return response.data
}

/**
 * 전체 미읽음 수 조회
 */
export const getTotalUnreadCount = async (): Promise<ApiResponse<number>> => {
  const response = await axiosInstance.get('/direct-chats/unread-count')
  return response.data
}

// ========================================
// 파일 업로드
// ========================================

/**
 * Presigned URL 요청
 */
export const getPresignedUrl = async (
  request: PresignedUrlRequest
): Promise<ApiResponse<PresignedUrlResponse>> => {
  const response = await axiosInstance.post('/files/presigned', request)
  return response.data
}

/**
 * S3 직접 업로드
 */
export const uploadToS3 = async (
  presignedUrl: string,
  file: File
): Promise<void> => {
  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  })
}

/**
 * 업로드 완료 처리
 */
export const completeUpload = async (
  request: FileCompleteRequest
): Promise<ApiResponse<FileCompleteResponse>> => {
  const response = await axiosInstance.post('/files/complete', request)
  return response.data
}

/**
 * 채팅용 파일 업로드 (3단계 통합)
 */
export const uploadChatFile = async (
  file: File
): Promise<FileCompleteResponse> => {
  // 1. Presigned URL 요청
  const presignedResponse = await getPresignedUrl({
    filename: file.name,
    mimeType: file.type,
    fileSize: file.size,
    entityType: 'CHAT_ATTACHMENT',
  })

  if (!presignedResponse.success || !presignedResponse.data) {
    throw new Error('Presigned URL 요청 실패')
  }

  const { presignedUrl, uploadId, fileKey } = presignedResponse.data

  // 2. S3 직접 업로드
  await uploadToS3(presignedUrl, file)

  // 3. 업로드 완료 처리
  const completeResponse = await completeUpload({ uploadId, fileKey })

  if (!completeResponse.success || !completeResponse.data) {
    throw new Error('업로드 완료 처리 실패')
  }

  return completeResponse.data
}
