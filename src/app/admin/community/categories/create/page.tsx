'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { createAdminCommunityCategory, type AdminCommunityCategoryCreateRequest } from '@/lib/api/admin-community'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'
import Checkbox from '@/components/ui/Checkbox'

export default function AdminCommunityCategoryCreatePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<AdminCommunityCategoryCreateRequest>({
    name: '',
    slug: '',
    description: '',
    icon: '',
    displayOrder: 0,
    isActive: true,
    allowAnonymous: false,
    requireLogin: true,
    allowAttachments: true,
    maxAttachments: 5,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) : value,
    }))
  }

  // 슬러그 입력 핸들러 (영문, 숫자, 하이픈만 허용)
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setFormData((prev) => ({
      ...prev,
      slug: value,
    }))
  }

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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      showErrorToast(null, '카테고리명을 입력해주세요.')
      return
    }

    if (!formData.slug.trim()) {
      showErrorToast(null, '슬러그를 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await createAdminCommunityCategory(formData)
      if (response.success) {
        showSuccessToast('카테고리가 생성되었습니다.')
        router.push('/admin/community/categories')
      }
    } catch (error) {
      showErrorToast(error, '카테고리 생성에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
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
            <h1 className="text-2xl font-bold text-gray-900">카테고리 생성</h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="예: 자유게시판"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  슬러그 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleSlugChange}
                  placeholder="예: free"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  영문 소문자, 숫자, 하이픈(-)만 사용 가능 · URL: /community/{formData.slug || 'slug'}
                </p>
              </div>
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
                {isSubmitting ? '생성 중...' : '생성'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </AdminGuard>
  )
}
