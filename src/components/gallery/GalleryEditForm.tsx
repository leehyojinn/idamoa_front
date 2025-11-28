'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { FiSave, FiX, FiImage, FiTag } from 'react-icons/fi'
import { updateGallery, type Gallery, type UpdateGalleryRequest } from '@/lib/api/gallery'
import { uploadFile } from '@/lib/api/file'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { useAuth } from '@/hooks/useAuth'
import { getMyInfo } from '@/lib/api/auth'
import Checkbox from '@/components/ui/Checkbox'
import { getPublicFilters, type PublicFilterCategory } from '@/lib/api/filter'

interface ImageAttachment {
  uuid?: string
  file?: File
  preview: string
  displayOrder: number
  isExisting: boolean
}

interface GalleryEditFormProps {
  gallery: Gallery
}

export default function GalleryEditForm({ gallery }: GalleryEditFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompany, setIsCompany] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // 기본 정보
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [copyrightInfo, setCopyrightInfo] = useState('')

  // 태그
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // 필터
  const [filterCategories, setFilterCategories] = useState<PublicFilterCategory[]>([])
  const [selectedFilterOptionIds, setSelectedFilterOptionIds] = useState<number[]>([])
  const [isLoadingFilters, setIsLoadingFilters] = useState(true)

  // 업체 권한 체크
  useEffect(() => {
    const checkCompanyAuth = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      try {
        const response = await getMyInfo()
        if (response.success && response.data) {
          if (response.data.isCompany || response.data.isAdmin) {
            setIsCompany(true)
          } else {
            showErrorToast(null, '사진 게시판은 업체 회원 또는 관리자만 수정할 수 있습니다')
            router.push('/photos')
          }
        }
      } catch (error) {
        showErrorToast(error, '권한 확인에 실패했습니다')
        router.push('/photos')
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkCompanyAuth()
  }, [user, router])

  // 필터 로드
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const filters = await getPublicFilters('GALLERY')
        setFilterCategories(filters)
      } catch (error) {
        showErrorToast(error, '필터 정보를 불러오는데 실패했습니다')
      } finally {
        setIsLoadingFilters(false)
      }
    }
    loadFilters()
  }, [])

  // 이미지
  const [images, setImages] = useState<ImageAttachment[]>([])

  // 기존 데이터로 초기화
  useEffect(() => {
    setTitle(gallery.title)
    setDescription(gallery.content || '')
    setLocation(gallery.relatedLink || '')
    setCopyrightInfo(gallery.copyright?.owner || '')
    setTags(gallery.tags)
    setImages(
      gallery.images.map((img, index) => ({
        uuid: img.uuid,
        preview: img.fileUrl,
        displayOrder: index,
        isExisting: true,
      }))
    )

    // 기존 필터 옵션 초기화
    if (gallery.filterGroups && gallery.filterGroups.length > 0) {
      const existingFilterOptionIds: number[] = []
      gallery.filterGroups.forEach(group => {
        group.options.forEach(option => {
          existingFilterOptionIds.push(option.id)
        })
      })
      setSelectedFilterOptionIds(existingFilterOptionIds)
    }
  }, [gallery])

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag))
    } else {
      setTags([...tags, tag])
    }
  }

  const handleFilterOptionChange = (categoryId: number, optionId: number, checked: boolean, filterType: string) => {
    if (filterType === 'SINGLE_SELECT') {
      // 단일 선택: 같은 카테고리의 다른 옵션 제거 후 추가
      const category = filterCategories.find(c => c.id === categoryId)
      if (!category) return

      const categoryOptionIds = category.options.map(o => o.id)
      const filtered = selectedFilterOptionIds.filter(id => !categoryOptionIds.includes(id))

      if (checked) {
        setSelectedFilterOptionIds([...filtered, optionId])
      } else {
        setSelectedFilterOptionIds(filtered)
      }
    } else {
      // 다중 선택
      if (checked) {
        setSelectedFilterOptionIds([...selectedFilterOptionIds, optionId])
      } else {
        setSelectedFilterOptionIds(selectedFilterOptionIds.filter(id => id !== optionId))
      }
    }
  }

  const handleSelectAllOptions = (category: PublicFilterCategory, checked: boolean) => {
    const categoryOptionIds = category.options.map(o => o.id)

    if (checked) {
      // 전체 선택: 기존 선택에서 해당 카테고리 옵션 제거 후 전체 추가
      const filtered = selectedFilterOptionIds.filter(id => !categoryOptionIds.includes(id))
      setSelectedFilterOptionIds([...filtered, ...categoryOptionIds])
    } else {
      // 전체 해제
      setSelectedFilterOptionIds(selectedFilterOptionIds.filter(id => !categoryOptionIds.includes(id)))
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: ImageAttachment[] = []
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const preview = e.target?.result as string
          newImages.push({
            file,
            preview,
            displayOrder: images.length + newImages.length,
            isExisting: false,
          })

          if (newImages.length === files.length) {
            setImages([...images, ...newImages])
          }
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index)
    setImages(updated.map((img, i) => ({ ...img, displayOrder: i })))
  }

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images]
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= newImages.length) return

    ;[newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]]
    setImages(newImages.map((img, i) => ({ ...img, displayOrder: i })))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 유효성 검사
    if (!title.trim()) {
      showErrorToast(null, '제목을 입력하세요')
      return
    }

    if (!description.trim()) {
      showErrorToast(null, '설명을 입력하세요')
      return
    }

    if (images.length === 0) {
      showErrorToast(null, '최소 1개 이상의 이미지를 추가하세요')
      return
    }

    setIsSubmitting(true)

    try {
      // 이미지 처리 - 항상 imageUuids 전송
      const imageUuids: string[] = []

      for (const image of images) {
        if (image.file) {
          // 새 이미지 업로드
          try {
            const result = await uploadFile(image.file, 'OTHER')
            imageUuids.push(result.uuid)
          } catch (error) {
            console.error('이미지 업로드 실패:', error)
            throw new Error(`이미지 업로드 실패: ${image.file.name}`)
          }
        } else if (image.uuid) {
          // 기존 이미지
          imageUuids.push(image.uuid)
        }
      }

      // 관련링크 프로토콜 자동 추가
      let formattedLink: string | undefined = undefined
      if (location.trim()) {
        const trimmedLink = location.trim()
        if (!trimmedLink.startsWith('http://') && !trimmedLink.startsWith('https://')) {
          formattedLink = `https://${trimmedLink}`
        } else {
          formattedLink = trimmedLink
        }
      }

      // 갤러리 수정
      const data: UpdateGalleryRequest = {
        title: title.trim(),
        content: description.trim(),
        relatedLink: formattedLink,
        tags: tags.length > 0 ? tags : undefined,
        filterOptionIds: selectedFilterOptionIds.length > 0 ? selectedFilterOptionIds : undefined,
        imageUuids,  // 항상 포함
        copyright: copyrightInfo.trim() ? {
          owner: copyrightInfo.trim(),
          license: 'All Rights Reserved',
          attribution: '선택'
        } : undefined,
      }

      const result = await updateGallery(gallery.uuid, data)

      if (result.success && result.data) {
        showSuccessToast('갤러리가 수정되었습니다')
        router.push(`/photos/${result.data.uuid}`)
      }
    } catch (error: any) {
      if (error?.response?.status === 400) {
        showErrorToast(error, '입력 정보를 확인해주세요')
      } else if (error?.response?.status === 403) {
        showErrorToast(error, '수정 권한이 없습니다')
      } else {
        showErrorToast(error, '갤러리 수정에 실패했습니다')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // 권한 체크 중 로딩 화면
  if (isCheckingAuth) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">권한 확인 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">갤러리 수정</h1>

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
                  placeholder="갤러리 제목을 입력하세요"
                />
                <p className="text-sm text-gray-500 mt-1">{title.length}/200자</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  설명 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="갤러리에 대한 설명을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  관련 링크
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="관련 링크 (예: example.com)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  저작권 정보
                </label>
                <input
                  type="text"
                  value={copyrightInfo}
                  onChange={(e) => setCopyrightInfo(e.target.value)}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="저작권 정보 (예: Copyright 2024 홍길동)"
                />
              </div>
            </div>
          </div>

          {/* 필터 */}
          {isLoadingFilters ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="mt-2 text-gray-600">필터 로딩 중...</p>
            </div>
          ) : (
            filterCategories.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">필터</h2>
                <div className="space-y-6">
                  {filterCategories.map((category) => (
                    <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                          {category.name}
                          {category.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {category.filterType === 'MULTI_SELECT' && (
                          <Checkbox
                            checked={category.options.every(opt =>
                              selectedFilterOptionIds.includes(opt.id)
                            )}
                            onChange={(checked) => handleSelectAllOptions(category, checked)}
                            label="전체 선택"
                          />
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {category.options.map((option) => (
                          <Checkbox
                            key={option.id}
                            checked={selectedFilterOptionIds.includes(option.id)}
                            onChange={(checked) =>
                              handleFilterOptionChange(category.id, option.id, checked, category.filterType)
                            }
                            label={option.name}
                            size="sm"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* 태그 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">태그</h2>
            <div className="space-y-6">

              {/* 직접 입력 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-800 mb-3">직접 입력</h3>
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
              </div>

              {/* 선택된 태그 목록 */}
              {tags.length > 0 && (
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-800 mb-3">선택된 태그 ({tags.length})</h3>
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
                </div>
              )}
            </div>
          </div>

          {/* 이미지 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              이미지 <span className="text-red-500">*</span>
            </h2>
            <div className="space-y-4">
              <label
                htmlFor="image-upload"
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer block"
              >
                <FiImage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="flex flex-col items-center justify-center">
                  <span className="text-blue-600 font-medium hover:text-blue-700">
                    이미지 추가
                  </span>
                  <input
                    id="image-upload"
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    여러 이미지를 선택할 수 있습니다
                  </p>
                </div>
              </label>

              {images.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    {images.length}개의 이미지 (순서는 화살표로 변경 가능)
                  </p>
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 bg-gray-50 rounded-lg p-4"
                    >
                      <Image
                        src={image.preview}
                        alt={image.file?.name || `이미지 ${index + 1}`}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded"
                        unoptimized
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {image.file?.name || `기존 이미지 ${index + 1}`}
                        </p>
                        {image.file && (
                          <p className="text-xs text-gray-500">
                            {(image.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                        {image.isExisting && (
                          <p className="text-xs text-blue-600">기존 이미지</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => moveImage(index, 'up')}
                          disabled={index === 0}
                          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(index, 'down')}
                          disabled={index === images.length - 1}
                          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <FiX className="w-5 h-5" />
                        </button>
                      </div>
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
              <FiSave className="text-2xl" />
              {isSubmitting ? '수정 중...' : '수정 완료'}
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
