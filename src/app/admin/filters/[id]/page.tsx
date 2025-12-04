'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft } from 'react-icons/fi'
import {
  getFilterCategory,
  getFilterOptions,
  createFilterOption,
  updateFilterOption,
  deleteFilterOption,
  updateFilterOptionActive,
} from '@/lib/api/filter'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'
import type { FilterCategory, FilterOption, FilterOptionCreateRequest, FilterOptionUpdateRequest } from '@/types/filter'

export default function AdminFilterOptionsPage() {
  const params = useParams()
  const router = useRouter()
  const categoryId = parseInt(params.id as string)

  const [category, setCategory] = useState<FilterCategory | null>(null)
  const [options, setOptions] = useState<FilterOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedOption, setSelectedOption] = useState<FilterOption | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 폼 데이터
  const [formData, setFormData] = useState<FilterOptionCreateRequest>({
    code: '',
    name: '',
    shortName: '',
    description: '',
    parentId: undefined,
    displayOrder: 0,
    icon: '',
    color: '',
    isDefault: false,
  })

  const fetchCategory = async () => {
    try {
      const data = await getFilterCategory(categoryId)
      setCategory(data)
    } catch (error) {
      showErrorToast(error, '카테고리를 불러오는데 실패했습니다.')
      router.push('/admin/filters')
    }
  }

  const fetchOptions = async () => {
    if (!category) return
    setIsLoading(true)
    try {
      const data = await getFilterOptions({
        categoryId: category.id,
        page: 0,
        size: 200,
      })
      setOptions(data.content)
    } catch (error) {
      showErrorToast(error, '필터 옵션 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategory()
  }, [categoryId])

  useEffect(() => {
    if (category) {
      fetchOptions()
    }
  }, [category])

  const handleCreate = async () => {
    if (!category) return
    if (!formData.code || !formData.name) {
      showErrorToast(null, '코드와 이름은 필수 입력 항목입니다.')
      return
    }

    const createData: any = {
      categoryId: category.id,
      code: formData.code,
      name: formData.name,
      shortName: formData.shortName || undefined,
      description: formData.description || undefined,
      displayOrder: formData.displayOrder,
      icon: formData.icon || undefined,
      color: formData.color || undefined,
      isDefault: formData.isDefault,
    }

    // parentId는 숫자이므로 별도 처리
    if (formData.parentId !== undefined && formData.parentId !== null) {
      createData.parentId = formData.parentId
    }

    // undefined 및 빈 문자열 제거
    Object.keys(createData).forEach(key => {
      const value = createData[key]
      if (value === undefined || value === '') {
        delete createData[key]
      }
    })

    setIsSubmitting(true)
    try {
      await createFilterOption(createData)
      showSuccessToast('옵션이 생성되었습니다.')
      setShowCreateModal(false)
      resetForm()
      fetchOptions()
    } catch (error) {
      showErrorToast(error, '옵션 생성에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedOption) return

    const updateData: FilterOptionUpdateRequest = {
      name: formData.name,
      shortName: formData.shortName || undefined,
      description: formData.description || undefined,
      displayOrder: formData.displayOrder,
      icon: formData.icon || undefined,
      color: formData.color || undefined,
    }

    // undefined 및 빈 문자열 제거
    Object.keys(updateData).forEach(key => {
      const value = updateData[key as keyof FilterOptionUpdateRequest]
      if (value === undefined || value === '') {
        delete updateData[key as keyof FilterOptionUpdateRequest]
      }
    })

    setIsSubmitting(true)
    try {
      await updateFilterOption(selectedOption.id, updateData)
      showSuccessToast('옵션이 수정되었습니다.')
      setShowEditModal(false)
      setSelectedOption(null)
      resetForm()
      fetchOptions()
    } catch (error) {
      showErrorToast(error, '옵션 수정에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (option: FilterOption) => {
    if (!confirm(`정말로 "${option.name}" 옵션을 삭제하시겠습니까?`)) return

    try {
      await deleteFilterOption(option.id)
      showSuccessToast('옵션이 삭제되었습니다.')
      fetchOptions()
    } catch (error) {
      showErrorToast(error, '옵션 삭제에 실패했습니다.')
    }
  }

  const handleToggleActive = async (option: FilterOption) => {
    try {
      await updateFilterOptionActive(option.id, !option.isActive)
      showSuccessToast(`옵션이 ${!option.isActive ? '활성화' : '비활성화'}되었습니다.`)
      fetchOptions()
    } catch (error) {
      showErrorToast(error, '옵션 상태 변경에 실패했습니다.')
    }
  }

  const openCreateModal = (parentOption?: FilterOption) => {
    const parentId = parentOption?.id
    setFormData({
      code: '',
      name: '',
      shortName: '',
      description: '',
      parentId: parentId,
      displayOrder: 0,
      icon: '',
      color: '',
      isDefault: false,
    })
    setShowCreateModal(true)
  }

  const openEditModal = (option: FilterOption) => {
    setSelectedOption(option)
    setFormData({
      code: option.code,
      name: option.name,
      shortName: option.shortName || '',
      description: option.description || '',
      parentId: option.parentId,
      displayOrder: option.displayOrder,
      icon: option.icon || '',
      color: option.color || '',
      isDefault: option.isDefault,
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      shortName: '',
      description: '',
      parentId: undefined,
      displayOrder: 0,
      icon: '',
      color: '',
      isDefault: false,
    })
  }

  // 계층 구조로 옵션 정렬 (부모-자식 순서 유지)
  const sortedOptions = useMemo(() => {
    const buildHierarchy = (parentId: number | null = null): FilterOption[] => {
      return options
        .filter(opt => opt.parentId === parentId)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .flatMap(opt => [opt, ...buildHierarchy(opt.id)])
    }
    return buildHierarchy()
  }, [options])

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-64px-200px)]">
        <Link
          href="/admin/filters"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <FiArrowLeft />
          카테고리 목록으로
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {category?.name || '필터 옵션 관리'}
            </h1>
            {category && (
              <p className="text-sm text-gray-500 mt-1">
                코드: {category.code} · 타입: {category.filterType}
              </p>
            )}
          </div>
          <button
            onClick={() => openCreateModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 옵션 추가
          </button>
        </div>

        {/* 목록 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : options.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">옵션이 없습니다.</p>
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
                    깊이
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    색상
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용 횟수
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
                {sortedOptions.map((option) => (
                  <tr key={option.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className="flex items-center gap-2"
                        style={{ paddingLeft: `${option.depth * 20}px` }}
                      >
                        {option.depth > 0 && <span className="text-gray-400">└</span>}
                        {option.icon && <span className="text-gray-400">{option.icon}</span>}
                        <span className="font-medium text-gray-900">{option.name}</span>
                        {option.shortName && option.shortName !== option.name && (
                          <span className="text-xs text-gray-500">({option.shortName})</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {option.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {option.depth}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {option.color && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: option.color }}
                          />
                          <span className="text-xs text-gray-500">{option.color}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {option.usageCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(option)}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          option.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {option.isActive ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {option.displayOrder}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => openCreateModal(option)}
                        className="text-green-600 hover:text-green-900"
                        title="자식 옵션 추가"
                      >
                        + 자식
                      </button>
                      <button
                        onClick={() => openEditModal(option)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(option)}
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
              <h3 className="text-lg font-semibold mb-4">
                필터 옵션 생성
                {formData.parentId && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    (부모: {options.find(o => o.id === formData.parentId)?.name})
                  </span>
                )}
              </h3>

              <div className="space-y-4">
                {formData.parentId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>부모 옵션:</strong> {options.find(o => o.id === formData.parentId)?.name}
                      <br />
                      이 옵션의 자식 옵션으로 생성됩니다.
                    </p>
                  </div>
                )}
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
                      placeholder="예: seoul"
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
                      placeholder="예: 서울"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">짧은 이름</label>
                    <input
                      type="text"
                      value={formData.shortName}
                      onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: 서울"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">색상</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.color || '#3B82F6'}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="예: #3B82F6 또는 bg-blue-600"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="옵션 설명"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      아이콘
                      <a
                        href="https://react-icons.github.io/react-icons/search?q=io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-xs text-blue-600 hover:underline"
                      >
                        아이콘 찾기 →
                      </a>
                    </label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: IoBrush, IoMegaphone, IoHome 등"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      react-icons의 Ionicons5 아이콘 이름 입력 (예: IoBrush, IoHome, IoStar)
                    </p>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">기본값으로 설정</span>
                  </label>
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
        {showEditModal && selectedOption && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">필터 옵션 수정</h3>

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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">짧은 이름</label>
                    <input
                      type="text"
                      value={formData.shortName}
                      onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">색상</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.color || '#3B82F6'}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="예: #3B82F6 또는 bg-blue-600"
                      />
                    </div>
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

                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      아이콘
                      <a
                        href="https://react-icons.github.io/react-icons/search?q=io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-xs text-blue-600 hover:underline"
                      >
                        아이콘 찾기 →
                      </a>
                    </label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: IoBrush, IoMegaphone, IoHome 등"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      react-icons의 Ionicons5 아이콘 이름 입력 (예: IoBrush, IoHome, IoStar)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedOption(null)
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
