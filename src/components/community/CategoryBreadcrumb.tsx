'use client'

import Link from 'next/link'
import { FiChevronRight, FiHome } from 'react-icons/fi'
import { useCategory, useCategoryBySlug } from '@/hooks/useCommunityCategory'

interface CategoryBreadcrumbProps {
  categoryUuid?: string
  categorySlug?: string
  className?: string
}

interface BreadcrumbItem {
  name: string
  slug: string
}

export default function CategoryBreadcrumb({
  categoryUuid,
  categorySlug,
  className = '',
}: CategoryBreadcrumbProps) {
  // UUID로 조회하거나 슬러그로 조회
  const { data: categoryByUuid, isLoading: isLoadingByUuid } = useCategory(categoryUuid || '')
  const { data: categoryBySlug, isLoading: isLoadingBySlug } = useCategoryBySlug(categorySlug || '')

  const category = categoryByUuid || categoryBySlug
  const isLoading = (categoryUuid && isLoadingByUuid) || (categorySlug && isLoadingBySlug)

  if (!categoryUuid && !categorySlug) {
    return null
  }

  if (isLoading) {
    return (
      <nav className={`flex items-center gap-2 text-sm ${className}`}>
        <div className="flex items-center gap-2 animate-pulse">
          <div className="w-4 h-4 bg-gray-200 rounded" />
          <FiChevronRight className="w-4 h-4 text-gray-300" />
          <div className="w-20 h-4 bg-gray-200 rounded" />
        </div>
      </nav>
    )
  }

  if (!category) {
    return null
  }

  // 상위 경로 구성
  const breadcrumbs: BreadcrumbItem[] = []

  // 부모 카테고리가 있으면 추가 (API에서 parent 정보 제공)
  if (category.parent) {
    breadcrumbs.push({
      name: category.parent.name,
      slug: category.parent.slug,
    })
  }

  // 현재 카테고리
  breadcrumbs.push({
    name: category.name,
    slug: category.slug,
  })

  return (
    <nav className={`flex items-center gap-2 text-sm flex-wrap ${className}`}>
      <Link
        href="/community"
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <FiHome className="w-4 h-4" />
        <span className="hidden sm:inline">커뮤니티</span>
      </Link>

      {breadcrumbs.map((item, index) => (
        <div key={item.slug} className="flex items-center gap-2">
          <FiChevronRight className="w-4 h-4 text-gray-400" />
          {index === breadcrumbs.length - 1 ? (
            // 현재 페이지 (링크 없음)
            <span className="font-medium text-gray-900">{item.name}</span>
          ) : (
            // 상위 카테고리 (링크 있음)
            <Link
              href={`/community/${item.slug}`}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {item.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}

// 게시글 상세 페이지용 Breadcrumb (카테고리 + 게시글 제목)
interface PostBreadcrumbProps {
  categoryName: string
  categorySlug: string
  postTitle?: string
  className?: string
}

export function PostBreadcrumb({
  categoryName,
  categorySlug,
  postTitle,
  className = '',
}: PostBreadcrumbProps) {
  return (
    <nav className={`flex items-center gap-2 text-sm flex-wrap ${className}`}>
      <Link
        href="/community"
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <FiHome className="w-4 h-4" />
        <span className="hidden sm:inline">커뮤니티</span>
      </Link>

      <FiChevronRight className="w-4 h-4 text-gray-400" />

      <Link
        href={`/community/${categorySlug}`}
        className="text-gray-500 hover:text-gray-700 transition-colors"
      >
        {categoryName}
      </Link>

      {postTitle && (
        <>
          <FiChevronRight className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-none">
            {postTitle}
          </span>
        </>
      )}
    </nav>
  )
}
