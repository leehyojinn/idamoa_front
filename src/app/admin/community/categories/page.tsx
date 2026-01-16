'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiChevronRight,
  FiChevronDown,
  FiRefreshCw,
} from 'react-icons/fi'
import {
  useAdminCategoryTree,
  useDeleteCategory,
} from '@/hooks/useCommunityCategory'
import { type AdminCommunityCategory } from '@/lib/api/admin-community'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'
import CategoryFormModal from '@/components/admin/community/CategoryFormModal'

export default function AdminCommunityCategoriesPage() {
  const { data: categories, isLoading, refetch, error } = useAdminCategoryTree()
  const deleteCategory = useDeleteCategory()

  const [editingCategory, setEditingCategory] = useState<AdminCommunityCategory | null>(null)
  const [parentForNew, setParentForNew] = useState<AdminCommunityCategory | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // 초기에 모든 카테고리 확장
  useEffect(() => {
    if (categories) {
      const allIds = new Set<string>()
      const collectIds = (cats: AdminCommunityCategory[]) => {
        for (const cat of cats) {
          if (cat.children && cat.children.length > 0) {
            allIds.add(cat.uuid)
            collectIds(cat.children)
          }
        }
      }
      collectIds(categories)
      setExpandedIds(allIds)
    }
  }, [categories])

  const toggleExpand = (uuid: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(uuid)) {
      newExpanded.delete(uuid)
    } else {
      newExpanded.add(uuid)
    }
    setExpandedIds(newExpanded)
  }

  const handleCreate = (parent?: AdminCommunityCategory) => {
    setEditingCategory(null)
    setParentForNew(parent || null)
    setIsModalOpen(true)
  }

  const handleEdit = (category: AdminCommunityCategory) => {
    setEditingCategory(category)
    setParentForNew(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (category: AdminCommunityCategory) => {
    const hasChildren = !!(category.children && category.children.length > 0)
    if (hasChildren) {
      showErrorToast(null, '하위 카테고리가 있어 삭제할 수 없습니다. 먼저 하위 카테고리를 삭제하거나 이동해주세요.')
      return
    }

    if (!confirm(`정말로 "${category.name}" 카테고리를 삭제하시겠습니까?`)) return

    try {
      await deleteCategory.mutateAsync(category.uuid)
      showSuccessToast('카테고리가 삭제되었습니다.')
    } catch (error: any) {
      showErrorToast(error, '카테고리 삭제에 실패했습니다.')
    }
  }

  const handleModalSuccess = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
    setParentForNew(null)
    refetch()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const renderCategory = (category: AdminCommunityCategory, level = 0) => {
    const hasChildren = !!(category.children && category.children.length > 0)
    const isExpanded = expandedIds.has(category.uuid)

    return (
      <div key={category.uuid}>
        <div
          className={`flex items-center gap-3 py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
            !category.isActive ? 'bg-gray-50/50' : ''
          }`}
          style={{ paddingLeft: `${16 + level * 24}px` }}
        >
          {/* 확장/축소 버튼 */}
          <button
            onClick={() => toggleExpand(category.uuid)}
            className={`w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 transition-colors ${
              !hasChildren ? 'invisible' : ''
            }`}
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? (
                <FiChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <FiChevronRight className="w-4 h-4 text-gray-500" />
              )
            ) : null}
          </button>

          {/* 아이콘 */}
          <span className="w-8 text-center text-lg">
            {category.icon || '📁'}
          </span>

          {/* 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-medium ${!category.isActive ? 'text-gray-400' : 'text-gray-900'}`}>
                {category.name}
              </span>
              <span className="text-xs text-gray-400">/{category.slug}</span>
              {!category.isActive && (
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                  비활성
                </span>
              )}
              {category.depth > 0 && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                  하위 Lv.{category.depth}
                </span>
              )}
            </div>
            {category.description && (
              <p className="text-sm text-gray-500 truncate mt-0.5">
                {category.description}
              </p>
            )}
          </div>

          {/* 설정 태그 */}
          <div className="hidden lg:flex flex-wrap gap-1 w-48">
            {category.allowAnonymous && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                익명
              </span>
            )}
            {category.requireLogin && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                로그인
              </span>
            )}
            {category.allowAttachments && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                첨부({category.maxAttachments})
              </span>
            )}
          </div>

          {/* 순서 */}
          <span className="hidden md:block text-xs text-gray-400 w-16 text-center">
            순서: {category.displayOrder}
          </span>

          {/* 생성일 */}
          <span className="hidden md:block text-xs text-gray-400 w-24">
            {formatDate(category.createdAt)}
          </span>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleCreate(category)}
              className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
              title="하위 카테고리 추가"
            >
              <FiPlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleEdit(category)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="수정"
            >
              <FiEdit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(category)}
              className={`p-2 rounded transition-colors ${
                hasChildren
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-red-600 hover:bg-red-50'
              }`}
              title={hasChildren ? '하위 카테고리가 있어 삭제할 수 없습니다' : '삭제'}
              disabled={hasChildren}
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 자식 카테고리 */}
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-64px-200px)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">커뮤니티 카테고리 관리</h1>
            <p className="text-sm text-gray-500 mt-1">계층 구조로 카테고리를 관리합니다</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
              새로고침
            </button>
            <button
              onClick={() => handleCreate()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              최상위 카테고리 추가
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-lg border border-red-200">
            <p className="text-red-500">카테고리를 불러오는데 실패했습니다.</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        ) : !categories || categories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <div className="text-5xl mb-4">📂</div>
            <p className="text-gray-500">등록된 카테고리가 없습니다.</p>
            <button
              onClick={() => handleCreate()}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              첫 카테고리 만들기
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center gap-3 py-3 px-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
              <span className="w-6" />
              <span className="w-8 text-center">아이콘</span>
              <span className="flex-1">카테고리명 / 슬러그</span>
              <span className="hidden lg:block w-48">설정</span>
              <span className="hidden md:block w-16 text-center">순서</span>
              <span className="hidden md:block w-24">생성일</span>
              <span className="w-28 text-center">액션</span>
            </div>

            {/* 카테고리 목록 */}
            {categories.map((category) => renderCategory(category))}
          </div>
        )}

        {/* 안내 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
          <p className="font-medium mb-2">사용 안내</p>
          <ul className="list-disc list-inside space-y-1 text-blue-600">
            <li><FiPlus className="inline w-3 h-3" /> 버튼으로 하위 카테고리를 추가할 수 있습니다.</li>
            <li>하위 카테고리가 있는 경우 삭제할 수 없습니다. 먼저 하위 카테고리를 삭제하거나 이동해주세요.</li>
            <li>비활성 카테고리는 사용자에게 표시되지 않습니다.</li>
          </ul>
        </div>
      </div>
      <Footer />

      {/* 생성/수정 모달 */}
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingCategory(null)
          setParentForNew(null)
        }}
        category={editingCategory}
        parentCategory={parentForNew}
        onSuccess={handleModalSuccess}
      />
    </AdminGuard>
  )
}
