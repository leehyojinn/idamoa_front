'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiX } from 'react-icons/fi'
import {
  getAdminGallery,
  createAdminGallery,
  updateAdminGallery,
  type AdminGalleryCreateRequest,
  type AdminGalleryUpdateRequest,
  type AdminGalleryBoard,
} from '@/lib/api/gallery'
import { useFileUpload } from '@/hooks/useFile'
import ImageUpload, { type ImageData } from '@/components/ui/ImageUpload'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { formatUrl } from '@/lib/utils'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

interface UploadedImage {
  uuid: string
  filename: string
  fileUrl: string
}

export default function AdminGalleryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const galleryUuid = params.uuid as string
  const isNew = galleryUuid === 'new'
  const fileUploadMutation = useFileUpload()

  const [gallery, setGallery] = useState<AdminGalleryBoard | null>(null)
  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    categoryId: undefined as number | undefined,
    imageUuids: [] as string[],
    relatedLink: '',
    copyright: {
      owner: '',
      license: 'All Rights Reserved',
      attribution: '선택',
    },
    filterOptionIds: [] as number[],
    tags: [] as string[],
    isPublished: true,
    isPrivate: false,
  })

  const [tagInput, setTagInput] = useState('')
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)

  const fetchGallery = async () => {
    if (isNew) return

    setIsLoading(true)
    try {
      const data = await getAdminGallery(galleryUuid)
      setGallery(data)
      setFormData({
        title: data.title,
        content: data.content || '',
        categoryId: data.categoryId,
        imageUuids: data.images.map(f => f.uuid),
        relatedLink: data.relatedLink || '',
        copyright: data.copyright || {
          owner: '',
          license: 'All Rights Reserved',
          attribution: '선택',
        },
        filterOptionIds: data.filterOptions.map(o => o.id),
        tags: data.tags,
        isPublished: data.isPublished,
        isPrivate: false,
      })
      // 기존 이미지 정보 로드
      setUploadedImages(
        data.images.map(f => ({
          uuid: f.uuid,
          filename: f.originalFilename,
          fileUrl: f.fileUrl,
        }))
      )
    } catch (error) {
      showErrorToast(error, '게시글을 불러오는데 실패했습니다.')
      router.push('/admin/galleries')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (files: FileList) => {
    if (files.length === 0) return

    setIsUploadingImages(true)
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

      const newImages = await Promise.all(uploadPromises)
      setUploadedImages((prev) => [...prev, ...newImages])
      setFormData((prev) => ({
        ...prev,
        imageUuids: [...prev.imageUuids, ...newImages.map((f) => f.uuid)],
      }))
      showSuccessToast(`${newImages.length}개 이미지가 업로드되었습니다.`)
    } catch (error) {
      showErrorToast(error, '이미지 업로드에 실패했습니다.')
    } finally {
      setIsUploadingImages(false)
    }
  }

  const handleRemoveImage = (uuid: string) => {
    setUploadedImages((prev) => prev.filter((f) => f.uuid !== uuid))
    setFormData((prev) => ({
      ...prev,
      imageUuids: prev.imageUuids.filter((id) => id !== uuid),
    }))
  }

  useEffect(() => {
    fetchGallery()
  }, [galleryUuid])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      showErrorToast(null, '제목을 입력해주세요.')
      return
    }

    if (formData.imageUuids.length === 0) {
      showErrorToast(null, '이미지는 최소 1개 이상 필요합니다.')
      return
    }

    setIsSubmitting(true)
    try {
      if (isNew) {
        const createData: AdminGalleryCreateRequest = {
          title: formData.title,
          content: formData.content || undefined,
          categoryId: formData.categoryId,
          imageUuids: formData.imageUuids,
          relatedLink: formData.relatedLink || undefined,
          copyright: formData.copyright.owner
            ? formData.copyright
            : undefined,
          filterOptionIds: formData.filterOptionIds,
          tags: formData.tags,
          isPublished: formData.isPublished,
          isPrivate: formData.isPrivate,
        }
        await createAdminGallery(createData)
        showSuccessToast('게시글이 생성되었습니다.')
      } else {
        const updateData: AdminGalleryUpdateRequest = {
          title: formData.title,
          content: formData.content || undefined,
          categoryId: formData.categoryId,
          imageUuids: formData.imageUuids,
          relatedLink: formData.relatedLink || undefined,
          copyright: formData.copyright.owner
            ? formData.copyright
            : undefined,
          filterOptionIds: formData.filterOptionIds,
          tags: formData.tags,
        }
        await updateAdminGallery(galleryUuid, updateData)
        showSuccessToast('게시글이 수정되었습니다.')
      }
      router.push('/admin/galleries')
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
          href="/admin/galleries"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <FiArrowLeft />
          목록으로
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isNew ? '사진 게시글 작성' : '사진 게시글 수정'}
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
              내용
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              maxLength={5000}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="내용을 입력하세요"
            />
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이미지 첨부 <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleImageUpload(e.target.files)
                  }
                }}
                className="hidden"
                id="image-upload"
                disabled={isUploadingImages}
              />
              <label
                htmlFor="image-upload"
                className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer ${
                  isUploadingImages ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isUploadingImages ? '업로드 중...' : '이미지 선택'}
              </label>
              <p className="mt-2 text-sm text-gray-500">
                여러 이미지를 선택할 수 있습니다
              </p>
            </div>

            {/* 업로드된 이미지 목록 */}
            {uploadedImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedImages.map((image) => (
                  <div
                    key={image.uuid}
                    className="relative group"
                  >
                    <img
                      src={image.fileUrl}
                      alt={image.filename}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(image.uuid)}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                    <p className="mt-1 text-xs text-gray-500 truncate">
                      {image.filename}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 관련 링크 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              관련 링크 (포트폴리오 URL 등)
            </label>
            <input
              type="url"
              value={formData.relatedLink}
              onChange={(e) => setFormData({ ...formData, relatedLink: e.target.value })}
              onBlur={(e) => {
                const formatted = formatUrl(e.target.value)
                if (formatted !== formData.relatedLink) {
                  setFormData({ ...formData, relatedLink: formatted })
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="example.com/portfolio/123"
            />
          </div>

          {/* 저작권 정보 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">저작권 정보</h3>
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm text-gray-600 mb-1">저작권자</label>
                <input
                  type="text"
                  value={formData.copyright.owner}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      copyright: { ...formData.copyright, owner: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="홍길동 디자인"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">라이선스</label>
                <select
                  value={formData.copyright.license}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      copyright: { ...formData.copyright, license: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="All Rights Reserved">All Rights Reserved</option>
                  <option value="CC BY">CC BY (저작자 표시)</option>
                  <option value="CC BY-NC">CC BY-NC (비영리)</option>
                  <option value="CC BY-SA">CC BY-SA (동일조건변경허락)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">출처 표기</label>
                <select
                  value={formData.copyright.attribution}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      copyright: { ...formData.copyright, attribution: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="필수">필수</option>
                  <option value="선택">선택</option>
                </select>
              </div>
            </div>
          </div>

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

          {/* 제출 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/admin/galleries')}
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
