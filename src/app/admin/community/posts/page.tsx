'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiEye, FiTrash2, FiEyeOff, FiSearch } from 'react-icons/fi'
import {
  getAdminCommunityPosts,
  getAdminCommunityCategories,
  deleteAdminCommunityPost,
  hideAdminCommunityPost,
  showAdminCommunityPost,
  type AdminCommunityPostListItem,
  type AdminCommunityCategory,
  type AdminCommunityPostSearchParams,
} from '@/lib/api/admin-community'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

export default function AdminCommunityPostsPage() {
  const [posts, setPosts] = useState<AdminCommunityPostListItem[]>([])
  const [categories, setCategories] = useState<AdminCommunityCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 필터 상태
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [categorySlug, setCategorySlug] = useState('')

  // 페이지네이션
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)

  const fetchCategories = async () => {
    try {
      const response = await getAdminCommunityCategories()
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
      console.error('카테고리 로드 실패:', error)
    }
  }

  const fetchPosts = async (page: number = 0) => {
    setIsLoading(true)
    try {
      const params: AdminCommunityPostSearchParams = {
        keyword: searchKeyword || undefined,
        categorySlug: categorySlug || undefined,
        page,
        size: 20,
        sort: 'createdAt,desc',
      }

      const response = await getAdminCommunityPosts(params)
      if (response.success && response.data) {
        const data = response.data as any
        // PageResponse 구조 또는 직접 배열 처리
        if (Array.isArray(data)) {
          setPosts(data)
          setTotalPages(1)
          setCurrentPage(0)
        } else {
          setPosts(data.content || [])
          setTotalPages(data.totalPages || 0)
          setCurrentPage(data.number || 0)
        }
      }
    } catch (error) {
      showErrorToast(error, '게시글 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchPosts(0)
  }, [searchKeyword, categorySlug])

  const handleSearch = () => {
    setSearchKeyword(keyword)
  }

  const handleDelete = async (post: AdminCommunityPostListItem) => {
    if (!confirm(`정말로 "${post.title}" 게시글을 삭제하시겠습니까?`)) return

    try {
      await deleteAdminCommunityPost(post.uuid)
      showSuccessToast('게시글이 삭제되었습니다.')
      fetchPosts(currentPage)
    } catch (error) {
      showErrorToast(error, '게시글 삭제에 실패했습니다.')
    }
  }

  const handleToggleHidden = async (post: AdminCommunityPostListItem) => {
    try {
      if (post.isHiddenByAdmin) {
        await showAdminCommunityPost(post.uuid)
        showSuccessToast('게시글이 공개되었습니다.')
      } else {
        await hideAdminCommunityPost(post.uuid)
        showSuccessToast('게시글이 숨김 처리되었습니다.')
      }
      fetchPosts(currentPage)
    } catch (error) {
      showErrorToast(error, '상태 변경에 실패했습니다.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-64px-200px)]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">커뮤니티 게시글 관리</h1>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="제목/내용 검색"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FiSearch className="w-4 h-4" />
              검색
            </button>
          </div>

          <div className="flex flex-wrap gap-4">
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">전체 카테고리</option>
              {categories.map((cat) => (
                <option key={cat.uuid} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 목록 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">게시글이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      카테고리
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      제목
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작성자
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      통계
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작성일
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {posts.map((post) => (
                    <tr key={post.uuid} className={`hover:bg-gray-50 ${post.isHiddenByAdmin ? 'bg-red-50' : ''}`}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {post.isPinned && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                              고정
                            </span>
                          )}
                          {post.isNotice && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              공지
                            </span>
                          )}
                          {post.isHiddenByAdmin && (
                            <span className="px-2 py-0.5 bg-gray-800 text-white text-xs font-medium rounded">
                              숨김
                            </span>
                          )}
                          {post.isAnonymous && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                              익명
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {post.categoryName}
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        <Link
                          href={`/admin/community/posts/${post.uuid}`}
                          className="font-medium text-gray-900 hover:text-blue-600 truncate block"
                          title={post.title}
                        >
                          {post.title}
                        </Link>
                        {post.hasAttachments && (
                          <span className="text-gray-400 text-xs">📎 첨부파일</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{post.authorName}</p>
                          {post.isAnonymous && (
                            <p className="text-gray-500 text-xs">(익명)</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="text-xs space-y-0.5">
                          <div>조회 {post.viewCount}</div>
                          <div>좋아요 {post.likeCount} / 싫어요 {post.dislikeCount}</div>
                          <div>댓글 {post.commentCount}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(post.createdAt)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/admin/community/posts/${post.uuid}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="상세보기"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleToggleHidden(post)}
                            className={`p-2 rounded transition-colors ${
                              post.isHiddenByAdmin
                                ? 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={post.isHiddenByAdmin ? '공개' : '숨김'}
                          >
                            <FiEyeOff className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(post)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="삭제"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => fetchPosts(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <span className="px-4 py-2">
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => fetchPosts(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </AdminGuard>
  )
}
