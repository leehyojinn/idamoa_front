'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  FiUpload,
  FiX,
  FiPlus,
  FiArrowLeft,
  FiImage,
  FiStar,
  FiFilter,
  FiChevronRight,
  FiChevronDown,
  FiCheck,
  FiVideo,
  FiCalendar,
  FiDollarSign,
  FiInfo,
} from 'react-icons/fi'
import {
  createPortfolio,
  updatePortfolio,
  getPromotionPrices,
  type Portfolio,
  type PortfolioCreateRequest,
  type PortfolioUpdateRequest,
  type PromotionPrice,
} from '@/lib/api/portfolio'
import { getPublicFilters, type PublicFilterCategory, type PublicFilterOption } from '@/lib/api/filter'
import { uploadFile } from '@/lib/api/file'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'

interface Props {
  portfolio?: Portfolio | null
  isEdit?: boolean
}

interface ImageFile {
  uuid?: string
  file?: File
  preview: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
}

interface VideoFile {
  uuid?: string
  file?: File
  preview: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
}

// 프로젝트 규모 옵션
const PROJECT_SCALE_OPTIONS = [
  { value: '', label: '선택하세요' },
  { value: 'SMALL', label: '소형 (10평 미만)' },
  { value: 'MEDIUM', label: '중형 (10~30평)' },
  { value: 'LARGE', label: '대형 (30~50평)' },
  { value: 'XLARGE', label: '초대형 (50평 이상)' },
]

// 예산 범위 옵션
const BUDGET_RANGE_OPTIONS = [
  { value: '', label: '선택하세요' },
  { value: 'UNDER_1000', label: '1,000만원 미만' },
  { value: '1000_3000', label: '1,000~3,000만원' },
  { value: '3000_5000', label: '3,000~5,000만원' },
  { value: '5000_10000', label: '5,000만원~1억원' },
  { value: 'OVER_10000', label: '1억원 이상' },
]

