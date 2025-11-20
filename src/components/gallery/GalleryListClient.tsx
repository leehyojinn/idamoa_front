'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FiSearch, FiPlus, FiEye, FiBookmark, FiTag, FiImage, FiX, FiMoreVertical, FiEdit, FiTrash2, FiExternalLink, FiFilter, FiChevronDown, FiChevronUp, FiRefreshCw } from 'react-icons/fi'
import { searchGalleries, deleteGallery, toggleBookmark, type GalleryListItem, type GallerySearchParams } from '@/lib/api/gallery'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Select from '@/components/ui/Select'
import { useAuth } from '@/hooks/useAuth'

// 태그 카테고리
const TAG_CATEGORIES = {
  평수: ['50평이하', '100평이하', '200평이하', '200평이상'],
  진료과목: [
    '피부과', '성형외과', '정형외과', '내과', '치과', '안과', '한의원', '한방병원',
    '산부인과', '비뇨기과', '이비인후과', '가정의학과', '재활의학과', '신경외과',
    '마취통증학과', '정신과', '외과', '영상의학과', '소아과', '건강검진센터', '종합병원'
  ],
  공간별: ['대기실', '상담실', '진료실', '피부관리실', '수술실', '메이크업', '입원/회복실', '복도', '출입구'],
  스타일: ['모던', '미니멀', '클래식', '내츄럴', '럭셔리', '컬러풀', '오리엔탈', '플란트', '미디어월', '노출'],
  컬러: ['화이트', '그레이', '베이지', '블랙', '브라운', '레드', '오렌지', '엘로우', '그린', '블루'],
  자재: ['도장', '도배', '금속', '유리', '벽돌', '타일/대리석', '에폭시', '시멘트', '콩자갈', '조경', '사인', '간판'],
  유형: ['3D', '실사']
}

// 컬러 이름 -> CSS 색상 매핑
const COLOR_MAP: { [key: string]: string } = {
  '화이트': '#FFFFFF',
  '그레이': '#9CA3AF',
  '베이지': '#F5F5DC',
  '블랙': '#000000',
  '브라운': '#8B4513',
  '레드': '#EF4444',
  '오렌지': '#F97316',
  '엘로우': '#EAB308',
  '그린': '#22C55E',
  '블루': '#3B82F6'
}

