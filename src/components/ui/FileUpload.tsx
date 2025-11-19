'use client'

import { useState } from 'react'
import { FiUpload, FiX, FiFile, FiImage } from 'react-icons/fi'

export interface FileAttachment {
  id?: number
  file?: File
  fileUuid?: string
  fileUrl?: string
  fileType: 'DRAWING' | 'PHOTO' | 'DOCUMENT' | 'ESTIMATE'
  fileDescription: string
  displayOrder: number
  originalFilename?: string
  mimeType?: string
  fileSize?: number
}

interface FileUploadProps {
  attachments: FileAttachment[]
  onChange: (attachments: FileAttachment[]) => void
  maxFiles?: number
}

export default function FileUpload({ attachments, onChange, maxFiles = 10 }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newAttachments: FileAttachment[] = []

    Array.from(files).forEach((file, index) => {
      if (attachments.length + newAttachments.length >= maxFiles) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const fileUrl = e.target?.result as string
        const fileType = file.type.startsWith('image/') ? 'PHOTO' : 'DOCUMENT'

        newAttachments.push({
          file,
          fileUrl,
          fileType,
          fileDescription: file.name,
          displayOrder: attachments.length + index,
          originalFilename: file.name,
          mimeType: file.type,
          fileSize: file.size
        })

        if (newAttachments.length === Math.min(files.length, maxFiles - attachments.length)) {
          onChange([...attachments, ...newAttachments])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const removeFile = (index: number) => {
    const updated = attachments.filter((_, i) => i !== index)
    onChange(updated.map((att, i) => ({ ...att, displayOrder: i })))
  }

  const updateDescription = (index: number, description: string) => {
    const updated = [...attachments]
    updated[index] = { ...updated[index], fileDescription: description }
    onChange(updated)
  }

  const updateFileType = (index: number, fileType: FileAttachment['fileType']) => {
    const updated = [...attachments]
    updated[index] = { ...updated[index], fileType }
    onChange(updated)
  }

  const isImage = (mimeType?: string) => {
    return mimeType?.startsWith('image/')
  }

  return (
    <div className="space-y-4">
      <label
        htmlFor="file-upload"
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer block ${
          isDragging
            ? 'border-primary bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <div className="flex flex-col items-center justify-center">
          <span className="text-primary font-medium hover:text-primary-dark">
            파일 선택
          </span>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
          />
          <p className="text-sm text-gray-500 mt-1">
            또는 파일을 드래그 앤 드롭하세요
          </p>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          최대 {maxFiles}개 파일 ({attachments.length}/{maxFiles})
        </p>
      </label>

      {attachments.length > 0 && (
        <div className="space-y-3">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex gap-4">
                {/* 파일 미리보기 */}
                <div className="flex-shrink-0">
                  {isImage(attachment.mimeType) ? (
                    <div className="w-20 h-20 rounded overflow-hidden bg-gray-100">
                      <img
                        src={attachment.fileUrl}
                        alt={attachment.originalFilename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded bg-gray-100 flex items-center justify-center">
                      <FiFile className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* 파일 정보 */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {attachment.originalFilename}
                      </p>
                      {attachment.fileSize && (
                        <p className="text-xs text-gray-500">
                          {(attachment.fileSize / 1024).toFixed(1)} KB
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="flex-shrink-0 text-gray-400 hover:text-red-500"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={attachment.fileType}
                      onChange={(e) =>
                        updateFileType(
                          index,
                          e.target.value as FileAttachment['fileType']
                        )
                      }
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="PHOTO">사진</option>
                      <option value="DRAWING">도면</option>
                      <option value="DOCUMENT">문서</option>
                      <option value="ESTIMATE">견적서</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    value={attachment.fileDescription}
                    onChange={(e) => updateDescription(index, e.target.value)}
                    placeholder="파일 설명을 입력하세요"
                    className="w-full text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
