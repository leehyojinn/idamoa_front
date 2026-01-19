'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'
import { FiArrowLeft, FiUpload, FiX, FiFile, FiImage, FiCode, FiEye } from 'react-icons/fi'
import {
  createCommunityPost,
  updateCommunityPost,
  type CommunityCategory,
  type CommunityPostDetail,
  type CommunityFile,
} from '@/lib/api/community'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { useAuth } from '@/hooks/useAuth'
import { uploadFile } from '@/lib/api/file'
import Checkbox from '@/components/ui/Checkbox'
import CategorySelect from '@/components/community/CategorySelect'

// 계층 구조에서 uuid로 카테고리 찾기
function findCategoryByUuid(categories: CommunityCategory[], uuid: string): CommunityCategory | null {
  for (const cat of categories) {
    if (cat.uuid === uuid) return cat
    if (cat.children) {
      const found = findCategoryByUuid(cat.children, uuid)
      if (found) return found
    }
  }
  return null
}

interface Props {
  categories: CommunityCategory[]
  initialData?: CommunityPostDetail
  isEdit?: boolean
}

export default function CommunityPostFormClient({ categories, initialData, isEdit }: Props) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  const [categoryUuid, setCategoryUuid] = useState(initialData?.categoryUuid || '')
  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [contentMode, setContentMode] = useState<'text' | 'html'>(initialData?.contentType === 'HTML' ? 'html' : 'text')
  const [isHtmlPreview, setIsHtmlPreview] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(initialData?.isAnonymous || false)
  const [files, setFiles] = useState<CommunityFile[]>(initialData?.attachments || [])
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 로그인 확인
  useEffect(() => {
    if (!isAuthenticated) {
      showErrorToast(null, '로그인이 필요합니다')
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // 수정 모드에서 소유자 확인
  useEffect(() => {
    if (isEdit && initialData && !initialData.isOwner) {
      showErrorToast(null, '수정 권한이 없습니다')
      router.push('/community')
    }
  }, [isEdit, initialData, router])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return

    const fileArray = Array.from(selectedFiles)
    setUploadingFiles(fileArray)

    try {
      for (const file of fileArray) {
        const result = await uploadFile(file, 'OTHER')
        setFiles((prev) => [
          ...prev,
          {
            uuid: result.uuid,
            originalFilename: file.name,
            fileUrl: result.fileUrl,
            fileSize: file.size,
            mimeType: file.type,
            fileExtension: file.name.split('.').pop() || '',
            attachmentType: file.type.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
            displayOrder: files.length,
          },
        ])
      }
    } catch (error) {
      showErrorToast(error, '파일 업로드에 실패했습니다')
    } finally {
      setUploadingFiles([])
      e.target.value = ''
    }
  }

  const handleRemoveFile = (uuid: string) => {
    setFiles((prev) => prev.filter((f) => f.uuid !== uuid))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!categoryUuid) {
      showErrorToast(null, '카테고리를 선택해주세요')
      return
    }

    if (!title.trim()) {
      showErrorToast(null, '제목을 입력해주세요')
      return
    }

    if (!content.trim()) {
      showErrorToast(null, '내용을 입력해주세요')
      return
    }

    setIsSubmitting(true)
    try {
      if (isEdit && initialData) {
        await updateCommunityPost(initialData.uuid, {
          title,
          content,
          contentType: contentMode === 'html' ? 'HTML' : 'TEXT',
          isAnonymous,
          fileUuids: files.map((f) => f.uuid),
        })
        showSuccessToast('게시글이 수정되었습니다')
        router.push(`/community/posts/${initialData.uuid}`)
      } else {
        const result = await createCommunityPost({
          categoryUuid,
          title,
          content,
          contentType: contentMode === 'html' ? 'HTML' : 'TEXT',
          isAnonymous,
          fileUuids: files.map((f) => f.uuid),
        })
        showSuccessToast('게시글이 작성되었습니다')
        if (result.success && result.data) {
          router.push(`/community/posts/${result.data.uuid}`)
        } else {
          router.push('/community')
        }
      }
    } catch (error) {
      showErrorToast(error, isEdit ? '게시글 수정에 실패했습니다' : '게시글 작성에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // 선택된 카테고리의 설정 확인 (계층 구조에서 찾기)
  const selectedCategory = findCategoryByUuid(categories, categoryUuid)

  return (
    <div className="space-y-6">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <FiArrowLeft className="w-5 h-5" />
        <span className="text-sm md:text-base">뒤로가기</span>
      </button>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="p-4 md:p-6 border-b border-gray-100">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            {isEdit ? '게시글 수정' : '글쓰기'}
          </h1>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {/* 카테고리 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리 <span className="text-red-500">*</span>
            </label>
            <CategorySelect
              value={categoryUuid}
              onChange={(cat) => setCategoryUuid(cat.uuid)}
              disabled={isEdit}
              placeholder="카테고리를 선택하세요"
            />
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              maxLength={300}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{title.length}/300</p>
          </div>

          {/* 내용 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                내용 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setContentMode('text')
                    setIsHtmlPreview(false)
                  }}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    contentMode === 'text'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  일반 텍스트
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setContentMode('html')
                    setIsHtmlPreview(false)
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    contentMode === 'html'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FiCode className="w-4 h-4" />
                  HTML 코드
                </button>
                {contentMode === 'html' && (
                  <button
                    type="button"
                    onClick={() => setIsHtmlPreview(!isHtmlPreview)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isHtmlPreview
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <FiEye className="w-4 h-4" />
                    미리보기
                  </button>
                )}
              </div>
            </div>
            {contentMode === 'html' && isHtmlPreview ? (
              <div
                className="w-full min-h-[300px] p-3 border border-gray-300 rounded-lg bg-gray-50 prose prose-sm max-w-none overflow-auto"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
              />
            ) : contentMode === 'html' ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="HTML 코드를 입력하세요.&#10;&#10;예시:&#10;<h3>제목</h3>&#10;<p>내용입니다.</p>&#10;<ul><li>목록 1</li><li>목록 2</li></ul>"
                rows={12}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base resize-y font-mono"
              />
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용을 입력하세요"
                rows={12}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base resize-y"
              />
            )}
            <p className="text-xs text-gray-500 mt-1 text-right">
              {content.length}자{contentMode === 'html' && ' | HTML 모드'}
            </p>
          </div>

          {/* 첨부파일 */}
          {(!selectedCategory || selectedCategory.allowAttachments) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">첨부파일</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={!!(selectedCategory && files.length >= selectedCategory.maxAttachments)}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FiUpload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    파일을 선택하거나 여기에 드래그하세요
                  </p>
                  {selectedCategory && (
                    <p className="text-xs text-gray-500 mt-1">
                      최대 {selectedCategory.maxAttachments}개까지 업로드 가능 ({files.length}/{selectedCategory.maxAttachments})
                    </p>
                  )}
                </label>
              </div>

              {/* 업로드 중인 파일 */}
              {uploadingFiles.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-primary">업로드 중...</p>
                </div>
              )}

              {/* 첨부된 파일 목록 */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.uuid}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      {file.attachmentType === 'IMAGE' ? (
                        <FiImage className="w-5 h-5 text-primary flex-shrink-0" />
                      ) : (
                        <FiFile className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.originalFilename}
                        </p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.uuid)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 익명 옵션 */}
          {selectedCategory?.allowAnonymous && (
            <Checkbox
              checked={isAnonymous}
              onChange={(checked) => setIsAnonymous(checked)}
              label="익명으로 작성"
            />
          )}
        </div>

        {/* 버튼 */}
        <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm md:text-base font-medium"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm md:text-base font-medium"
          >
            {isSubmitting ? '저장 중...' : isEdit ? '수정하기' : '작성하기'}
          </button>
        </div>
      </form>
    </div>
  )
}
