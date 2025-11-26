'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getFilterCategories,
  createFilterCategory,
  updateFilterCategory,
  deleteFilterCategory,
  updateFilterCategoryActive,
} from '@/lib/api/filter'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'
import type { FilterCategory, FilterCategoryCreateRequest, FilterCategoryUpdateRequest, EntityType, FilterType } from '@/types/filter'

const ENTITY_TYPE_LABELS = {
  COMPANY: '업체',
  HOSPITAL: '병원',
  SERVICE: '서비스',
}

const FILTER_TYPE_LABELS = {
  SINGLE_SELECT: '단일 선택',
  MULTI_SELECT: '다중 선택',
  HIERARCHICAL: '계층 구조',
}

export default function AdminFiltersPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<FilterCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<{ entityType?: string; isActive?: boolean }>({})

  // 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 폼 데이터
  const [formData, setFormData] = useState<FilterCategoryCreateRequest>({
    code: '',
    name: '',
    description: '',
    entityType: 'COMPANY',
    filterType: 'MULTI_SELECT',
    supportsHierarchy: false,
    maxDepth: 1,
    displayOrder: 0,
    icon: '',
    isRequired: false,
  })

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const data = await getFilterCategories({
        ...filter,
        page: 0,
        size: 100,
      })
      setCategories(data.content)
    } catch (error) {
      showErrorToast(error, '필터 카테고리 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [filter])

  const handleCreate = async () => {
    if (!formData.code || !formData.name) {
      showErrorToast(null, '코드와 이름은 필수 입력 항목입니다.')
      return
    }

    const createData: FilterCategoryCreateRequest = {
      code: formData.code,
      name: formData.name,
      description: formData.description || undefined,
      entityType: formData.entityType,
      filterType: formData.filterType,
      supportsHierarchy: formData.supportsHierarchy,
      maxDepth: formData.maxDepth,
      displayOrder: formData.displayOrder,
      icon: formData.icon || undefined,
      isRequired: formData.isRequired,
    }

    // undefined 및 빈 문자열 제거
    Object.keys(createData).forEach(key => {
      const value = createData[key as keyof FilterCategoryCreateRequest]
      if (value === undefined || value === '') {
        delete createData[key as keyof FilterCategoryCreateRequest]
      }
    })

    setIsSubmitting(true)
    try {
      await createFilterCategory(createData)
      showSuccessToast('카테고리가 생성되었습니다.')
      setShowCreateModal(false)
      resetForm()
      fetchCategories()
    } catch (error) {
      showErrorToast(error, '카테고리 생성에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedCategory) return

    const updateData: FilterCategoryUpdateRequest = {
      name: formData.name,
      description: formData.description || undefined,
      displayOrder: formData.displayOrder,
      icon: formData.icon || undefined,
      isRequired: formData.isRequired,
    }

    // undefined 값 제거
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof FilterCategoryUpdateRequest] === undefined) {
        delete updateData[key as keyof FilterCategoryUpdateRequest]
      }
    })

    setIsSubmitting(true)
    try {
      await updateFilterCategory(selectedCategory.id, updateData)
      showSuccessToast('카테고리가 수정되었습니다.')
      setShowEditModal(false)
      setSelectedCategory(null)
      resetForm()
      fetchCategories()
    } catch (error) {
      showErrorToast(error, '카테고리 수정에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (category: FilterCategory) => {
    if (!confirm(`정말로 "${category.name}" 카테고리를 삭제하시겠습니까?`)) return

    try {
      await deleteFilterCategory(category.id)
      showSuccessToast('카테고리가 삭제되었습니다.')
      fetchCategories()
    } catch (error) {
      showErrorToast(error, '카테고리 삭제에 실패했습니다.')
    }
  }

  const handleToggleActive = async (category: FilterCategory) => {
    try {
      await updateFilterCategoryActive(category.id, !category.isActive)
      showSuccessToast(`카테고리가 ${!category.isActive ? '활성화' : '비활성화'}되었습니다.`)
      fetchCategories()
    } catch (error) {
      showErrorToast(error, '카테고리 상태 변경에 실패했습니다.')
    }
  }

  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const openEditModal = (category: FilterCategory) => {
    setSelectedCategory(category)
    setFormData({
      code: category.code,
      name: category.name,
      description: category.description || '',
      entityType: category.entityType,
      filterType: category.filterType,
      supportsHierarchy: category.supportsHierarchy,
      maxDepth: category.maxDepth,
      displayOrder: category.displayOrder,
      icon: category.icon || '',
      isRequired: category.isRequired,
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      entityType: 'COMPANY',
      filterType: 'MULTI_SELECT',
      supportsHierarchy: false,
      maxDepth: 1,
      displayOrder: 0,
      icon: '',
      isRequired: false,
    })
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-64px-200px)]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">필터 카테고리 관리</h1>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 카테고리 추가
          </button>
        </div>

        {/* 필터 */}
        <div className="flex gap-4 mb-6">
          <select
            value={filter.entityType || ''}
            onChange={(e) => setFilter({ ...filter, entityType: e.target.value || undefined })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">전체 엔티티</option>
            <option value="COMPANY">업체</option>
            <option value="HOSPITAL">병원</option>
            <option value="SERVICE">서비스</option>
          </select>

          <select
            value={filter.isActive === undefined ? '' : String(filter.isActive)}
            onChange={(e) =>
              setFilter({
                ...filter,
                isActive: e.target.value === '' ? undefined : e.target.value === 'true',
              })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">전체 상태</option>
            <option value="true">활성화</option>
            <option value="false">비활성화</option>
          </select>
        </div>

        {/* 목록 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">카테고리가 없습니다.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    코드
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    타입
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    엔티티
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    필수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    순서
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {category.icon && <span className="text-gray-400">{category.icon}</span>}
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                        {FILTER_TYPE_LABELS[category.filterType]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {ENTITY_TYPE_LABELS[category.entityType]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {category.isRequired ? (
                        <span className="text-red-600 font-medium">필수</span>
                      ) : (
                        <span className="text-gray-400">선택</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(category)}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          category.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {category.isActive ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.displayOrder}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <Link
                        href={`/admin/filters/${category.id}`}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        옵션
                      </Link>
                      <button
                        onClick={() => openEditModal(category)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="text-red-600 hover:text-red-900"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 생성 모달 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">필터 카테고리 생성</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      코드 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: specialty"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: 전문 영역"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="카테고리 설명"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      엔티티 타입 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.entityType}
                      onChange={(e) => setFormData({ ...formData, entityType: e.target.value as EntityType })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="COMPANY">업체</option>
                      <option value="HOSPITAL">병원</option>
                      <option value="SERVICE">서비스</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      필터 타입 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.filterType}
                      onChange={(e) => setFormData({ ...formData, filterType: e.target.value as FilterType })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="SINGLE_SELECT">단일 선택</option>
                      <option value="MULTI_SELECT">다중 선택</option>
                      <option value="HIERARCHICAL">계층 구조</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">표시 순서</label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">아이콘</label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: work"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isRequired}
                        onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">필수 항목</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? '생성 중...' : '생성'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 수정 모달 */}
        {showEditModal && selectedCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">필터 카테고리 수정</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">코드 (수정 불가)</label>
                    <input
                      type="text"
                      value={formData.code}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">표시 순서</label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">아이콘</label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isRequired}
                        onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">필수 항목</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedCategory(null)
                    resetForm()
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handleEdit}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? '수정 중...' : '수정'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </AdminGuard>
  )
}
