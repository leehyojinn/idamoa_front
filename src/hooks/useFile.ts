/**
 * File Upload React Query Hooks
 */

import { useMutation } from '@tanstack/react-query'
import { uploadFile, type EntityType } from '@/lib/api/file'

// ========================================
// Mutations
// ========================================

export interface UploadFileParams {
  file: File
  entityType: EntityType
  entityId?: number | null
}

/**
 * 파일 업로드 (전체 플로우)
 * Presigned URL 생성 → S3 업로드 → 완료 알림
 */
export const useFileUpload = () => {
  return useMutation<string, Error, UploadFileParams>({
    mutationFn: async ({ file, entityType, entityId }) => {
      return await uploadFile(file, entityType, entityId)
    },
  })
}

/**
 * 여러 파일 업로드
 */
export const useMultipleFileUpload = () => {
  return useMutation<string[], Error, UploadFileParams[]>({
    mutationFn: async (uploads) => {
      const uploadPromises = uploads.map(({ file, entityType, entityId }) =>
        uploadFile(file, entityType, entityId)
      )
      return await Promise.all(uploadPromises)
    },
  })
}
