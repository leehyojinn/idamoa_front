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
  | 'POPUP_IMAGE'
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
  uuid: string
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
): Promise<{ uuid: string; fileUrl: string }> => {
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

  // 4. fileUuid와 fileUrl 반환
  return {
    uuid: completeResponse.data.uuid,
    fileUrl: completeResponse.data.fileUrl,
  }
}

// ========================================
// 파일 다운로드 관련 Types
// ========================================

/**
 * 파일 구매 상태 응답
 */
export interface FilePurchaseStatusResponse {
  fileUuid: string
  isPaid: boolean
  price: number
  hasPurchased: boolean
  canDownload: boolean
}

/**
 * 파일 다운로드 응답
 */
export interface FileDownloadResponse {
  fileUuid: string
  fileName: string
  downloadUrl: string
  price: number
}

/**
 * 크레딧 잔액 응답
 */
export interface CreditBalanceResponse {
  balance: number
  currency: string
}

// ========================================
// 파일 다운로드 관련 API Functions
// ========================================

/**
 * 파일 구매 상태 확인
 * GET /api/files/{fileUuid}/purchase-status
 */
export const getFilePurchaseStatus = async (
  fileUuid: string
): Promise<FilePurchaseStatusResponse> => {
  const response = await axiosInstance.get<ApiResponse<FilePurchaseStatusResponse>>(
    `/files/${fileUuid}/purchase-status`
  )
  if (!response.data.success) {
    throw new Error(response.data.message || '구매 상태 확인 실패')
  }
  return response.data.data
}

/**
 * 파일 다운로드 (크레딧 차감)
 * POST /api/files/{fileUuid}/download
 */
export const downloadFile = async (
  fileUuid: string
): Promise<FileDownloadResponse> => {
  const response = await axiosInstance.post<ApiResponse<FileDownloadResponse>>(
    `/files/${fileUuid}/download`
  )
  if (!response.data.success) {
    const errorCode = (response.data as any).errorCode
    if (errorCode === 'INSUFFICIENT_CREDITS') {
      throw {
        code: 'INSUFFICIENT_CREDITS',
        message: '크레딧이 부족합니다. 충전 후 다시 시도해주세요.'
      }
    }
    if (errorCode === 'DOWNLOAD_LIMIT_EXCEEDED') {
      throw {
        code: 'DOWNLOAD_LIMIT_EXCEEDED',
        message: '다운로드 제한을 초과했습니다.'
      }
    }
    throw new Error(response.data.message || '다운로드 실패')
  }
  return response.data.data
}

/**
 * 크레딧 잔액 조회
 * GET /api/payments/credits/balance
 */
export const getCreditBalance = async (): Promise<CreditBalanceResponse> => {
  const response = await axiosInstance.get<ApiResponse<CreditBalanceResponse>>(
    '/payments/credits/balance'
  )
  if (!response.data.success) {
    throw new Error(response.data.message || '크레딧 잔액 조회 실패')
  }
  return response.data.data
}
