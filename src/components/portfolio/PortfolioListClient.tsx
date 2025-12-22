'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FiSearch, FiPlus, FiEye, FiBookmark, FiTag, FiImage, FiX, FiMoreVertical, FiEdit, FiTrash2, FiExternalLink, FiFilter, FiHeart, FiStar, FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { searchPortfolios, deletePortfolio, toggleBookmark, toggleLike, type PortfolioListItem, type PortfolioSearchParams, type PortfolioSearchResponse } from '@/lib/api/portfolio'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import { useAuth } from '@/hooks/useAuth'
import { getPublicFilters, type PublicFilterCategory } from '@/lib/api/filter'

interface PortfolioListClientProps {
  initialData?: PortfolioSearchResponse
}

export default function PortfolioListClient({ initialData }: PortfolioListClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { user } = useAuth()

  const basePath = pathname || '/'

  const [portfolios, setPortfolios] = useState<PortfolioListItem[]>(initialData?.content || [])
  const [isLoading, setIsLoading] = useState(!initialData)

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingPortfolio, setDeletingPortfolio] = useState<PortfolioListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [showFilters, setShowFilters] = useState(false)
  const [showMobileFilterPopup, setShowMobileFilterPopup] = useState(false)
  const [showPCFilterPopup, setShowPCFilterPopup] = useState(false)

  const [filterCategories, setFilterCategories] = useState<PublicFilterCategory[]>([])
  const [isLoadingFilters, setIsLoadingFilters] = useState(true)

  const getThumbnailUrl = (portfolio: PortfolioListItem) => {
    if (portfolio.thumbnailUrl) return portfolio.thumbnailUrl
    if (portfolio.images && portfolio.images.length > 0) {
      return portfolio.images[0].thumbnailUrl || portfolio.images[0].fileUrl
    }
    return ''
  }

  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(initialData?.totalPages || 0)
  const [totalElements, setTotalElements] = useState(initialData?.totalElements || 0)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const [keyword, setKeyword] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedFilterOptionIds, setSelectedFilterOptionIds] = useState<number[]>([])
  const [sortBy, setSortBy] = useState<string>('createdAt,DESC')
  const [onlyBookmarked, setOnlyBookmarked] = useState(false)
  const [onlyMyPosts, setOnlyMyPosts] = useState(false)
  const [companyUuid, setCompanyUuid] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [expandedOptions, setExpandedOptions] = useState<Set<number>>(new Set())
  const [collapsedCategories, setCollapsedCategories] = useState<Set<number>>(new Set())

  // 필터 로드
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const filters = await getPublicFilters('PORTFOLIO')

        const filterActiveOptions = (options: typeof filters[0]['options']) => {
          return options.filter(option => {
            if (option.isDeleted === true) return false
            if (option.isActive === false) return false
            return true
          })
        }

        const buildOptionTree = (options: typeof filters[0]['options']) => {
          const activeOptions = filterActiveOptions(options)
          const optionMap = new Map<number, typeof options[0]>()
          const roots: typeof options = []

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
    setCurrentPage(0)
    fetchPortfolios({
      page: 0,
      keyword,
      filterOptionIds: newFilterOptionIds,
      companyUuid: companyUuid || undefined,
      sort: sortBy,
      onlyBookmarked,
      onlyMyPosts,
    })
  }

  const handleRemoveTag = (tag: string) => {
    let optionIdToRemove: number | null = null
    for (const category of filterCategories) {
      const findOption = (options: typeof category.options): number | null => {
        for (const opt of options) {
          if (opt.name === tag) return opt.id
          if (opt.children) {
            const found = findOption(opt.children)
            if (found) return found
          }
        }
        return null
      }
      optionIdToRemove = findOption(category.options)
      if (optionIdToRemove) break
    }

    const newTags = selectedTags.filter(t => t !== tag)
    const newFilterOptionIds = optionIdToRemove
      ? selectedFilterOptionIds.filter(id => id !== optionIdToRemove)
      : selectedFilterOptionIds

    setSelectedTags(newTags)
    setSelectedFilterOptionIds(newFilterOptionIds)
    setCurrentPage(0)
    fetchPortfolios({
      page: 0,
      keyword,
      filterOptionIds: newFilterOptionIds,
      companyUuid: companyUuid || undefined,
      sort: sortBy,
      onlyBookmarked,
      onlyMyPosts,
    })
  }

  const handleClearAllTags = () => {
    setSelectedTags([])
    setSelectedFilterOptionIds([])
    setCurrentPage(0)
    fetchPortfolios({
      page: 0,
      keyword,
      filterOptionIds: [],
      companyUuid: companyUuid || undefined,
      sort: sortBy,
      onlyBookmarked,
      onlyMyPosts,
    })
  }

  const handleResetFilters = () => {
    setKeyword('')
    setSelectedTags([])
    setSelectedFilterOptionIds([])
    setSortBy('createdAt,DESC')
    setOnlyBookmarked(false)
    setOnlyMyPosts(false)
    setCompanyUuid(null)
    setCompanyName(null)
    setCurrentPage(0)
    fetchPortfolios({
      page: 0,
      sort: 'createdAt,DESC',
    })
  }

  const fetchPortfolios = useCallback(async (params: PortfolioSearchParams = {}) => {
    setIsLoading(true)
    try {
      const result = await searchPortfolios({
        page: params.page || 0,
        size: 12,
        keyword: params.keyword || undefined,
        filterOptionIds: params.filterOptionIds || undefined,
        companyUuid: params.companyUuid || undefined,
        sort: params.sort || sortBy,
        onlyBookmarked: params.onlyBookmarked,
        onlyMyPosts: params.onlyMyPosts,
      })

      if (result.success && result.data) {
        console.log('=== 포트폴리오 리스트 응답 ===')
        console.log('총 개수:', result.data.totalElements)
        console.log('리스트:', result.data.content)
        setPortfolios(result.data.content || [])
        setTotalPages(result.data.totalPages || 0)
        setTotalElements(result.data.totalElements || 0)
      } else {
        setPortfolios([])
        setTotalPages(0)
        setTotalElements(0)
      }
    } catch (error) {
      showErrorToast(error, '포트폴리오 목록을 불러오는데 실패했습니다')
      setPortfolios([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setIsLoading(false)
    }
  }, [sortBy])

  useEffect(() => {
    const companyUuidParam = searchParams.get('companyUuid') || null
    const companyNameParam = searchParams.get('companyName') || null

    // 이미 initialData가 있고 필터 파라미터가 없으면 스킵
    if (isInitialLoad && initialData && !companyUuidParam) {
      setIsInitialLoad(false)
      return
    }

    if (companyUuidParam) {
      setCompanyUuid(companyUuidParam)
      setCompanyName(companyNameParam)
      setCurrentPage(0)
      fetchPortfolios({
        page: 0,
        companyUuid: companyUuidParam,
        sort: 'createdAt,DESC',
      })
    } else if (isInitialLoad && !initialData) {
      // initialData가 없으면 데이터 로드
      fetchPortfolios({
        page: 0,
        sort: 'createdAt,DESC',
      })
    }

    setIsInitialLoad(false)
  }, [searchParams, fetchPortfolios, isInitialLoad, initialData])

  const handleClearCompanyFilter = () => {
    setCompanyUuid(null)
    setCompanyName(null)
    setCurrentPage(0)
    router.push(basePath, { scroll: false })
    fetchPortfolios({
      page: 0,
      keyword,
      filterOptionIds: selectedFilterOptionIds,
      sort: sortBy,
      onlyBookmarked,
      onlyMyPosts,
    })
  }

  const handleSearch = () => {
    setCurrentPage(0)
    fetchPortfolios({
      page: 0,
      keyword,
      filterOptionIds: selectedFilterOptionIds,
      companyUuid: companyUuid || undefined,
      sort: sortBy,
      onlyBookmarked,
      onlyMyPosts,
    })
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchPortfolios({
      page: newPage,
      keyword,
      filterOptionIds: selectedFilterOptionIds,
      companyUuid: companyUuid || undefined,
      sort: sortBy,
      onlyBookmarked,
      onlyMyPosts,
    })
  }

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort)
    setCurrentPage(0)
    fetchPortfolios({
      page: 0,
      keyword,
      filterOptionIds: selectedFilterOptionIds,
      companyUuid: companyUuid || undefined,
      sort: newSort,
      onlyBookmarked,
      onlyMyPosts,
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  const handleDeleteClick = (portfolio: PortfolioListItem) => {
    setDeletingPortfolio(portfolio)
    setShowDeleteDialog(true)
    setOpenMenuId(null)
  }

  const handleDelete = async () => {
    if (!deletingPortfolio) return

    setIsDeleting(true)
    try {
      await deletePortfolio(deletingPortfolio.uuid)
      showSuccessToast('포트폴리오가 삭제되었습니다')
      setShowDeleteDialog(false)
      setDeletingPortfolio(null)
      fetchPortfolios({ page: currentPage, keyword, filterOptionIds: selectedFilterOptionIds, sort: sortBy, onlyBookmarked, onlyMyPosts })
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

  const handleToggleBookmark = async (portfolioUuid: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      showErrorToast(null, '로그인이 필요합니다')
      return
    }

    try {
      const result = await toggleBookmark(portfolioUuid)
      if (result.success && result.data !== undefined) {
        const isBookmarked = result.data
        setPortfolios(portfolios.map(p =>
          p.uuid === portfolioUuid
            ? { ...p, isBookmarked: isBookmarked }
            : p
        ))
        showSuccessToast(isBookmarked ? '북마크에 추가했습니다' : '북마크에서 제거했습니다')
      }
    } catch (error) {
      showErrorToast(error, '북마크 처리에 실패했습니다')
    }
  }

  const handleToggleLike = async (portfolioUuid: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      showErrorToast(null, '로그인이 필요합니다')
      return
    }

    try {
      const result = await toggleLike(portfolioUuid)
      if (result.success && result.data !== undefined) {
        const isLiked = result.data
        setPortfolios(portfolios.map(p =>
          p.uuid === portfolioUuid
            ? { ...p, isLiked: isLiked, likeCount: isLiked ? p.likeCount + 1 : p.likeCount - 1 }
            : p
        ))
        showSuccessToast(isLiked ? '좋아요를 눌렀습니다' : '좋아요를 취소했습니다')
      }
    } catch (error) {
      showErrorToast(error, '좋아요 처리에 실패했습니다')
    }
  }

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null)
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openMenuId])

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

  const getSelectedChildrenCount = (option: typeof filterCategories[0]['options'][0]): number => {
    if (!option.children || option.children.length === 0) {
      return selectedFilterOptionIds.includes(option.id) ? 1 : 0
    }
    return option.children.reduce((sum, child) => sum + getSelectedChildrenCount(child), 0)
  }

  const renderFilterOption = (option: typeof filterCategories[0]['options'][0], depth: number = 0) => {
    const hasChildren = option.children && option.children.length > 0
    const isExpanded = expandedOptions.has(option.id)
    const selectedCount = hasChildren ? getSelectedChildrenCount(option) : 0

    if (hasChildren) {
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

    return (
      <div key={option.id}>
        <Checkbox
          checked={selectedFilterOptionIds.includes(option.id)}
          onChange={(checked) => handleToggleFilterOption(option.id, option.name, checked)}
          label={option.name}
          size="sm"
        />
      </div>
    )
  }

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

  const getSelectedCountInCategory = (category: typeof filterCategories[0]): number => {
    const countInOptions = (options: typeof category.options): number => {
      return options.reduce((sum, opt) => {
        if (selectedFilterOptionIds.includes(opt.id)) {
          return sum + 1
        }
        if (opt.children && opt.children.length > 0) {
          return sum + countInOptions(opt.children)
        }
        return sum
      }, 0)
    }
    return countInOptions(category.options)
  }

  const FilterSidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={isMobile ? '' : 'space-y-4'}>
      {isLoadingFilters ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-600">필터 로딩 중...</p>
        </div>
      ) : filterCategories.length > 0 ? (
        <div className="space-y-3">
          {filterCategories.map((category) => {
            const isCollapsed = collapsedCategories.has(category.id)
            const selectedCount = getSelectedCountInCategory(category)

            return (
              <div key={category.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                <button
                  type="button"
                  onClick={() => toggleCategoryCollapse(category.id)}
                  className="w-full flex items-center justify-between py-1 text-left hover:bg-gray-50 rounded transition-colors"
                >
                  <span className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                    {isCollapsed ? (
                      <FiChevronRight className="w-4 h-4 text-gray-400" />
                    ) : (
                      <FiChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                    {category.name}
                  </span>
                  {selectedCount > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                      {selectedCount}
                    </span>
                  )}
                </button>
                {!isCollapsed && (
                  <div className="space-y-1 mt-2 ml-2">
                    {category.options.map((option) => renderFilterOption(option, 0))}
                  </div>
                )}
              </div>
            )
          })}
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
            <button
              onClick={() => setShowPCFilterPopup(true)}
              className={`w-full mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                selectedFilterOptionIds.length > 0
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              <FiFilter />
              모든 필터보기
              {selectedFilterOptionIds.length > 0 && (
                <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded-full text-xs font-bold">
                  {selectedFilterOptionIds.length}
                </span>
              )}
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
      <div className="flex-1 min-w-0 space-y-6 overflow-x-hidden">
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
              href="/portfolios/create"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <FiPlus className="text-xl" />
              포트폴리오 등록
            </Link>
          )}
        </div>

        {/* 업체 필터 표시 */}
        {companyUuid && companyName && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiFilter className="text-blue-600" />
              <span className="text-blue-800 font-medium">
                <span className="font-bold">{companyName}</span> 업체의 포트폴리오만 보기
              </span>
            </div>
            <button
              onClick={handleClearCompanyFilter}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              <FiX />
              필터 해제
            </button>
          </div>
        )}

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
                  { value: 'createdAt,DESC', label: '최신순' },
                  { value: 'viewCount,DESC', label: '조회순' },
                  { value: 'likeCount,DESC', label: '좋아요순' },
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
                    setCurrentPage(0)
                    fetchPortfolios({
                      page: 0,
                      keyword,
                      filterOptionIds: selectedFilterOptionIds,
                      companyUuid: companyUuid || undefined,
                      sort: sortBy,
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
                    setCurrentPage(0)
                    fetchPortfolios({
                      page: 0,
                      keyword,
                      filterOptionIds: selectedFilterOptionIds,
                      companyUuid: companyUuid || undefined,
                      sort: sortBy,
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
        ) : portfolios.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">등록된 포트폴리오가 없습니다.</p>
            {user && (
              <Link
                href="/portfolios/create"
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
              {portfolios.map((portfolio) => {
                const isAuthor = user?.email === (portfolio.company?.companyName ? undefined : user?.email)

                return (
                  <div key={portfolio.uuid} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow relative">
                    {/* 메뉴 버튼 (작성자만) */}
                    {isAuthor && (
                      <div className="absolute top-2 right-2 z-10">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setOpenMenuId(openMenuId === portfolio.uuid ? null : portfolio.uuid)
                          }}
                          className="bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-md transition-all"
                        >
                          <FiMoreVertical className="w-5 h-5 text-gray-700" />
                        </button>

                        {openMenuId === portfolio.uuid && (
                          <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                            <Link
                              href={`/portfolios/${portfolio.uuid}/edit`}
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
                                handleDeleteClick(portfolio)
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

                    <Link href={`/portfolios/${portfolio.uuid}`}>
                      {/* 썸네일 */}
                      <div className="aspect-video bg-gray-200 relative overflow-hidden">
                        {getThumbnailUrl(portfolio) ? (
                          <Image
                            src={getThumbnailUrl(portfolio)}
                            alt={portfolio.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FiImage className="w-16 h-16" />
                          </div>
                        )}
                        {portfolio.images && portfolio.images.length > 1 && (
                          <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                            +{portfolio.images.length}
                          </div>
                        )}
                        {/* 북마크 버튼 */}
                        {user && (
                          <button
                            onClick={(e) => handleToggleBookmark(portfolio.uuid, e)}
                            className={`absolute bottom-2 left-2 p-2 rounded-full shadow-md transition-all ${
                              portfolio.isBookmarked
                                ? 'bg-yellow-100 bg-opacity-90 hover:bg-opacity-100'
                                : 'bg-white bg-opacity-90 hover:bg-opacity-100'
                            }`}
                          >
                            <FiBookmark className={`w-5 h-5 ${portfolio.isBookmarked ? 'fill-current text-yellow-600' : 'text-gray-600'}`} />
                          </button>
                        )}
                      </div>

                      {/* 정보 */}
                      <div className="p-4 space-y-3">
                        <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
                          {portfolio.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {portfolio.description || portfolio.content || ''}
                        </p>

                        {/* 필터 옵션 배지 */}
                        {portfolio.filterOptions && portfolio.filterOptions.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {portfolio.filterOptions.slice(0, 3).map(filter => (
                              <span
                                key={filter.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700"
                              >
                                {filter.displayName || filter.value}
                              </span>
                            ))}
                            {portfolio.filterOptions.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{portfolio.filterOptions.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* 태그 */}
                        {portfolio.tags && portfolio.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {portfolio.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs"
                              >
                                <FiTag className="text-xs" />
                                {tag}
                              </span>
                            ))}
                            {portfolio.tags.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{portfolio.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                              {portfolio.company?.companyName?.charAt(0) || 'U'}
                            </div>
                            <span>{portfolio.company?.companyName || '알 수 없음'}</span>
                            {portfolio.company?.averageRating !== undefined && portfolio.company.averageRating > 0 && (
                              <span className="flex items-center gap-1 text-yellow-500">
                                <FiStar className="fill-current" />
                                {portfolio.company.averageRating.toFixed(1)}
                                {portfolio.company.reviewCount !== undefined && (
                                  <span className="text-gray-400">({portfolio.company.reviewCount})</span>
                                )}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <FiEye />
                              {portfolio.viewCount}
                            </span>
                            <button
                              onClick={(e) => handleToggleLike(portfolio.uuid, e)}
                              className={`flex items-center gap-1 transition-colors ${
                                portfolio.isLiked ? 'text-red-500' : 'hover:text-red-500'
                              }`}
                            >
                              <FiHeart className={portfolio.isLiked ? 'fill-current' : ''} />
                              {portfolio.likeCount}
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
              <div className="flex justify-center items-center gap-1 sm:gap-2 mt-8 overflow-x-auto pb-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="flex-shrink-0 px-3 py-2 text-sm sm:px-4 sm:text-base border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  이전
                </button>

                <div className="flex gap-1 sm:gap-2">
                  {(() => {
                    const maxButtons = 5
                    const pages: number[] = []

                    if (totalPages <= maxButtons) {
                      for (let i = 0; i < totalPages; i++) pages.push(i)
                    } else {
                      const half = Math.floor(maxButtons / 2)
                      let start = Math.max(0, currentPage - half)
                      let end = Math.min(totalPages - 1, currentPage + half)

                      if (currentPage < half) {
                        end = maxButtons - 1
                      } else if (currentPage > totalPages - 1 - half) {
                        start = totalPages - maxButtons
                      }

                      for (let i = start; i <= end; i++) pages.push(i)
                    }

                    return pages.map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`flex-shrink-0 min-w-[36px] px-2 py-2 text-sm sm:min-w-[40px] sm:px-3 sm:text-base rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    ))
                  })()}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  className="flex-shrink-0 px-3 py-2 text-sm sm:px-4 sm:text-base border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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

            <div className="flex-1 overflow-y-auto p-4">
              <FilterSidebar isMobile />
            </div>

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

      {/* PC 필터 팝업 */}
      {showPCFilterPopup && (
        <div className="fixed inset-0 z-50 hidden lg:flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPCFilterPopup(false)}
          />

          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] mx-4 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div>
                <h3 className="text-xl font-bold">모든 필터</h3>
                <p className="text-sm text-blue-100">
                  {selectedFilterOptionIds.length > 0
                    ? `${selectedFilterOptionIds.length}개 필터 선택됨`
                    : '원하는 필터를 선택하세요'
                  }
                </p>
              </div>
              <div className="flex items-center gap-3">
                {(selectedFilterOptionIds.length > 0 || keyword) && (
                  <button
                    onClick={handleResetFilters}
                    className="text-sm text-white/80 hover:text-white font-medium px-3 py-1 rounded hover:bg-white/20 transition-colors"
                  >
                    전체 초기화
                  </button>
                )}
                <button
                  onClick={() => setShowPCFilterPopup(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
            </div>

            {selectedTags.length > 0 && (
              <div className="px-5 py-3 bg-blue-50 border-b border-blue-100">
                <p className="text-xs text-gray-600 mb-2 font-medium">선택된 필터</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-white text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm border border-blue-200"
                    >
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-600 transition-colors">
                        <FiX className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-5">
              {isLoadingFilters ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-blue-600"></div>
                    <p className="mt-3 text-gray-600">필터 로딩 중...</p>
                  </div>
                </div>
              ) : filterCategories.length > 0 ? (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
                  {filterCategories.map((category) => {
                    const selectedCount = getSelectedCountInCategory(category)
                    const isCollapsed = collapsedCategories.has(category.id)

                    return (
                      <div key={category.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <button
                          type="button"
                          onClick={() => toggleCategoryCollapse(category.id)}
                          className="w-full flex items-center justify-between mb-3"
                        >
                          <h4 className="font-bold text-gray-900 flex items-center gap-2">
                            {isCollapsed ? (
                              <FiChevronRight className="w-4 h-4 text-gray-400" />
                            ) : (
                              <FiChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                            {category.name}
                          </h4>
                          {selectedCount > 0 && (
                            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                              {selectedCount}
                            </span>
                          )}
                        </button>
                        {!isCollapsed && (
                          <div className="space-y-1 max-h-64 overflow-y-auto">
                            {category.options.map((option) => renderFilterOption(option, 0))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  사용 가능한 필터가 없습니다
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3">
              <button
                onClick={() => setShowPCFilterPopup(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  handleSearch()
                  setShowPCFilterPopup(false)
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                {selectedFilterOptionIds.length > 0
                  ? `${selectedFilterOptionIds.length}개 필터 적용하기`
                  : '검색하기'
                }
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
              setDeletingPortfolio(null)
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
              {deletingPortfolio && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{deletingPortfolio.title}</p>
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
                    setDeletingPortfolio(null)
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
