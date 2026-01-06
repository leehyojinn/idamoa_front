'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import DOMPurify from 'isomorphic-dompurify'
import { FiArrowLeft, FiPlus, FiX, FiFile, FiTag, FiImage, FiFilter, FiChevronRight, FiChevronDown, FiCheck, FiEye, FiCode } from 'react-icons/fi'
import { getDocument, createDocument, updateDocument } from '@/lib/api/document'
import { uploadFile } from '@/lib/api/file'
import { getPublicFilters, type PublicFilterCategory, type PublicFilterOption } from '@/lib/api/filter'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'
import Checkbox from '@/components/ui/Checkbox'
import type { DocumentBoard, DocumentCreateRequest, DocumentUpdateRequest, FileInfo } from '@/types/document'

interface FileAttachment {
  file: File
  fileUuid?: string
  isPaid: boolean
  price: string
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
  isPaid: boolean
  price: string
}

// 파일 크기 포맷
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function AdminDocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const documentUuid = params.uuid as string
  const isNew = documentUuid === 'new'
  const filterButtonRef = useRef<HTMLButtonElement>(null)

  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [document, setDocument] = useState<DocumentBoard | null>(null)

  // 기본 정보
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [contentMode, setContentMode] = useState<'text' | 'html'>('text')
  const [isHtmlPreview, setIsHtmlPreview] = useState(false)

  // 전체 유료 설정
  const [useGlobalPrice, setUseGlobalPrice] = useState(false)
  const [globalPrice, setGlobalPrice] = useState('')

  // 태그
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // 필터
  const [filterCategories, setFilterCategories] = useState<PublicFilterCategory[]>([])
  const [selectedFilterOptionIds, setSelectedFilterOptionIds] = useState<number[]>([])
  const [isLoadingFilters, setIsLoadingFilters] = useState(true)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [expandedOptions, setExpandedOptions] = useState<Set<number>>(new Set())
  const [collapsedCategories, setCollapsedCategories] = useState<Set<number>>(new Set())

  // 기존 파일
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([])
  const [removedFileUuids, setRemovedFileUuids] = useState<string[]>([])

  // 새 파일
  const [newFiles, setNewFiles] = useState<FileAttachment[]>([])

  // 썸네일
  const [thumbnail, setThumbnail] = useState<ThumbnailAttachment | null>(null)
  const [existingThumbnail, setExistingThumbnail] = useState<{ uuid: string; fileUrl: string } | null>(null)
  const [removeThumbnail, setRemoveThumbnail] = useState(false)

  // 게시 설정
  const [isPublished, setIsPublished] = useState(true)

  const fetchDocument = useCallback(async () => {
    if (isNew) return

    setIsLoading(true)
    try {
      const doc = await getDocument(documentUuid)
      setDocument(doc)
      setTitle(doc.title)
      setContent(doc.content || '')
      setTags(doc.tags || [])
      setIsPublished(doc.isPublished)

      // 기존 파일 설정
      if (doc.files && doc.files.length > 0) {
        setExistingFiles(doc.files.map((f: FileInfo) => ({
          uuid: f.uuid,
          originalFilename: f.originalFilename,
          fileSize: f.fileSize,
          fileUrl: f.fileUrl,
          isPaid: f.isPaid || false,
          price: f.price?.toString() || ''
        })))
      }

      // 기존 썸네일 설정
      if (doc.thumbnail) {
        setExistingThumbnail({
          uuid: doc.thumbnail.uuid,
          fileUrl: doc.thumbnail.fileUrl
        })
      }

      // 기존 필터 옵션 설정
      if (doc.filterOptions && doc.filterOptions.length > 0) {
        setSelectedFilterOptionIds(doc.filterOptions.map(opt => opt.id))
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        showErrorToast(error, '자료를 찾을 수 없습니다')
        router.push('/admin/documents')
      } else {
        showErrorToast(error, '자료를 불러오는데 실패했습니다')
      }
    } finally {
      setIsLoading(false)
    }
  }, [documentUuid, router, isNew])

  useEffect(() => {
    fetchDocument()
  }, [fetchDocument])

  // 필터 로드
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const filters = await getPublicFilters('DOCUMENT')

        // 삭제되지 않고 활성화된 옵션만 필터링
        const filterActiveOptions = (options: PublicFilterOption[]) => {
          return options.filter(option => {
            if (option.isDeleted === true) return false
            if (option.isActive === false) return false
            return true
          })
        }

        // 플랫 배열을 트리 구조로 변환하는 함수
        const buildOptionTree = (options: PublicFilterOption[]) => {
          const activeOptions = filterActiveOptions(options)
          const optionMap = new Map<number, PublicFilterOption>()
          const roots: PublicFilterOption[] = []

          activeOptions.forEach(option => {
            optionMap.set(option.id, { ...option, children: [] })
          })

          activeOptions.forEach(option => {
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

        const filtersWithTree = filters.map(category => ({
          ...category,
          options: buildOptionTree(category.options)
        }))
        setFilterCategories(filtersWithTree)
        setCollapsedCategories(new Set(filtersWithTree.map(c => c.id)))
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

  // 필터 옵션 변경 핸들러
  const handleFilterOptionChange = (categoryId: number, optionId: number, checked: boolean, filterType: string) => {
    if (filterType === 'SINGLE_SELECT') {
      const category = filterCategories.find(c => c.id === categoryId)
      if (!category) return

      const getAllOptionIds = (options: PublicFilterOption[]): number[] => {
        return options.flatMap(o => [o.id, ...(o.children ? getAllOptionIds(o.children) : [])])
      }
      const categoryOptionIds = getAllOptionIds(category.options)
      const filtered = selectedFilterOptionIds.filter(id => !categoryOptionIds.includes(id))

      if (checked) {
        setSelectedFilterOptionIds([...filtered, optionId])
      } else {
        setSelectedFilterOptionIds(filtered)
      }
    } else {
      if (checked) {
        setSelectedFilterOptionIds([...selectedFilterOptionIds, optionId])
      } else {
        setSelectedFilterOptionIds(selectedFilterOptionIds.filter(id => id !== optionId))
      }
    }
  }

  // 필터 옵션 이름 찾기
  const getFilterOptionName = (optionId: number): string => {
    const findInOptions = (options: PublicFilterOption[]): string | null => {
      for (const option of options) {
        if (option.id === optionId) return option.name
        if (option.children) {
          const found = findInOptions(option.children)
          if (found) return found
        }
      }
      return null
    }

    for (const category of filterCategories) {
      const found = findInOptions(category.options)
      if (found) return found
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

  // 카테고리 접기/펼치기 토글
  const toggleCategoryCollapse = (categoryId: number) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  // 자식 중 선택된 개수 계산 (재귀적으로)
  const getSelectedChildrenCount = (option: PublicFilterOption): number => {
    if (!option.children || option.children.length === 0) {
      return selectedFilterOptionIds.includes(option.id) ? 1 : 0
    }
    return option.children.reduce((sum, child) => sum + getSelectedChildrenCount(child), 0)
  }

  // 필터 옵션 렌더링 (재귀적으로 자식 처리)
  const renderFilterOption = (
    option: PublicFilterOption,
    categoryId: number,
    filterType: string,
    depth: number = 0
  ) => {
    const hasChildren = option.children && option.children.length > 0
    const isExpanded = expandedOptions.has(option.id)
    const selectedCount = hasChildren ? getSelectedChildrenCount(option) : 0

    if (hasChildren) {
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return

    const files: FileAttachment[] = Array.from(selectedFiles).map(file => ({
      file,
      isPaid: false,
      price: '',
    }))

    setNewFiles([...newFiles, ...files])
  }

  const handleRemoveNewFile = (index: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== index))
  }

  const handleNewFileIsPaidChange = (index: number, isPaid: boolean) => {
    setNewFiles(newFiles.map((f, i) => i === index ? { ...f, isPaid, price: isPaid ? f.price : '' } : f))
  }

  const handleNewFilePriceChange = (index: number, price: string) => {
    setNewFiles(newFiles.map((f, i) => i === index ? { ...f, price } : f))
  }

  const handleExistingFileIsPaidChange = (uuid: string, isPaid: boolean) => {
    setExistingFiles(existingFiles.map(f => f.uuid === uuid ? { ...f, isPaid, price: isPaid ? f.price : '' } : f))
  }

  const handleExistingFilePriceChange = (uuid: string, price: string) => {
    setExistingFiles(existingFiles.map(f => f.uuid === uuid ? { ...f, price } : f))
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

    if (useGlobalPrice && (!globalPrice || parseInt(globalPrice) <= 0)) {
      showErrorToast(null, '전체 가격을 입력하세요')
      return
    }

    setIsSubmitting(true)

    try {
      // 새 파일 업로드 및 가격 정보 수집
      const newFilesWithPrice: { uuid: string; isPaid: boolean; price: number }[] = []

      for (const fileAttachment of newFiles) {
        try {
          const result = await uploadFile(fileAttachment.file, 'OTHER')
          newFilesWithPrice.push({
            uuid: result.uuid,
            isPaid: fileAttachment.isPaid,
            price: fileAttachment.isPaid ? parseInt(fileAttachment.price) || 0 : 0
          })
        } catch (error: any) {
          const errorMsg = error?.response?.data?.message || error?.message || '알 수 없는 오류'
          throw new Error(`파일 업로드 실패 (${fileAttachment.file.name}): ${errorMsg}`)
        }
      }

      // 새 썸네일 업로드
      let thumbnailUuid: string | undefined
      if (thumbnail) {
        try {
          const result = await uploadFile(thumbnail.file, 'OTHER')
          thumbnailUuid = result.uuid
        } catch (error: any) {
          const errorMsg = error?.response?.data?.message || error?.message || '알 수 없는 오류'
          throw new Error(`썸네일 업로드 실패: ${errorMsg}`)
        }
      }

      // 기존 파일 + 새 파일 가격 정보
      const globalPriceValue = parseInt(globalPrice) || 0
      const filesWithPrice = useGlobalPrice
        ? [
            ...existingFiles.map(f => ({
              uuid: f.uuid,
              isPaid: true,
              price: globalPriceValue
            })),
            ...newFilesWithPrice.map(f => ({
              uuid: f.uuid,
              isPaid: true,
              price: globalPriceValue
            }))
          ]
        : [
            ...existingFiles.map(f => ({
              uuid: f.uuid,
              isPaid: f.isPaid,
              price: f.isPaid ? parseInt(f.price) || 0 : 0
            })),
            ...newFilesWithPrice
          ]

      if (isNew) {
        const data: DocumentCreateRequest = {
          title: title.trim(),
          content: content.trim(),
          files: filesWithPrice,
          tags: tags.length > 0 ? tags : undefined,
          filterOptionIds: selectedFilterOptionIds.length > 0 ? selectedFilterOptionIds : undefined,
          isPublished,
        }

        if (thumbnailUuid) {
          data.thumbnailUuid = thumbnailUuid
        }

        await createDocument(data)
        showSuccessToast('자료가 생성되었습니다')
      } else {
        const data: DocumentUpdateRequest = {
          title: title.trim(),
          content: content.trim(),
          files: filesWithPrice,
          tags: tags.length > 0 ? tags : undefined,
          filterOptionIds: selectedFilterOptionIds.length > 0 ? selectedFilterOptionIds : undefined,
        }

        // 썸네일 처리
        if (thumbnailUuid) {
          data.thumbnailUuid = thumbnailUuid
        } else if (removeThumbnail) {
          data.thumbnailUuid = undefined
        } else if (existingThumbnail) {
          data.thumbnailUuid = existingThumbnail.uuid
        }

        await updateDocument(documentUuid, data)
        showSuccessToast('자료가 수정되었습니다')
      }

      router.push('/admin/documents')
    } catch (error: any) {
      if (error?.response?.status === 400) {
        showErrorToast(error, '입력 정보를 확인해주세요')
      } else if (error?.response?.status === 403) {
        showErrorToast(error, '수정 권한이 없습니다')
      } else {
        showErrorToast(error, isNew ? '자료 생성에 실패했습니다' : '자료 수정에 실패했습니다')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-64px-200px)]">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">자료를 불러오는 중...</p>
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

        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            {isNew ? '자료 등록' : '자료 수정'}
          </h1>

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
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">
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
                              ? 'bg-blue-600 text-white'
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
                      className="w-full min-h-[200px] px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 prose prose-sm max-w-none overflow-auto"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
                    />
                  ) : contentMode === 'html' ? (
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="HTML 코드를 입력하세요.&#10;&#10;예시:&#10;<h3>제목</h3>&#10;<p>내용입니다.</p>&#10;<ul><li>목록 1</li><li>목록 2</li></ul>"
                    />
                  ) : (
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="자료에 대한 설명을 입력하세요."
                    />
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    {content.length}자{contentMode === 'html' && ' | HTML 모드'}
                  </p>
                </div>
              </div>
            </div>

            {/* 전체 가격 설정 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">가격 설정</h2>
              <div className="space-y-4">
                <Checkbox
                  checked={useGlobalPrice}
                  onChange={setUseGlobalPrice}
                  label="전체 가격 적용"
                  description="체크하면 모든 파일에 동일한 가격이 적용됩니다"
                />

                {useGlobalPrice && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      전체 가격 (원) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={globalPrice}
                      onChange={(e) => setGlobalPrice(e.target.value)}
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="모든 파일에 적용될 가격을 입력하세요"
                    />
                  </div>
                )}
                {!useGlobalPrice && (
                  <p className="text-sm text-gray-500">
                    개별 파일마다 가격을 설정하려면 아래 첨부 파일에서 설정하세요
                  </p>
                )}
              </div>
            </div>

            {/* 필터 선택 */}
            {filterCategories.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">카테고리 선택</h2>

                {/* 필터 선택 버튼 */}
                <button
                  ref={filterButtonRef}
                  type="button"
                  onClick={() => setShowFilterPanel(true)}
                  className="w-full flex items-center justify-between p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                        className="bg-blue-50 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center gap-4">
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
                        <div className="flex items-center gap-4 pl-16">
                          {useGlobalPrice ? (
                            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">
                              {globalPrice ? `${parseInt(globalPrice).toLocaleString()}원` : '전체 가격 미설정'}
                            </span>
                          ) : (
                            <>
                              <Checkbox
                                checked={file.isPaid}
                                onChange={(checked) => handleExistingFileIsPaidChange(file.uuid, checked)}
                                label="유료"
                                size="sm"
                              />
                              {file.isPaid && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={file.price}
                                    onChange={(e) => handleExistingFilePriceChange(file.uuid, e.target.value)}
                                    min="0"
                                    className="w-32 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="가격"
                                  />
                                  <span className="text-sm text-gray-500">원</span>
                                </div>
                              )}
                              {!file.isPaid && (
                                <span className="text-sm text-green-600 font-medium">무료</span>
                              )}
                            </>
                          )}
                        </div>
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
                        className="bg-green-50 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center gap-4">
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
                        <div className="flex items-center gap-4 pl-16">
                          {useGlobalPrice ? (
                            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">
                              {globalPrice ? `${parseInt(globalPrice).toLocaleString()}원` : '전체 가격 미설정'}
                            </span>
                          ) : (
                            <>
                              <Checkbox
                                checked={fileAttachment.isPaid}
                                onChange={(checked) => handleNewFileIsPaidChange(index, checked)}
                                label="유료"
                                size="sm"
                              />
                              {fileAttachment.isPaid && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={fileAttachment.price}
                                    onChange={(e) => handleNewFilePriceChange(index, e.target.value)}
                                    min="0"
                                    className="w-32 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="가격"
                                  />
                                  <span className="text-sm text-gray-500">원</span>
                                </div>
                              )}
                              {!fileAttachment.isPaid && (
                                <span className="text-sm text-green-600 font-medium">무료</span>
                              )}
                            </>
                          )}
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
                {isSubmitting ? (isNew ? '등록 중...' : '수정 중...') : (isNew ? '자료 등록' : '자료 수정')}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/documents')}
                className="px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold text-lg transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />

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
                    const countSelected = (options: PublicFilterOption[]): number => {
                      return options.reduce((sum, opt) => {
                        if (opt.children && opt.children.length > 0) {
                          return sum + countSelected(opt.children)
                        }
                        return sum + (selectedFilterOptionIds.includes(opt.id) ? 1 : 0)
                      }, 0)
                    }
                    const selectedCount = countSelected(category.options)
                    const isCollapsed = collapsedCategories.has(category.id)

                    return (
                      <div key={category.id} className="p-4">
                        <button
                          type="button"
                          onClick={() => toggleCategoryCollapse(category.id)}
                          className="w-full flex items-center justify-between mb-3 hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {isCollapsed ? (
                              <FiChevronRight className="w-5 h-5 text-gray-400" />
                            ) : (
                              <FiChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                            <h4 className="font-semibold text-gray-900">
                              {category.name}
                            </h4>
                            {category.isRequired && (
                              <span className="text-red-500 text-sm">*</span>
                            )}
                          </div>
                          {selectedCount > 0 && (
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                              {selectedCount}
                            </span>
                          )}
                        </button>
                        {!isCollapsed && (
                          <div className="space-y-1">
                            {category.options.map((option) => renderFilterOption(option, category.id, category.filterType, 0))}
                          </div>
                        )}
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
    </AdminGuard>
  )
}
