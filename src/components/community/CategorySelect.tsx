'use client'

import { useState, useRef, useEffect } from 'react'
import { FiChevronDown, FiCheck } from 'react-icons/fi'
import { useCategoryTree, flattenCategories } from '@/hooks/useCommunityCategory'
import type { CommunityCategory } from '@/lib/api/community'

interface CategorySelectProps {
  value?: string // 선택된 카테고리 UUID
  onChange: (category: CommunityCategory) => void
  placeholder?: string
  error?: string
  disabled?: boolean
}

export default function CategorySelect({
  value,
  onChange,
  placeholder = '카테고리를 선택하세요',
  error,
  disabled = false,
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data: categories, isLoading } = useCategoryTree()

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 키보드 이벤트 처리
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const flatCategoryList = categories ? flattenCategories(categories) : []
  const selectedCategory = flatCategoryList.find((c) => c.uuid === value)

  const handleSelect = (category: CommunityCategory & { level: number }) => {
    onChange(category)
    setIsOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      {/* 선택 버튼 */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className={`
          w-full flex items-center justify-between
          px-4 py-2.5 border rounded-lg text-left
          transition-all duration-200
          ${disabled || isLoading
            ? 'bg-gray-100 cursor-not-allowed opacity-60'
            : 'bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
          }
          ${error ? 'border-red-500' : 'border-gray-300'}
        `}
      >
        <span className={`flex items-center gap-2 truncate ${selectedCategory ? 'text-gray-900' : 'text-gray-500'}`}>
          {isLoading ? (
            '로딩 중...'
          ) : selectedCategory ? (
            <>
              {selectedCategory.icon && <span>{selectedCategory.icon}</span>}
              {selectedCategory.level > 0 && (
                <span className="text-gray-400 text-sm">{'└'.repeat(1)}</span>
              )}
              <span>{selectedCategory.name}</span>
            </>
          ) : (
            placeholder
          )}
        </span>
        <FiChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* 에러 메시지 */}
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}

      {/* 드롭다운 메뉴 */}
      {isOpen && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {flatCategoryList.length === 0 ? (
            <div className="py-4 text-center text-gray-500 text-sm">
              등록된 카테고리가 없습니다.
            </div>
          ) : (
            flatCategoryList.map((category) => {
              // 하위 카테고리가 있으면 선택 불가
              const hasChildren = !!(category.children && category.children.length > 0)

              return (
                <button
                  key={category.uuid}
                  type="button"
                  onClick={() => !hasChildren && handleSelect(category)}
                  disabled={hasChildren}
                  className={`
                    w-full flex items-center px-4 py-2.5 text-left
                    transition-colors duration-150
                    ${hasChildren
                      ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                      : value === category.uuid
                        ? 'bg-primary-50 text-primary'
                        : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                  style={{ paddingLeft: `${16 + category.level * 16}px` }}
                >
                  {/* 깊이 표시 */}
                  {category.level > 0 && (
                    <span className="text-gray-400 mr-2 flex-shrink-0">└</span>
                  )}

                  {/* 아이콘 */}
                  {category.icon && (
                    <span className="mr-2 flex-shrink-0">{category.icon}</span>
                  )}

                  {/* 이름 */}
                  <span className="flex-1 truncate">{category.name}</span>

                  {/* 하위 카테고리가 있으면 표시 */}
                  {hasChildren && (
                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">하위 선택</span>
                  )}

                  {/* 설정 표시 */}
                  {!hasChildren && category.allowAnonymous && (
                    <span className="text-xs text-purple-500 ml-2 flex-shrink-0">익명</span>
                  )}

                  {/* 선택됨 표시 */}
                  {value === category.uuid && (
                    <FiCheck className="w-4 h-4 text-primary ml-2 flex-shrink-0" />
                  )}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
