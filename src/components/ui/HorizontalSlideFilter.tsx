'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { FiChevronDown, FiCheck, FiChevronRight, FiSearch } from 'react-icons/fi'

export interface FilterOption {
  id: number
  name: string
  parentId?: number | null
  children?: FilterOption[]
  isActive?: boolean
  isDeleted?: boolean
}

export interface FilterCategory {
  id: number
  name: string
  code: string
  options: FilterOption[]
}

interface HorizontalSlideFilterProps {
  categories: FilterCategory[]
  selectedOptionIds: number[]
  onToggleOption: (optionId: number, optionName: string, checked: boolean) => void
  onSelectCategoryFilter?: (categoryId: number, allOptionIds: number[], categoryName: string) => void
  activeCategoryFilterId?: number | null
  isLoading?: boolean
  // 검색 관련
  keyword?: string
  onKeywordChange?: (keyword: string) => void
  onSearch?: () => void
  onReset?: () => void
}

export default function HorizontalSlideFilter({
  categories,
  selectedOptionIds,
  onToggleOption,
  onSelectCategoryFilter,
  activeCategoryFilterId = null,
  isLoading = false,
  keyword = '',
  onKeywordChange,
  onSearch,
  onReset,
}: HorizontalSlideFilterProps) {
  // 선택된 카테고리
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null)
  // 선택 경로 (각 레벨에서 선택된 옵션 ID들)
  const [selectedPath, setSelectedPath] = useState<number[]>([])

  // 드래그 스크롤을 위한 ref들
  const categoryScrollRef = useRef<HTMLDivElement>(null)
  const scrollRefs = useRef<(HTMLDivElement | null)[]>([])

  // 드래그 상태
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [currentScrollRef, setCurrentScrollRef] = useState<HTMLDivElement | null>(null)
  const [hasDragged, setHasDragged] = useState(false)

  // 드래그 판정 임계값 (모바일에서 더 관대하게)
  const DRAG_THRESHOLD = 10

  // [성능 최적화] 카테고리별 선택된 옵션 개수 캐싱
  const selectedCountByCategory = useMemo(() => {
    const countMap = new Map<number, number>()

    const countInOptions = (options: FilterOption[]): number => {
      return options.reduce((sum, opt) => {
        if (selectedOptionIds.includes(opt.id)) {
          return sum + 1
        }
        if (opt.children && opt.children.length > 0) {
          return sum + countInOptions(opt.children)
        }
        return sum
      }, 0)
    }

    categories.forEach(category => {
      countMap.set(category.id, countInOptions(category.options))
    })

    return countMap
  }, [categories, selectedOptionIds])

  // [성능 최적화] 옵션별 선택된 자식 개수 캐싱
  const selectedCountByOption = useMemo(() => {
    const countMap = new Map<number, number>()

    const countAndCache = (options: FilterOption[]): void => {
      options.forEach(opt => {
        let count = selectedOptionIds.includes(opt.id) ? 1 : 0
        if (opt.children && opt.children.length > 0) {
          countAndCache(opt.children)
          count += opt.children.reduce((sum, child) => sum + (countMap.get(child.id) || 0), 0)
        }
        countMap.set(opt.id, count)
      })
    }

    categories.forEach(category => {
      countAndCache(category.options)
    })

    return countMap
  }, [categories, selectedOptionIds])

  // 카테고리 내 선택된 옵션 개수 (캐시 사용)
  const getSelectedCountInCategory = useCallback((category: FilterCategory): number => {
    return selectedCountByCategory.get(category.id) || 0
  }, [selectedCountByCategory])

  // 옵션의 자식 중 선택된 개수 (캐시 사용)
  const getSelectedCountInOption = useCallback((option: FilterOption): number => {
    return selectedCountByOption.get(option.id) || 0
  }, [selectedCountByOption])

  // 특정 경로의 옵션들 가져오기
  const getOptionsAtPath = useCallback((path: number[]): FilterOption[] => {
    if (!activeCategoryId) return []

    const category = categories.find(c => c.id === activeCategoryId)
    if (!category) return []

    if (path.length === 0) {
      return category.options
    }

    // 경로를 따라 내려가서 마지막 옵션의 children 반환
    let currentOptions = category.options
    for (const optionId of path) {
      const found = currentOptions.find(o => o.id === optionId)
      if (found && found.children && found.children.length > 0) {
        currentOptions = found.children
      } else {
        return []
      }
    }
    return currentOptions
  }, [activeCategoryId, categories])

  // 드래그 스크롤 핸들러들
  const handleMouseDown = (e: React.MouseEvent, ref: HTMLDivElement | null) => {
    if (!ref) return
    setIsDragging(true)
    setHasDragged(false)
    setCurrentScrollRef(ref)
    setStartX(e.pageX - ref.offsetLeft)
    setScrollLeft(ref.scrollLeft)
    ref.style.cursor = 'grabbing'
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !currentScrollRef) return
    e.preventDefault()
    const x = e.pageX - currentScrollRef.offsetLeft
    const walk = (x - startX) * 1.5
    if (Math.abs(walk) > DRAG_THRESHOLD) {
      setHasDragged(true)
    }
    currentScrollRef.scrollLeft = scrollLeft - walk
  }, [isDragging, currentScrollRef, startX, scrollLeft, DRAG_THRESHOLD])

  const handleMouseUp = useCallback(() => {
    if (!currentScrollRef) return
    setIsDragging(false)
    currentScrollRef.style.cursor = 'grab'
    setCurrentScrollRef(null)
    setTimeout(() => setHasDragged(false), 50)
  }, [currentScrollRef])

  // 터치 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent, ref: HTMLDivElement | null) => {
    if (!ref) return
    setIsDragging(true)
    setHasDragged(false)
    setCurrentScrollRef(ref)
    setStartX(e.touches[0].pageX - ref.offsetLeft)
    setScrollLeft(ref.scrollLeft)
  }

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !currentScrollRef) return
    const x = e.touches[0].pageX - currentScrollRef.offsetLeft
    const walk = (x - startX) * 1.5
    if (Math.abs(walk) > DRAG_THRESHOLD) {
      setHasDragged(true)
    }
    currentScrollRef.scrollLeft = scrollLeft - walk
  }, [isDragging, currentScrollRef, startX, scrollLeft, DRAG_THRESHOLD])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    setCurrentScrollRef(null)
    setTimeout(() => setHasDragged(false), 50)
  }, [])

  // 전역 이벤트 리스너
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove, { passive: false })
      window.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  // [필터 상태 관련] 선택된 옵션이 없고 카테고리 필터도 없으면 selectedPath 초기화
  // activeCategoryFilterId가 있으면 카테고리/자식 필터링 중이므로 selectedPath 유지
  useEffect(() => {
    if (selectedOptionIds.length === 0 && activeCategoryFilterId === null) {
      setSelectedPath([])
    }
  }, [selectedOptionIds, activeCategoryFilterId])

  // 카테고리 내 모든 옵션 ID 수집 (재귀)
  const getAllOptionIdsInCategory = useCallback((category: FilterCategory): number[] => {
    const collectIds = (options: FilterOption[]): number[] => {
      return options.flatMap(opt => {
        const ids = [opt.id]
        if (opt.children && opt.children.length > 0) {
          ids.push(...collectIds(opt.children))
        }
        return ids
      })
    }
    return collectIds(category.options)
  }, [])

  // [초기 로드] 첫 번째 카테고리 자동 활성화 (최초 1회만)
  const hasInitializedRef = useRef(false)
  useEffect(() => {
    if (!hasInitializedRef.current && categories.length > 0) {
      hasInitializedRef.current = true
      const firstCategory = categories[0]
      setActiveCategoryId(firstCategory.id)

      // 카테고리 필터 핸들러가 있으면 호출 (모든 옵션 ID 전달)
      if (onSelectCategoryFilter && firstCategory.options.length > 0) {
        const allOptionIds = getAllOptionIdsInCategory(firstCategory)
        onSelectCategoryFilter(firstCategory.id, allOptionIds, firstCategory.name)
      }
    }
  }, [categories, onSelectCategoryFilter, getAllOptionIdsInCategory])

  // 카테고리 선택 핸들러 (펼침 + 카테고리 전체 필터)
  const handleCategoryClick = (category: FilterCategory) => {
    if (hasDragged) return

    if (activeCategoryId === category.id) {
      // 이미 펼쳐진 카테고리 클릭 → 접기 및 필터 초기화 (전체 보기)
      setActiveCategoryId(null)
      setSelectedPath([])
      // 필터 초기화하여 전체 리스트 표시
      if (onSelectCategoryFilter) {
        onSelectCategoryFilter(0, [], '')
      }
    } else {
      // 새 카테고리 클릭 → 펼치고, 카테고리 전체 필터 적용
      setActiveCategoryId(category.id)
      setSelectedPath([])

      // 카테고리 필터 핸들러가 있으면 호출 (모든 옵션 ID 전달)
      if (onSelectCategoryFilter && category.options.length > 0) {
        const allOptionIds = getAllOptionIdsInCategory(category)
        onSelectCategoryFilter(category.id, allOptionIds, category.name)
      }
    }
  }

  // 옵션 클릭 핸들러 (모든 레벨에서 사용)
  const handleOptionClick = (option: FilterOption, level: number) => {
    if (hasDragged) return

    const hasChildren = option.children && option.children.length > 0
    const isSelected = selectedOptionIds.includes(option.id)

    // 모든 옵션 선택 가능 (부모든 자식이든)
    onToggleOption(option.id, option.name, !isSelected)

    if (hasChildren) {
      // 자식이 있으면 펼침 처리: 클릭하면 항상 펼침 (이미 펼쳐져 있어도 유지)
      if (selectedPath[level] !== option.id) {
        const newPath = [...selectedPath.slice(0, level), option.id]
        setSelectedPath(newPath)
      }
      // 이미 펼쳐진 옵션을 클릭해도 접지 않음
    } else {
      // 자식이 없으면 현재 레벨까지만 유지 (하위 레벨 접기)
      setSelectedPath(selectedPath.slice(0, level))
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3 animate-in fade-in duration-300">
        {/* 검색바 skeleton */}
        <div className="flex gap-2">
          <div className="flex-1 h-11 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-pulse" />
          <div className="w-16 h-11 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-pulse" />
        </div>
        {/* 카테고리 skeleton */}
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="h-11 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-pulse flex-shrink-0"
              style={{ width: `${60 + i * 15}px`, animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return null
  }

  // [모바일 관련] 최대 표시 레벨 수 제한 (너무 깊으면 화면이 길어짐)
  const MAX_LEVELS = 3

  // 현재 표시할 레벨들 계산
  const levels: FilterOption[][] = []
  if (activeCategoryId) {
    // 레벨 0: 카테고리의 최상위 옵션들
    levels.push(getOptionsAtPath([]))

    // 선택된 경로를 따라 하위 레벨들 추가 (펼침 상태는 선택과 무관하게 유지)
    // 최대 MAX_LEVELS까지만 표시
    const maxPathLength = Math.min(selectedPath.length, MAX_LEVELS - 1)
    for (let i = 0; i < maxPathLength; i++) {
      const pathToHere = selectedPath.slice(0, i + 1)
      const options = getOptionsAtPath(pathToHere)
      if (options.length > 0) {
        levels.push(options)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearch) {
      e.preventDefault()
      onSearch()
    }
  }

  return (
    <div className="space-y-2 md:space-y-3">
      {/* 검색 입력란 */}
      {onKeywordChange && (
        <div className="flex gap-1.5 md:gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="검색어를 입력하세요..."
              className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary focus:border-transparent text-xs md:text-sm"
            />
            <FiSearch className="absolute left-2.5 md:left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4" />
          </div>
          {onSearch && (
            <button
              onClick={onSearch}
              className="px-3 md:px-5 py-2 md:py-2.5 bg-primary hover:bg-primary-700 text-white rounded-full text-xs md:text-sm font-medium transition-colors flex-shrink-0"
            >
              검색
            </button>
          )}
          {onReset && (
            <button
              onClick={onReset}
              className={`px-2.5 md:px-4 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-medium transition-colors flex-shrink-0 ${
                keyword || selectedOptionIds.length > 0
                  ? 'bg-red-100 hover:bg-red-200 text-red-600'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-400'
              }`}
            >
              초기화
            </button>
          )}
        </div>
      )}

      {/* 선택된 필터 태그 표시 - 숨김 처리 */}

      {/* 카테고리 탭 (최상위 - 펼침만, 선택 불가) */}
      <div
        ref={categoryScrollRef}
        className="flex gap-1.5 md:gap-2 overflow-x-auto scrollbar-hide cursor-grab select-none pb-1 -mx-1 px-1"
        style={{ WebkitOverflowScrolling: 'touch' }}
        onMouseDown={(e) => handleMouseDown(e, categoryScrollRef.current)}
        onTouchStart={(e) => handleTouchStart(e, categoryScrollRef.current)}
      >
        {categories.map(category => {
          const isExpanded = activeCategoryId === category.id
          const isCategoryFiltered = activeCategoryFilterId === category.id
          const selectedCount = getSelectedCountInCategory(category)
          // 펼쳐져 있거나 카테고리 필터가 적용된 경우 활성 상태로 표시
          const isActive = isExpanded || isCategoryFiltered

          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className={`
                flex items-center gap-1 md:gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2.5 rounded-full text-xs md:text-sm font-semibold
                transition-all duration-200 whitespace-nowrap flex-shrink-0 border md:border-2
                active:scale-95 hover:shadow-md
                ${isActive
                  ? 'bg-gray-900 text-white border-gray-900 shadow-lg scale-[1.02]'
                  : selectedCount > 0
                    ? 'bg-primary-50 text-primary border-primary-400 shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <span>{category.name}</span>
              {selectedCount > 0 && (
                <span className={`text-[10px] md:text-xs px-1 md:px-1.5 py-0.5 rounded-full font-bold min-w-[16px] md:min-w-[20px] text-center ${isActive ? 'bg-white text-gray-900' : 'bg-primary text-white'}`}>
                  {selectedCount}
                </span>
              )}
              <FiChevronDown
                className={`w-3 h-3 md:w-4 md:h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>
          )
        })}
      </div>

      {/* 동적 레벨들 (선택 경로에 따라 표시) */}
      {levels.map((options, levelIndex) => {
        const isExpanded = options.length > 0
        const bgColors = ['bg-gray-50', 'bg-primary-50', 'bg-orange-50', 'bg-blue-50']
        const bgColor = bgColors[levelIndex % bgColors.length]

        return (
          <div
            key={levelIndex}
            className={`
              overflow-hidden transition-all duration-300 ease-out
              ${isExpanded ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}
            `}
          >
            <div
              ref={(el) => { scrollRefs.current[levelIndex] = el }}
              className={`flex gap-1.5 md:gap-2 overflow-x-auto scrollbar-hide cursor-grab select-none py-1.5 md:py-2 px-2 md:px-3 ${bgColor} rounded-lg md:rounded-xl -mx-1`}
              style={{ WebkitOverflowScrolling: 'touch' }}
              onMouseDown={(e) => handleMouseDown(e, scrollRefs.current[levelIndex])}
              onTouchStart={(e) => handleTouchStart(e, scrollRefs.current[levelIndex])}
            >
              {options.map(option => {
                const hasChildren = option.children && option.children.length > 0
                const isSelected = selectedOptionIds.includes(option.id)
                // 경로에 있으면 펼침 상태로 표시 (선택 여부와 무관)
                const isPathSelected = selectedPath[levelIndex] === option.id
                const selectedChildCount = getSelectedCountInOption(option)

                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionClick(option, levelIndex)}
                    className={`
                      flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3.5 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium
                      transition-all duration-200 whitespace-nowrap flex-shrink-0 border
                      active:scale-95 hover:shadow-md
                      ${isSelected
                        ? 'bg-primary text-white border-primary shadow-md scale-[1.02]'
                        : selectedChildCount > 0
                          ? 'bg-primary-100 text-primary-700 border-primary-300 hover:bg-primary-200'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border-gray-200'
                      }
                    `}
                  >
                    {isSelected && (
                      <FiCheck className="w-3 h-3 md:w-3.5 md:h-3.5 animate-in zoom-in duration-200" />
                    )}
                    <span>{option.name}</span>
                    {hasChildren && selectedChildCount > 0 && !isSelected && (
                      <span className="text-[10px] md:text-xs bg-primary text-white px-1 md:px-1.5 py-0.5 rounded-full font-bold">
                        {selectedChildCount}
                      </span>
                    )}
                    {hasChildren && (
                      <FiChevronRight
                        className={`w-3 h-3 md:w-3.5 md:h-3.5 transition-transform duration-200 ${isPathSelected ? 'rotate-90' : ''}`}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