export default function GalleryListClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [galleries, setGalleries] = useState<GalleryListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 메뉴 드롭다운 상태
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // 삭제 다이얼로그
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingGallery, setDeletingGallery] = useState<GalleryListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 필터 펼침/접힘 상태
  const [showFilters, setShowFilters] = useState(false)

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
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Search & Filter
  const [keyword, setKeyword] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'CREATED_AT' | 'VIEW_COUNT' | 'BOOKMARK_COUNT'>('CREATED_AT')
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC')
  const [onlyBookmarked, setOnlyBookmarked] = useState(false)
  const [onlyMyPosts, setOnlyMyPosts] = useState(false)

  const handleSelectTag = (category: string, tag: string) => {
    if (!selectedTags.includes(tag)) {
      const newTags = [...selectedTags, tag]
      setSelectedTags(newTags)
      // 바로 검색 실행
      updateURL({
        page: 0,
        keyword,
        tags: newTags,
        sortBy,
        sortDirection,
        onlyBookmarked,
        onlyMyPosts,
      })
    }
  }

  const handleRemoveTag = (tag: string) => {
    const newTags = selectedTags.filter(t => t !== tag)
    setSelectedTags(newTags)
    // 바로 검색 실행
    updateURL({
      page: 0,
      keyword,
      tags: newTags,
      sortBy,
      sortDirection,
      onlyBookmarked,
      onlyMyPosts,
    })
  }

  const handleClearAllTags = () => {
    setSelectedTags([])
    // 바로 검색 실행
    updateURL({
      page: 0,
      keyword,
      tags: [],
      sortBy,
      sortDirection,
      onlyBookmarked,
      onlyMyPosts,
    })
  }

  const handleResetFilters = () => {
    setKeyword('')
    setSelectedTags([])
    setSortBy('CREATED_AT')
    setSortDirection('DESC')
    setOnlyBookmarked(false)
    setOnlyMyPosts(false)
    // URL을 초기 상태로
    router.push('/photos', { scroll: false })
  }

  const fetchGalleries = useCallback(async (params: GallerySearchParams = {}) => {
    setIsLoading(true)
    try {
      // 백엔드 태그 검색 버그로 인해 태그 검색 비활성화
      // TODO: 백엔드 BoardSpecifications.java의 array_position 타입 문제 해결 후 활성화

      const result = await searchGalleries({
        page: params.page || 0,
        size: 12,
        keyword: params.keyword || undefined,
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
      showErrorToast(error, '갤러리 목록을 불러오는데 실패했습니다')
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
    const sortBy = (searchParams.get('sortBy') || 'CREATED_AT') as 'CREATED_AT' | 'VIEW_COUNT' | 'BOOKMARK_COUNT'
    const sortDirection = (searchParams.get('sortDirection') || 'DESC') as 'ASC' | 'DESC'
    const onlyBookmarked = searchParams.get('onlyBookmarked') === 'true'
    const onlyMyPosts = searchParams.get('onlyMyPosts') === 'true'

    setCurrentPage(page)
    setKeyword(keyword)
    setSelectedTags(tags)
    setSortBy(sortBy)
    setSortDirection(sortDirection)
    setOnlyBookmarked(onlyBookmarked)
    setOnlyMyPosts(onlyMyPosts)

    fetchGalleries({ page, keyword, tags, sortBy, sortDirection, onlyBookmarked, onlyMyPosts })
  }, [searchParams, fetchGalleries])

  const updateURL = (params: GallerySearchParams) => {
    const query = new URLSearchParams()
    if (params.page !== undefined) query.set('page', params.page.toString())
    if (params.keyword) query.set('keyword', params.keyword)
    if (params.tags && params.tags.length > 0) query.set('tags', params.tags.join(','))
    if (params.sortBy) query.set('sortBy', params.sortBy)
    if (params.sortDirection) query.set('sortDirection', params.sortDirection)
    if (params.onlyBookmarked) query.set('onlyBookmarked', 'true')
    if (params.onlyMyPosts) query.set('onlyMyPosts', 'true')

    router.push(`/photos?${query.toString()}`, { scroll: false })
  }

  const handleSearch = () => {
    const params = {
      page: 0,
      keyword,
      tags: selectedTags,
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
      showSuccessToast('갤러리가 삭제되었습니다')
      setShowDeleteDialog(false)
      setDeletingGallery(null)
      // 목록 새로고침
      fetchGalleries({ page: currentPage, keyword, tags: selectedTags, sortBy, sortDirection, onlyBookmarked, onlyMyPosts })
    } catch (error: any) {
      if (error?.response?.status === 403) {
        showErrorToast(error, '삭제 권한이 없습니다')
      } else {
        showErrorToast(error, '갤러리 삭제에 실패했습니다')
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

        // 갤러리 목록에서 해당 갤러리의 북마크 상태만 업데이트
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

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null)
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openMenuId])

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">사진 갤러리</h1>
          <p className="text-gray-600 mt-2">
            {totalElements}개의 갤러리
          </p>
        </div>
        {user && (
          <Link
            href="/photos/create"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <FiPlus className="text-xl" />
            갤러리 등록
          </Link>
        )}
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 space-y-4">
        {/* 검색바 */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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

        {/* 빠른 필터 및 정렬 */}
        <div className="space-y-3">
          {/* 첫 번째 줄: 정렬 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
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

            {/* 데스크톱: 초기화/상세필터 버튼 */}
            <div className="hidden sm:flex items-center gap-3 ml-auto">
              <button
                onClick={handleResetFilters}
                disabled={!keyword && selectedTags.length === 0 && sortBy === 'CREATED_AT' && !onlyBookmarked && !onlyMyPosts}
                className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <FiRefreshCw />
                초기화
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  showFilters || selectedTags.length > 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiFilter />
                상세 필터
                {selectedTags.length > 0 && (
                  <span className="bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                    {selectedTags.length}
                  </span>
                )}
                {showFilters ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>
          </div>

          {/* 두 번째 줄: 빠른 필터 (로그인 시) + 모바일 버튼 */}
          <div className="flex flex-wrap items-center gap-2">
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

            {/* 모바일: 초기화/상세필터 버튼 */}
            <div className="flex sm:hidden items-center gap-2 ml-auto">
              <button
                onClick={handleResetFilters}
                disabled={!keyword && selectedTags.length === 0 && sortBy === 'CREATED_AT' && !onlyBookmarked && !onlyMyPosts}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiRefreshCw />
                <span className="whitespace-nowrap">초기화</span>
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showFilters || selectedTags.length > 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiFilter />
                <span className="whitespace-nowrap">필터</span>
                {selectedTags.length > 0 && (
                  <span className="bg-white text-blue-600 px-1.5 py-0.5 rounded-full text-xs font-bold">
                    {selectedTags.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 선택된 태그 미리보기 */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <FiTag />
              선택된 태그:
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

        {/* 상세 필터 (아코디언) */}
        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FiTag className="text-blue-600" />
                카테고리별 태그 선택
              </h3>
            </div>

            {/* 카테고리별 셀렉트 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(TAG_CATEGORIES).map(([category, tagList]) => (
                <Select
                  key={category}
                  label={category}
                  options={[
                    { value: '', label: `${category} 선택` },
                    ...tagList.map(tag => ({
                      value: tag,
                      label: tag,
                      color: category === '컬러' ? COLOR_MAP[tag] : undefined
                    }))
                  ]}
                  value=""
                  onChange={(value) => {
                    if (value) {
                      handleSelectTag(category, value)
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 갤러리 그리드 */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">갤러리를 불러오는 중...</p>
        </div>
      ) : galleries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg">등록된 갤러리가 없습니다.</p>
          {user && (
            <Link
              href="/photos/create"
              className="inline-flex items-center gap-2 mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <FiPlus className="text-xl" />
              첫 갤러리 등록하기
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
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                          style={{ backgroundColor: filter.color + '20', color: filter.color }}
                        >
                          <span>{filter.icon}</span>
                          {filter.shortName}
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
                  {gallery.tags.length > 0 && (
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
                      {gallery.tags.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{gallery.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                        {(gallery.companyName || gallery.userName)?.charAt(0) || 'U'}
                      </div>
                      <span>{gallery.companyName || gallery.userName || '알 수 없음'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <FiEye />
                        {gallery.viewCount}
                      </span>
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
            <h3 className="text-xl font-bold text-gray-900 mb-4">갤러리 삭제</h3>
            <div className="space-y-4">
              <p className="text-gray-600">
                정말로 이 갤러리를 삭제하시겠습니까?
                <br />
                삭제된 갤러리는 복구할 수 없습니다.
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
