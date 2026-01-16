'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FiEye, FiThumbsUp, FiThumbsDown, FiPaperclip, FiSearch, FiEdit, FiClock, FiChevronDown } from 'react-icons/fi'
import {
  getCommunityCategories,
  getCommunityPosts,
  type CommunityCategory,
  type CommunityPostListItem,
  type PageResponse,
} from '@/lib/api/community'
import { showErrorToast } from '@/lib/errorHandler'
import { useAuth } from '@/hooks/useAuth'
import { findCategoryBySlug } from '@/hooks/useCommunityCategory'

interface Props {
  initialCategories?: CommunityCategory[]
  initialPosts?: PageResponse<CommunityPostListItem>
  categorySlug?: string
}

export default function CommunityListClient({ initialCategories, initialPosts, categorySlug = '' }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuth()

  // URL에서 초기값 읽기
  const getInitialPage = () => {
    const pageParam = searchParams.get('page')
    return pageParam ? parseInt(pageParam, 10) : 0
  }
  const getInitialKeyword = () => searchParams.get('keyword') || ''

  const [categories, setCategories] = useState<CommunityCategory[]>(initialCategories || [])
  const [posts, setPosts] = useState<CommunityPostListItem[]>(initialPosts?.content || [])
  const [keyword, setKeyword] = useState(getInitialKeyword)
  const [searchInput, setSearchInput] = useState(getInitialKeyword)
  const [isLoading, setIsLoading] = useState(!initialPosts)
  const [currentPage, setCurrentPage] = useState(getInitialPage)
  const [totalPages, setTotalPages] = useState(initialPosts?.totalPages || 0)
  const [totalElements, setTotalElements] = useState(initialPosts?.totalElements || 0)

  // 현재 카테고리 경로 계산
  const basePath = categorySlug ? `/community/${categorySlug}` : '/community'

  // URL 업데이트 함수 (페이지, 키워드만 쿼리 파라미터로)
  const updateURL = useCallback((params: { page?: number; keyword?: string }) => {
    const newParams = new URLSearchParams()

    const p = params.page ?? currentPage
    const kw = params.keyword ?? keyword

    if (p > 0) newParams.set('page', p.toString())
    if (kw) newParams.set('keyword', kw)

    const queryString = newParams.toString()
    const newUrl = queryString ? `${basePath}?${queryString}` : basePath
    router.replace(newUrl, { scroll: false })
  }, [currentPage, keyword, basePath, router])

  // 카테고리 로드
  useEffect(() => {
    if (!initialCategories) {
      getCommunityCategories()
        .then((result) => {
          if (result.success && result.data) {
            setCategories(result.data)
          }
        })
        .catch(() => {})
    }
  }, [initialCategories])

  // 게시글 로드
  const fetchPosts = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getCommunityPosts({
        categorySlug: categorySlug || undefined,
        includeChildren: true,  // 하위 카테고리 게시글 포함
        keyword: keyword || undefined,
        page: currentPage,
        size: 20,
        sort: 'createdAt,desc',
      })

      if (result.success && result.data) {
        const data = result.data as any
        // 배열로 오는 경우와 페이지 객체로 오는 경우 모두 처리
        if (Array.isArray(data)) {
          setPosts(data)
          setTotalPages(1)
          setTotalElements(data.length)
        } else {
          setPosts(data.content || [])
          setTotalPages(data.totalPages || 0)
          setTotalElements(data.totalElements || 0)
        }
      } else {
        setPosts([])
        setTotalPages(0)
        setTotalElements(0)
      }
    } catch (error) {
      showErrorToast(error, '게시글을 불러오는데 실패했습니다')
      setPosts([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setIsLoading(false)
    }
  }, [categorySlug, keyword, currentPage])

  // 검색/필터 변경 시 게시글 로드
  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // 검색
  const handleSearch = () => {
    setKeyword(searchInput)
    setCurrentPage(0)
    updateURL({ keyword: searchInput, page: 0 })
  }

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    updateURL({ page: newPage })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 글쓰기 버튼 클릭
  const handleWriteClick = () => {
    if (!isAuthenticated) {
      showErrorToast(null, '로그인이 필요합니다')
      router.push('/login')
      return
    }
    router.push('/community/posts/create')
  }

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diff / (1000 * 60))
    const diffHours = Math.floor(diff / (1000 * 60 * 60))
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return '방금 전'
    if (diffMinutes < 60) return `${diffMinutes}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // 현재 카테고리 찾기 (계층 구조에서)
  const currentCategory = categorySlug ? findCategoryBySlug(categories, categorySlug) : null

  // 현재 선택된 카테고리가 하위 카테고리인 경우 부모 찾기
  const findParentCategory = (cats: CommunityCategory[], slug: string): CommunityCategory | null => {
    for (const cat of cats) {
      if (cat.children?.some(child => child.slug === slug)) {
        return cat
      }
      if (cat.children) {
        const found = findParentCategory(cat.children, slug)
        if (found) return found
      }
    }
    return null
  }

  const parentCategory = categorySlug ? findParentCategory(categories, categorySlug) : null
  const activeParentSlug = parentCategory?.slug || (currentCategory?.depth === 0 ? currentCategory?.slug : null)

  return (
    <div className="space-y-6">
      {/* 상위 카테고리 탭 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200">
          <Link
            href="/community"
            className={`flex-shrink-0 px-4 md:px-6 py-3 md:py-4 text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
              categorySlug === ''
                ? 'text-primary border-b-2 border-primary bg-primary-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            전체
          </Link>
          {/* 최상위 카테고리만 표시 (depth === 0) */}
          {categories.filter(cat => cat.depth === 0).map((cat) => {
            const isActive = categorySlug === cat.slug || activeParentSlug === cat.slug
            const hasChildren = cat.children && cat.children.length > 0
            // 하위 카테고리가 있으면 첫 번째 하위 카테고리로 이동
            const targetSlug = hasChildren ? cat.children![0].slug : cat.slug

            return (
              <Link
                key={cat.uuid}
                href={`/community/${targetSlug}`}
                className={`flex-shrink-0 px-4 md:px-6 py-3 md:py-4 text-sm md:text-base font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
                  isActive
                    ? 'text-primary border-b-2 border-primary bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {cat.icon && <span className="mr-1">{cat.icon}</span>}
                {cat.name}
                {hasChildren && <FiChevronDown className="w-3.5 h-3.5 opacity-50" />}
              </Link>
            )
          })}
        </div>

        {/* 하위 카테고리 탭 (선택된 상위 카테고리의 자식들) */}
        {activeParentSlug && (() => {
          const activeParent = categories.find(c => c.slug === activeParentSlug)
          if (!activeParent?.children || activeParent.children.length === 0) return null

          return (
            <div className="flex overflow-x-auto scrollbar-hide bg-gray-50 border-b border-gray-100">
              {activeParent.children.map((subCat) => (
                <Link
                  key={subCat.uuid}
                  href={`/community/${subCat.slug}`}
                  className={`flex-shrink-0 px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                    categorySlug === subCat.slug
                      ? 'text-primary bg-white border-b-2 border-primary'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {subCat.icon && <span className="mr-1">{subCat.icon}</span>}
                  {subCat.name}
                </Link>
              ))}
            </div>
          )
        })()}
      </div>

      {/* 검색 및 글쓰기 */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="검색어를 입력하세요"
              className="w-full pl-10 pr-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base"
            />
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 md:px-6 py-2.5 md:py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm md:text-base font-medium"
          >
            검색
          </button>
        </div>
        <button
          onClick={handleWriteClick}
          className="flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors text-sm md:text-base font-medium"
        >
          <FiEdit className="w-4 h-4 md:w-5 md:h-5" />
          글쓰기
        </button>
      </div>

      {/* 총 게시글 수 */}
      {totalElements > 0 && (
        <div className="text-sm text-gray-500">
          총 <span className="font-medium text-gray-900">{totalElements.toLocaleString()}</span>개의 게시글
        </div>
      )}

      {/* 게시글 목록 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 md:py-20">
            <div className="inline-block animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-4 border-gray-300 border-t-primary"></div>
            <p className="mt-4 text-gray-600 text-sm md:text-base">로딩 중...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 md:py-20">
            <div className="mb-4 text-5xl md:text-6xl">📭</div>
            <p className="text-gray-500 text-base md:text-lg font-medium">게시글이 없습니다</p>
            <p className="text-gray-400 text-sm mt-2">첫 번째 글을 작성해보세요!</p>
            <button
              onClick={handleWriteClick}
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <FiEdit className="w-5 h-5" />
              글쓰기
            </button>
          </div>
        ) : (
          <>
            {/* 게시글 리스트 */}
            <div className="divide-y divide-gray-100">
              {posts.map((post) => (
                <Link
                  key={post.uuid}
                  href={`/community/posts/${post.uuid}`}
                  className="block p-4 md:p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3 md:gap-4">
                    {/* 메인 컨텐츠 */}
                    <div className="flex-1 min-w-0">
                      {/* 상단 배지 */}
                      <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                        {post.isPinned && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded">
                            고정
                          </span>
                        )}
                        {post.isNotice && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-primary-100 text-primary text-xs font-bold rounded">
                            공지
                          </span>
                        )}
                        <span className="text-xs md:text-sm text-gray-500">
                          [{post.categoryName}]
                        </span>
                      </div>

                      {/* 제목 */}
                      <h3 className={`text-base md:text-lg font-medium mb-2 line-clamp-2 ${
                        post.isHiddenByAdmin ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {post.title}
                        {post.commentCount > 0 && (
                          <span className="text-primary font-bold ml-1.5">
                            [{post.commentCount}]
                          </span>
                        )}
                        {post.hasAttachments && (
                          <FiPaperclip className="inline-block ml-1.5 w-4 h-4 text-gray-400" />
                        )}
                      </h3>

                      {/* 메타 정보 */}
                      <div className="flex flex-wrap items-center gap-x-3 md:gap-x-4 gap-y-1 text-xs md:text-sm text-gray-500">
                        <span className="font-medium text-gray-700">
                          {post.authorName}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiClock className="w-3.5 h-3.5" />
                          {formatDate(post.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiEye className="w-3.5 h-3.5" />
                          {post.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiThumbsUp className="w-3.5 h-3.5" />
                          {post.likeCount}
                        </span>
                        {post.dislikeCount > 0 && (
                          <span className="flex items-center gap-1">
                            <FiThumbsDown className="w-3.5 h-3.5" />
                            {post.dislikeCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 0 && (
              <div className="flex justify-center items-center gap-1 md:gap-2 py-6 px-4 border-t border-gray-100">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                >
                  이전
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i
                    } else if (currentPage < 3) {
                      pageNum = i
                    } else if (currentPage > totalPages - 3) {
                      pageNum = totalPages - 5 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 md:w-10 md:h-10 rounded-lg transition-colors text-sm ${
                          currentPage === pageNum
                            ? 'bg-primary text-white'
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
                  className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
