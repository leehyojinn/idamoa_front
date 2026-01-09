'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import {
  getAdminCommunityCategory,
  updateAdminCommunityCategory,
  type AdminCommunityCategoryUpdateRequest,
  type AdminCommunityCategory,
} from '@/lib/api/admin-community'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'
import Checkbox from '@/components/ui/Checkbox'

interface PageProps {
  params: Promise<{ uuid: string }>
}

export default function AdminCommunityCategoryEditPage({ params }: PageProps) {
  const { uuid } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [category, setCategory] = useState<AdminCommunityCategory | null>(null)

  const [formData, setFormData] = useState<AdminCommunityCategoryUpdateRequest>({
    name: '',
    description: '',
    icon: '',
    displayOrder: 0,
    isActive: true,
    allowAnonymous: false,
    requireLogin: true,
    allowAttachments: true,
    maxAttachments: 5,
  })

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await getAdminCommunityCategory(uuid)
        if (response.success && response.data) {
          setCategory(response.data)
          setFormData({
            name: response.data.name,
            description: response.data.description || '',
            icon: response.data.icon || '',
            displayOrder: response.data.displayOrder,
            isActive: response.data.isActive,
            allowAnonymous: response.data.allowAnonymous,
            requireLogin: response.data.requireLogin,
            allowAttachments: response.data.allowAttachments,
            maxAttachments: response.data.maxAttachments,
          })
        }
      } catch (error) {
        showErrorToast(error, '카테고리 정보를 불러오는데 실패했습니다.')
        router.push('/admin/community/categories')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategory()
  }, [uuid, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name?.trim()) {
      showErrorToast(null, '카테고리명을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await updateAdminCommunityCategory(uuid, formData)
      if (response.success) {
        showSuccessToast('카테고리가 수정되었습니다.')
        router.push('/admin/community/categories')
      }
    } catch (error) {
      showErrorToast(error, '카테고리 수정에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-3xl min-h-[calc(100vh-64px-200px)]">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </div>
        <Footer />
      </AdminGuard>
    )
  }

  if (!category) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-3xl min-h-[calc(100vh-64px-200px)]">
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">카테고리를 찾을 수 없습니다.</p>
            <Link
              href="/admin/community/categories"
              className="inline-block mt-4 text-blue-600 hover:text-blue-800"
            >
              목록으로 돌아가기
            </Link>
          </div>
        </div>
        <Footer />
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl min-h-[calc(100vh-64px-200px)]">
        <div className="mb-6">
          <Link
            href="/admin/community/categories"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            목록으로
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">카테고리 수정</h1>
            <p className="text-sm text-gray-500 mt-1">슬러그: {category.slug}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                placeholder="예: 자유게시판"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={3}
                placeholder="카테고리에 대한 설명을 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">아이콘 (이모지)</label>
                <input
                  type="text"
                  name="icon"
                  value={formData.icon || ''}
                  onChange={handleChange}
                  placeholder="예: 💬"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">표시 순서</label>
                <input
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleChange}
                  min={0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">카테고리 설정</h3>
              <div className="space-y-3">
                <Checkbox
                  checked={formData.isActive ?? true}
                  onChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
                  label="활성화"
                  description="비활성화 시 목록에 표시되지 않음"
                />

                <Checkbox
                  checked={formData.requireLogin ?? true}
                  onChange={(checked) => setFormData((prev) => ({ ...prev, requireLogin: checked }))}
                  label="글 작성 시 로그인 필수"
                />

                <Checkbox
                  checked={formData.allowAnonymous ?? false}
                  onChange={(checked) => setFormData((prev) => ({ ...prev, allowAnonymous: checked }))}
                  label="익명 글쓰기 허용"
                />

                <Checkbox
                  checked={formData.allowAttachments ?? true}
                  onChange={(checked) => setFormData((prev) => ({ ...prev, allowAttachments: checked }))}
                  label="첨부파일 허용"
                />

                {formData.allowAttachments && (
                  <div className="ml-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">최대 첨부파일 수</label>
                    <input
                      type="number"
                      name="maxAttachments"
                      value={formData.maxAttachments}
                      onChange={handleChange}
                      min={1}
                      max={20}
                      className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Link
                href="/admin/community/categories"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <FiSave className="w-4 h-4" />
                {isSubmitting ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </AdminGuard>
  )
}
