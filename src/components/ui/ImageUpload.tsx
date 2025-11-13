'use client'

import { useState } from 'react'
import Image from 'next/image'
import { IoClose } from 'react-icons/io5'
import { useFileUpload } from '@/hooks/useFile'
import FileInput from './FileInput'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'

interface ImageUploadProps {
  label?: string
  value?: string | string[] // 이미 업로드된 이미지 URL
  onChange: (url: string | string[]) => void
  multiple?: boolean
  maxFiles?: number
  disabled?: boolean
  error?: string
}

export default function ImageUpload({
  label,
  value,
  onChange,
  multiple = false,
  maxFiles = 5,
  disabled = false,
  error,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const fileUploadMutation = useFileUpload()

  // value를 배열로 정규화
  const imageUrls = Array.isArray(value) ? value : value ? [value] : []

  const handleFilesChange = async (files: File[]) => {
    if (files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const uploadPromises = files.map(async (file, index) => {
        try {
          const url = await fileUploadMutation.mutateAsync({
            file,
            entityType: 'COMPANY_IMAGE',
            entityId: null,
          })
          setUploadProgress(((index + 1) / files.length) * 100)
          return url
        } catch (error) {
          console.error(`파일 업로드 실패: ${file.name}`, error)
          throw error
        }
      })

      const uploadedUrls = await Promise.all(uploadPromises)

      if (multiple) {
        onChange([...imageUrls, ...uploadedUrls])
      } else {
        onChange(uploadedUrls[0])
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
    const newUrls = imageUrls.filter((_, i) => i !== index)
    if (multiple) {
      onChange(newUrls)
    } else {
      onChange('')
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
      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {imageUrls.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group"
            >
              <Image
                src={url}
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
