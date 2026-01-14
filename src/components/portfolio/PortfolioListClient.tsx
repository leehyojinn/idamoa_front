'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FiSearch, FiPlus, FiEye, FiBookmark, FiTag, FiImage, FiX, FiMoreVertical, FiEdit, FiTrash2, FiExternalLink, FiFilter, FiHeart, FiStar, FiChevronDown, FiChevronRight, FiChevronLeft, FiChevronsLeft, FiChevronsRight, FiVideo } from 'react-icons/fi'
import { searchPortfolios, deletePortfolio, toggleBookmark, toggleLike, type PortfolioListItem, type PortfolioSearchParams, type PortfolioSearchResponse } from '@/lib/api/portfolio'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { getCdnUrl } from '@/lib/utils'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import { useAuth } from '@/hooks/useAuth'
import { getPublicFilters, type PublicFilterCategory } from '@/lib/api/filter'
import HorizontalSlideFilter from '@/components/ui/HorizontalSlideFilter'

interface PortfolioListClientProps {
  initialData?: PortfolioSearchResponse
}

export default function PortfolioListClient({ initialData }: PortfolioListClientProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { user } = useAuth()

  const basePath = pathname || '/'

  // URL에서 초기 상태 읽기
  const getInitialPage = () => parseInt(searchParams.get('page') || '0', 10)
  const getInitialKeyword = () => searchParams.get('keyword') || ''
  const getInitialSort = () => searchParams.get('sort') || 'createdAt,DESC'
  const getInitialFilterIds = () => {
    const ids = searchParams.get('filterIds')
    return ids ? ids.split(',').map(Number).filter(n => !isNaN(n)) : []
  }
  const getInitialBookmarked = () => searchParams.get('bookmarked') === 'true'
  const getInitialMyPosts = () => searchParams.get('myPosts') === 'true'
  const getInitialCompanyUuid = () => searchParams.get('companyUuid') || null
  const getInitialCompanyName = () => searchParams.get('companyName') || null

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

  // 다음 페이지 데이터 캐시
  const [nextPageCache, setNextPageCache] = useState<{
    page: number
    data: PortfolioListItem[]
    totalPages: number
    totalElements: number
  } | null>(null)

  const getThumbnailUrl = (portfolio: PortfolioListItem) => {
    let url = ''
    if (portfolio.thumbnailUrl) url = portfolio.thumbnailUrl
    else if (portfolio.images && portfolio.images.length > 0) {
      url = portfolio.images[0].thumbnailUrl || portfolio.images[0].fileUrl
    }
    return getCdnUrl(url)
  }

  const [currentPage, setCurrentPage] = useState(getInitialPage)
  const [totalPages, setTotalPages] = useState(initialData?.totalPages || 0)
  const [totalElements, setTotalElements] = useState(initialData?.totalElements || 0)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const [keyword, setKeyword] = useState(getInitialKeyword)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedFilterOptionIds, setSelectedFilterOptionIds] = useState<number[]>(getInitialFilterIds)
  const [sortBy, setSortBy] = useState<string>(getInitialSort)
  const [onlyBookmarked, setOnlyBookmarked] = useState(getInitialBookmarked)
  const [onlyMyPosts, setOnlyMyPosts] = useState(getInitialMyPosts)
  const [companyUuid, setCompanyUuid] = useState<string | null>(getInitialCompanyUuid)
  const [companyName, setCompanyName] = useState<string | null>(getInitialCompanyName)
  const [expandedOptions, setExpandedOptions] = useState<Set<number>>(new Set())
  const [collapsedCategories, setCollapsedCategories] = useState<Set<number>>(new Set())

  // URL 업데이트 함수 (스크롤 영향 없이 URL만 변경)
  const updateURL = useCallback((params: {
    page?: number
    keyword?: string
    sort?: string
    filterIds?: number[]
    bookmarked?: boolean
    myPosts?: boolean
    companyUuid?: string | null
    companyName?: string | null
  }) => {
    const urlParams = new URLSearchParams()

    const page = params.page ?? currentPage
    const kw = params.keyword ?? keyword
    const sort = params.sort ?? sortBy
    const filterIds = params.filterIds ?? selectedFilterOptionIds
    const bookmarked = params.bookmarked ?? onlyBookmarked
    const myPosts = params.myPosts ?? onlyMyPosts
    const cUuid = params.companyUuid !== undefined ? params.companyUuid : companyUuid
    const cName = params.companyName !== undefined ? params.companyName : companyName

    if (page > 0) urlParams.set('page', page.toString())
    if (kw) urlParams.set('keyword', kw)
    if (sort && sort !== 'createdAt,DESC') urlParams.set('sort', sort)
    if (filterIds.length > 0) urlParams.set('filterIds', filterIds.join(','))
    if (bookmarked) urlParams.set('bookmarked', 'true')
    if (myPosts) urlParams.set('myPosts', 'true')
    if (cUuid) urlParams.set('companyUuid', cUuid)
    if (cName) urlParams.set('companyName', cName)

    const queryString = urlParams.toString()
    const newUrl = queryString ? `${basePath}?${queryString}` : basePath

    // Next.js 라우터 대신 브라우저 History API 직접 사용 (스크롤 영향 없음)
    window.history.replaceState(null, '', newUrl)
  }, [currentPage, keyword, sortBy, selectedFilterOptionIds, onlyBookmarked, onlyMyPosts, companyUuid, companyName, basePath])

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

        // isExpanded가 false인 카테고리만 접힌 상태로 설정
        const collapsedIds = filtersWithTree
          .filter(c => c.isExpanded !== true)
          .map(c => c.id)
        setCollapsedCategories(new Set(collapsedIds))

        // isExpanded가 true인 옵션들을 펼친 상태로 설정
        const collectExpandedOptions = (options: typeof filtersWithTree[0]['options']): number[] => {
          const ids: number[] = []
          options.forEach(opt => {
            if (opt.isExpanded === true && opt.children && opt.children.length > 0) {
              ids.push(opt.id)
            }
            if (opt.children) {
              ids.push(...collectExpandedOptions(opt.children))
            }
          })
          return ids
        }
        const expandedIds = filtersWithTree.flatMap(c => collectExpandedOptions(c.options))
        setExpandedOptions(new Set(expandedIds))
      } catch (error) {
        showErrorToast(error, '필터 정보를 불러오는데 실패했습니다')
      } finally {
        setIsLoadingFilters(false)
      }
    }
    loadFilters()
  }, [])

  // 옵션과 모든 하위 옵션의 ID, 이름 가져오기
  const getOptionWithDescendants = (optionId: number): { ids: number[], names: string[] } => {
    const ids: number[] = []
    const names: string[] = []

    const findAndCollect = (options: typeof filterCategories[0]['options']): boolean => {
      for (const opt of options) {
        if (opt.id === optionId) {
          // 찾은 옵션과 모든 하위 옵션 수집
          const collectAll = (o: typeof opt) => {
            ids.push(o.id)
            names.push(o.name)
            if (o.children) {
              o.children.forEach(collectAll)
            }
          }
          collectAll(opt)
          return true
        }
        if (opt.children && findAndCollect(opt.children)) {
          return true
        }
      }
      return false
    }

    for (const category of filterCategories) {
      if (findAndCollect(category.options)) break
    }

    return { ids, names }
  }

  // [성능 최적화] 선택된 ID들의 하위 ID들도 모두 포함한 배열 반환 (useCallback으로 메모이제이션)
  const getExpandedFilterIds = useCallback((selectedIds: number[]): number[] => {
    if (selectedIds.length === 0) {
      return []
    }

    // filterCategories가 비어있으면 원래 ID 그대로 반환
    if (!filterCategories || filterCategories.length === 0) {
      return selectedIds
    }

    const result = new Set<number>()

    const collectAllChildren = (options: typeof filterCategories[0]['options']) => {
      for (const opt of options) {
        result.add(opt.id)
        if (opt.children) {
          collectAllChildren(opt.children)
        }
      }
    }

    const findAndCollect = (options: typeof filterCategories[0]['options'], targetId: number): boolean => {
      for (const opt of options) {
        if (opt.id === targetId) {
          // 찾은 옵션과 모든 하위 옵션 수집
          result.add(opt.id)
          if (opt.children) {
            collectAllChildren(opt.children)
          }
          return true
        }
        if (opt.children && findAndCollect(opt.children, targetId)) {
          return true
        }
      }
      return false
    }

    for (const selectedId of selectedIds) {
      // 옵션에서 찾기
      let found = false
      for (const cat of filterCategories) {
        if (findAndCollect(cat.options, selectedId)) {
          found = true
          break
        }
      }
      // 찾지 못하면 원래 ID 그대로 추가
      if (!found) {
        result.add(selectedId)
      }
    }

    return Array.from(result)
  }, [filterCategories])

  const handleToggleFilterOption = (optionId: number, optionName: string, checked: boolean) => {
    // 한 개만 선택 가능 (라디오 버튼 방식)
    let newFilterOptionIds: number[]
    let newTags: string[]

    if (checked) {
      // 새로 선택하면 기존 선택 해제하고 이것만 선택
      newFilterOptionIds = [optionId]
      newTags = [optionName]
    } else {
      // 선택 해제
      newFilterOptionIds = []
      newTags = []
    }

    setSelectedFilterOptionIds(newFilterOptionIds)
    setSelectedTags(newTags)
    setCurrentPage(0)
    setNextPageCache(null) // 필터 변경 시 캐시 초기화
    updateURL({ page: 0, filterIds: newFilterOptionIds })
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
    setNextPageCache(null) // 태그 제거 시 캐시 초기화
    updateURL({ page: 0, filterIds: newFilterOptionIds })
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
    setNextPageCache(null) // 필터 초기화 시 캐시 초기화
    window.history.replaceState(null, '', basePath)
    fetchPortfolios({
      page: 0,
      sort: 'createdAt,DESC',
    })
  }

  const fetchPortfolios = useCallback(async (params: PortfolioSearchParams = {}) => {
    setIsLoading(true)
    try {
      // 선택된 필터 ID들을 하위 ID들도 포함하도록 확장
      const expandedFilterIds = params.filterOptionIds && params.filterOptionIds.length > 0
        ? getExpandedFilterIds(params.filterOptionIds)
        : undefined

      const result = await searchPortfolios({
        page: params.page || 0,
        size: 12,
        keyword: params.keyword || undefined,
        filterOptionIds: expandedFilterIds,
        companyUuid: params.companyUuid || undefined,
        sort: params.sort || sortBy,
        onlyBookmarked: params.onlyBookmarked,
        onlyMyPosts: params.onlyMyPosts,
      })

      if (result.success && result.data) {
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
  }, [sortBy, getExpandedFilterIds])

  // 다음 페이지 데이터 + 이미지 프리페치
  const prefetchNextPage = useCallback(async () => {
    if (currentPage >= totalPages - 1) return
    if (nextPageCache?.page === currentPage + 1) return

    try {
      // 선택된 필터 ID들을 하위 ID들도 포함하도록 확장
      const expandedFilterIds = selectedFilterOptionIds.length > 0
        ? getExpandedFilterIds(selectedFilterOptionIds)
        : undefined

      const result = await searchPortfolios({
        page: currentPage + 1,
        size: 12,
        keyword: keyword || undefined,
        filterOptionIds: expandedFilterIds,
        companyUuid: companyUuid || undefined,
        sort: sortBy,
        onlyBookmarked,
        onlyMyPosts,
      })

      if (result.success && result.data?.content) {
        setNextPageCache({
          page: currentPage + 1,
          data: result.data.content,
          totalPages: result.data.totalPages,
          totalElements: result.data.totalElements,
        })

        // 이미지 프리로드
        result.data.content.forEach(portfolio => {
          const url = portfolio.thumbnailUrl ||
            portfolio.images?.[0]?.thumbnailUrl ||
            portfolio.images?.[0]?.fileUrl
          if (url) {
            const img = new window.Image()
            img.src = url
          }
        })
      }
    } catch {
      // 프리페치 실패는 무시
    }
  }, [currentPage, totalPages, keyword, selectedFilterOptionIds, companyUuid, sortBy, onlyBookmarked, onlyMyPosts, nextPageCache?.page, getExpandedFilterIds])

  // 현재 페이지 로드 후 다음 페이지 프리페치
  useEffect(() => {
    if (isLoading || portfolios.length === 0) return

    const timer = setTimeout(() => {
      prefetchNextPage()
    }, 300)

    return () => clearTimeout(timer)
  }, [isLoading, portfolios.length, prefetchNextPage])

  // URL 변경 시 (뒤로가기/앞으로가기) 상태 동기화
  useEffect(() => {
    const urlPage = parseInt(searchParams.get('page') || '0', 10)
    const urlKeyword = searchParams.get('keyword') || ''
    const urlSort = searchParams.get('sort') || 'createdAt,DESC'
    const urlFilterIds = searchParams.get('filterIds')
    const urlFilterOptionIds = urlFilterIds ? urlFilterIds.split(',').map(Number).filter(n => !isNaN(n)) : []
    const urlBookmarked = searchParams.get('bookmarked') === 'true'
    const urlMyPosts = searchParams.get('myPosts') === 'true'
    const urlCompanyUuid = searchParams.get('companyUuid') || null
    const urlCompanyName = searchParams.get('companyName') || null

    // 상태와 URL이 다를 때만 업데이트 (뒤로가기/앞으로가기 감지)
    const needsUpdate =
      urlPage !== currentPage ||
      urlKeyword !== keyword ||
      urlSort !== sortBy ||
      JSON.stringify(urlFilterOptionIds) !== JSON.stringify(selectedFilterOptionIds) ||
      urlBookmarked !== onlyBookmarked ||
      urlMyPosts !== onlyMyPosts ||
      urlCompanyUuid !== companyUuid

    if (needsUpdate && !isInitialLoad) {
      setCurrentPage(urlPage)
      setKeyword(urlKeyword)
      setSortBy(urlSort)
      setSelectedFilterOptionIds(urlFilterOptionIds)
      setOnlyBookmarked(urlBookmarked)
      setOnlyMyPosts(urlMyPosts)
      setCompanyUuid(urlCompanyUuid)
      setCompanyName(urlCompanyName)

      fetchPortfolios({
        page: urlPage,
        keyword: urlKeyword || undefined,
        filterOptionIds: urlFilterOptionIds.length > 0 ? urlFilterOptionIds : undefined,
        companyUuid: urlCompanyUuid || undefined,
        sort: urlSort,
        onlyBookmarked: urlBookmarked,
        onlyMyPosts: urlMyPosts,
      })
    } else if (isInitialLoad) {
      // 초기 로드 시 URL 파라미터 기반으로 데이터 fetch
      fetchPortfolios({
        page: urlPage,
        keyword: urlKeyword || undefined,
        filterOptionIds: urlFilterOptionIds.length > 0 ? urlFilterOptionIds : undefined,
        companyUuid: urlCompanyUuid || undefined,
        sort: urlSort,
        onlyBookmarked: urlBookmarked,
        onlyMyPosts: urlMyPosts,
      })
      setIsInitialLoad(false)
    }
  }, [searchParams])

  // 로그인 상태 변경 시 좋아요/북마크 상태 갱신을 위해 데이터 다시 로드
  useEffect(() => {
    // user 상태가 변경되면 (로그인/로그아웃) 데이터를 다시 가져옴
    if (user && initialData) {
      fetchPortfolios({
        page: currentPage,
        keyword: keyword || undefined,
        filterOptionIds: selectedFilterOptionIds.length > 0 ? selectedFilterOptionIds : undefined,
        companyUuid: companyUuid || undefined,
        sort: sortBy,
        onlyBookmarked,
        onlyMyPosts,
      })
    }
  }, [user?.email]) // user.email이 변경될 때만 실행 (로그인/로그아웃 시)

  const handleClearCompanyFilter = () => {
    setCompanyUuid(null)
    setCompanyName(null)
    setCurrentPage(0)
    setNextPageCache(null) // 업체 필터 해제 시 캐시 초기화
    window.history.replaceState(null, '', basePath)
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
    setNextPageCache(null) // 검색 시 캐시 초기화
    updateURL({ page: 0, keyword })
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
    // 캐시된 다음 페이지 데이터가 있으면 즉시 사용
    if (nextPageCache && nextPageCache.page === newPage) {
      setCurrentPage(newPage)
      setPortfolios(nextPageCache.data)
      setTotalPages(nextPageCache.totalPages)
      setTotalElements(nextPageCache.totalElements)
      setNextPageCache(null)
      updateURL({ page: newPage })
      return
    }

    setCurrentPage(newPage)
    updateURL({ page: newPage })
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
    setNextPageCache(null)
    updateURL({ page: 0, sort: newSort })
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
    const isSelected = selectedFilterOptionIds.includes(option.id)

    if (hasChildren) {
      return (
        <div key={option.id} className={depth > 0 ? 'ml-3' : ''}>
          {/* 전체 영역 클릭 시 선택 */}
          <button
            type="button"
            onClick={() => handleToggleFilterOption(option.id, option.name, !isSelected)}
            className="w-full flex items-center py-1.5 px-1 text-left hover:bg-gray-50 rounded transition-colors"
          >
            {/* 펼침/접힘 버튼 (화살표만) */}
            <div
              onClick={(e) => {
                e.stopPropagation()
                toggleOptionExpand(option.id)
              }}
              className="flex-shrink-0 p-1 rounded hover:bg-gray-200 transition-colors"
            >
              {isExpanded ? (
                <FiChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <FiChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </div>
            {/* 체크박스 */}
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
              isSelected
                ? 'bg-primary border-primary'
                : 'border-gray-300'
            }`}>
              {isSelected && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            {/* 옵션 이름 */}
            <span className="text-sm font-medium text-gray-700 flex-1 ml-2">{option.name}</span>
            {selectedCount > 0 && (
              <span className="bg-primary-100 text-primary text-xs px-1.5 py-0.5 rounded-full">
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
          checked={isSelected}
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

  // 카테고리 내 모든 옵션 ID 가져오기
  const getAllOptionIdsInCategory = (category: typeof filterCategories[0]): number[] => {
    const collectIds = (options: typeof category.options): number[] => {
      return options.flatMap(opt => {
        const ids = [opt.id]
        if (opt.children && opt.children.length > 0) {
          ids.push(...collectIds(opt.children))
        }
        return ids
      })
    }
    return collectIds(category.options)
  }

  // 카테고리 전체 선택/해제
  const handleToggleCategory = (category: typeof filterCategories[0]) => {
    const allOptionIds = getAllOptionIdsInCategory(category)
    const allOptionNames = category.options.map(opt => opt.name)
    const allSelected = allOptionIds.every(id => selectedFilterOptionIds.includes(id))

    let newFilterOptionIds: number[]
    let newTags: string[]

    if (allSelected) {
      // 전체 해제
      newFilterOptionIds = selectedFilterOptionIds.filter(id => !allOptionIds.includes(id))
      newTags = selectedTags.filter(tag => !allOptionNames.includes(tag))
    } else {
      // 전체 선택
      const idsToAdd = allOptionIds.filter(id => !selectedFilterOptionIds.includes(id))
      const namesToAdd = category.options
        .filter(opt => !selectedTags.includes(opt.name))
        .map(opt => opt.name)
      newFilterOptionIds = [...selectedFilterOptionIds, ...idsToAdd]
      newTags = [...selectedTags, ...namesToAdd]
    }

    setSelectedFilterOptionIds(newFilterOptionIds)
    setSelectedTags(newTags)
    setCurrentPage(0)
    updateURL({ page: 0, filterIds: newFilterOptionIds })
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

  const FilterSidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={isMobile ? '' : 'space-y-4'}>
      {isLoadingFilters ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary"></div>
          <p className="mt-2 text-gray-600">필터 로딩 중...</p>
        </div>
      ) : filterCategories.length > 0 ? (
        <div className="space-y-3">
          {filterCategories.map((category) => {
            const isCollapsed = collapsedCategories.has(category.id)
            const selectedCount = getSelectedCountInCategory(category)
            const allOptionIds = getAllOptionIdsInCategory(category)
            const allSelected = allOptionIds.length > 0 && allOptionIds.every(id => selectedFilterOptionIds.includes(id))
            const someSelected = selectedCount > 0 && !allSelected

            return (
              <div key={category.id} className="mb-3 last:mb-0">
                {/* 카테고리 헤더 - 진한 배경색과 흰색 텍스트로 강조 */}
                <button
                  type="button"
                  onClick={() => handleToggleCategory(category)}
                  className={`w-full flex items-center py-2 px-2 text-left rounded-lg transition-colors ${
                    selectedCount > 0
                      ? 'bg-primary hover:bg-primary-700'
                      : 'bg-gray-700 hover:bg-gray-800'
                  }`}
                >
                  {/* 펼침/접힘 버튼 */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleCategoryCollapse(category.id)
                    }}
                    className="flex-shrink-0 p-0.5 rounded hover:bg-white/20 transition-colors"
                  >
                    {isCollapsed ? (
                      <FiChevronRight className="w-4 h-4 text-white" />
                    ) : (
                      <FiChevronDown className="w-4 h-4 text-white" />
                    )}
                  </div>
                  {/* 체크박스 */}
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ml-1 ${
                    allSelected
                      ? 'bg-white border-white'
                      : someSelected
                      ? 'bg-white/50 border-white'
                      : 'border-white/70 bg-transparent'
                  }`}>
                    {allSelected && (
                      <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {someSelected && !allSelected && (
                      <div className="w-2 h-0.5 bg-primary rounded"></div>
                    )}
                  </div>
                  {/* 카테고리 이름 */}
                  <span className="font-bold text-white text-sm flex-1 ml-2">{category.name}</span>
                  {selectedCount > 0 && (
                    <span className="bg-white text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                      {selectedCount}
                    </span>
                  )}
                </button>
                {/* 옵션 영역 - 들여쓰기와 배경으로 구분 */}
                {!isCollapsed && (
                  <div className="mt-1 ml-2 pl-3 py-2 border-l-2 border-gray-200 bg-gray-50/50 rounded-r-lg">
                    <div className="space-y-0.5">
                      {category.options.map((option) => renderFilterOption(option, 0))}
                    </div>
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
    <div>
      {/* PC: 왼쪽 고정 필터 사이드바 - 숨김 처리 */}
      <aside className="hidden">
        <div className="sticky top-[9rem] bg-white rounded-lg shadow-sm p-4 max-h-[calc(100vh-120px)] overflow-y-auto space-y-4">
          <div>
            <div className="relative">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="검색어 입력..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <button
              onClick={handleSearch}
              className="w-full mt-2 px-4 py-2 bg-primary hover:bg-primary-800 text-white rounded-lg text-sm font-medium transition-colors"
            >
              검색
            </button>
            <button
              onClick={() => setShowPCFilterPopup(true)}
              className={`w-full mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                selectedFilterOptionIds.length > 0
                  ? 'bg-primary-100 text-primary hover:bg-primary-200 border border-primary-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              <FiFilter />
              모든 필터보기
              {selectedFilterOptionIds.length > 0 && (
                <span className="bg-primary text-white px-1.5 py-0.5 rounded-full text-xs font-bold">
                  {selectedFilterOptionIds.length}
                </span>
              )}
            </button>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                <FiFilter className="text-primary" />
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
                      className="inline-flex items-center gap-1 bg-primary-100 text-primary px-2 py-0.5 rounded text-xs"
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
              className="flex items-center gap-2 bg-primary hover:bg-primary-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <FiPlus className="text-xl" />
              포트폴리오 등록
            </Link>
          )}
        </div>

        {/* 업체 필터 표시 */}
        {companyUuid && companyName && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiFilter className="text-primary" />
              <span className="text-primary-800 font-medium">
                <span className="font-bold">{companyName}</span> 업체의 포트폴리오만 보기
              </span>
            </div>
            <button
              onClick={handleClearCompanyFilter}
              className="flex items-center gap-1 text-primary hover:text-primary font-medium text-sm"
            >
              <FiX />
              필터 해제
            </button>
          </div>
        )}

        {/* 무신사 스타일 가로 슬라이드 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <HorizontalSlideFilter
            categories={filterCategories.map(cat => {
              // 재귀적으로 옵션과 자식들을 변환하는 함수
              const mapOption = (opt: typeof cat.options[0]): any => ({
                id: opt.id,
                name: opt.name,
                parentId: opt.parentId,
                children: opt.children?.map(mapOption),
              })

              return {
                id: cat.id,
                name: cat.name,
                code: cat.code || cat.uuid || '',
                options: cat.options.map(mapOption),
              }
            })}
            selectedOptionIds={selectedFilterOptionIds}
            onToggleOption={handleToggleFilterOption}
            isLoading={isLoadingFilters}
            keyword={keyword}
            onKeywordChange={setKeyword}
            onSearch={handleSearch}
            onReset={handleResetFilters}
          />
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 space-y-4">
          {/* 모바일 검색바 - 숨김 처리 (HorizontalSlideFilter에서 검색 제공) */}
          {/* <div className="lg:hidden flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="제목, 설명, 태그 등 검색..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              </div>
            </div>
            <button
              onClick={handleSearch}
              className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary-800 text-white rounded-lg font-semibold transition-colors"
            >
              검색
            </button>
          </div> */}

          {/* 정렬 및 필터 버튼 */}
          <div className="flex flex-wrap items-center gap-2" style={{marginTop:'0 !important;'}}>
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
                    setNextPageCache(null) // 북마크 필터 변경 시 캐시 초기화
                    updateURL({ page: 0, bookmarked: newValue })
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
                    setNextPageCache(null) // 내 글 필터 변경 시 캐시 초기화
                    updateURL({ page: 0, myPosts: newValue })
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
                      ? 'bg-primary-100 text-primary border-2 border-primary-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  <FiEdit />
                  <span className="whitespace-nowrap">내 글만</span>
                </button>
              </>
            )}

            {/* 모바일: 필터 버튼 - 숨김 처리 (HorizontalSlideFilter 사용) */}
            {/* <button
              onClick={() => setShowMobileFilterPopup(true)}
              className={`lg:hidden flex items-center gap-2 px-3 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors ml-auto ${
                selectedFilterOptionIds.length > 0
                  ? 'bg-primary text-white hover:bg-primary-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiFilter />
              <span className="whitespace-nowrap">모든 필터</span>
              {selectedFilterOptionIds.length > 0 && (
                <span className="bg-white text-primary px-1.5 py-0.5 rounded-full text-xs font-bold">
                  {selectedFilterOptionIds.length}
                </span>
              )}
            </button> */}
          </div>

        </div>

        {/* 포트폴리오 그리드 */}
        {isLoading && portfolios.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary"></div>
            <p className="mt-4 text-gray-600">포트폴리오 불러오는 중...</p>
          </div>
        ) : !isLoading && portfolios.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">등록된 포트폴리오가 없습니다.</p>
            {user && (
              <Link
                href="/portfolios/create"
                className="inline-flex items-center gap-2 mt-6 bg-primary hover:bg-primary-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <FiPlus className="text-xl" />
                첫 포트폴리오 등록하기
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="relative">
              {/* 로딩 오버레이 */}
              {isLoading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-primary"></div>
                    <p className="mt-3 text-gray-600 text-sm">불러오는 중...</p>
                  </div>
                </div>
              )}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${isLoading ? 'pointer-events-none' : ''}`}>
              {portfolios.map((portfolio, index) => {
                // 관리자이거나 COMPANY 역할이면 수정/삭제 메뉴 표시 (서버에서 권한 체크됨)
                const canManage = user?.currentRole === 'ADMIN' || user?.currentRole === 'COMPANY'
                // 첫 페이지(12개) 이미지는 priority로 빠르게 로드
                const isPriority = index < 12

                return (
                  <div key={portfolio.uuid} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow relative">
                    {/* 메뉴 버튼 (업체 정보가 있거나 관리자/업체인 경우) */}
                    {(portfolio.company?.companyUuid || portfolio.company?.uuid || canManage) && (
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
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                            {(portfolio.company?.companyUuid || portfolio.company?.uuid) && (
                              <Link
                                href={`/?tab=portfolio&companyUuid=${portfolio.company.companyUuid || portfolio.company.uuid}&companyName=${encodeURIComponent(portfolio.company.companyName || '')}`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenMenuId(null)
                                }}
                                className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-gray-700 transition-colors"
                              >
                                <FiExternalLink className="w-4 h-4" />
                                <span className="text-sm font-medium">이 업체만 보기</span>
                              </Link>
                            )}
                            {canManage && (
                              <>
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
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <Link href={`/portfolios/${portfolio.uuid}`}>
                      {/* 썸네일 */}
                      <div className="aspect-video bg-gray-200 relative overflow-hidden">
                        {/* Shimmer 효과 */}
                        <div
                          className="absolute inset-0 animate-shimmer"
                          style={{
                            background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
                            backgroundSize: '200% 100%',
                          }}
                        />
                        {getThumbnailUrl(portfolio) ? (
                          <Image
                            src={getThumbnailUrl(portfolio)}
                            alt={portfolio.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                            className="object-cover relative z-10"
                            priority={isPriority}
                            loading={isPriority ? undefined : "lazy"}
                            placeholder="blur"
                            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2UyZThlZiIvPjwvc3ZnPg=="
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 relative z-10">
                            <FiImage className="w-16 h-16" />
                          </div>
                        )}
                        {/* 이미지/영상 개수 배지 */}
                        <div className="absolute top-2 left-2 flex gap-1 z-20">
                          {portfolio.images && portfolio.images.length > 1 && (
                            <div className="bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                              <FiImage className="w-3 h-3" />
                              {portfolio.images.length}
                            </div>
                          )}
                          {portfolio.videos && portfolio.videos.length > 0 && (
                            <div className="bg-primary bg-opacity-90 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                              <FiVideo className="w-3 h-3" />
                              {portfolio.videos.length}
                            </div>
                          )}
                        </div>
                        {/* 북마크 버튼 */}
                        {user && (
                          <button
                            onClick={(e) => handleToggleBookmark(portfolio.uuid, e)}
                            className={`absolute bottom-2 left-2 z-10 p-2 rounded-full shadow-md transition-all ${
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
                            <span className="flex items-center gap-1 text-yellow-500">
                              <FiStar className="fill-current" />
                              {(portfolio.company?.averageRating ?? 0).toFixed(1)}
                              <span className="text-gray-400">({portfolio.company?.reviewCount ?? 0})</span>
                            </span>
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
            </div>

            {/* 페이지네이션 */}
            {totalPages >= 1 && (
              <div className="flex justify-center items-center gap-1 sm:gap-2 mt-8 overflow-x-auto pb-2">
                {/* 처음 */}
                <button
                  onClick={() => handlePageChange(0)}
                  disabled={currentPage === 0}
                  className="flex-shrink-0 p-2 sm:p-2.5 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  title="처음"
                >
                  <FiChevronsLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* 이전 */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="flex-shrink-0 p-2 sm:p-2.5 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  title="이전"
                >
                  <FiChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* 모바일: 5개 */}
                <div className="flex gap-1 sm:hidden">
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
                        className={`flex-shrink-0 min-w-[36px] px-2 py-2 text-sm rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-primary text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    ))
                  })()}
                </div>

                {/* PC: 10개 */}
                <div className="hidden sm:flex gap-2">
                  {(() => {
                    const maxButtons = 10
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
                        className={`flex-shrink-0 min-w-[40px] px-3 py-2 text-base rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-primary text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    ))
                  })()}
                </div>

                {/* 다음 */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  className="flex-shrink-0 p-2 sm:p-2.5 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  title="다음"
                >
                  <FiChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* 끝 */}
                <button
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={currentPage === totalPages - 1}
                  className="flex-shrink-0 p-2 sm:p-2.5 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  title="끝"
                >
                  <FiChevronsRight className="w-4 h-4 sm:w-5 sm:h-5" />
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
                  <FiFilter className="text-primary" />
                  검색 및 필터
                  {selectedFilterOptionIds.length > 0 && (
                    <span className="bg-primary-100 text-primary px-2 py-0.5 rounded-full text-sm">
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
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {selectedTags.length > 0 && (
              <div className="px-4 py-3 bg-primary-50 border-b border-primary-100">
                <p className="text-xs text-gray-600 mb-2">선택된 필터</p>
                <div className="flex flex-wrap gap-1">
                  {selectedTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-white text-primary px-2 py-1 rounded-full text-sm font-medium shadow-sm border border-primary-200"
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
                className="w-full bg-primary hover:bg-primary-800 text-white py-3 rounded-lg font-semibold transition-colors"
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
            <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-primary to-indigo-600 text-white">
              <div>
                <h3 className="text-xl font-bold">모든 필터</h3>
                <p className="text-sm text-primary-100">
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
              <div className="px-5 py-3 bg-primary-50 border-b border-primary-100">
                <p className="text-xs text-gray-600 mb-2 font-medium">선택된 필터</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-white text-primary px-3 py-1.5 rounded-full text-sm font-medium shadow-sm border border-primary-200"
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
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-primary"></div>
                    <p className="mt-3 text-gray-600">필터 로딩 중...</p>
                  </div>
                </div>
              ) : filterCategories.length > 0 ? (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
                  {filterCategories.map((category) => {
                    const selectedCount = getSelectedCountInCategory(category)
                    const isCollapsed = collapsedCategories.has(category.id)
                    const allOptionIds = getAllOptionIdsInCategory(category)
                    const allSelected = allOptionIds.length > 0 && allOptionIds.every(id => selectedFilterOptionIds.includes(id))
                    const someSelected = selectedCount > 0 && !allSelected

                    return (
                      <div key={category.id} className="rounded-lg overflow-hidden shadow-sm">
                        {/* 카테고리 헤더 - 진한 배경색과 흰색 텍스트 */}
                        <button
                          type="button"
                          onClick={() => handleToggleCategory(category)}
                          className={`w-full flex items-center py-3 px-3 text-left transition-colors ${
                            selectedCount > 0
                              ? 'bg-primary hover:bg-primary-700'
                              : 'bg-gray-700 hover:bg-gray-800'
                          }`}
                        >
                          {/* 펼침/접힘 버튼 */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleCategoryCollapse(category.id)
                            }}
                            className="flex-shrink-0 p-0.5 rounded hover:bg-white/20 transition-colors"
                          >
                            {isCollapsed ? (
                              <FiChevronRight className="w-4 h-4 text-white" />
                            ) : (
                              <FiChevronDown className="w-4 h-4 text-white" />
                            )}
                          </div>
                          {/* 체크박스 */}
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ml-1 ${
                            allSelected
                              ? 'bg-white border-white'
                              : someSelected
                              ? 'bg-white/50 border-white'
                              : 'border-white/70 bg-transparent'
                          }`}>
                            {allSelected && (
                              <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {someSelected && !allSelected && (
                              <div className="w-2 h-0.5 bg-primary rounded"></div>
                            )}
                          </div>
                          <h4 className="font-bold text-white flex-1 ml-2">{category.name}</h4>
                          {selectedCount > 0 && (
                            <span className="bg-white text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                              {selectedCount}
                            </span>
                          )}
                        </button>
                        {/* 옵션 영역 */}
                        {!isCollapsed && (
                          <div className="bg-gray-50 p-3 border border-gray-200 border-t-0 rounded-b-lg">
                            <div className="space-y-0.5 max-h-64 overflow-y-auto pl-2 border-l-2 border-gray-300">
                              {category.options.map((option) => renderFilterOption(option, 0))}
                            </div>
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
                className="flex-1 bg-primary hover:bg-primary-800 text-white py-3 rounded-lg font-semibold transition-colors"
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
