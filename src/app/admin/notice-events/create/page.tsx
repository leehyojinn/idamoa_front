'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createNotice, createEvent } from '@/lib/api/notice-event'
import { uploadFile } from '@/lib/api/file'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'
import { FiPlus, FiX, FiFile, FiImage } from 'react-icons/fi'

export default function CreateNoticeEventPage() {
  const router = useRouter()
  const [boardType, setBoardType] = useState<'NOTICE' | 'EVENT'>('NOTICE')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isPublished, setIsPublished] = useState(true)
  const [isPinned, setIsPinned] = useState(false)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [thumbnailUuid, setThumbnailUuid] = useState<string | null>(null)
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])
  const [attachmentUuids, setAttachmentUuids] = useState<string[]>([])
  const [eventStartDate, setEventStartDate] = useState('')
  const [eventEndDate, setEventEndDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showErrorToast(null, '이미지 파일만 선택할 수 있습니다.')
      return
    }

    setThumbnailFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachmentFiles((prev) => [...prev, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      showErrorToast(null, '제목을 입력해주세요.')
      return
    }

    if (!content.trim()) {
      showErrorToast(null, '내용을 입력해주세요.')
      return
    }

    if (boardType === 'EVENT' && eventStartDate && eventEndDate) {
      if (new Date(eventStartDate) > new Date(eventEndDate)) {
        showErrorToast(null, '시작일은 종료일보다 이전이어야 합니다.')
        return
      }
    }

    setIsSubmitting(true)

    try {
      // 썸네일 업로드
      let uploadedThumbnailUuid = thumbnailUuid
      if (thumbnailFile && !thumbnailUuid) {
        const result = await uploadFile(thumbnailFile, 'OTHER')
        uploadedThumbnailUuid = result.uuid
        setThumbnailUuid(result.uuid)
      }

      // 첨부파일 업로드
      const uploadedAttachmentUuids = [...attachmentUuids]
      for (const file of attachmentFiles) {
        if (!attachmentUuids.includes(file.name)) {
          const result = await uploadFile(file, 'OTHER')
          uploadedAttachmentUuids.push(result.uuid)
        }
      }
      setAttachmentUuids(uploadedAttachmentUuids)

      // 게시글 생성
      if (boardType === 'NOTICE') {
        const response = await createNotice({
          title: title.trim(),
          content: content.trim(),
          tags: tags.length > 0 ? tags : undefined,
          isPublished,
          isPinned,
          thumbnailUuid: uploadedThumbnailUuid || undefined,
          attachmentUuids: uploadedAttachmentUuids.length > 0 ? uploadedAttachmentUuids : undefined,
        })

        if (response.success) {
          showSuccessToast('공지사항이 생성되었습니다.')
          router.push('/admin/notice-events')
        }
      } else {
        const response = await createEvent({
          title: title.trim(),
          content: content.trim(),
          tags: tags.length > 0 ? tags : undefined,
          isPublished,
          isPinned,
          thumbnailUuid: uploadedThumbnailUuid || undefined,
          attachmentUuids: uploadedAttachmentUuids.length > 0 ? uploadedAttachmentUuids : undefined,
          eventStartDate: eventStartDate || undefined,
          eventEndDate: eventEndDate || undefined,
        })

        if (response.success) {
          showSuccessToast('이벤트가 생성되었습니다.')
          router.push('/admin/notice-events')
        }
      }
    } catch (error) {
      showErrorToast(error, '게시글 생성에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-64px-200px)]">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">게시글 작성</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* 게시판 타입 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              게시판 타입 *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="NOTICE"
                  checked={boardType === 'NOTICE'}
                  onChange={(e) => setBoardType(e.target.value as 'NOTICE')}
                  className="mr-2"
                />
                공지사항
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="EVENT"
                  checked={boardType === 'EVENT'}
                  onChange={(e) => setBoardType(e.target.value as 'EVENT')}
                  className="mr-2"
                />
                이벤트
              </label>
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="제목을 입력하세요 (최대 200자)"
              required
            />
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용 *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={10000}
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="내용을 입력하세요 (최대 10000자)"
              required
            />
          </div>

          {/* 이벤트 기간 (이벤트만) */}
          {boardType === 'EVENT' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시작일
                </label>
                <input
                  type="datetime-local"
                  value={eventStartDate}
                  onChange={(e) => setEventStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  종료일
                </label>
                <input
                  type="datetime-local"
                  value={eventEndDate}
                  onChange={(e) => setEventEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* 썸네일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              썸네일 이미지
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="hidden"
              id="thumbnail-upload"
            />
            <label
              htmlFor="thumbnail-upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <FiImage />
              썸네일 선택
            </label>
            {thumbnailPreview && (
              <div className="mt-4 relative inline-block">
                <Image
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  width={192}
                  height={192}
                  className="w-48 h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setThumbnailFile(null)
                    setThumbnailPreview(null)
                    setThumbnailUuid(null)
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <FiX />
                </button>
              </div>
            )}
          </div>

          {/* 첨부파일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              첨부파일
            </label>
            <input
              type="file"
              multiple
              onChange={handleAttachmentChange}
              className="hidden"
              id="attachment-upload"
            />
            <label
              htmlFor="attachment-upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <FiFile />
              파일 선택
            </label>
            {attachmentFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachmentFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 태그 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              태그
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="태그 입력 후 엔터"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <FiPlus />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FiX size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 옵션 */}
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">즉시 게시</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">상단 고정</span>
            </label>
          </div>

          {/* 버튼 */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '작성 중...' : '작성 완료'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </AdminGuard>
  )
}
