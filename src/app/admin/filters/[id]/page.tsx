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
  getAllFilterOptionsForMigration,
  previewFilterMigration,
  executeFilterMigration,
  type MigrationFilterOption,
  type MigrationPreviewResponse,
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

  // 마이그레이션 상태
  const [allOptions, setAllOptions] = useState<MigrationFilterOption[]>([])
  const [sourceOptionId, setSourceOptionId] = useState<number | null>(null)
  const [targetOptionId, setTargetOptionId] = useState<number | null>(null)
  const [deactivateSource, setDeactivateSource] = useState(false)
  const [deleteSource, setDeleteSource] = useState(false)
  const [previewResult, setPreviewResult] = useState<MigrationPreviewResponse | null>(null)
  const [isMigrating, setIsMigrating] = useState(false)
  const [showMigrationSection, setShowMigrationSection] = useState(false)

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
    isExpanded: false,
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
      isExpanded: formData.isExpanded,
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
      isExpanded: formData.isExpanded,
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
      isExpanded: false,
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
      isExpanded: option.isExpanded || false,
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
      isExpanded: false,
    })
  }

  // 마이그레이션용 전체 옵션 로드
  const fetchAllOptions = async () => {
    try {
      const data = await getAllFilterOptionsForMigration()
      setAllOptions(data)
    } catch (error) {
      showErrorToast(error, '옵션 목록을 불러오는데 실패했습니다.')
    }
  }

  // 마이그레이션 미리보기
  const handlePreviewMigration = async () => {
    if (!sourceOptionId || !targetOptionId) {
      showErrorToast(null, '소스 옵션과 타겟 옵션을 선택해주세요.')
      return
    }

    if (sourceOptionId === targetOptionId) {
      showErrorToast(null, '소스와 타겟 옵션이 같을 수 없습니다.')
      return
    }

    try {
      const result = await previewFilterMigration({
        sourceOptionId,
        targetOptionId,
        deactivateSource,
        deleteSource,
      })
      setPreviewResult(result)
      showSuccessToast('미리보기가 완료되었습니다.')
    } catch (error) {
      showErrorToast(error, '미리보기에 실패했습니다.')
    }
  }

  // 마이그레이션 실행
  const handleExecuteMigration = async () => {
    if (!sourceOptionId || !targetOptionId) {
      showErrorToast(null, '소스 옵션과 타겟 옵션을 선택해주세요.')
      return
    }

    if (!previewResult) {
      showErrorToast(null, '먼저 미리보기를 확인해주세요.')
      return
    }

    const totalAffected = previewResult.affectedCompanyCount + previewResult.affectedBoardCount
    const confirmMessage = [
      `마이그레이션을 실행하시겠습니까?`,
      ``,
      `소스: ${previewResult.sourceOption.name} (${previewResult.sourceOption.code})`,
      `타겟: ${previewResult.targetOption.name} (${previewResult.targetOption.code})`,
      ``,
      `영향받는 업체: ${previewResult.affectedCompanyCount}개`,
      `영향받는 게시글: ${previewResult.affectedBoardCount}개`,
      `중복 건너뜀: ${previewResult.duplicateCompanyCount}개 업체, ${previewResult.duplicateBoardCount}개 게시글`,
      ``,
      deleteSource
        ? '⚠️ 소스 옵션이 삭제됩니다.'
        : deactivateSource
        ? '⚠️ 소스 옵션이 비활성화됩니다.'
        : '소스 옵션은 유지됩니다.',
      ``,
      `이 작업은 되돌릴 수 없습니다.`,
    ].join('\n')

    if (!confirm(confirmMessage)) return

    setIsMigrating(true)
    try {
      const result = await executeFilterMigration({
        sourceOptionId,
        targetOptionId,
        deactivateSource,
        deleteSource,
      })

      const successMessage = [
        `마이그레이션이 완료되었습니다!`,
        ``,
        `업체: ${result.migratedCompanyCount}개 마이그레이션, ${result.skippedCompanyCount}개 건너뜀`,
        `게시글: ${result.migratedBoardCount}개 마이그레이션, ${result.skippedBoardCount}개 건너뜀`,
        `처리 시간: ${result.processingTimeMs}ms`,
        ``,
        `소스 옵션 비활성화: ${result.sourceDeactivated ? '예' : '아니오'}`,
        `소스 옵션 삭제: ${result.sourceDeleted ? '예' : '아니오'}`,
      ].join('\n')

      alert(successMessage)

      // 상태 초기화
      setSourceOptionId(null)
      setTargetOptionId(null)
      setDeactivateSource(false)
      setDeleteSource(false)
      setPreviewResult(null)
      setShowMigrationSection(false)

      // 목록 새로고침
      fetchOptions()
    } catch (error) {
      showErrorToast(error, '마이그레이션에 실패했습니다.')
    } finally {
      setIsMigrating(false)
    }
  }

  // 마이그레이션 섹션 토글
  const toggleMigrationSection = () => {
    if (!showMigrationSection) {
      fetchAllOptions()
    }
    setShowMigrationSection(!showMigrationSection)
    setPreviewResult(null)
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

  // 현재 카테고리의 옵션만 필터링 (타겟 선택용)
  const targetOptions = useMemo(() => {
    if (!category) return []
    return allOptions.filter(opt => opt.categoryId === category.id && opt.id !== sourceOptionId)
  }, [allOptions, category, sourceOptionId])

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
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-800 transition-colors"
          >
            + 옵션 추가
          </button>
        </div>

        {/* 목록 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary"></div>
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
                        className="text-primary hover:text-primary"
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

        {/* 마이그레이션 섹션 */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">옵션 마이그레이션</h2>
            <button
              onClick={toggleMigrationSection}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {showMigrationSection ? '닫기' : '마이그레이션 열기'}
            </button>
          </div>

          {showMigrationSection && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-yellow-800 mb-2">⚠️ 주의사항</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 마이그레이션은 되돌릴 수 없습니다.</li>
                  <li>• 반드시 미리보기를 먼저 확인하세요.</li>
                  <li>• 같은 카테고리의 옵션으로만 마이그레이션할 수 있습니다.</li>
                  <li>• 소스 옵션을 사용하는 모든 데이터가 타겟 옵션으로 변경됩니다.</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    소스 옵션 (마이그레이션할 옵션) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={sourceOptionId || ''}
                    onChange={(e) => {
                      setSourceOptionId(e.target.value ? parseInt(e.target.value) : null)
                      setPreviewResult(null)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">소스 옵션 선택</option>
                    {options.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name} ({opt.code}) - 사용 {opt.usageCount}회
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    타겟 옵션 (변경될 옵션) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={targetOptionId || ''}
                    onChange={(e) => {
                      setTargetOptionId(e.target.value ? parseInt(e.target.value) : null)
                      setPreviewResult(null)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={!sourceOptionId}
                  >
                    <option value="">타겟 옵션 선택</option>
                    {targetOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name} ({opt.code}) - 사용 {opt.usageCount}회
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={deactivateSource}
                    onChange={(e) => setDeactivateSource(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">마이그레이션 후 소스 옵션 비활성화</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={deleteSource}
                    onChange={(e) => setDeleteSource(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">마이그레이션 후 소스 옵션 삭제 (Soft Delete)</span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handlePreviewMigration}
                  disabled={!sourceOptionId || !targetOptionId}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  미리보기
                </button>

                <button
                  onClick={handleExecuteMigration}
                  disabled={!previewResult || isMigrating}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isMigrating ? '마이그레이션 중...' : '마이그레이션 실행'}
                </button>
              </div>

              {/* 미리보기 결과 */}
              {previewResult && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">미리보기 결과</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">소스 옵션</h4>
                      <p className="text-gray-900 font-semibold">{previewResult.sourceOption.name}</p>
                      <p className="text-sm text-gray-600">코드: {previewResult.sourceOption.code}</p>
                      <p className="text-sm text-gray-600">사용: {previewResult.sourceOption.usageCount}회</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">타겟 옵션</h4>
                      <p className="text-gray-900 font-semibold">{previewResult.targetOption.name}</p>
                      <p className="text-sm text-gray-600">코드: {previewResult.targetOption.code}</p>
                      <p className="text-sm text-gray-600">사용: {previewResult.targetOption.usageCount}회</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">영향받는 데이터</h4>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-900">업체: {previewResult.affectedCompanyCount}개</p>
                        <p className="text-sm text-gray-900">게시글: {previewResult.affectedBoardCount}개</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">중복으로 건너뜀</h4>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">업체: {previewResult.duplicateCompanyCount}개</p>
                        <p className="text-sm text-gray-600">게시글: {previewResult.duplicateBoardCount}개</p>
                      </div>
                    </div>
                  </div>

                  {previewResult.affectedCompanySamples.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        영향받는 업체 샘플 (최대 10개)
                      </h4>
                      <div className="space-y-1">
                        {previewResult.affectedCompanySamples.map((company) => (
                          <div key={company.id} className="text-sm text-gray-900 flex items-center gap-2">
                            <span>{company.name}</span>
                            {company.hasDuplicate && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
                                중복
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                    <p className="text-sm text-primary-800">
                      <strong>예상 결과:</strong>{' '}
                      {previewResult.affectedCompanyCount - previewResult.duplicateCompanyCount}개 업체,{' '}
                      {previewResult.affectedBoardCount - previewResult.duplicateBoardCount}개 게시글이 마이그레이션됩니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

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
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                    <p className="text-sm text-primary-800">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                        placeholder="예: #3B82F6 또는 bg-primary"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      아이콘
                      <a
                        href="https://react-icons.github.io/react-icons/search?q=io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-xs text-primary hover:underline"
                      >
                        아이콘 찾기 →
                      </a>
                    </label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                      placeholder="예: IoBrush, IoMegaphone, IoHome 등"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      react-icons의 Ionicons5 아이콘 이름 입력 (예: IoBrush, IoHome, IoStar)
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">기본값으로 설정</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isExpanded}
                      onChange={(e) => setFormData({ ...formData, isExpanded: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">자식 펼침 (계층)</span>
                    <span className="text-xs text-gray-500">
                      체크하면 이 옵션의 자식이 기본으로 펼쳐져 표시됩니다
                    </span>
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
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-800 disabled:opacity-50"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                        placeholder="예: #3B82F6 또는 bg-primary"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">표시 순서</label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      아이콘
                      <a
                        href="https://react-icons.github.io/react-icons/search?q=io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-xs text-primary hover:underline"
                      >
                        아이콘 찾기 →
                      </a>
                    </label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                      placeholder="예: IoBrush, IoMegaphone, IoHome 등"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      react-icons의 Ionicons5 아이콘 이름 입력 (예: IoBrush, IoHome, IoStar)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isExpanded}
                      onChange={(e) => setFormData({ ...formData, isExpanded: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">자식 펼침 (계층)</span>
                  </label>
                  <span className="text-xs text-gray-500">
                    체크하면 이 옵션의 자식이 기본으로 펼쳐져 표시됩니다
                  </span>
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
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-800 disabled:opacity-50"
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
