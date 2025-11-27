'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiX } from 'react-icons/fi'
import {
  getDocument,
  createDocument,
  updateDocument,
} from '@/lib/api/document'
import { useFileUpload } from '@/hooks/useFile'
import ImageUpload, { type ImageData } from '@/components/ui/ImageUpload'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'
import type { DocumentBoard, DocumentCreateRequest, DocumentUpdateRequest } from '@/types/document'

interface UploadedFile {
  uuid: string
  filename: string
  fileUrl: string
}

export default function AdminDocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const documentUuid = params.uuid as string
  const isNew = documentUuid === 'new'
  const fileUploadMutation = useFileUpload()

  const [document, setDocument] = useState<DocumentBoard | null>(null)
  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    categoryId: undefined as number | undefined,
    fileUuids: [] as string[],
    thumbnailUuid: undefined as string | undefined,
    isPaid: false,
    price: 0,
    filterOptionIds: [] as number[],
    tags: [] as string[],
    isPublished: false,
    isPrivate: false,
  })

  const [tagInput, setTagInput] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [thumbnail, setThumbnail] = useState<ImageData | undefined>()
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)

  const fetchDocument = async () => {
    if (isNew) return

    setIsLoading(true)
    try {
      const data = await getDocument(documentUuid)
      setDocument(data)
      setFormData({
        title: data.title,
        content: data.content,
        categoryId: data.categoryId,
        fileUuids: data.files.map(f => f.uuid),
        thumbnailUuid: data.thumbnail?.uuid,
        isPaid: data.isPaid,
        price: data.price,
        filterOptionIds: data.filterOptions.map(o => o.id),
        tags: data.tags,
        isPublished: data.isPublished,
        isPrivate: false,
      })
      // 기존 파일 정보 로드
      setUploadedFiles(
        data.files.map(f => ({
          uuid: f.uuid,
          filename: f.originalFilename,
          fileUrl: f.fileUrl,
        }))
      )
      if (data.thumbnail) {
        setThumbnail({
          uuid: data.thumbnail.uuid,
          url: data.thumbnail.fileUrl,
        })
      }
    } catch (error) {
      showErrorToast(error, '게시글을 불러오는데 실패했습니다.')
      router.push('/admin/documents')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return

    setIsUploadingFiles(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const result = await fileUploadMutation.mutateAsync({
          file,
          entityType: 'OTHER',
          entityId: null,
        })
        return {
          uuid: result.uuid,
          filename: file.name,
          fileUrl: result.fileUrl,
        }
      })

      const newFiles = await Promise.all(uploadPromises)
      setUploadedFiles((prev) => [...prev, ...newFiles])
      setFormData((prev) => ({
        ...prev,
        fileUuids: [...prev.fileUuids, ...newFiles.map((f) => f.uuid)],
      }))
      showSuccessToast(`${newFiles.length}개 파일이 업로드되었습니다.`)
    } catch (error) {
      showErrorToast(error, '파일 업로드에 실패했습니다.')
    } finally {
      setIsUploadingFiles(false)
    }
  }

  const handleRemoveFile = (uuid: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.uuid !== uuid))
    setFormData((prev) => ({
      ...prev,
      fileUuids: prev.fileUuids.filter((id) => id !== uuid),
    }))
  }

  const handleThumbnailChange = (data: ImageData | ImageData[] | undefined) => {
    if (!data) {
      setThumbnail(undefined)
      setFormData((prev) => ({ ...prev, thumbnailUuid: undefined }))
    } else if (!Array.isArray(data)) {
      setThumbnail(data)
      setFormData((prev) => ({ ...prev, thumbnailUuid: data.uuid }))
    }
  }

  useEffect(() => {
    fetchDocument()
  }, [documentUuid])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      showErrorToast(null, '제목을 입력해주세요.')
      return
    }

    if (!formData.content.trim()) {
      showErrorToast(null, '내용을 입력해주세요.')
      return
    }

    if (formData.fileUuids.length === 0) {
      showErrorToast(null, '파일은 최소 1개 이상 필요합니다.')
      return
    }

    setIsSubmitting(true)
    try {
      if (isNew) {
        const createData: DocumentCreateRequest = {
          title: formData.title,
          content: formData.content,
          categoryId: formData.categoryId,
          fileUuids: formData.fileUuids,
          thumbnailUuid: formData.thumbnailUuid,
          isPaid: formData.isPaid,
          price: formData.price,
          filterOptionIds: formData.filterOptionIds,
          tags: formData.tags,
          isPublished: formData.isPublished,
          isPrivate: formData.isPrivate,
        }
        await createDocument(createData)
        showSuccessToast('게시글이 생성되었습니다.')
      } else {
        const updateData: DocumentUpdateRequest = {
          title: formData.title,
          content: formData.content,
          categoryId: formData.categoryId,
          fileUuids: formData.fileUuids,
          thumbnailUuid: formData.thumbnailUuid,
          isPaid: formData.isPaid,
          price: formData.price,
          filterOptionIds: formData.filterOptionIds,
          tags: formData.tags,
        }
        await updateDocument(documentUuid, updateData)
        showSuccessToast('게시글이 수정되었습니다.')
      }
      router.push('/admin/documents')
    } catch (error) {
      showErrorToast(error, isNew ? '게시글 생성에 실패했습니다.' : '게시글 수정에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    })
  }

  if (isLoading) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-64px-200px)]">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </div>
        <Footer />
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-64px-200px)]">
        <Link
          href="/admin/documents"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <FiArrowLeft />
          목록으로
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isNew ? '자료실 게시글 작성' : '자료실 게시글 수정'}
        </h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="제목을 입력하세요"
              required
            />
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
              maxLength={5000}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="내용을 입력하세요"
              required
            />
          </div>

          {/* 파일 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              파일 첨부 <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files)
                  }
                }}
                className="hidden"
                id="file-upload"
                disabled={isUploadingFiles}
              />
              <label
                htmlFor="file-upload"
                className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer ${
                  isUploadingFiles ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isUploadingFiles ? '업로드 중...' : '파일 선택'}
              </label>
              <p className="mt-2 text-sm text-gray-500">
                여러 파일을 선택할 수 있습니다
              </p>
            </div>

            {/* 업로드된 파일 목록 */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  업로드된 파일 ({uploadedFiles.length}개)
                </p>
                {uploadedFiles.map((file) => (
                  <div
                    key={file.uuid}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.filename}
                      </p>
                      <p className="text-xs text-gray-500 font-mono truncate">
                        {file.uuid}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.uuid)}
                      className="ml-4 p-1 text-red-600 hover:text-red-900"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 썸네일 업로드 */}
          <div>
            <ImageUpload
              label="썸네일 이미지 (선택)"
              value={thumbnail}
              onChange={handleThumbnailChange}
              multiple={false}
              entityType="OTHER"
            />
          </div>

          {/* 유료/무료 */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isPaid}
                onChange={(e) =>
                  setFormData({ ...formData, isPaid: e.target.checked, price: e.target.checked ? formData.price : 0 })
                }
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">유료 자료</span>
            </label>
          </div>

          {/* 가격 */}
          {formData.isPaid && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">가격 (원)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* 태그 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">태그</label>
            <div className="flex gap-2 mb-2">
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="태그 입력 후 Enter"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                추가
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 즉시 게시 (신규 작성 시에만) */}
          {isNew && (
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">즉시 게시</span>
              </label>
            </div>
          )}

          {/* 제출 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/admin/documents')}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (isNew ? '생성 중...' : '수정 중...') : isNew ? '생성' : '수정'}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </AdminGuard>
  )
}
