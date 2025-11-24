'use client'

import { useState } from 'react'
import Image from 'next/image'
import { IoClose } from 'react-icons/io5'
import { useFileUpload } from '@/hooks/useFile'
import FileInput from './FileInput'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import type { EntityType } from '@/lib/api/file'

export interface ImageData {
  uuid: string
  url: string
}

interface ImageUploadProps {
  label?: string
  value?: ImageData | ImageData[] // 이미 업로드된 이미지 데이터
  onChange: (data: ImageData | ImageData[] | undefined) => void
  multiple?: boolean
  maxFiles?: number
  disabled?: boolean
  error?: string
  entityType?: EntityType // 파일 엔티티 타입 (기본값: COMPANY_IMAGE)
}

export default function ImageUpload({
  label,
  value,
  onChange,
  multiple = false,
  maxFiles = 5,
  disabled = false,
  error,
  entityType = 'COMPANY_IMAGE',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const fileUploadMutation = useFileUpload()

  // value를 배열로 정규화 (빈 url을 가진 이미지는 제외)
  const images = Array.isArray(value)
    ? value.filter(img => img.url && img.uuid)
    : value && value.url && value.uuid ? [value] : []

  const handleFilesChange = async (files: File[]) => {
    if (files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const uploadPromises = files.map(async (file, index) => {
        try {
          const result = await fileUploadMutation.mutateAsync({
            file,
            entityType,
            entityId: null,
          })
          setUploadProgress(((index + 1) / files.length) * 100)
          return {
            uuid: result.uuid,
            url: result.fileUrl,
          }
        } catch (error) {
          throw error
        }
      })

      const uploadedImages = await Promise.all(uploadPromises)

      if (multiple) {
        onChange([...images, ...uploadedImages])
      } else {
        onChange(uploadedImages[0])
      }

      showSuccessToast('이미지 업로드 완료')
    } catch (error) {
      showErrorToast(error, '이미지 업로드 실패')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    if (multiple) {
      onChange(newImages)
    } else {
      onChange(undefined)
    }
  }

  return (
    <div className="space-y-4">
      <FileInput
        label={label}
        accept="image/*"
        multiple={multiple}
        maxFiles={maxFiles}
        onChange={handleFilesChange}
        disabled={disabled || isUploading}
        error={error}
      />

      {/* 업로드 진행률 */}
      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* 업로드된 이미지 미리보기 */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.uuid || index}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group"
            >
              <Image
                src={image.url}
                alt={`업로드된 이미지 ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                disabled={disabled}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IoClose className="text-lg" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
