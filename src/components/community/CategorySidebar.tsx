'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiChevronDown, FiChevronRight, FiHome } from 'react-icons/fi'
import { useCategoryTree } from '@/hooks/useCommunityCategory'
import type { CommunityCategory } from '@/lib/api/community'

interface CategoryItemProps {
  category: CommunityCategory
  level?: number
  currentSlug?: string
}

function CategoryItem({ category, level = 0, currentSlug }: CategoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = category.children && category.children.length > 0
  const isActive = currentSlug === category.slug

  // 현재 카테고리 또는 하위 카테고리가 선택되어 있는지 확인
  const isActiveOrHasActiveChild = (cat: CommunityCategory): boolean => {
    if (cat.slug === currentSlug) return true
    if (cat.children) {
      return cat.children.some(isActiveOrHasActiveChild)
    }
    return false
  }

  const hasActiveChild = category.children?.some(isActiveOrHasActiveChild) || false

  return (
    <div>
      <div
        className={`
          flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all duration-200
          ${isActive
            ? 'bg-primary text-white font-medium shadow-sm'
            : hasActiveChild
              ? 'bg-primary-50 text-primary'
              : 'text-gray-700 hover:bg-gray-100'
          }
        `}
        style={{ paddingLeft: `${12 + level * 12}px` }}
      >
        {/* 확장/축소 버튼 */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className={`p-0.5 rounded transition-colors ${
              isActive ? 'hover:bg-white/20' : 'hover:bg-gray-200'
            }`}
          >
            {isExpanded ? (
              <FiChevronDown className="w-4 h-4" />
            ) : (
              <FiChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* 링크 */}
        <Link
          href={`/community/${category.slug}`}
          className="flex-1 flex items-center gap-2 min-w-0"
        >
          {category.icon && (
            <span className="flex-shrink-0">{category.icon}</span>
          )}
          <span className="truncate">{category.name}</span>
          {level === 0 && category.children && category.children.length > 0 && (
            <span className={`text-xs ml-auto flex-shrink-0 ${
              isActive ? 'text-white/70' : 'text-gray-400'
            }`}>
              {category.children.length}
            </span>
          )}
        </Link>
      </div>

      {/* 자식 카테고리 */}
      {hasChildren && isExpanded && (
        <div className="mt-0.5">
          {category.children!.map((child) => (
            <CategoryItem
              key={child.uuid}
              category={child}
              level={level + 1}
              currentSlug={currentSlug}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface CategorySidebarProps {
  className?: string
}

export default function CategorySidebar({ className = '' }: CategorySidebarProps) {
  const pathname = usePathname()
  const { data: categories, isLoading, error } = useCategoryTree()

  // 현재 경로에서 카테고리 슬러그 추출
  const currentSlug = pathname.replace('/community/', '').split('/')[0] || ''

  if (isLoading) {
    return (
      <nav className={`w-64 p-4 ${className}`}>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </nav>
    )
  }

  if (error) {
    return (
      <nav className={`w-64 p-4 ${className}`}>
        <div className="text-sm text-red-500 p-3 bg-red-50 rounded-lg">
          카테고리를 불러오는데 실패했습니다.
        </div>
      </nav>
    )
  }

  return (
    <nav className={`w-64 ${className}`}>
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FiHome className="w-5 h-5" />
          커뮤니티
        </h2>

        {/* 전체 보기 */}
        <Link
          href="/community"
          className={`
            flex items-center gap-2 py-2 px-3 rounded-lg transition-all duration-200 mb-2
            ${pathname === '/community'
              ? 'bg-primary text-white font-medium shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
            }
          `}
        >
          <span className="w-5" />
          <span>전체 게시글</span>
        </Link>

        {/* 카테고리 목록 */}
        <div className="space-y-0.5">
          {categories?.map((category) => (
            <CategoryItem
              key={category.uuid}
              category={category}
              currentSlug={currentSlug}
            />
          ))}
        </div>

        {/* 카테고리가 없는 경우 */}
        {(!categories || categories.length === 0) && (
          <div className="text-center py-8 text-gray-500 text-sm">
            등록된 카테고리가 없습니다.
          </div>
        )}
      </div>
    </nav>
  )
}
