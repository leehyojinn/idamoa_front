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
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiEdit2,
  FiRefreshCw,
} from 'react-icons/fi'
import {
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
import {
  useAdminCategoryTree,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/useCommunityCategory'
import CategoryFormModal from '@/components/admin/community/CategoryFormModal'
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
  const { data: categories, isLoading, refetch, error } = useAdminCategoryTree()
  const deleteCategory = useDeleteCategory()
  const updateCategory = useUpdateCategory()

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
      showErrorToast(null, '하위 카테고리가 있어 삭제할 수 없습니다.')
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

  // 순서 변경
  const handleMoveOrder = async (category: AdminCommunityCategory, direction: 'up' | 'down', siblings: AdminCommunityCategory[]) => {
    const currentIndex = siblings.findIndex(c => c.uuid === category.uuid)
    if (currentIndex === -1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= siblings.length) return

    const targetCategory = siblings[targetIndex]

    try {
      await Promise.all([
        updateCategory.mutateAsync({ uuid: category.uuid, data: { displayOrder: targetCategory.displayOrder } }),
        updateCategory.mutateAsync({ uuid: targetCategory.uuid, data: { displayOrder: category.displayOrder } })
      ])
      showSuccessToast('순서가 변경되었습니다.')
      refetch()
    } catch (error: any) {
      showErrorToast(error, '순서 변경에 실패했습니다.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const renderCategory = (category: AdminCommunityCategory, level = 0, siblings: AdminCommunityCategory[] = []) => {
    const hasChildren = !!(category.children && category.children.length > 0)
    const isExpanded = expandedIds.has(category.uuid)
    const currentIndex = siblings.findIndex(c => c.uuid === category.uuid)
    const isFirst = currentIndex === 0
    const isLast = currentIndex === siblings.length - 1

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
            {hasChildren && (isExpanded ? <FiChevronDown className="w-4 h-4 text-gray-500" /> : <FiChevronRight className="w-4 h-4 text-gray-500" />)}
          </button>

          {/* 아이콘 */}
          <span className="w-8 text-center text-lg">{category.icon || '📁'}</span>

          {/* 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-medium ${!category.isActive ? 'text-gray-400' : 'text-gray-900'}`}>{category.name}</span>
              <span className="text-xs text-gray-400">/{category.slug}</span>
              {!category.isActive && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">비활성</span>}
              {category.depth > 0 && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">하위 Lv.{category.depth}</span>}
            </div>
            {category.description && <p className="text-sm text-gray-500 truncate mt-0.5">{category.description}</p>}
          </div>

          {/* 설정 태그 */}
          <div className="hidden lg:flex flex-wrap gap-1 w-40">
            {category.allowAnonymous && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">익명</span>}
            {category.requireLogin && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">로그인</span>}
            {category.allowAttachments && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">첨부({category.maxAttachments})</span>}
          </div>

          {/* 순서 변경 버튼 */}
          <div className="hidden md:flex items-center gap-0.5">
            <button
              onClick={() => handleMoveOrder(category, 'up', siblings)}
              disabled={isFirst}
              className={`p-1 rounded transition-colors ${isFirst ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-200'}`}
              title="위로 이동"
            >
              <FiChevronUp className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-400 w-6 text-center">{category.displayOrder}</span>
            <button
              onClick={() => handleMoveOrder(category, 'down', siblings)}
              disabled={isLast}
              className={`p-1 rounded transition-colors ${isLast ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-200'}`}
              title="아래로 이동"
            >
              <FiChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* 생성일 */}
          <span className="hidden md:block text-xs text-gray-400 w-24">{formatDate(category.createdAt)}</span>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-0.5">
            <button onClick={() => handleCreate(category)} className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="하위 카테고리 추가">
              <FiPlus className="w-4 h-4" />
            </button>
            <button onClick={() => handleEdit(category)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="수정">
              <FiEdit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(category)}
              className={`p-1.5 rounded transition-colors ${hasChildren ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
              title={hasChildren ? '하위 카테고리가 있어 삭제할 수 없습니다' : '삭제'}
              disabled={hasChildren}
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 자식 카테고리 */}
        {hasChildren && isExpanded && (
          <div>{category.children!.map((child) => renderCategory(child, level + 1, category.children!))}</div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-4 text-gray-600">로딩 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-red-200">
        <p className="text-red-500">카테고리를 불러오는데 실패했습니다.</p>
        <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-end gap-2 mb-4">
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <FiRefreshCw className="w-4 h-4" />
          새로고침
        </button>
        <button onClick={() => handleCreate()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <FiPlus className="w-4 h-4" />
          최상위 카테고리 추가
        </button>
      </div>

      {!categories || categories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-5xl mb-4">📂</div>
          <p className="text-gray-500">등록된 카테고리가 없습니다.</p>
          <button onClick={() => handleCreate()} className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
            <span className="hidden lg:block w-40">설정</span>
            <span className="hidden md:block w-20 text-center">순서</span>
            <span className="hidden md:block w-24">생성일</span>
            <span className="w-24 text-center">액션</span>
          </div>

          {/* 카테고리 목록 */}
          {categories.map((category) => renderCategory(category, 0, categories))}
        </div>
      )}

      {/* 생성/수정 모달 */}
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCategory(null); setParentForNew(null) }}
        category={editingCategory}
        parentCategory={parentForNew}
        onSuccess={handleModalSuccess}
      />
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
