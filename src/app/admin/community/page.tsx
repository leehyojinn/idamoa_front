'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FiGrid,
  FiEdit3,
  FiMessageSquare,
  FiPlus,
  FiTrash2,
  FiEyeOff,
  FiEye,
  FiSearch,
  FiArrowUp,
  FiArrowDown,
  FiCheck,
  FiX,
  FiEdit2,
} from 'react-icons/fi'
import {
  getAdminCommunityCategories,
  deleteAdminCommunityCategory,
  updateAdminCommunityCategory,
  getAdminCommunityPosts,
  deleteAdminCommunityPost,
  hideAdminCommunityPost,
  showAdminCommunityPost,
  getAdminCommunityComments,
  deleteAdminCommunityComment,
  hideAdminCommunityComment,
  showAdminCommunityComment,
  type AdminCommunityCategory,
  type AdminCommunityPostListItem,
  type AdminCommunityComment,
  type AdminCommunityPostSearchParams,
  type AdminCommunityCommentSearchParams,
} from '@/lib/api/admin-community'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

type TabType = 'categories' | 'posts' | 'comments'

export default function AdminCommunityPage() {
  const [activeTab, setActiveTab] = useState<TabType>('categories')

  const tabs = [
    { id: 'categories' as TabType, label: '카테고리', icon: FiGrid },
    { id: 'posts' as TabType, label: '게시글', icon: FiEdit3 },
    { id: 'comments' as TabType, label: '댓글', icon: FiMessageSquare },
  ]

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-64px-200px)]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">커뮤니티 관리</h1>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'posts' && <PostsTab />}
        {activeTab === 'comments' && <CommentsTab />}
      </div>
      <Footer />
    </AdminGuard>
  )
}

// ============ 카테고리 탭 ============
function CategoriesTab() {
  const [categories, setCategories] = useState<AdminCommunityCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isReordering, setIsReordering] = useState(false)

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const response = await getAdminCommunityCategories({ sort: 'displayOrder,asc' })
      if (response.success && response.data) {
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

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-4 text-gray-600">로딩 중...</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-end gap-2 mb-4">
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

      {categories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">등록된 카테고리가 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">순서</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리명</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">슬러그</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설정</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category, index) => (
                <tr key={category.uuid} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
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
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {category.icon && <span>{category.icon}</span>}
                      <span className="font-medium text-gray-900">{category.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{category.slug}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {category.allowAnonymous && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">익명허용</span>
                      )}
                      {category.requireLogin && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">로그인필수</span>
                      )}
                      {category.allowAttachments && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">첨부({category.maxAttachments})</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {category.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(category.createdAt)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
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
    </>
  )
}

