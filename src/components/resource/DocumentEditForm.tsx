'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { FiPlus, FiX, FiFile, FiTag, FiImage } from 'react-icons/fi'
import { getDocument, updateDocument, type UpdateDocumentRequest, type Document, type DocumentFile } from '@/lib/api/resource'
import { uploadFile } from '@/lib/api/file'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { useAuth } from '@/hooks/useAuth'

interface FileAttachment {
  file: File
  fileUuid?: string
}

interface ThumbnailAttachment {
  file: File
  preview: string
  fileUuid?: string
}

interface ExistingFile {
  uuid: string
  originalFilename: string
  fileSize: number
  fileUrl: string
}

// 파일 크기 포맷
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

interface DocumentEditFormProps {
  uuid: string
}

export default function DocumentEditForm({ uuid }: DocumentEditFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [document, setDocument] = useState<Document | null>(null)

  // 기본 정보
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  // 유료 설정
  const [isPaid, setIsPaid] = useState(false)
  const [price, setPrice] = useState('')

  // 태그
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // 기존 파일
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([])
  const [removedFileUuids, setRemovedFileUuids] = useState<string[]>([])

  // 새 파일
  const [newFiles, setNewFiles] = useState<FileAttachment[]>([])

  // 썸네일
  const [thumbnail, setThumbnail] = useState<ThumbnailAttachment | null>(null)
  const [existingThumbnail, setExistingThumbnail] = useState<{ uuid: string; fileUrl: string } | null>(null)
  const [removeThumbnail, setRemoveThumbnail] = useState(false)

  const fetchDocument = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getDocument(uuid)
      if (result.success && result.data) {
        const doc = result.data
        setDocument(doc)
        setTitle(doc.title)
        setContent(doc.content || '')
        setIsPaid(doc.isPaid)
        setPrice(doc.price?.toString() || '')
        setTags(doc.tags || [])

        // 기존 파일 설정
        if (doc.files && doc.files.length > 0) {
          setExistingFiles(doc.files.map((f: DocumentFile) => ({
            uuid: f.uuid,
            originalFilename: f.originalFilename,
            fileSize: f.fileSize,
            fileUrl: f.fileUrl
          })))
        }

        // 기존 썸네일 설정
        if (doc.thumbnail) {
          setExistingThumbnail({
            uuid: doc.thumbnail.uuid,
            fileUrl: doc.thumbnail.fileUrl
          })
        }
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        showErrorToast(error, '자료를 찾을 수 없습니다')
        router.push('/resources')
      } else {
        showErrorToast(error, '자료를 불러오는데 실패했습니다')
      }
    } finally {
      setIsLoading(false)
    }
  }, [uuid, router])

  useEffect(() => {
    if (!user) {
      showErrorToast(null, '로그인이 필요합니다')
      router.push('/login')
      return
    }
    fetchDocument()
  }, [user, router, fetchDocument])

  // 권한 체크
  useEffect(() => {
    if (document && user && user.email !== document.userEmail) {
      showErrorToast(null, '수정 권한이 없습니다')
      router.push(`/resources/${uuid}`)
    }
  }, [document, user, router, uuid])

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return

    const files: FileAttachment[] = Array.from(selectedFiles).map(file => ({
      file,
    }))

    setNewFiles([...newFiles, ...files])
  }

  const handleRemoveNewFile = (index: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== index))
  }

  const handleRemoveExistingFile = (fileUuid: string) => {
    setExistingFiles(existingFiles.filter(f => f.uuid !== fileUuid))
    setRemovedFileUuids([...removedFileUuids, fileUuid])
  }

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showErrorToast(null, '이미지 파일만 선택할 수 있습니다')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const preview = e.target?.result as string
      setThumbnail({ file, preview })
      setExistingThumbnail(null)
      setRemoveThumbnail(false)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveThumbnailClick = () => {
    setThumbnail(null)
    setExistingThumbnail(null)
    setRemoveThumbnail(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 유효성 검사
    if (!title.trim()) {
      showErrorToast(null, '제목을 입력하세요')
      return
    }

    if (!content.trim()) {
      showErrorToast(null, '내용을 입력하세요')
      return
    }

    const totalFiles = existingFiles.length + newFiles.length
    if (totalFiles === 0) {
      showErrorToast(null, '최소 1개 이상의 파일을 추가하세요')
      return
    }

    if (isPaid && (!price || parseInt(price) <= 0)) {
      showErrorToast(null, '유료 파일의 가격을 입력하세요')
      return
    }

    setIsSubmitting(true)

    try {
      // 새 파일 업로드
      const newFileUuids: string[] = []
      for (const fileAttachment of newFiles) {
        try {
          const result = await uploadFile(fileAttachment.file, 'OTHER')
          newFileUuids.push(result.uuid)
        } catch (error) {
          console.error('파일 업로드 실패:', error)
          throw new Error(`파일 업로드 실패: ${fileAttachment.file.name}`)
        }
      }

      // 새 썸네일 업로드
      let thumbnailUuid: string | undefined
      if (thumbnail) {
        try {
          const result = await uploadFile(thumbnail.file, 'OTHER')
          thumbnailUuid = result.uuid
        } catch (error) {
          console.error('썸네일 업로드 실패:', error)
          throw new Error('썸네일 업로드에 실패했습니다')
        }
      }

      // 자료 수정
      const fileUuids = [
        ...existingFiles.map(f => f.uuid),
        ...newFileUuids
      ]

      const data: UpdateDocumentRequest = {
        title: title.trim(),
        content: content.trim(),
        fileUuids,
        isPaid,
        price: isPaid ? parseInt(price) : undefined,
        tags: tags.length > 0 ? tags : undefined,
      }

      // 썸네일 처리
      if (thumbnailUuid) {
        data.thumbnailUuid = thumbnailUuid
      } else if (removeThumbnail) {
        data.thumbnailUuid = undefined
      } else if (existingThumbnail) {
        data.thumbnailUuid = existingThumbnail.uuid
      }

      const result = await updateDocument(uuid, data)

      if (result.success) {
        showSuccessToast('자료가 수정되었습니다')
        router.push(`/resources/${uuid}`)
      }
    } catch (error: any) {
      if (error?.response?.status === 400) {
        showErrorToast(error, '입력 정보를 확인해주세요')
      } else if (error?.response?.status === 403) {
        showErrorToast(error, '수정 권한이 없습니다')
      } else {
        showErrorToast(error, '자료 수정에 실패했습니다')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-4 text-gray-600">자료를 불러오는 중...</p>
      </div>
    )
  }

  if (!document) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">자료 수정</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 기본 정보 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">기본 정보</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="자료 제목을 입력하세요"
                />
                <p className="text-sm text-gray-500 mt-1">{title.length}/200자</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  maxLength={5000}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="자료에 대한 설명을 입력하세요"
                />
                <p className="text-sm text-gray-500 mt-1">{content.length}/5000자</p>
              </div>
            </div>
          </div>

          {/* 유료 설정 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">유료 설정</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPaid"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isPaid" className="text-sm font-medium text-gray-700">
                  유료 자료로 설정
                </label>
              </div>

              {isPaid && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    가격 (원) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="가격을 입력하세요"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 태그 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">태그</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="태그 입력 후 엔터 또는 추가 버튼"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                >
                  추가
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                    >
                      <FiTag className="text-xs" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 썸네일 업로드 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">썸네일 이미지</h2>
            <div className="space-y-4">
              {!thumbnail && !existingThumbnail ? (
                <label
                  htmlFor="thumbnail-upload"
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer block"
                >
                  <FiImage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <span className="text-blue-600 font-medium hover:text-blue-700">
                    썸네일 이미지 선택
                  </span>
                  <input
                    id="thumbnail-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleThumbnailSelect}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    자료 미리보기 이미지 (선택사항)
                  </p>
                </label>
              ) : (
                <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                  {thumbnail ? (
                    <Image
                      src={thumbnail.preview}
                      alt="썸네일"
                      width={120}
                      height={80}
                      className="w-30 h-20 object-cover rounded"
                      unoptimized
                    />
                  ) : existingThumbnail ? (
                    <Image
                      src={existingThumbnail.fileUrl}
                      alt="썸네일"
                      width={120}
                      height={80}
                      className="w-30 h-20 object-cover rounded"
                    />
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {thumbnail ? thumbnail.file.name : '기존 썸네일'}
                    </p>
                    {thumbnail && (
                      <p className="text-xs text-gray-500">
                        {formatFileSize(thumbnail.file.size)}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveThumbnailClick}
                    className="text-red-600 hover:text-red-700"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 파일 업로드 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              첨부 파일 <span className="text-red-500">*</span>
            </h2>
            <div className="space-y-4">
              <label
                htmlFor="file-upload"
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer block"
              >
                <FiFile className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="flex flex-col items-center justify-center">
                  <span className="text-blue-600 font-medium hover:text-blue-700">
                    파일 선택
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleFileSelect}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    여러 파일을 선택할 수 있습니다
                  </p>
                </div>
              </label>

              {/* 기존 파일 */}
              {existingFiles.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 font-medium">
                    기존 파일 ({existingFiles.length}개)
                  </p>
                  {existingFiles.map((file) => (
                    <div
                      key={file.uuid}
                      className="flex items-center gap-4 bg-blue-50 rounded-lg p-4"
                    >
                      <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                        <FiFile className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.originalFilename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.fileSize)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingFile(file.uuid)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 새 파일 */}
              {newFiles.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 font-medium">
                    새 파일 ({newFiles.length}개)
                  </p>
                  {newFiles.map((fileAttachment, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 bg-green-50 rounded-lg p-4"
                    >
                      <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                        <FiPlus className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {fileAttachment.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(fileAttachment.file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewFile(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '수정 중...' : '자료 수정'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold text-lg transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
