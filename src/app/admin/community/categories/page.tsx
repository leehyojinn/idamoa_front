'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiEdit2, FiTrash2, FiPlus, FiArrowUp, FiArrowDown, FiCheck, FiX } from 'react-icons/fi'
import {
  getAdminCommunityCategories,
  deleteAdminCommunityCategory,
  updateAdminCommunityCategory,
  type AdminCommunityCategory,
} from '@/lib/api/admin-community'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

export default function AdminCommunityCategoriesPage() {
  const [categories, setCategories] = useState<AdminCommunityCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isReordering, setIsReordering] = useState(false)

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const response = await getAdminCommunityCategories({ sort: 'displayOrder,asc' })
      if (response.success && response.data) {
        // 응답이 배열인지 PageResponse 형태인지 확인
        const data = response.data as any
        if (Array.isArray(data)) {
          setCategories(data)
        } else if (data.content && Array.isArray(data.content)) {
          setCategories(data.content)
        } else {
          setCategories([])
        }
      }
    } catch (error) {
      showErrorToast(error, '카테고리 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleDelete = async (category: AdminCommunityCategory) => {
    if (!confirm(`정말로 "${category.name}" 카테고리를 삭제하시겠습니까?`)) return

    try {
      await deleteAdminCommunityCategory(category.uuid)
      showSuccessToast('카테고리가 삭제되었습니다.')
      fetchCategories()
    } catch (error) {
      showErrorToast(error, '카테고리 삭제에 실패했습니다.')
    }
  }

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newCategories = [...categories]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= categories.length) return

    ;[newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]]
    setCategories(newCategories)
    setIsReordering(true)
  }

  const saveOrder = async () => {
    try {
      // 순서대로 displayOrder 업데이트
      for (let i = 0; i < categories.length; i++) {
        await updateAdminCommunityCategory(categories[i].uuid, { displayOrder: i + 1 })
      }
      showSuccessToast('순서가 저장되었습니다.')
      setIsReordering(false)
      fetchCategories()
    } catch (error) {
      showErrorToast(error, '순서 저장에 실패했습니다.')
    }
  }

  const cancelReorder = () => {
    fetchCategories()
    setIsReordering(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-64px-200px)]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">커뮤니티 카테고리 관리</h1>
          <div className="flex gap-2">
            {isReordering && (
              <>
                <button
                  onClick={cancelReorder}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                  취소
                </button>
                <button
                  onClick={saveOrder}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiCheck className="w-4 h-4" />
                  순서 저장
                </button>
              </>
            )}
            <Link
              href="/admin/community/categories/create"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              카테고리 추가
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">등록된 카테고리가 없습니다.</p>
            <Link
              href="/admin/community/categories/create"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              첫 카테고리 만들기
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    순서
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    카테고리명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    슬러그
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    설정
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    생성일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category, index) => (
                  <tr key={category.uuid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveCategory(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <FiArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveCategory(index, 'down')}
                          disabled={index === categories.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <FiArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {category.icon && <span>{category.icon}</span>}
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {category.allowAnonymous && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                            익명허용
                          </span>
                        )}
                        {category.requireLogin && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                            로그인필수
                          </span>
                        )}
                        {category.allowAttachments && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                            첨부({category.maxAttachments})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          category.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {category.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(category.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link
                        href={`/admin/community/categories/${category.uuid}/edit`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900"
                      >
                        <FiEdit2 className="w-4 h-4" />
                        수정
                      </Link>
                      <button
                        onClick={() => handleDelete(category)}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-900"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer />
    </AdminGuard>
  )
}
