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
import { getMyCompany } from '@/lib/api/company'
import Checkbox from '@/components/ui/Checkbox'
import { getPublicFilters, type PublicFilterCategory } from '@/lib/api/filter'
import { getPromotionPrices, type PromotionTypeSetting } from '@/lib/api/gallery-promotion'
import { getCreditBalance } from '@/lib/api/credit'
import { FiStar, FiInfo, FiCreditCard } from 'react-icons/fi'
import { compressImage } from '@/lib/imageCompression'

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
  const [creditBalance, setCreditBalance] = useState(0)
  const [showCompanyRequiredDialog, setShowCompanyRequiredDialog] = useState(false)
  const [showCompanyDetailsRequiredDialog, setShowCompanyDetailsRequiredDialog] = useState(false)

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
  const [collapsedCategories, setCollapsedCategories] = useState<Set<number>>(new Set())

  // 이미지
  const [images, setImages] = useState<ImageAttachment[]>([])

  // 우대등록
  const [promotionSettings, setPromotionSettings] = useState<PromotionTypeSetting[]>([])
  const [selectedPromotionType, setSelectedPromotionType] = useState<string | null>(null)
  const [autoRenew, setAutoRenew] = useState(false)
  const [isLoadingPromotions, setIsLoadingPromotions] = useState(true)

  // 이미지 압축 중 상태
  const [isCompressing, setIsCompressing] = useState(false)

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
          if (response.data.isAdmin) {
            // 관리자는 상세정보 체크 불필요
            setIsCompany(true)
            // 크레딧 잔액 조회
            try {
              const creditRes = await getCreditBalance()
              if (creditRes.success && creditRes.data) {
                setCreditBalance(creditRes.data.balance)
              }
            } catch (e) {
              console.error('크레딧 잔액 조회 실패:', e)
            }
          } else if (response.data.isCompany) {
            // 업체인 경우 상세정보 확인
            try {
              const companyRes = await getMyCompany()
              if (companyRes.success && companyRes.data) {
                setIsCompany(true)
                // 크레딧 잔액 조회
                try {
                  const creditRes = await getCreditBalance()
                  if (creditRes.success && creditRes.data) {
                    setCreditBalance(creditRes.data.balance)
                  }
                } catch (e) {
                  console.error('크레딧 잔액 조회 실패:', e)
                }
              } else {
                setShowCompanyDetailsRequiredDialog(true)
              }
            } catch (error) {
              // 404 등 에러 = 상세정보 없음
              setShowCompanyDetailsRequiredDialog(true)
            }
          } else {
            setShowCompanyRequiredDialog(true)
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

        // 삭제되지 않고 활성화된 옵션만 필터링
        const filterActiveOptions = (options: typeof filters[0]['options']) => {
          return options.filter(option => {
            // isDeleted가 true면 제외
            if (option.isDeleted === true) return false
            // isActive가 false면 제외 (undefined나 true면 포함)
            if (option.isActive === false) return false
            return true
          })
        }

        // 플랫 배열을 트리 구조로 변환하는 함수
        const buildOptionTree = (options: typeof filters[0]['options']) => {
          // 먼저 삭제/비활성 옵션 제외
          const activeOptions = filterActiveOptions(options)

          const optionMap = new Map<number, typeof options[0]>()
          const roots: typeof options = []

          // 모든 옵션을 맵에 저장하고 children 배열 초기화
          activeOptions.forEach(option => {
            optionMap.set(option.id, { ...option, children: [] })
          })

          // 부모-자식 관계 설정
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

        // 각 카테고리의 options를 트리 구조로 변환
        const filtersWithTree = filters.map(category => ({
          ...category,
          options: buildOptionTree(category.options)
        }))
        setFilterCategories(filtersWithTree)
        // 모든 카테고리를 기본 접힌 상태로 설정
        setCollapsedCategories(new Set(filtersWithTree.map(c => c.id)))
      } catch (error) {
        showErrorToast(error, '필터 정보를 불러오는데 실패했습니다')
      } finally {
        setIsLoadingFilters(false)
      }
    }
    loadFilters()
  }, [])

  // 우대등록 가격 설정 로드
  useEffect(() => {
    const loadPromotionPrices = async () => {
      try {
        const response = await getPromotionPrices()
        if (response.success && response.data) {
          // 활성화된 설정만, displayOrder로 정렬
          const activeSettings = response.data
            .filter(s => s.isActive)
            .sort((a, b) => a.displayOrder - b.displayOrder)
          setPromotionSettings(activeSettings)
        }
      } catch (error) {
        console.error('우대등록 가격 정보를 불러오는데 실패했습니다:', error)
      } finally {
        setIsLoadingPromotions(false)
      }
    }
    loadPromotionPrices()
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

  // 선택된 우대등록 정보 가져오기
  const getSelectedPromotion = () => {
    if (!selectedPromotionType) return null
    return promotionSettings.find(s => s.promotionType === selectedPromotionType)
  }

  // 크레딧 부족 여부 확인
  const hasInsufficientCredits = () => {
    const selectedPromo = getSelectedPromotion()
    if (!selectedPromo) return false
    return creditBalance < selectedPromo.price
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

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
    if (validFiles.length === 0) return

    setIsCompressing(true)

    try {
      const newImages: ImageAttachment[] = []
      const oversizedFiles: string[] = []

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]

        // 이미지 압축
        const compressedFile = await compressImage(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
        })

        // 압축 후에도 10MB 초과하면 제외
        if (compressedFile.size > MAX_FILE_SIZE) {
          oversizedFiles.push(`${file.name} (${(compressedFile.size / 1024 / 1024).toFixed(1)}MB)`)
          continue
        }

        // 프리뷰 생성
        const preview = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(compressedFile)
        })

        newImages.push({
          file: compressedFile,
          preview,
          displayOrder: images.length + newImages.length,
        })
      }

      if (oversizedFiles.length > 0) {
        showErrorToast(null, `파일 크기 초과 (최대 10MB):\n${oversizedFiles.join('\n')}`)
      }

      if (newImages.length > 0) {
        setImages([...images, ...newImages])
      }
    } finally {
      setIsCompressing(false)
    }
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

      // 포트폴리오 생성
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
        // 우대등록 옵션
        promotionType: selectedPromotionType as 'STANDARD' | 'PREMIUM' | undefined,
        autoRenew: selectedPromotionType ? autoRenew : undefined,
      }

      const result = await createGallery(data)

      if (result.success && result.data) {
        showSuccessToast('포트폴리오가 등록되었습니다')
        router.push(`/photos/${result.data.uuid}`)
      }
    } catch (error: any) {
      if (error?.response?.status === 400) {
        showErrorToast(error, '입력 정보를 확인해주세요')
      } else {
        showErrorToast(error, '포트폴리오 등록에 실패했습니다')
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

  // 업체 등록 필요 다이얼로그
  if (showCompanyRequiredDialog) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
                <svg
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                업체 등록이 필요합니다
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                사진을 등록하려면 먼저 업체 정보를 등록해야 합니다.
                <br />
                업체 등록 페이지로 이동하시겠습니까?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCompanyRequiredDialog(false)
                    router.back()
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  돌아가기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCompanyRequiredDialog(false)
                    router.push('/mypage/company-register')
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  업체 등록하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 업체 상세정보 등록 필요 다이얼로그
  if (showCompanyDetailsRequiredDialog) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
                <svg
                  className="h-8 w-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                업체 상세정보 등록이 필요합니다
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                사진을 등록하려면 먼저 업체 상세정보를 입력해야 합니다.
                <br />
                업체 정보 수정 페이지로 이동하시겠습니까?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCompanyDetailsRequiredDialog(false)
                    router.back()
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  돌아가기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCompanyDetailsRequiredDialog(false)
                    router.push('/mypage/company-profile-edit')
                  }}
                  className="flex-1 px-4 py-3 bg-yellow-500 text-white rounded-xl font-medium hover:bg-yellow-600 transition-colors"
                >
                  상세정보 등록하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">포트폴리오 등록</h1>

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
                  placeholder="포트폴리오 제목을 입력하세요"
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
                  placeholder="포트폴리오에 대한 설명을 입력하세요"
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

          {/* 우대등록 옵션 */}
          {promotionSettings.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiStar className="text-yellow-500" />
                우대등록
              </h2>
              <div className="space-y-4">
                {/* 크레딧 잔액 표시 */}
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <FiCreditCard className="text-gray-500" />
                  <span className="text-sm text-gray-600">내 크레딧:</span>
                  <span className="font-bold text-blue-600">
                    {creditBalance.toLocaleString()}원
                  </span>
                </div>

                {/* 우대 타입 선택 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 일반 등록 (우대 없음) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPromotionType(null)
                      setAutoRenew(false)
                    }}
                    className={`relative p-4 border-2 rounded-xl text-left transition-all ${
                      selectedPromotionType === null
                        ? 'border-gray-600 bg-gray-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900">일반 등록</span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPromotionType === null
                          ? 'border-gray-600 bg-gray-600'
                          : 'border-gray-300'
                      }`}>
                        {selectedPromotionType === null && (
                          <FiCheck className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">우대 없이 일반 등록</p>
                    <p className="text-lg font-bold text-gray-900 mt-2">무료</p>
                  </button>

                  {/* 우대 옵션들 */}
                  {promotionSettings.map((setting) => {
                    const isSelected = selectedPromotionType === setting.promotionType
                    const isPremium = setting.promotionType === 'PREMIUM'
                    const insufficientCredits = creditBalance < setting.price

                    return (
                      <button
                        key={setting.uuid}
                        type="button"
                        onClick={() => {
                          if (!insufficientCredits) {
                            setSelectedPromotionType(setting.promotionType)
                          }
                        }}
                        disabled={insufficientCredits}
                        className={`relative p-4 border-2 rounded-xl text-left transition-all ${
                          isSelected
                            ? isPremium
                              ? 'border-yellow-500 bg-yellow-50 shadow-md'
                              : 'border-blue-500 bg-blue-50 shadow-md'
                            : insufficientCredits
                              ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                              : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {isPremium && (
                          <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                            추천
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-bold ${isPremium ? 'text-yellow-700' : 'text-blue-700'}`}>
                            {setting.displayName}
                          </span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? isPremium
                                ? 'border-yellow-500 bg-yellow-500'
                                : 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && <FiCheck className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{setting.description}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <p className={`text-lg font-bold ${isPremium ? 'text-yellow-700' : 'text-blue-700'}`}>
                            {setting.price.toLocaleString()}원/월
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isPremium
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            가중치 {setting.weight}x
                          </span>
                        </div>
                        {insufficientCredits && (
                          <p className="text-xs text-red-500 mt-2">크레딧이 부족합니다</p>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* 자동 갱신 옵션 */}
                {selectedPromotionType && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoRenew}
                        onChange={(e) => setAutoRenew(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                      />
                      <div>
                        <span className="font-medium text-gray-900">자동 갱신</span>
                        <p className="text-sm text-gray-600 mt-0.5">
                          매월 자동으로 우대등록이 갱신됩니다. 크레딧이 부족하면 갱신되지 않습니다.
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* 안내 메시지 */}
                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                  <FiInfo className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    우대등록 시 메인페이지 추천 영역에 노출되어 더 많은 관심을 받을 수 있습니다.
                    가중치가 높을수록 노출 확률이 높아집니다.
                  </p>
                </div>

                {/* 선택된 우대 요약 */}
                {selectedPromotionType && (
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-100">선택된 우대</p>
                        <p className="font-bold text-lg">
                          {getSelectedPromotion()?.displayName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-blue-100">결제 금액</p>
                        <p className="font-bold text-lg">
                          {getSelectedPromotion()?.price.toLocaleString()}원
                        </p>
                      </div>
                    </div>
                    {hasInsufficientCredits() && (
                      <div className="mt-3 p-2 bg-red-500/20 rounded text-sm">
                        ⚠️ 크레딧이 부족합니다. 충전 후 이용해주세요.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 이미지 업로드 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              이미지 <span className="text-red-500">*</span>
            </h2>
            <div className="space-y-4">
              {isCompressing ? (
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-blue-50">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
                  <p className="text-blue-600 font-medium">이미지 압축 중...</p>
                  <p className="text-sm text-gray-500 mt-1">
                    잠시만 기다려주세요
                  </p>
                </div>
              ) : (
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
                      여러 이미지를 선택할 수 있습니다 (파일당 최대 10MB, 자동 압축)
                    </p>
                  </div>
                </label>
              )}

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
              {isSubmitting ? '등록 중...' : '포트폴리오 등록'}
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
    </div>
  )
}
