'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { FiPlus, FiX, FiImage, FiTag, FiFilter, FiChevronRight, FiChevronDown, FiCheck } from 'react-icons/fi'
import { createGallery, type CreateGalleryRequest } from '@/lib/api/gallery'
import { uploadFile } from '@/lib/api/file'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { useAuth } from '@/hooks/useAuth'
import { getMyInfo } from '@/lib/api/auth'
import Checkbox from '@/components/ui/Checkbox'
import { getPublicFilters, type PublicFilterCategory } from '@/lib/api/filter'

interface ImageAttachment {
  file: File
  preview: string
  fileUuid?: string
  displayOrder: number
}

export default function GalleryCreateForm() {
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
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [expandedOptions, setExpandedOptions] = useState<Set<number>>(new Set())

  // 이미지
  const [images, setImages] = useState<ImageAttachment[]>([])

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
            showErrorToast(null, '사진 게시판은 업체 회원 또는 관리자만 등록할 수 있습니다')
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

        // 플랫 배열을 트리 구조로 변환하는 함수
        const buildOptionTree = (options: typeof filters[0]['options']) => {
          const optionMap = new Map<number, typeof options[0]>()
          const roots: typeof options = []

          // 모든 옵션을 맵에 저장하고 children 배열 초기화
          options.forEach(option => {
            optionMap.set(option.id, { ...option, children: [] })
          })

          // 부모-자식 관계 설정
          options.forEach(option => {
            const currentOption = optionMap.get(option.id)!
            if (option.parentId && optionMap.has(option.parentId)) {
              const parent = optionMap.get(option.parentId)!
              if (!parent.children) parent.children = []
              parent.children.push(currentOption)
            } else {
              roots.push(currentOption)
            }
          })

          return roots
        }

        // 각 카테고리의 options를 트리 구조로 변환
        const filtersWithTree = filters.map(category => ({
          ...category,
          options: buildOptionTree(category.options)
        }))
        setFilterCategories(filtersWithTree)
      } catch (error) {
        showErrorToast(error, '필터 정보를 불러오는데 실패했습니다')
      } finally {
        setIsLoadingFilters(false)
      }
    }
    loadFilters()
  }, [])

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

  // 선택된 필터 옵션 이름 가져오기
  const getSelectedFilterNames = () => {
    const names: string[] = []
    filterCategories.forEach(category => {
      category.options.forEach(option => {
        if (selectedFilterOptionIds.includes(option.id)) {
          names.push(option.name)
        }
      })
    })
    return names
  }

  // 필터 옵션 ID로 이름 찾기
  const getFilterOptionName = (optionId: number) => {
    for (const category of filterCategories) {
      const option = category.options.find(o => o.id === optionId)
      if (option) return option.name
    }
    return ''
  }

  // 필터 옵션 제거
  const handleRemoveFilterOption = (optionId: number) => {
    setSelectedFilterOptionIds(selectedFilterOptionIds.filter(id => id !== optionId))
  }

  // 전체 필터 초기화
  const handleClearAllFilters = () => {
    setSelectedFilterOptionIds([])
  }

  // 아코디언 토글
  const toggleOptionExpand = (optionId: number) => {
    setExpandedOptions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(optionId)) {
        newSet.delete(optionId)
      } else {
        newSet.add(optionId)
      }
      return newSet
    })
  }

  // 자식 중 선택된 개수 계산 (재귀적으로)
  const getSelectedChildrenCount = (option: typeof filterCategories[0]['options'][0]): number => {
    if (!option.children || option.children.length === 0) {
      return selectedFilterOptionIds.includes(option.id) ? 1 : 0
    }
    return option.children.reduce((sum, child) => sum + getSelectedChildrenCount(child), 0)
  }

  // 모든 리프 옵션 ID 가져오기 (재귀적으로)
  const getAllLeafOptionIds = (option: typeof filterCategories[0]['options'][0]): number[] => {
    if (!option.children || option.children.length === 0) {
      return [option.id]
    }
    return option.children.flatMap(child => getAllLeafOptionIds(child))
  }

  // 필터 옵션 렌더링 (재귀적으로 자식 처리)
  const renderFilterOption = (
    option: typeof filterCategories[0]['options'][0],
    categoryId: number,
    filterType: string,
    depth: number = 0
  ) => {
    const hasChildren = option.children && option.children.length > 0
    const isExpanded = expandedOptions.has(option.id)
    const selectedCount = hasChildren ? getSelectedChildrenCount(option) : 0

    if (hasChildren) {
      // 자식이 있으면 아코디언 형태로 표시
      return (
        <div key={option.id} className={depth > 0 ? 'ml-3' : ''}>
          <button
            type="button"
            onClick={() => toggleOptionExpand(option.id)}
            className="w-full flex items-center justify-between py-2 px-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
              {isExpanded ? (
                <FiChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <FiChevronRight className="w-4 h-4 text-gray-400" />
              )}
              {option.name}
            </span>
            {selectedCount > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                {selectedCount}
              </span>
            )}
          </button>
          {isExpanded && (
            <div className="ml-2 mt-1 space-y-1 border-l-2 border-gray-100 pl-2">
              {option.children!.map((child) => renderFilterOption(child, categoryId, filterType, depth + 1))}
            </div>
          )}
        </div>
      )
    }

    // 자식이 없으면 선택 가능한 버튼
    const isSelected = selectedFilterOptionIds.includes(option.id)
    return (
      <button
        key={option.id}
        type="button"
        onClick={() => handleFilterOptionChange(categoryId, option.id, !isSelected, filterType)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          isSelected
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
          isSelected
            ? 'bg-white border-white'
            : 'border-gray-400'
        }`}>
          {isSelected && <FiCheck className="w-3 h-3 text-blue-600" />}
        </span>
        <span className="truncate">{option.name}</span>
      </button>
    )
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
      // 이미지 업로드
      const imageUuids: string[] = []
      for (const image of images) {
        try {
          const result = await uploadFile(image.file, 'OTHER')
          imageUuids.push(result.uuid)
        } catch (error) {
          console.error('이미지 업로드 실패:', error)
          throw new Error(`이미지 업로드 실패: ${image.file.name}`)
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

      // 갤러리 생성
      const data: CreateGalleryRequest = {
        title: title.trim(),
        content: description.trim(),
        relatedLink: formattedLink,
        tags: tags.length > 0 ? tags : undefined,
        filterOptionIds: selectedFilterOptionIds.length > 0 ? selectedFilterOptionIds : undefined,
        imageUuids,
        copyright: copyrightInfo.trim() ? {
          owner: copyrightInfo.trim(),
          license: 'All Rights Reserved',
          attribution: '선택'
        } : undefined,
      }

      const result = await createGallery(data)

      if (result.success && result.data) {
        showSuccessToast('갤러리가 등록되었습니다')
        router.push(`/photos/${result.data.uuid}`)
      }
    } catch (error: any) {
      if (error?.response?.status === 400) {
        showErrorToast(error, '입력 정보를 확인해주세요')
      } else {
        showErrorToast(error, '갤러리 등록에 실패했습니다')
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">갤러리 등록</h1>

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
          {filterCategories.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">필터</h2>

              {/* 필터 선택 버튼 */}
              <button
                type="button"
                onClick={() => setShowFilterPanel(true)}
                className="w-full flex items-center justify-between p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <FiFilter className="text-blue-600 text-xl" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">
                      {selectedFilterOptionIds.length > 0
                        ? `${selectedFilterOptionIds.length}개의 필터 선택됨`
                        : '필터 선택하기'
                      }
                    </p>
                    <p className="text-sm text-gray-500">
                      {filterCategories.length}개 카테고리에서 선택
                    </p>
                  </div>
                </div>
                <FiChevronRight className="text-gray-400 text-xl group-hover:text-blue-600 transition-colors" />
              </button>

              {/* 선택된 필터 표시 */}
              {selectedFilterOptionIds.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700">
                      선택된 필터 ({selectedFilterOptionIds.length})
                    </p>
                    <button
                      type="button"
                      onClick={handleClearAllFilters}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      전체 해제
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedFilterOptionIds.map(optionId => (
                      <span
                        key={optionId}
                        className="inline-flex items-center gap-1 bg-white text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm border border-blue-200"
                      >
                        {getFilterOptionName(optionId)}
                        <button
                          type="button"
                          onClick={() => handleRemoveFilterOption(optionId)}
                          className="ml-1 hover:text-red-600 transition-colors"
                        >
                          <FiX className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
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

          {/* 이미지 업로드 */}
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
                    이미지 선택
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
                    {images.length}개의 이미지 (순서는 드래그로 변경 가능)
                  </p>
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 bg-gray-50 rounded-lg p-4"
                    >
                      <Image
                        src={image.preview}
                        alt={image.file.name}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded"
                        unoptimized
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {image.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(image.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
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
              <FiPlus className="text-2xl" />
              {isSubmitting ? '등록 중...' : '갤러리 등록'}
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

      {/* 필터 사이드 패널 */}
      {showFilterPanel && (
        <div className="fixed inset-0 z-50">
          {/* 배경 오버레이 */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowFilterPanel(false)}
          />

          {/* 사이드 패널 */}
          <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div>
                <h3 className="text-lg font-bold">필터 선택</h3>
                <p className="text-sm text-blue-100">
                  {selectedFilterOptionIds.length}개 선택됨
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFilterPanel(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* 선택된 필터 미리보기 */}
            {selectedFilterOptionIds.length > 0 && (
              <div className="p-4 bg-blue-50 border-b">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">선택된 필터</span>
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    전체 해제
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFilterOptionIds.slice(0, 10).map(optionId => (
                    <span
                      key={optionId}
                      className="inline-flex items-center gap-1 bg-white text-blue-700 px-2 py-1 rounded-full text-xs font-medium shadow-sm border border-blue-200"
                    >
                      {getFilterOptionName(optionId)}
                      <button
                        type="button"
                        onClick={() => handleRemoveFilterOption(optionId)}
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {selectedFilterOptionIds.length > 10 && (
                    <span className="text-xs text-gray-500 py-1">
                      +{selectedFilterOptionIds.length - 10}개 더
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 필터 목록 */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingFilters ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                    <p className="mt-2 text-gray-600">필터 로딩 중...</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filterCategories.map((category) => {
                    // 선택된 개수 계산 (재귀적으로 모든 리프 노드 확인)
                    const countSelected = (options: typeof category.options): number => {
                      return options.reduce((sum, opt) => {
                        if (opt.children && opt.children.length > 0) {
                          return sum + countSelected(opt.children)
                        }
                        return sum + (selectedFilterOptionIds.includes(opt.id) ? 1 : 0)
                      }, 0)
                    }
                    const selectedCount = countSelected(category.options)

                    return (
                      <div key={category.id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">
                              {category.name}
                            </h4>
                            {category.isRequired && (
                              <span className="text-red-500 text-sm">*</span>
                            )}
                            {selectedCount > 0 && (
                              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                                {selectedCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          {category.options.map((option) => renderFilterOption(option, category.id, category.filterType, 0))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="p-4 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => setShowFilterPanel(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                {selectedFilterOptionIds.length > 0
                  ? `${selectedFilterOptionIds.length}개 필터 적용하기`
                  : '닫기'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
