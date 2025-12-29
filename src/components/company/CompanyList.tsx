'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Pagination from '@/components/ui/Pagination'
import Select from '@/components/ui/Select'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { searchCompaniesWithFilters, toggleCompanyLike, type CompanyListItem, type CompanyListResponse } from '@/lib/api/company'
import { getPublicFilters, type PublicFilterCategory } from '@/lib/api/filter'
import { useAuthStore } from '@/stores/authStore'
import {
  IoEye,
  IoHeart,
  IoHeartOutline,
  IoCheckmarkCircle,
  IoLocationOutline,
  IoCallOutline,
  IoChatbubblesOutline,
  IoArrowForward,
  IoSearch,
  IoRefresh,
} from 'react-icons/io5'
import { FiStar } from 'react-icons/fi'
import { getCdnUrl } from '@/lib/utils'

const SORT_OPTIONS = [
  { value: 'PREMIUM_TIER', label: '추천순' },
  { value: 'RATING', label: '평점 높은 순' },
  { value: 'REVIEW_COUNT', label: '리뷰 많은 순' },
  { value: 'POPULAR', label: '인기순' },
]

interface CompanyListProps {
  initialData?: CompanyListResponse
  selectedTag?: string // 선택된 태그
}

export default function CompanyList({ initialData, selectedTag }: CompanyListProps) {
  const router = useRouter()
  const accessToken = useAuthStore((state) => state.accessToken)
  const [companies, setCompanies] = useState<CompanyListItem[]>(initialData?.content || [])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(initialData?.totalPages || 0)
  const [totalElements, setTotalElements] = useState(initialData?.totalElements || 0)
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'LATEST' | 'RATING' | 'REVIEW_COUNT' | 'POPULAR' | 'PREMIUM_TIER'>('PREMIUM_TIER')
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // 새로운 상태들
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<Record<number, number[]>>({})
  const [filterCategories, setFilterCategories] = useState<PublicFilterCategory[]>([])
  const [selectedRegion, setSelectedRegion] = useState<number | ''>('')
  const [filtersLoading, setFiltersLoading] = useState(true)

  // 필터 카테고리 로드
  useEffect(() => {
    const loadFilters = async () => {
      try {
        setFiltersLoading(true)
        const categories = await getPublicFilters()
        setFilterCategories(categories)
      } finally {
        setFiltersLoading(false)
      }
    }
    loadFilters()
  }, [])

  // selectedTag를 filters로 변환 (전문영역 필터)
  useEffect(() => {
    if (selectedTag && filterCategories.length > 0) {
      const specialtyCategory = filterCategories.find(
        cat => {
          const name = cat.name?.toLowerCase() || ''
          const code = cat.code?.toLowerCase() || ''
          return name.includes('전문') || name.includes('분야') ||
                 code === 'specialty' || code === 'profession' || code === 'field'
        }
      )

      if (specialtyCategory) {
        const matchingOption = specialtyCategory.options.find(opt => {
          const optionName = opt.name.replace(/\s+/g, '').toLowerCase()
          const tagName = selectedTag.replace(/\s+/g, '').toLowerCase()

          if (opt.name === selectedTag) return true
          if (optionName === tagName) return true
          if (optionName.includes(tagName)) return true
          if (tagName.includes(optionName)) return true

          return false
        })

        if (matchingOption) {
          setFilters(prev => ({
            ...prev,
            [specialtyCategory.id]: [matchingOption.id]
          }))
        } else {
          setFilters(prev => {
            const newFilters = { ...prev }
            delete newFilters[specialtyCategory.id]
            return newFilters
          })
        }
      }
      setPage(0)
    } else if (!selectedTag && filterCategories.length > 0) {
      // 전체 선택 시 전문영역 필터 제거
      const specialtyCategory = filterCategories.find(
        cat => {
          const name = cat.name?.toLowerCase() || ''
          const code = cat.code?.toLowerCase() || ''
          return name.includes('전문') || name.includes('분야') ||
                 code === 'specialty' || code === 'profession' || code === 'field'
        }
      )
      if (specialtyCategory) {
        setFilters(prev => {
          const newFilters = { ...prev }
          delete newFilters[specialtyCategory.id]
          return newFilters
        })
      }
    }
  }, [selectedTag, filterCategories])

  // 지역 필터 변경 시
  useEffect(() => {
    if (selectedRegion && filterCategories.length > 0) {
      const regionCategory = filterCategories.find(
        cat => cat.name === '지역' || cat.code === 'region'
      )

      if (regionCategory) {
        setFilters(prev => ({
          ...prev,
          [regionCategory.id]: [Number(selectedRegion)]
        }))
      }
    } else if (selectedRegion === '' && filterCategories.length > 0) {
      // 전체 선택 시 지역 필터 제거
      const regionCategory = filterCategories.find(
        cat => cat.name === '지역' || cat.code === 'region'
      )
      if (regionCategory) {
        setFilters(prev => {
          const newFilters = { ...prev }
          delete newFilters[regionCategory.id]
          return newFilters
        })
      }
    }
  }, [selectedRegion, filterCategories])

  const fetchCompanies = useCallback(async () => {
    setLoading(true)

    try {
      const params = {
        keyword: keyword || undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        sortBy,
        page,
        size: 12,
      }

      const result = await searchCompaniesWithFilters(params)

      if (result.success && result.data) {
        setCompanies(result.data.content)
        setTotalPages(result.data.totalPages)
        setTotalElements(result.data.totalElements)
      }
    } catch (error) {
      showErrorToast(error, '업체 목록을 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }, [page, sortBy, keyword, filters])

  useEffect(() => {
    // 초기 로드 시에는 SSR 데이터 사용, 이후 변경 시에만 fetch
    if (isInitialLoad && initialData) {
      setIsInitialLoad(false)
      return
    }
    fetchCompanies()
  }, [fetchCompanies, isInitialLoad, initialData])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort as 'LATEST' | 'RATING' | 'REVIEW_COUNT' | 'POPULAR' | 'PREMIUM_TIER')
    setPage(0)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setKeyword(searchInput)
    setPage(0)
  }

  const handleReset = () => {
    setSearchInput('')
    setKeyword('')
    setSelectedRegion('')
    setFilters({})
    setSortBy('PREMIUM_TIER')
    setPage(0)
  }

  const handleCompanyClick = (slug: string) => {
    router.push(`/companies/${slug}`)
  }

  const handleLikeClick = async (e: React.MouseEvent, companyUuid: string, currentIsLiked: boolean) => {
    e.stopPropagation() // 카드 클릭 이벤트 방지

    // 로그인 체크
    if (!accessToken) {
      showErrorToast(null, '로그인이 필요합니다')
      router.push('/login')
      return
    }

    try {
      const result = await toggleCompanyLike(companyUuid)

      if (result.success) {
        // 상태 업데이트
        setCompanies(prevCompanies =>
          prevCompanies.map(company =>
            company.uuid === companyUuid
              ? {
                  ...company,
                  isLiked: result.data.isLiked,
                  likeCount: result.data.isLiked
                    ? company.likeCount + 1
                    : company.likeCount - 1,
                }
              : company
          )
        )
        showSuccessToast(result.data.message)
      }
    } catch (error) {
      showErrorToast(error, '좋아요 처리 중 오류가 발생했습니다')
    }
  }

  const getPrimaryImage = (images: any[]) => {
    const url = images.find((img) => img.isPrimary)?.imageUrl || images[0]?.imageUrl || '/images/img-placeholder.png'
    return getCdnUrl(url)
  }

  // 지역 카테고리 찾기 (정확한 매칭만)
  const regionCategory = filterCategories.find(
    cat => {
      const name = cat.name?.toLowerCase() || ''
      const code = cat.code?.toLowerCase() || ''
      // 지역 관련 키워드만 정확히 매칭
      return (name === '지역' || name === '서비스 지역' || name === '활동 지역') ||
             (code === 'region' || code === 'service_region' || code === 'location')
    }
  )

  return (
    <div className="w-full bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 빠른상담 CTA */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 hover:shadow-lg transition-shadow mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
              <IoChatbubblesOutline className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                원하는 업체를 찾지 못하셨나요?
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                업체를 무료로 매칭 및 상담해드립니다
              </p>
            </div>
            <div className="shrink-0">
              <button
                onClick={() => router.push('/consultations/new')}
                className="btn bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                <span>빠른상담 신청</span>
                <IoArrowForward className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 영역 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearchSubmit}>
            {/* 검색바 */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="업체명, 태그, 주소로 검색"
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium whitespace-nowrap"
              >
                검색
              </button>
            </div>

            {/* 필터 옵션 */}
            <div className="flex flex-wrap gap-3">
              {/* 지역 필터 */}
              {filtersLoading ? (
                <div className="w-full sm:w-auto sm:min-w-[200px]">
                  <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                </div>
              ) : regionCategory && regionCategory.options && regionCategory.options.length > 0 ? (
                <div className="w-full sm:w-auto sm:min-w-[200px]">
                  <Select
                    options={[
                      { value: '', label: '🗺️ 전체 지역' },
                      ...regionCategory.options
                        .filter(option => option.isActive !== false && option.isDeleted !== true) // 비활성화되거나 삭제된 항목 제외
                        .map((option) => ({
                          value: option.id.toString(),
                          label: option.name,
                        })),
                    ]}
                    value={selectedRegion === '' ? '' : selectedRegion.toString()}
                    onChange={(value) => setSelectedRegion(value === '' ? '' : Number(value))}
                  />
                </div>
              ) : null}

              {/* 초기화 버튼 */}
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium"
              >
                <IoRefresh className="w-4 h-4" />
                초기화
              </button>
            </div>
          </form>
        </div>

        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <p className="mt-2 text-sm text-gray-600">
              총 {totalElements.toLocaleString()}개의 업체
            </p>
          </div>

          {/* 정렬 옵션 */}
          <div className="mt-4 sm:mt-0 w-full sm:w-auto">
            <Select
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={handleSortChange}
              className="min-w-[200px]"
            />
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">로딩 중...</p>
            </div>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">등록된 업체가 없습니다</p>
          </div>
        ) : (
          <>
            {/* 업체 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {companies.map((company, index) => {
                // 첫 8개 이미지는 priority 로딩 (LCP 최적화)
                const isPriority = index < 8
                return (
                <div
                  key={company.uuid}
                  onClick={() => handleCompanyClick(company.slug)}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group border border-[rgba(0,0,0,0.2)]"
                >
                  {/* 이미지 */}
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    {/* Shimmer 로딩 효과 */}
                    <div
                      className="absolute inset-0 animate-shimmer z-0"
                      style={{
                        background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
                        backgroundSize: '200% 100%',
                      }}
                    />
                    <Image
                      src={getPrimaryImage(company.images)}
                      alt={company.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 350px"
                      className="object-cover group-hover:scale-110 transition-transform duration-300 relative z-10"
                      priority={isPriority}
                      loading={isPriority ? undefined : "lazy"}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2UyZThlZiIvPjwvc3ZnPg=="
                    />

                    {/* 프리미엄 배지 */}
                    {company.isPremium && company.premiumTier && (
                      <div className="absolute top-3 left-3">
                        <span
                          className={`
                          px-3 py-1 rounded-full text-xs font-bold text-white shadow-md
                          ${
                            company.premiumTier === 'GOLD'
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                              : company.premiumTier === 'SILVER'
                              ? 'bg-gradient-to-r from-gray-300 to-gray-500'
                              : 'bg-gradient-to-r from-orange-400 to-orange-600'
                          }
                        `}
                        >
                          {company.premiumTier}
                        </span>
                      </div>
                    )}

                    {/* 추천 배지 */}
                    {company.featured && (
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white shadow-md">
                          추천
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 내용 */}
                  <div className="p-5">
                    {/* 업체명 */}
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                        {company.name}
                      </h3>
                      {company.verified && (
                        <IoCheckmarkCircle className="text-blue-500 text-xl flex-shrink-0 ml-2" />
                      )}
                    </div>

                    {/* 설명 */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                      {company.description}
                    </p>

                    {/* 평점 */}
                    <div className="flex items-center gap-1 mb-3">
                      <FiStar className="fill-current text-yellow-500 text-lg" />
                      <span className="font-semibold text-gray-900">
                        {company.avgRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({company.reviewCount}개 리뷰)
                      </span>
                    </div>

                    {/* 주소 */}
                    {company.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <IoLocationOutline className="text-gray-400 flex-shrink-0" />
                        <span className="line-clamp-1">{company.address}</span>
                      </div>
                    )}

                    {/* 전화번호 */}
                    {company.primaryPhone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <IoCallOutline className="text-gray-400 flex-shrink-0" />
                        <span>{company.primaryPhone}</span>
                      </div>
                    )}

                    {/* 통계 */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <IoEye className="text-gray-400" />
                          <span>{company.viewCount.toLocaleString()}</span>
                        </div>
                        <button
                          onClick={(e) => handleLikeClick(e, company.uuid, company.isLiked)}
                          className="flex items-center gap-1 hover:scale-110 transition-transform"
                        >
                          {company.isLiked ? (
                            <IoHeart className="text-red-500" />
                          ) : (
                            <IoHeartOutline className="text-gray-400 hover:text-red-500" />
                          )}
                          <span>{company.likeCount.toLocaleString()}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )})}

            </div>

            {/* 페이지네이션 */}
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  )
}
