'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiEye, FiThumbsUp, FiMessageSquare, FiChevronRight, FiEdit, FiClock } from 'react-icons/fi'
import {
  getCommunityCategories,
  getCommunityPosts,
  type CommunityCategory,
  type CommunityPostListItem,
} from '@/lib/api/community'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { showErrorToast } from '@/lib/errorHandler'

interface Props {
  initialCategories?: CommunityCategory[]
}

interface CategoryWithPosts {
  category: CommunityCategory
  posts: CommunityPostListItem[]
  isLoading: boolean
}

export default function CommunityGridView({ initialCategories }: Props) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [categories, setCategories] = useState<CommunityCategory[]>(initialCategories || [])
  const [categoryPosts, setCategoryPosts] = useState<Map<string, CommunityPostListItem[]>>(new Map())
  const [loadingCategories, setLoadingCategories] = useState<Set<string>>(new Set())
  const [isInitialLoading, setIsInitialLoading] = useState(true)

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

  // 각 카테고리별 게시글 로드
  useEffect(() => {
    const topCategories = categories.filter(cat => cat.depth === 0)
    if (topCategories.length === 0) return

    const fetchAllCategoryPosts = async () => {
      setIsInitialLoading(true)
      const newLoadingSet = new Set<string>()
      topCategories.forEach(cat => newLoadingSet.add(cat.slug))
      setLoadingCategories(newLoadingSet)

      const results = await Promise.all(
        topCategories.map(async (cat) => {
          try {
            const result = await getCommunityPosts({
              categorySlug: cat.slug,
              page: 0,
              size: 5,
              sort: 'createdAt,desc',
            })
            if (result.success && result.data) {
              const data = result.data as any
              return {
                slug: cat.slug,
                posts: Array.isArray(data) ? data : (data.content || [])
              }
            }
          } catch (error) {
            console.error(`Failed to load posts for ${cat.slug}:`, error)
          }
          return { slug: cat.slug, posts: [] }
        })
      )

      const newMap = new Map<string, CommunityPostListItem[]>()
      results.forEach(({ slug, posts }) => {
        newMap.set(slug, posts)
      })
      setCategoryPosts(newMap)
      setLoadingCategories(new Set())
      setIsInitialLoading(false)
    }

    fetchAllCategoryPosts()
  }, [categories])

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
      month: 'short',
      day: 'numeric',
    })
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

  const topCategories = categories.filter(cat => cat.depth === 0)

  return (
    <div className="space-y-6">
      {/* 헤더 - 글쓰기 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={handleWriteClick}
          className="flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors text-sm md:text-base font-medium"
        >
          <FiEdit className="w-4 h-4 md:w-5 md:h-5" />
          글쓰기
        </button>
      </div>

      {/* 카테고리 그리드 */}
      {isInitialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-5 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="h-4 bg-gray-100 rounded w-full"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {topCategories.map((category) => {
            const posts = categoryPosts.get(category.slug) || []
            const isLoading = loadingCategories.has(category.slug)

            return (
              <div
                key={category.uuid}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* 카테고리 헤더 */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {category.icon && <span>{category.icon}</span>}
                    {category.name}
                  </h3>
                  <Link
                    href={`/community/${category.slug}`}
                    className="flex items-center gap-1 text-sm text-primary hover:text-primary-700 font-medium transition-colors"
                  >
                    더보기
                    <FiChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* 게시글 리스트 */}
                <div className="divide-y divide-gray-50">
                  {isLoading ? (
                    <div className="p-5 text-center text-gray-400">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-primary"></div>
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                      등록된 게시글이 없습니다
                    </div>
                  ) : (
                    posts.map((post) => (
                      <Link
                        key={post.uuid}
                        href={`/community/posts/${post.uuid}`}
                        className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            {post.isPinned && (
                              <span className="flex-shrink-0 px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded">
                                고정
                              </span>
                            )}
                            {post.isNotice && (
                              <span className="flex-shrink-0 px-1.5 py-0.5 bg-primary-100 text-primary text-[10px] font-bold rounded">
                                공지
                              </span>
                            )}
                            <h4 className="text-sm text-gray-800 group-hover:text-primary truncate transition-colors">
                              {post.title}
                            </h4>
                            {post.commentCount > 0 && (
                              <span className="flex-shrink-0 text-xs text-primary font-bold">
                                [{post.commentCount}]
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
                          <span className="hidden sm:flex items-center gap-1">
                            <FiEye className="w-3 h-3" />
                            {post.viewCount}
                          </span>
                          <span className="hidden sm:flex items-center gap-1">
                            <FiThumbsUp className="w-3 h-3" />
                            {post.likeCount}
                          </span>
                          <span className="text-gray-500">
                            {formatDate(post.createdAt)}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