// ============ 게시글 탭 ============
function PostsTab() {
  const router = useRouter()
  const [posts, setPosts] = useState<AdminCommunityPostListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)

  const fetchPosts = async (page: number = 0) => {
    setIsLoading(true)
    try {
      const params: AdminCommunityPostSearchParams = {
        keyword: searchKeyword || undefined,
        page,
        size: 20,
        sort: 'createdAt,desc',
      }
      const response = await getAdminCommunityPosts(params)
      if (response.success && response.data) {
        const data = response.data as any
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
    fetchPosts(0)
  }, [searchKeyword])

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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-4 text-gray-600">로딩 중...</p>
      </div>
    )
  }

  return (
    <>
      {/* 검색 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="제목, 내용 검색"
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
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">게시글이 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성자</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">통계</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성일</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.uuid} className={`hover:bg-gray-50 ${post.isHiddenByAdmin ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {post.isPinned && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">고정</span>}
                        {post.isNotice && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">공지</span>}
                        {post.isHiddenByAdmin && <span className="px-2 py-0.5 bg-gray-800 text-white text-xs font-medium rounded">숨김</span>}
                        {post.isAnonymous && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">익명</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4 max-w-xs">
                      <Link href={`/admin/community/posts/${post.uuid}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2">
                        {truncateText(post.title, 50)}
                      </Link>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{post.categoryName}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{post.authorName}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="text-xs">
                        <div>조회 {post.viewCount} / 댓글 {post.commentCount}</div>
                        <div>좋아요 {post.likeCount} / 싫어요 {post.dislikeCount}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(post.createdAt)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleToggleHidden(post)}
                          className={`p-2 rounded transition-colors ${post.isHiddenByAdmin ? 'text-gray-600 bg-gray-100 hover:bg-gray-200' : 'text-gray-400 hover:bg-gray-100'}`}
                          title={post.isHiddenByAdmin ? '공개' : '숨김'}
                        >
                          {post.isHiddenByAdmin ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
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

          {totalPages > 0 && (
            <div className="flex justify-center items-center gap-1 md:gap-2 mt-6">
              <button
                onClick={() => fetchPosts(currentPage - 1)}
                disabled={currentPage === 0}
                className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
              >
                이전
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i
                  } else if (currentPage < 3) {
                    pageNum = i
                  } else if (currentPage > totalPages - 3) {
                    pageNum = totalPages - 5 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => fetchPosts(pageNum)}
                      className={`w-9 h-9 md:w-10 md:h-10 rounded-lg transition-colors text-sm ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => fetchPosts(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}

// ============ 댓글 탭 ============
function CommentsTab() {
  const [comments, setComments] = useState<AdminCommunityComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)

  const fetchComments = async (page: number = 0) => {
    setIsLoading(true)
    try {
      const params: AdminCommunityCommentSearchParams = {
        keyword: searchKeyword || undefined,
        page,
        size: 20,
        sort: 'createdAt,desc',
      }
      const response = await getAdminCommunityComments(params)
      if (response.success && response.data) {
        const data = response.data as any
        if (Array.isArray(data)) {
          setComments(data)
          setTotalPages(1)
          setCurrentPage(0)
        } else {
          setComments(data.content || [])
          setTotalPages(data.totalPages || 0)
          setCurrentPage(data.number || 0)
        }
      }
    } catch (error) {
      showErrorToast(error, '댓글 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchComments(0)
  }, [searchKeyword])

  const handleSearch = () => {
    setSearchKeyword(keyword)
  }

  const handleDelete = async (comment: AdminCommunityComment) => {
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return
    try {
      await deleteAdminCommunityComment(comment.uuid)
      showSuccessToast('댓글이 삭제되었습니다.')
      fetchComments(currentPage)
    } catch (error) {
      showErrorToast(error, '댓글 삭제에 실패했습니다.')
    }
  }

  const handleToggleHidden = async (comment: AdminCommunityComment) => {
    try {
      if (comment.isHiddenByAdmin) {
        await showAdminCommunityComment(comment.uuid)
        showSuccessToast('댓글이 공개되었습니다.')
      } else {
        await hideAdminCommunityComment(comment.uuid)
        showSuccessToast('댓글이 숨김 처리되었습니다.')
      }
      fetchComments(currentPage)
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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-4 text-gray-600">로딩 중...</p>
      </div>
    )
  }

  return (
    <>
      {/* 검색 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="댓글 내용 검색"
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
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">댓글이 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">댓글 내용</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성자</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">통계</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성일</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comments.map((comment) => (
                  <tr key={comment.uuid} className={`hover:bg-gray-50 ${comment.isHiddenByAdmin ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {comment.depth > 0 && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">답글</span>}
                        {comment.isHiddenByAdmin && <span className="px-2 py-0.5 bg-gray-800 text-white text-xs font-medium rounded">숨김</span>}
                        {comment.isDeleted && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">삭제됨</span>}
                        {comment.isAnonymous && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">익명</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4 max-w-xs">
                      <p className="text-sm text-gray-900 line-clamp-2" title={comment.content}>{truncateText(comment.content, 100)}</p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{comment.authorName}</p>
                        {comment.isAnonymous && <p className="text-gray-500 text-xs">(익명)</p>}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="text-xs">
                        <div>좋아요 {comment.likeCount}</div>
                        <div>싫어요 {comment.dislikeCount}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(comment.createdAt)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-1">
                        {!comment.isDeleted && (
                          <>
                            <button
                              onClick={() => handleToggleHidden(comment)}
                              className={`p-2 rounded transition-colors ${comment.isHiddenByAdmin ? 'text-gray-600 bg-gray-100 hover:bg-gray-200' : 'text-gray-400 hover:bg-gray-100'}`}
                              title={comment.isHiddenByAdmin ? '공개' : '숨김'}
                            >
                              {comment.isHiddenByAdmin ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(comment)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="삭제"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 0 && (
            <div className="flex justify-center items-center gap-1 md:gap-2 mt-6">
              <button
                onClick={() => fetchComments(currentPage - 1)}
                disabled={currentPage === 0}
                className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
              >
                이전
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i
                  } else if (currentPage < 3) {
                    pageNum = i
                  } else if (currentPage > totalPages - 3) {
                    pageNum = totalPages - 5 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => fetchComments(pageNum)}
                      className={`w-9 h-9 md:w-10 md:h-10 rounded-lg transition-colors text-sm ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => fetchComments(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
