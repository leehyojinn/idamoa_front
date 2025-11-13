/**
 * File API
 * S3 Presigned URL을 이용한 파일 업로드
 */

import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'

// ========================================
// Types
// ========================================

export type EntityType =
  | 'COMPANY_IMAGE'
  | 'USER_PROFILE'
  | 'PORTFOLIO'
  | 'REVIEW'
  | 'OTHER'

export interface PresignedUrlRequest {
  filename: string
  mimeType: string
  fileSize: number
  entityType: EntityType
  entityId?: number | null
}

export interface PresignedUrlResponse {
  uploadId: string
  presignedUrl: string
  fileKey: string
  filename: string
  expiresIn: number
  callbackUrl: string
}

export interface FileUploadCompleteRequest {
  uploadId: string
  fileKey: string
  width?: number
  height?: number
  description?: string
}

export interface FileUploadCompleteResponse {
  id: number
  originalFilename: string
  storedFilename: string
  fileUrl: string
  fileSize: number
  mimeType: string
  fileExtension: string
  entityType: EntityType | null
  entityId: number | null
  createdAt: string
}

// ========================================
// API Functions
// ========================================

/**
 * Presigned URL 생성
 */
export const createPresignedUrl = async (
  data: PresignedUrlRequest
): Promise<ApiResponse<PresignedUrlResponse>> => {
  const response = await axiosInstance.post('/files/presigned', data)
  return response.data
}

/**
 * S3에 파일 업로드 (직접)
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
 * 파일 업로드 완료 알림
 */
export const completeFileUpload = async (
  data: FileUploadCompleteRequest
): Promise<ApiResponse<FileUploadCompleteResponse>> => {
  const response = await axiosInstance.post('/files/complete', data)
  return response.data
}

/**
 * 전체 업로드 플로우 (헬퍼 함수)
 */
export const uploadFile = async (
  file: File,
  entityType: EntityType,
  entityId?: number | null
): Promise<string> => {
  // 1. Presigned URL 요청
  const presignedResponse = await createPresignedUrl({
    filename: file.name,
    mimeType: file.type,
    fileSize: file.size,
    entityType,
    entityId,
  })

  if (!presignedResponse.success) {
    throw new Error('Presigned URL 생성 실패')
  }

  // 2. S3에 업로드
  await uploadToS3(presignedResponse.data.presignedUrl, file)

  // 3. 업로드 완료 알림
  const completeResponse = await completeFileUpload({
    uploadId: presignedResponse.data.uploadId,
    fileKey: presignedResponse.data.fileKey,
  })

  if (!completeResponse.success) {
    throw new Error('파일 업로드 완료 처리 실패')
  }

  // 4. 파일 URL 반환
  return completeResponse.data.fileUrl
}