export default function PortfolioForm({ portfolio, isEdit = false }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(portfolio?.title || '')
  const [description, setDescription] = useState(portfolio?.description || '')
  const [content, setContent] = useState(portfolio?.content || '')
  const [tags, setTags] = useState<string[]>(portfolio?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [images, setImages] = useState<ImageFile[]>([])
  const [videos, setVideos] = useState<VideoFile[]>([])
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState(0)
  const [selectedFilters, setSelectedFilters] = useState<number[]>([])
  const [filterCategories, setFilterCategories] = useState<PublicFilterCategory[]>([])
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [expandedOptions, setExpandedOptions] = useState<Set<number>>(new Set())
  const [collapsedCategories, setCollapsedCategories] = useState<Set<number>>(new Set())

  // 프로젝트 정보
  const [projectType, setProjectType] = useState(portfolio?.projectType || '')
  const [projectScale, setProjectScale] = useState(portfolio?.projectScale || '')
  const [projectDuration, setProjectDuration] = useState<number | ''>(portfolio?.projectDuration || '')
  const [projectDate, setProjectDate] = useState(portfolio?.projectDate || '')

  // 예산 정보
  const [budgetRange, setBudgetRange] = useState(portfolio?.budgetRange || '')
  const [actualCost, setActualCost] = useState<number | ''>(portfolio?.actualCost || '')

  // 우대등록 관련
  const [promotionPrices, setPromotionPrices] = useState<PromotionPrice[]>([])
  const [selectedPromotion, setSelectedPromotion] = useState<string | null>(
    portfolio?.promotion?.promotionType || null
  )
  const [promotionMonths, setPromotionMonths] = useState(1)
  const [autoRenew, setAutoRenew] = useState(portfolio?.promotion?.autoRenew || false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingFilters, setIsLoadingFilters] = useState(true)

  // 기존 이미지 및 비디오 로드
  useEffect(() => {
    if (portfolio?.images) {
      setImages(
        portfolio.images.map(img => ({
          uuid: img.uuid,
          preview: img.fileUrl,
          fileUrl: img.fileUrl,
          fileName: img.originalFilename,
          fileSize: img.fileSize,
        }))
      )
    }
    if (portfolio?.videos) {
      setVideos(
        portfolio.videos.map(vid => ({
          uuid: vid.uuid,
          preview: vid.fileUrl,
          fileUrl: vid.fileUrl,
          fileName: vid.originalFilename,
          fileSize: vid.fileSize,
        }))
      )
    }
  }, [portfolio])

  // 필터 옵션 로드
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const filters = await getPublicFilters('PORTFOLIO')

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
        showErrorToast(error, '필터 옵션을 불러오는데 실패했습니다')
      } finally {
        setIsLoadingFilters(false)
      }
    }

    fetchFilters()
  }, [])

  // 우대등록 가격 로드
  useEffect(() => {
    const fetchPromotionPrices = async () => {
      try {
        const response = await getPromotionPrices()
        if (response.success && response.data) {
          setPromotionPrices(response.data)
        }
      } catch (error) {
        showErrorToast(error, '우대등록 가격 정보를 불러오는데 실패했습니다')
      }
    }

    fetchPromotionPrices()
  }, [])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: ImageFile[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith('image/')) {
        newImages.push({
          file,
          preview: URL.createObjectURL(file),
          fileName: file.name,
          fileSize: file.size,
        })
      }
    }

    setImages(prev => [...prev, ...newImages])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev]
      if (newImages[index].preview && !newImages[index].fileUrl) {
        URL.revokeObjectURL(newImages[index].preview)
      }
      newImages.splice(index, 1)
      // 썸네일 인덱스 조정
      if (selectedThumbnailIndex >= newImages.length) {
        setSelectedThumbnailIndex(Math.max(0, newImages.length - 1))
      } else if (index < selectedThumbnailIndex) {
        setSelectedThumbnailIndex(selectedThumbnailIndex - 1)
      }
      return newImages
    })
  }

  // 비디오 선택 핸들러
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newVideos: VideoFile[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith('video/')) {
        newVideos.push({
          file,
          preview: URL.createObjectURL(file),
          fileName: file.name,
          fileSize: file.size,
        })
      }
    }

    setVideos(prev => [...prev, ...newVideos])
    if (videoInputRef.current) {
      videoInputRef.current.value = ''
    }
  }

  // 비디오 삭제 핸들러
  const handleRemoveVideo = (index: number) => {
    setVideos(prev => {
      const newVideos = [...prev]
      if (newVideos[index].preview && !newVideos[index].fileUrl) {
        URL.revokeObjectURL(newVideos[index].preview)
      }
      newVideos.splice(index, 1)
      return newVideos
    })
  }

  // 썸네일 선택 핸들러
  const handleSelectThumbnail = (index: number) => {
    setSelectedThumbnailIndex(index)
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags(prev => [...prev, tag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
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
      const filtered = selectedFilters.filter(id => !categoryOptionIds.includes(id))

      if (checked) {
        setSelectedFilters([...filtered, optionId])
      } else {
        setSelectedFilters(filtered)
      }
    } else {
      if (checked) {
        setSelectedFilters([...selectedFilters, optionId])
      } else {
        setSelectedFilters(selectedFilters.filter(id => id !== optionId))
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
    setSelectedFilters(selectedFilters.filter(id => id !== optionId))
  }

  // 전체 필터 초기화
  const handleClearAllFilters = () => {
    setSelectedFilters([])
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
      return selectedFilters.includes(option.id) ? 1 : 0
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

    const isSelected = selectedFilters.includes(option.id)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      showErrorToast(null, '제목을 입력해주세요')
      return
    }

    if (images.length === 0) {
      showErrorToast(null, '최소 1개 이상의 이미지를 등록해주세요')
      return
    }

    setIsSubmitting(true)

    try {
      // 새 이미지 업로드
      const newImageFiles = images.filter(img => img.file).map(img => img.file!)
      const uploadedImageUuids: string[] = []

      for (const file of newImageFiles) {
        const result = await uploadFile(file, 'PORTFOLIO')
        uploadedImageUuids.push(result.uuid)
      }

      // 기존 이미지 UUID들의 순서 유지하면서 새 이미지 UUID 매핑
      const allImageUuids: string[] = []
      let newImageIndex = 0
      for (const img of images) {
        if (img.uuid) {
          allImageUuids.push(img.uuid)
        } else {
          allImageUuids.push(uploadedImageUuids[newImageIndex])
          newImageIndex++
        }
      }

      // 새 비디오 업로드
      const newVideoFiles = videos.filter(vid => vid.file).map(vid => vid.file!)
      const uploadedVideoUuids: string[] = []

      for (const file of newVideoFiles) {
        const result = await uploadFile(file, 'PORTFOLIO')
        uploadedVideoUuids.push(result.uuid)
      }

      // 기존 비디오 + 새 비디오 병합
      const allVideoUuids: string[] = []
      let newVideoIndex = 0
      for (const vid of videos) {
        if (vid.uuid) {
          allVideoUuids.push(vid.uuid)
        } else {
          allVideoUuids.push(uploadedVideoUuids[newVideoIndex])
          newVideoIndex++
        }
      }

      // 썸네일 UUID 결정 (선택된 이미지의 UUID)
      const thumbnailUuid = allImageUuids[selectedThumbnailIndex] || allImageUuids[0]

      if (isEdit && portfolio) {
        // 수정
        const updateData: PortfolioUpdateRequest = {
          title: title.trim(),
          description: description.trim(),
          content: content.trim() || undefined,
          tags,
          imageUuids: allImageUuids,
          videoUuids: allVideoUuids.length > 0 ? allVideoUuids : undefined,
          thumbnailUuid: thumbnailUuid,
          filterOptionIds: selectedFilters,
          projectType: projectType || undefined,
          projectScale: projectScale || undefined,
          projectDuration: projectDuration || undefined,
          projectDate: projectDate || undefined,
          budgetRange: budgetRange || undefined,
          actualCost: actualCost || undefined,
        }

        await updatePortfolio(portfolio.uuid, updateData)
        showSuccessToast('포트폴리오가 수정되었습니다')
        router.push(`/portfolios/${portfolio.uuid}`)
      } else {
        // 생성
        const createData: PortfolioCreateRequest = {
          title: title.trim(),
          description: description.trim(),
          content: content.trim() || undefined,
          tags,
          imageUuids: allImageUuids,
          videoUuids: allVideoUuids.length > 0 ? allVideoUuids : undefined,
          thumbnailUuid: thumbnailUuid,
          filterOptionIds: selectedFilters,
          projectType: projectType || undefined,
          projectScale: projectScale || undefined,
          projectDuration: projectDuration || undefined,
          projectDate: projectDate || undefined,
          budgetRange: budgetRange || undefined,
          actualCost: actualCost || undefined,
          promotionType: selectedPromotion || undefined,
          promotionMonths: selectedPromotion ? promotionMonths : undefined,
          autoRenew: selectedPromotion ? autoRenew : undefined,
        }

        const response = await createPortfolio(createData)
        if (response.success && response.data) {
          showSuccessToast('포트폴리오가 등록되었습니다')
          router.push(`/portfolios/${response.data.uuid}`)
        }
      }
    } catch (error) {
      showErrorToast(error, isEdit ? '수정에 실패했습니다' : '등록에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedPromotionPrice = promotionPrices.find(
    p => p.promotionType === selectedPromotion
  )
  const totalPromotionPrice = selectedPromotionPrice
    ? selectedPromotionPrice.monthlyPrice * promotionMonths
    : 0

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? '포트폴리오 수정' : '포트폴리오 등록'}
        </h1>
      </div>

      <div className="space-y-8">
        {/* 이미지 업로드 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiImage className="w-5 h-5" />
            이미지
            <span className="text-sm font-normal text-gray-500">
              (최대 20장, 클릭하여 대표 이미지 선택)
            </span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image, index) => (
              <div
                key={index}
                onClick={() => handleSelectThumbnail(index)}
                className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden group cursor-pointer transition-all ${
                  selectedThumbnailIndex === index
                    ? 'ring-4 ring-blue-500 ring-offset-2'
                    : 'hover:ring-2 hover:ring-gray-300'
                }`}
              >
                <Image
                  src={image.preview}
                  alt={`이미지 ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveImage(index)
                  }}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiX className="w-4 h-4" />
                </button>
                {selectedThumbnailIndex === index && (
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded flex items-center gap-1">
                    <FiCheck className="w-3 h-3" />
                    대표
                  </span>
                )}
              </div>
            ))}

            {images.length < 20 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
              >
                <FiUpload className="w-8 h-8 mb-2" />
                <span className="text-sm">이미지 추가</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* 영상 업로드 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiVideo className="w-5 h-5" />
            영상
            <span className="text-sm font-normal text-gray-500">
              (선택사항, 최대 5개)
            </span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {videos.map((video, index) => (
              <div
                key={index}
                className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden group"
              >
                <video
                  src={video.preview}
                  className="w-full h-full object-cover"
                  muted
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <FiVideo className="w-10 h-10 text-white/70" />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveVideo(index)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiX className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-xs truncate bg-black/50 px-2 py-1 rounded">
                    {video.fileName}
                  </p>
                </div>
              </div>
            ))}

            {videos.length < 5 && (
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
              >
                <FiUpload className="w-8 h-8 mb-2" />
                <span className="text-sm">영상 추가</span>
              </button>
            )}
          </div>

          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            onChange={handleVideoSelect}
            className="hidden"
          />
        </div>

        {/* 기본 정보 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">기본 정보</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="포트폴리오 제목을 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                간략 설명
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="포트폴리오에 대한 간략한 설명을 입력하세요"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                maxLength={500}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상세 내용
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="시공 과정, 사용 자재, 디자인 컨셉 등 상세 내용을 입력하세요"
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                maxLength={5000}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                태그
                <span className="text-gray-400 text-xs ml-2">
                  ({tags.length}/10)
                </span>
              </label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-blue-400 hover:text-blue-600"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="태그 입력 후 엔터"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim() || tags.length >= 10}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiPlus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 프로젝트 정보 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiInfo className="w-5 h-5" />
            프로젝트 정보
            <span className="text-sm font-normal text-gray-500">(선택사항)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                프로젝트 유형
              </label>
              <input
                type="text"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                placeholder="예: 주거 인테리어, 상업 공간, 리모델링"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                프로젝트 규모
              </label>
              <select
                value={projectScale}
                onChange={(e) => setProjectScale(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {PROJECT_SCALE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시공 기간 (일)
              </label>
              <input
                type="number"
                value={projectDuration}
                onChange={(e) => setProjectDuration(e.target.value ? parseInt(e.target.value) : '')}
                placeholder="예: 30"
                min={1}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FiCalendar className="w-4 h-4" />
                시공 완료일
              </label>
              <input
                type="date"
                value={projectDate}
                onChange={(e) => setProjectDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 예산 정보 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiDollarSign className="w-5 h-5" />
            예산 정보
            <span className="text-sm font-normal text-gray-500">(선택사항)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                예산 범위
              </label>
              <select
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {BUDGET_RANGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                실제 비용 (만원)
              </label>
              <input
                type="number"
                value={actualCost}
                onChange={(e) => setActualCost(e.target.value ? parseInt(e.target.value) : '')}
                placeholder="예: 3000 (3천만원)"
                min={0}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {actualCost && (
                <p className="text-sm text-gray-500 mt-1">
                  = {(actualCost as number).toLocaleString()}만원
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 필터 선택 */}
        {filterCategories.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">카테고리 선택</h2>

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
                    {selectedFilters.length > 0
                      ? `${selectedFilters.length}개의 필터 선택됨`
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
            {selectedFilters.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">
                    선택된 필터 ({selectedFilters.length})
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
                  {selectedFilters.map(optionId => (
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

        {/* 우대등록 (생성 시만 표시) */}
        {!isEdit && promotionPrices.length > 0 && (
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <FiStar className="w-5 h-5 text-yellow-500" />
              우대등록
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              우대등록을 하면 메인 페이지 상단에 포트폴리오가 노출됩니다
            </p>

            <div className="space-y-4">
              {/* 우대등록 타입 선택 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPromotion(null)}
                  className={`p-4 rounded-xl border-2 text-left transition-colors ${
                    selectedPromotion === null
                      ? 'border-gray-400 bg-white'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold text-gray-900">등록 안함</p>
                  <p className="text-sm text-gray-500 mt-1">일반 포트폴리오로 등록</p>
                </button>

                {promotionPrices.map((price) => (
                  <button
                    key={price.promotionType}
                    type="button"
                    onClick={() => setSelectedPromotion(price.promotionType)}
                    className={`p-4 rounded-xl border-2 text-left transition-colors ${
                      selectedPromotion === price.promotionType
                        ? 'border-yellow-400 bg-yellow-50'
                        : 'border-gray-200 bg-white hover:border-yellow-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900">{price.displayName || price.promotionType}</p>
                      <span className="text-sm font-bold text-yellow-600">
                        {price.weight || 1}x 노출
                      </span>
                    </div>
                    {price.description && (
                      <p className="text-sm text-gray-600 mt-1">{price.description}</p>
                    )}
                    <p className="text-lg font-bold text-gray-900 mt-2">
                      월 {(price.monthlyPrice || 0).toLocaleString()}원
                    </p>
                  </button>
                ))}
              </div>

              {/* 기간 선택 */}
              {selectedPromotion && (
                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    우대등록 기간
                  </label>
                  <div className="flex gap-2">
                    {[1, 3, 6, 12].map((month) => (
                      <button
                        key={month}
                        type="button"
                        onClick={() => setPromotionMonths(month)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          promotionMonths === month
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {month}개월
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-gray-600">총 결제 금액</span>
                    <span className="text-xl font-bold text-gray-900">
                      {totalPromotionPrice.toLocaleString()}원
                    </span>
                  </div>
                </div>
              )}

              {/* 자동 갱신 옵션 */}
              {selectedPromotion && (
                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRenew}
                      onChange={(e) => setAutoRenew(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500 mt-0.5"
                    />
                    <div>
                      <span className="font-medium text-gray-900">자동 갱신</span>
                      <p className="text-sm text-gray-600 mt-0.5">
                        기간 종료 시 자동으로 우대등록이 갱신됩니다. 크레딧이 부족하면 갱신되지 않습니다.
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 제출 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isEdit ? '수정 중...' : '등록 중...'}
              </span>
            ) : (
              isEdit ? '수정하기' : (selectedPromotion ? `${totalPromotionPrice.toLocaleString()}원 결제 및 등록` : '등록하기')
            )}
          </button>
        </div>
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
                  {selectedFilters.length}개 선택됨
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
            {selectedFilters.length > 0 && (
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
                  {selectedFilters.slice(0, 10).map(optionId => (
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
                  {selectedFilters.length > 10 && (
                    <span className="text-xs text-gray-500 py-1">
                      +{selectedFilters.length - 10}개 더
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
                        return sum + (selectedFilters.includes(opt.id) ? 1 : 0)
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
                {selectedFilters.length > 0
                  ? `${selectedFilters.length}개 필터 적용하기`
                  : '닫기'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
