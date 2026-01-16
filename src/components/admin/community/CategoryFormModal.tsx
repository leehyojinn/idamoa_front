'use client'

import { useEffect, useState } from 'react'
import { FiX } from 'react-icons/fi'
import {
  useAdminCategoryTree,
  useCreateCategory,
  useUpdateCategory,
  flattenForParentSelect,
} from '@/hooks/useCommunityCategory'
import {
  type AdminCommunityCategory,
  type AdminCommunityCategoryCreateRequest,
  type AdminCommunityCategoryUpdateRequest,
} from '@/lib/api/admin-community'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Checkbox from '@/components/ui/Checkbox'

interface CategoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  category?: AdminCommunityCategory | null // 수정할 카테고리
  parentCategory?: AdminCommunityCategory | null // 새 카테고리의 부모
  onSuccess: () => void
}

interface FormData {
  name: string
  slug: string
  description: string
  icon: string
  displayOrder: number
  isActive: boolean
  allowAnonymous: boolean
  requireLogin: boolean
  allowAttachments: boolean
  maxAttachments: number
  parentUuid: string
  changeParent: boolean
}

const initialFormData: FormData = {
  name: '',
  slug: '',
  description: '',
  icon: '',
  displayOrder: 0,
  isActive: true,
  allowAnonymous: false,
  requireLogin: true,
  allowAttachments: true,
  maxAttachments: 10,
  parentUuid: '',
  changeParent: false,
}

export default function CategoryFormModal({
  isOpen,
  onClose,
  category,
  parentCategory,
  onSuccess,
}: CategoryFormModalProps) {
  const isEdit = !!category
  const { data: allCategories } = useAdminCategoryTree()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  // 폼 초기화
  useEffect(() => {
    if (isOpen) {
      if (category) {
        // 수정 모드
        setFormData({
          name: category.name,
          slug: category.slug,
          description: category.description || '',
          icon: category.icon || '',
          displayOrder: category.displayOrder,
          isActive: category.isActive,
          allowAnonymous: category.allowAnonymous,
          requireLogin: category.requireLogin,
          allowAttachments: category.allowAttachments,
          maxAttachments: category.maxAttachments,
          parentUuid: category.parent?.uuid || '',
          changeParent: false,
        })
      } else {
        // 생성 모드
        setFormData({
          ...initialFormData,
          parentUuid: parentCategory?.uuid || '',
        })
      }
      setErrors({})
    }
  }, [isOpen, category, parentCategory])

  // 부모 선택 옵션
  const parentOptions = allCategories
    ? flattenForParentSelect(allCategories, category?.uuid)
    : []

  // 슬러그 자동 생성 (한글을 영문으로 변환)
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[가-힣]/g, (char) => {
        const code = char.charCodeAt(0) - 44032
        const jong = code % 28
        const jung = ((code - jong) / 28) % 21
        const cho = ((code - jong) / 28 - jung) / 21
        const choChar = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'][cho]
        return choChar
      })
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) || 0 : value,
    }))

    // 에러 초기화
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData((prev) => ({
      ...prev,
      name,
      // 생성 모드일 때만 슬러그 자동 생성
      slug: isEdit ? prev.slug : prev.slug || generateSlug(name),
    }))
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setFormData((prev) => ({
      ...prev,
      slug: value,
    }))
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = '카테고리명은 필수입니다'
    }

    if (!isEdit && !formData.slug.trim()) {
      newErrors.slug = '슬러그는 필수입니다'
    }

    if (!isEdit && formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = '영문 소문자, 숫자, 하이픈만 사용 가능합니다'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsSubmitting(true)
    try {
      if (isEdit) {
        // 수정
        const updateData: AdminCommunityCategoryUpdateRequest = {
          name: formData.name,
          description: formData.description || undefined,
          icon: formData.icon || undefined,
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
          allowAnonymous: formData.allowAnonymous,
          requireLogin: formData.requireLogin,
          allowAttachments: formData.allowAttachments,
          maxAttachments: formData.maxAttachments,
          changeParent: formData.changeParent,
          parentUuid: formData.changeParent ? formData.parentUuid || undefined : undefined,
        }

        await updateCategory.mutateAsync({
          uuid: category!.uuid,
          data: updateData,
        })
        showSuccessToast('카테고리가 수정되었습니다.')
      } else {
        // 생성
        const createData: AdminCommunityCategoryCreateRequest = {
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          icon: formData.icon || undefined,
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
          allowAnonymous: formData.allowAnonymous,
          requireLogin: formData.requireLogin,
          allowAttachments: formData.allowAttachments,
          maxAttachments: formData.maxAttachments,
          parentUuid: formData.parentUuid || undefined,
        }

        await createCategory.mutateAsync(createData)
        showSuccessToast('카테고리가 생성되었습니다.')
      }

      onSuccess()
    } catch (error: any) {
      showErrorToast(error, '저장에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? '카테고리 수정' : '카테고리 생성'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 부모 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상위 카테고리
            </label>
            {isEdit && (
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="changeParent"
                  name="changeParent"
                  checked={formData.changeParent}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="changeParent" className="text-sm text-gray-600">
                  상위 카테고리 변경
                </label>
              </div>
            )}
            <select
              name="parentUuid"
              value={formData.parentUuid}
              onChange={handleChange}
              disabled={isEdit && !formData.changeParent}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">최상위 카테고리</option>
              {parentOptions.map((option) => (
                <option key={option.uuid} value={option.uuid}>
                  {'─'.repeat(option.level)} {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* 카테고리명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              카테고리명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="예: 자유게시판"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* 슬러그 (생성시만) */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                슬러그 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleSlugChange}
                placeholder="예: free-board"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.slug ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-500">{errors.slug}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                URL에 사용됩니다. 영문 소문자, 숫자, 하이픈만 사용 가능
              </p>
            </div>
          )}

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              placeholder="카테고리 설명"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 아이콘 & 순서 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                아이콘 (이모지)
              </label>
              <input
                type="text"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                placeholder="예: 💬"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                정렬 순서
              </label>
              <input
                type="number"
                name="displayOrder"
                value={formData.displayOrder}
                onChange={handleChange}
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 첨부파일 설정 */}
          <div className="grid grid-cols-2 gap-4 items-end">
            <Checkbox
              checked={formData.allowAttachments}
              onChange={(checked) =>
                setFormData((prev) => ({ ...prev, allowAttachments: checked }))
              }
              label="첨부파일 허용"
            />
            {formData.allowAttachments && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  최대 첨부파일 수
                </label>
                <input
                  type="number"
                  name="maxAttachments"
                  value={formData.maxAttachments}
                  onChange={handleChange}
                  min={1}
                  max={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* 기타 설정 */}
          <div className="space-y-2 pt-2 border-t border-gray-200">
            <Checkbox
              checked={formData.isActive}
              onChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: checked }))
              }
              label="활성화"
              description="비활성화 시 사용자에게 표시되지 않음"
            />
            <Checkbox
              checked={formData.requireLogin}
              onChange={(checked) =>
                setFormData((prev) => ({ ...prev, requireLogin: checked }))
              }
              label="글 작성 시 로그인 필수"
            />
            <Checkbox
              checked={formData.allowAnonymous}
              onChange={(checked) =>
                setFormData((prev) => ({ ...prev, allowAnonymous: checked }))
              }
              label="익명 글쓰기 허용"
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? '저장 중...' : isEdit ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
