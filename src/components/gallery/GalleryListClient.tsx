'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FiSearch, FiPlus, FiEye, FiBookmark, FiTag, FiImage, FiX, FiMoreVertical, FiEdit, FiTrash2, FiExternalLink, FiFilter, FiHeart, FiStar, FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { searchGalleries, deleteGallery, toggleBookmark, toggleLike, type GalleryListItem, type GallerySearchParams, type GallerySearchResponse } from '@/lib/api/gallery'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import { useAuth } from '@/hooks/useAuth'
import { getPublicFilters, type PublicFilterCategory } from '@/lib/api/filter'

interface GalleryListClientProps {
  initialData?: GallerySearchResponse
}

export default function GalleryListClient({ initialData }: GalleryListClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { user } = useAuth()

  // 현재 경로 (메인페이지면 '/', 아니면 현재 경로)
  const basePath = pathname || '/'

  const [galleries, setGalleries] = useState<GalleryListItem[]>(initialData?.content || [])
  const [isLoading, setIsLoading] = useState(!initialData)

  // 메뉴 드롭다운 상태
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // 삭제 다이얼로그
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingGallery, setDeletingGallery] = useState<GalleryListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 필터 펼침/접힘 상태
  const [showFilters, setShowFilters] = useState(false)
  // 모바일 필터 팝업
  const [showMobileFilterPopup, setShowMobileFilterPopup] = useState(false)

  // 필터 카테고리
  const [filterCategories, setFilterCategories] = useState<PublicFilterCategory[]>([])
  const [isLoadingFilters, setIsLoadingFilters] = useState(true)

  // 이미지 URL 헬퍼 함수
  const getImageUrl = (url: string | undefined) => {
    if (!url) return ''
    // 이미 http로 시작하는 절대 경로면 그대로 반환
    if (url.startsWith('http')) return url
    // 상대 경로면 백엔드 서버 URL 붙이기
    return `http://43.203.237.51:8080${url}`
  }

  // 썸네일 URL 가져오기 (첫 번째 이미지)
  const getThumbnailUrl = (gallery: GalleryListItem) => {
    if (gallery.images && gallery.images.length > 0) {
      return gallery.images[0].fileUrl
    }
    return ''
  }

  // Pagination
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(initialData?.totalPages || 0)
  const [totalElements, setTotalElements] = useState(initialData?.totalElements || 0)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Search & Filter
  const [keyword, setKeyword] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedFilterOptionIds, setSelectedFilterOptionIds] = useState<number[]>([])
  const [sortBy, setSortBy] = useState<'CREATED_AT' | 'VIEW_COUNT' | 'BOOKMARK_COUNT'>('CREATED_AT')
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC')
  const [onlyBookmarked, setOnlyBookmarked] = useState(false)
  const [onlyMyPosts, setOnlyMyPosts] = useState(false)
  const [expandedOptions, setExpandedOptions] = useState<Set<number>>(new Set())

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

  const handleSelectTag = (categoryName: string, optionName: string) => {
    // 선택한 옵션의 ID 찾기
    const category = filterCategories.find(c => c.name === categoryName)
    if (!category) return

    const option = category.options.find(o => o.name === optionName)
    if (!option) return

    if (!selectedFilterOptionIds.includes(option.id)) {
      const newFilterOptionIds = [...selectedFilterOptionIds, option.id]
      const newTags = [...selectedTags, optionName]
      setSelectedFilterOptionIds(newFilterOptionIds)
      setSelectedTags(newTags)
      // 바로 검색 실행
      updateURL({
        page: 0,
        keyword,
        filterOptionIds: newFilterOptionIds,
        tags: newTags,
        sortBy,
        sortDirection,
        onlyBookmarked,
        onlyMyPosts,
      })
    }
  }

  const handleRemoveTag = (tag: string) => {
    // 태그에 해당하는 필터 옵션 ID 찾기
    let optionIdToRemove: number | null = null
    for (const category of filterCategories) {
      const option = category.options.find(o => o.name === tag)
      if (option) {
        optionIdToRemove = option.id
        break
      }
    }

    const newTags = selectedTags.filter(t => t !== tag)
    const newFilterOptionIds = optionIdToRemove
      ? selectedFilterOptionIds.filter(id => id !== optionIdToRemove)
      : selectedFilterOptionIds

    setSelectedTags(newTags)
    setSelectedFilterOptionIds(newFilterOptionIds)
    // 바로 검색 실행
    updateURL({
      page: 0,
      keyword,
      filterOptionIds: newFilterOptionIds,
      tags: newTags,
      sortBy,
      sortDirection,
      onlyBookmarked,
      onlyMyPosts,
    })
  }

  const handleClearAllTags = () => {
    setSelectedTags([])
    setSelectedFilterOptionIds([])
    // 바로 검색 실행
    updateURL({
      page: 0,
      keyword,
      filterOptionIds: [],
      tags: [],
      sortBy,
      sortDirection,
      onlyBookmarked,
      onlyMyPosts,
    })
  }

  // 체크박스로 필터 토글
  const handleToggleFilterOption = (optionId: number, optionName: string, checked: boolean) => {
    let newFilterOptionIds: number[]
    let newTags: string[]

    if (checked) {
      newFilterOptionIds = [...selectedFilterOptionIds, optionId]
      newTags = [...selectedTags, optionName]
    } else {
      newFilterOptionIds = selectedFilterOptionIds.filter(id => id !== optionId)
      newTags = selectedTags.filter(t => t !== optionName)
    }

    setSelectedFilterOptionIds(newFilterOptionIds)
    setSelectedTags(newTags)
    updateURL({
      page: 0,
      keyword,
      filterOptionIds: newFilterOptionIds,
      tags: newTags,
      sortBy,
      sortDirection,
      onlyBookmarked,
      onlyMyPosts,
    })
  }

  const handleResetFilters = () => {
    setKeyword('')
    setSelectedTags([])
    setSelectedFilterOptionIds([])
    setSortBy('CREATED_AT')
    setSortDirection('DESC')
    setOnlyBookmarked(false)
    setOnlyMyPosts(false)
    // URL을 초기 상태로
    router.push(basePath, { scroll: false })
  }

  const fetchGalleries = useCallback(async (params: GallerySearchParams = {}) => {
    setIsLoading(true)
    try {
      const result = await searchGalleries({
        page: params.page || 0,
        size: 12,
        keyword: params.keyword || undefined,
        filterOptionIds: params.filterOptionIds || undefined,
        tags: params.tags || undefined,
        sortBy: params.sortBy || sortBy,
        sortDirection: params.sortDirection || sortDirection,
        onlyBookmarked: params.onlyBookmarked,
        onlyMyPosts: params.onlyMyPosts,
      })

      if (result.success && result.data) {
        setGalleries(result.data.content || [])
        setTotalPages(result.data.totalPages || 0)
        setTotalElements(result.data.totalElements || 0)
      } else {
        setGalleries([])
        setTotalPages(0)
        setTotalElements(0)
      }
    } catch (error) {
      showErrorToast(error, '포트폴리오 목록을 불러오는데 실패했습니다')
      setGalleries([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setIsLoading(false)
    }
  }, [sortBy, sortDirection])

  useEffect(() => {
    // URL 파라미터에서 검색 조건 복원
    const page = parseInt(searchParams.get('page') || '0')
    const keyword = searchParams.get('keyword') || ''
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const filterOptionIdsStr = searchParams.get('filterOptionIds')?.split(',').filter(Boolean) || []
    const filterOptionIds = filterOptionIdsStr.map(id => parseInt(id))
    const sortBy = (searchParams.get('sortBy') || 'CREATED_AT') as 'CREATED_AT' | 'VIEW_COUNT' | 'BOOKMARK_COUNT'
    const sortDirection = (searchParams.get('sortDirection') || 'DESC') as 'ASC' | 'DESC'
    const onlyBookmarked = searchParams.get('onlyBookmarked') === 'true'
    const onlyMyPosts = searchParams.get('onlyMyPosts') === 'true'

    setCurrentPage(page)
    setKeyword(keyword)
    setSelectedTags(tags)
    setSelectedFilterOptionIds(filterOptionIds)
    setSortBy(sortBy)
    setSortDirection(sortDirection)
    setOnlyBookmarked(onlyBookmarked)
    setOnlyMyPosts(onlyMyPosts)

    // 초기 로드 시 SSR 데이터 사용, URL 파라미터 변경 시에만 fetch
    const hasUrlParams = searchParams.toString() !== ''
    if (isInitialLoad && initialData && !hasUrlParams) {
      setIsInitialLoad(false)
      return
    }
    setIsInitialLoad(false)
    fetchGalleries({ page, keyword, tags, filterOptionIds, sortBy, sortDirection, onlyBookmarked, onlyMyPosts })
  }, [searchParams, fetchGalleries, isInitialLoad, initialData])

  const updateURL = (params: GallerySearchParams) => {
    const query = new URLSearchParams()
    if (params.page !== undefined) query.set('page', params.page.toString())
    if (params.keyword) query.set('keyword', params.keyword)
    if (params.tags && params.tags.length > 0) query.set('tags', params.tags.join(','))
    if (params.filterOptionIds && params.filterOptionIds.length > 0) query.set('filterOptionIds', params.filterOptionIds.join(','))
    if (params.sortBy) query.set('sortBy', params.sortBy)
    if (params.sortDirection) query.set('sortDirection', params.sortDirection)
    if (params.onlyBookmarked) query.set('onlyBookmarked', 'true')
    if (params.onlyMyPosts) query.set('onlyMyPosts', 'true')

    router.push(`${basePath}?${query.toString()}`, { scroll: false })
  }

  const handleSearch = () => {
    const params = {
      page: 0,
      keyword,
      tags: selectedTags,
      filterOptionIds: selectedFilterOptionIds,
      sortBy,
      sortDirection,
      onlyBookmarked,
      onlyMyPosts,
    }
    updateURL(params)
  }

  const handlePageChange = (newPage: number) => {
    const params = {
      page: newPage,
      keyword,
      tags: selectedTags,
      filterOptionIds: selectedFilterOptionIds,
      sortBy,
      sortDirection,
      onlyBookmarked,
      onlyMyPosts,
    }
    updateURL(params)
  }

  const handleSortChange = (newSortBy: string) => {
    const params = {
      page: 0,
      keyword,
      tags: selectedTags,
      filterOptionIds: selectedFilterOptionIds,
      sortBy: newSortBy as 'CREATED_AT' | 'VIEW_COUNT' | 'BOOKMARK_COUNT',
      sortDirection,
      onlyBookmarked,
      onlyMyPosts,
    }
    updateURL(params)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  const handleDeleteClick = (gallery: GalleryListItem) => {
    setDeletingGallery(gallery)
    setShowDeleteDialog(true)
    setOpenMenuId(null)
  }

  const handleDelete = async () => {
    if (!deletingGallery) return

    setIsDeleting(true)
    try {
      await deleteGallery(deletingGallery.uuid)
      showSuccessToast('포트폴리오가 삭제되었습니다')
      setShowDeleteDialog(false)
      setDeletingGallery(null)
      // 목록 새로고침
      fetchGalleries({ page: currentPage, keyword, tags: selectedTags, filterOptionIds: selectedFilterOptionIds, sortBy, sortDirection, onlyBookmarked, onlyMyPosts })
    } catch (error: any) {
      if (error?.response?.status === 403) {
        showErrorToast(error, '삭제 권한이 없습니다')
      } else {
        showErrorToast(error, '포트폴리오 삭제에 실패했습니다')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleBookmark = async (galleryUuid: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      showErrorToast(null, '로그인이 필요합니다')
      return
    }

    try {
      const result = await toggleBookmark(galleryUuid)
      if (result.success && result.data !== undefined) {
        // result.data는 직접 boolean 값 (true: 추가됨, false: 제거됨)
        const isBookmarked = result.data

        // 포트폴리오 목록에서 해당 포트폴리오의 북마크 상태만 업데이트
        setGalleries(galleries.map(g =>
          g.uuid === galleryUuid
            ? { ...g, isBookmarked: isBookmarked }
            : g
        ))
        showSuccessToast(isBookmarked ? '북마크에 추가했습니다' : '북마크에서 제거했습니다')
      }
    } catch (error) {
      showErrorToast(error, '북마크 처리에 실패했습니다')
    }
  }

  const handleToggleLike = async (galleryUuid: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      showErrorToast(null, '로그인이 필요합니다')
      return
    }

    try {
      const result = await toggleLike(galleryUuid)
      if (result.success && result.data !== undefined) {
        const isLiked = result.data

        setGalleries(galleries.map(g =>
          g.uuid === galleryUuid
            ? { ...g, isLiked: isLiked, likeCount: isLiked ? g.likeCount + 1 : g.likeCount - 1 }
            : g
        ))
        showSuccessToast(isLiked ? '좋아요를 눌렀습니다' : '좋아요를 취소했습니다')
      }
    } catch (error) {
      showErrorToast(error, '좋아요 처리에 실패했습니다')
    }
  }

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null)
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openMenuId])

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

  // 자식 중 선택된 개수 계산
  const getSelectedChildrenCount = (option: typeof filterCategories[0]['options'][0]): number => {
    if (!option.children || option.children.length === 0) {
      return selectedFilterOptionIds.includes(option.id) ? 1 : 0
    }
    return option.children.reduce((sum, child) => sum + getSelectedChildrenCount(child), 0)
  }

  // 필터 옵션 렌더링 (재귀적으로 자식 처리)
  const renderFilterOption = (option: typeof filterCategories[0]['options'][0], depth: number = 0) => {
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
            className="w-full flex items-center justify-between py-1.5 text-left hover:bg-gray-50 rounded transition-colors"
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
              <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                {selectedCount}
              </span>
            )}
          </button>
          {isExpanded && (
            <div className="ml-2 mt-1 space-y-1 border-l-2 border-gray-100 pl-2">
              {option.children!.map((child) => renderFilterOption(child, depth + 1))}
            </div>
          )}
        </div>
      )
    }

    // 자식이 없으면 선택 가능한 체크박스
    return (
      <div key={option.id} className={depth > 0 ? '' : ''}>
        <Checkbox
          checked={selectedFilterOptionIds.includes(option.id)}
          onChange={(checked) => handleToggleFilterOption(option.id, option.name, checked)}
          label={option.name}
          size="sm"
        />
      </div>
    )
  }

  // 필터 사이드바 컴포넌트 (재사용)
  const FilterSidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={isMobile ? '' : 'space-y-4'}>
      {isLoadingFilters ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-600">필터 로딩 중...</p>
        </div>
      ) : filterCategories.length > 0 ? (
        <div className="space-y-4">
          {filterCategories.map((category) => (
            <div key={category.id} className="border-b border-gray-100 pb-4 last:border-b-0">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">{category.name}</h4>
              <div className="space-y-1">
                {category.options.map((option) => renderFilterOption(option, 0))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 text-sm">
          사용 가능한 필터가 없습니다
        </div>
      )}
    </div>
  )

  return (
    <div className="flex gap-6">
      {/* PC: 왼쪽 고정 필터 사이드바 */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-[9rem] bg-white rounded-lg shadow-sm p-4 max-h-[calc(100vh-120px)] overflow-y-auto space-y-4">
          {/* 검색 */}
          <div>
            <div className="relative">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="검색어 입력..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <button
              onClick={handleSearch}
              className="w-full mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              검색
            </button>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                <FiFilter className="text-blue-600" />
                필터
              </h3>
              {(selectedFilterOptionIds.length > 0 || keyword) && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  전체 초기화
                </button>
              )}
            </div>
            {selectedFilterOptionIds.length > 0 && (
              <div className="mb-4 pb-4 border-b border-gray-100">
                <p className="text-xs text-gray-500 mb-2">선택된 필터 ({selectedFilterOptionIds.length})</p>
                <div className="flex flex-wrap gap-1">
                  {selectedTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs"
                    >
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)}>
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <FilterSidebar />
          </div>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">포트폴리오</h1>
            <p className="text-gray-600 mt-2">
              {totalElements}개의 포트폴리오
            </p>
          </div>
          {user && (
            <Link
              href="/photos/create"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <FiPlus className="text-xl" />
              포트폴리오 등록
            </Link>
          )}
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 space-y-4">
          {/* 모바일 검색바 */}
          <div className="lg:hidden flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="제목, 설명, 태그 등 검색..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              </div>
            </div>
            <button
              onClick={handleSearch}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              검색
            </button>
          </div>

          {/* 정렬 및 필터 버튼 */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-full sm:w-auto sm:min-w-[140px]">
              <Select
                label=""
                options={[
                  { value: 'CREATED_AT', label: '최신순' },
                  { value: 'VIEW_COUNT', label: '조회순' },
                ]}
                value={sortBy}
                onChange={handleSortChange}
              />
            </div>

            {user && (
              <>
                <button
                  onClick={() => {
                    const newValue = !onlyBookmarked
                    setOnlyBookmarked(newValue)
                    updateURL({
                      page: 0,
                      keyword,
                      tags: selectedTags,
                      filterOptionIds: selectedFilterOptionIds,
                      sortBy,
                      sortDirection,
                      onlyBookmarked: newValue,
                      onlyMyPosts,
                    })
                  }}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                    onlyBookmarked
                      ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  <FiBookmark className={onlyBookmarked ? 'fill-current' : ''} />
                  <span className="whitespace-nowrap">북마크만</span>
                </button>
                <button
                  onClick={() => {
                    const newValue = !onlyMyPosts
                    setOnlyMyPosts(newValue)
                    updateURL({
                      page: 0,
                      keyword,
                      tags: selectedTags,
                      filterOptionIds: selectedFilterOptionIds,
                      sortBy,
                      sortDirection,
                      onlyBookmarked,
                      onlyMyPosts: newValue,
                    })
                  }}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                    onlyMyPosts
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  <FiEdit />
                  <span className="whitespace-nowrap">내 글만</span>
                </button>
              </>
            )}

            {/* 모바일: 필터 버튼 */}
            <button
              onClick={() => setShowMobileFilterPopup(true)}
              className={`lg:hidden flex items-center gap-2 px-3 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors ml-auto ${
                selectedFilterOptionIds.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiFilter />
              <span className="whitespace-nowrap">모든 필터</span>
              {selectedFilterOptionIds.length > 0 && (
                <span className="bg-white text-blue-600 px-1.5 py-0.5 rounded-full text-xs font-bold">
                  {selectedFilterOptionIds.length}
                </span>
              )}
            </button>
          </div>

          {/* 선택된 필터 미리보기 (모바일) */}
          {selectedTags.length > 0 && (
            <div className="lg:hidden flex flex-wrap items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <FiTag />
                선택된 필터:
              </span>
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-white text-blue-700 px-3 py-1 rounded-full text-sm font-medium shadow-sm border border-blue-200"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-blue-900 transition-colors"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={handleClearAllTags}
                className="ml-auto text-sm text-red-600 hover:text-red-700 font-medium"
              >
                모두 지우기
              </button>
            </div>
          )}
        </div>

      {/* 포트폴리오 그리드 */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">포트폴리오 불러오는 중...</p>
        </div>
      ) : galleries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg">등록된 포트폴리오가 없습니다.</p>
          {user && (
            <Link
              href="/photos/create"
              className="inline-flex items-center gap-2 mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <FiPlus className="text-xl" />
              첫 포트폴리오 등록하기
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleries.map((gallery) => {
              const isAuthor = user?.email === gallery.userEmail

              return (
                <div key={gallery.uuid} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow relative">
                  {/* 메뉴 버튼 (작성자만) */}
                  {isAuthor && (
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setOpenMenuId(openMenuId === gallery.uuid ? null : gallery.uuid)
                        }}
                        className="bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-md transition-all"
                      >
                        <FiMoreVertical className="w-5 h-5 text-gray-700" />
                      </button>

                      {/* 드롭다운 메뉴 */}
                      {openMenuId === gallery.uuid && (
                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                          <Link
                            href={`/photos/${gallery.uuid}/edit`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(null)
                            }}
                            className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-gray-700 transition-colors"
                          >
                            <FiEdit className="w-4 h-4" />
                            <span className="text-sm font-medium">수정</span>
                          </Link>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleDeleteClick(gallery)
                            }}
                            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-red-600 transition-colors"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            <span className="text-sm font-medium">삭제</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <Link href={`/photos/${gallery.uuid}`}>
                    {/* 썸네일 */}
                    <div className="aspect-video bg-gray-200 relative overflow-hidden">
                      {getThumbnailUrl(gallery) ? (
                        <Image
                          src={getThumbnailUrl(gallery)}
                          alt={gallery.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <FiImage className="w-16 h-16" />
                        </div>
                      )}
                      {gallery.images && gallery.images.length > 1 && (
                        <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                          +{gallery.images.length}
                        </div>
                      )}
                      {/* 북마크 버튼 */}
                      {user && (
                        <button
                          onClick={(e) => handleToggleBookmark(gallery.uuid, e)}
                          className={`absolute bottom-2 left-2 p-2 rounded-full shadow-md transition-all ${
                            gallery.isBookmarked
                              ? 'bg-yellow-100 bg-opacity-90 hover:bg-opacity-100'
                              : 'bg-white bg-opacity-90 hover:bg-opacity-100'
                          }`}
                        >
                          <FiBookmark className={`w-5 h-5 ${gallery.isBookmarked ? 'fill-current text-yellow-600' : 'text-gray-600'}`} />
                        </button>
                      )}
                    </div>

                {/* 정보 */}
                <div className="p-4 space-y-3">
                  <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
                    {gallery.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {gallery.content || ''}
                  </p>

                  {gallery.relatedLink && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        window.open(gallery.relatedLink, '_blank', 'noopener,noreferrer')
                      }}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <FiExternalLink className="text-xs" />
                      관련 링크
                    </button>
                  )}

                  {/* 필터 옵션 배지 */}
                  {gallery.filterOptions && gallery.filterOptions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {gallery.filterOptions.slice(0, 3).map(filter => (
                        <span
                          key={filter.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700"
                        >
                          {filter.icon && <span>{filter.icon}</span>}
                          {filter.shortName || filter.name}
                        </span>
                      ))}
                      {gallery.filterOptions.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{gallery.filterOptions.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 태그 */}
                  {gallery.tags && gallery.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {gallery.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs"
                        >
                          <FiTag className="text-xs" />
                          {tag}
                        </span>
                      ))}
                      {gallery.tags && gallery.tags.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{gallery.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                        {(gallery.company?.companyName || gallery.userName)?.charAt(0) || 'U'}
                      </div>
                      <span>{gallery.company?.companyName || gallery.userName || '알 수 없음'}</span>
                      {gallery.company?.averageRating !== undefined && gallery.company.averageRating > 0 && (
                        <span className="flex items-center gap-1 text-yellow-500">
                          <FiStar className="fill-current" />
                          {gallery.company.averageRating.toFixed(1)}
                          {gallery.company.reviewCount !== undefined && (
                            <span className="text-gray-400">({gallery.company.reviewCount})</span>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <FiEye />
                        {gallery.viewCount}
                      </span>
                      <button
                        onClick={(e) => handleToggleLike(gallery.uuid, e)}
                        className={`flex items-center gap-1 transition-colors ${
                          gallery.isLiked ? 'text-red-500' : 'hover:text-red-500'
                        }`}
                      >
                        <FiHeart className={gallery.isLiked ? 'fill-current' : ''} />
                        {gallery.likeCount}
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
            )
          })}
          </div>

          {/* 페이지네이션 */}
          {totalPages >= 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                이전
              </button>

              <div className="flex gap-2">
                {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 10) {
                    pageNum = i
                  } else if (currentPage < 5) {
                    pageNum = i
                  } else if (currentPage > totalPages - 6) {
                    pageNum = totalPages - 10 + i
                  } else {
                    pageNum = currentPage - 5 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
      </div>

      {/* 모바일 필터 팝업 */}
      {showMobileFilterPopup && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileFilterPopup(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col animate-slide-up">
            {/* 헤더 */}
            <div className="sticky top-0 bg-white p-4 border-b z-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FiFilter className="text-blue-600" />
                  검색 및 필터
                  {selectedFilterOptionIds.length > 0 && (
                    <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-sm">
                      {selectedFilterOptionIds.length}
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-3">
                  {(selectedFilterOptionIds.length > 0 || keyword) && (
                    <button
                      onClick={handleResetFilters}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      초기화
                    </button>
                  )}
                  <button
                    onClick={() => setShowMobileFilterPopup(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {/* 검색 입력 */}
              <div className="relative">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="검색어 입력..."
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* 선택된 필터 표시 */}
            {selectedTags.length > 0 && (
              <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                <p className="text-xs text-gray-600 mb-2">선택된 필터</p>
                <div className="flex flex-wrap gap-1">
                  {selectedTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-white text-blue-700 px-2 py-1 rounded-full text-sm font-medium shadow-sm border border-blue-200"
                    >
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)}>
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 필터 목록 */}
            <div className="flex-1 overflow-y-auto p-4">
              <FilterSidebar isMobile />
            </div>

            {/* 하단 버튼 */}
            <div className="sticky bottom-0 bg-white border-t p-4">
              <button
                onClick={() => {
                  handleSearch()
                  setShowMobileFilterPopup(false)
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                검색하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteDialog(false)
              setDeletingGallery(null)
            }}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">포트폴리오 삭제</h3>
            <div className="space-y-4">
              <p className="text-gray-600">
                정말로 이 포트폴리오 삭제하시겠습니까?
                <br />
                삭제된 포트폴리오는 복구할 수 없습니다.
              </p>
              {deletingGallery && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{deletingGallery.title}</p>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {isDeleting ? '삭제 중...' : '삭제'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteDialog(false)
                    setDeletingGallery(null)
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
