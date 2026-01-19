'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  FiArrowLeft,
  FiTrash2,
  FiEyeOff,
  FiEye,
  FiMapPin,
  FiBell,
  FiUser,
  FiMail,
  FiCalendar,
  FiFile,
  FiDownload,
  FiGlobe,
} from 'react-icons/fi'
import {
  getAdminCommunityPost,
  deleteAdminCommunityPost,
  hideAdminCommunityPost,
  showAdminCommunityPost,
  updateAdminCommunityPost,
  type AdminCommunityPostDetail,
} from '@/lib/api/admin-community'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

interface PageProps {
  params: Promise<{ uuid: string }>
}

export default function AdminCommunityPostDetailPage({ params }: PageProps) {
  const { uuid } = use(params)
  const router = useRouter()
  const [post, setPost] = useState<AdminCommunityPostDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchPost = async () => {
    try {
      const response = await getAdminCommunityPost(uuid)
      if (response.success && response.data) {
        setPost(response.data)
      }
    } catch (error) {
      showErrorToast(error, '게시글을 불러오는데 실패했습니다.')
      router.push('/admin/community/posts')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPost()
  }, [uuid])

  const handleDelete = async () => {
    if (!post) return
    if (!confirm(`정말로 "${post.title}" 게시글을 삭제하시겠습니까?`)) return

    try {
      await deleteAdminCommunityPost(post.uuid)
      showSuccessToast('게시글이 삭제되었습니다.')
      router.push('/admin/community/posts')
    } catch (error) {
      showErrorToast(error, '게시글 삭제에 실패했습니다.')
    }
  }

  const handleToggleHidden = async () => {
    if (!post) return
    try {
      if (post.isPublished) {
        await hideAdminCommunityPost(post.uuid)
        showSuccessToast('게시글이 숨김 처리되었습니다.')
      } else {
        await showAdminCommunityPost(post.uuid)
        showSuccessToast('게시글이 공개되었습니다.')
      }
      fetchPost()
    } catch (error) {
      showErrorToast(error, '상태 변경에 실패했습니다.')
    }
  }

  const handleTogglePinned = async () => {
    if (!post) return
    try {
      await updateAdminCommunityPost(post.uuid, { isPinned: !post.isPinned })
      showSuccessToast(post.isPinned ? '고정이 해제되었습니다.' : '게시글이 고정되었습니다.')
      fetchPost()
    } catch (error) {
      showErrorToast(error, '상태 변경에 실패했습니다.')
    }
  }

  const handleToggleNotice = async () => {
    if (!post) return
    try {
      await updateAdminCommunityPost(post.uuid, { isNotice: !post.isNotice })
      showSuccessToast(post.isNotice ? '공지가 해제되었습니다.' : '공지로 설정되었습니다.')
      fetchPost()
    } catch (error) {
      showErrorToast(error, '상태 변경에 실패했습니다.')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (isLoading) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-64px-200px)]">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </div>
        <Footer />
      </AdminGuard>
    )
  }

  if (!post) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-64px-200px)]">
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">게시글을 찾을 수 없습니다.</p>
            <Link
              href="/admin/community/posts"
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
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-64px-200px)]">
        <div className="mb-6">
          <Link
            href="/admin/community/posts"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            목록으로
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* 헤더 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                {post.categoryName} (slug: {post.categorySlug})
              </span>
              {post.isPinned && (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                  고정
                </span>
              )}
              {post.isNotice && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  공지
                </span>
              )}
              {!post.isPublished && (
                <span className="px-2 py-1 bg-gray-800 text-white text-xs font-medium rounded">
                  숨김처리됨
                </span>
              )}
              {post.isAnonymous && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                  익명
                </span>
              )}
              {post.isDeleted && (
                <span className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded">
                  삭제됨
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
          </div>

          {/* 작성자 정보 (관리자 전용) */}
          <div className="p-6 bg-yellow-50 border-b border-yellow-200">
            <h3 className="text-sm font-semibold text-yellow-800 mb-3">관리자 전용 - 작성자 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <FiUser className="w-4 h-4 text-yellow-600" />
                <span className="text-yellow-700">실제 작성자:</span>
                <span className="font-medium text-yellow-900">{post.realAuthorName}</span>
                {post.isAnonymous && <span className="text-purple-600">(익명으로 표시됨)</span>}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FiMail className="w-4 h-4 text-yellow-600" />
                <span className="text-yellow-700">이메일:</span>
                <span className="font-medium text-yellow-900">{post.userEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FiGlobe className="w-4 h-4 text-yellow-600" />
                <span className="text-yellow-700">IP 주소:</span>
                <span className="font-medium text-yellow-900">{post.ipAddress}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-yellow-700">User ID:</span>
                <span className="font-medium text-yellow-900">{post.userId}</span>
              </div>
            </div>
          </div>

          {/* 게시글 메타 정보 */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">작성일:</span>
                <span className="font-medium text-gray-900">{formatDate(post.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">수정일:</span>
                <span className="font-medium text-gray-900">{formatDate(post.updatedAt)}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
              <span>조회 {post.viewCount}</span>
              <span>좋아요 {post.likeCount}</span>
              <span>싫어요 {post.dislikeCount}</span>
              <span>댓글 {post.commentCount}</span>
            </div>
          </div>

          {/* 본문 */}
          <div className="p-6">
            <div className="prose max-w-none">
              {post.contentType === 'HTML' ? (
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              ) : (
                <div className="whitespace-pre-wrap">{post.content}</div>
              )}
            </div>
          </div>

          {/* 첨부파일 */}
          {post.attachments && post.attachments.length > 0 && (
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">첨부파일 ({post.attachments.length})</h3>
              <div className="space-y-2">
                {post.attachments.map((file) => (
                  <div
                    key={file.uuid}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    {file.attachmentType === 'IMAGE' ? (
                      <div className="w-16 h-16 relative rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={file.fileUrl}
                          alt={file.originalFilename}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                        <FiFile className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.originalFilename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.fileSize)} · {file.fileExtension.toUpperCase()}
                      </p>
                    </div>
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <FiDownload className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="p-6 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-3">
            <button
              onClick={handleTogglePinned}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                post.isPinned
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FiMapPin className="w-4 h-4" />
              {post.isPinned ? '고정 해제' : '고정'}
            </button>
            <button
              onClick={handleToggleNotice}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                post.isNotice
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FiBell className="w-4 h-4" />
              {post.isNotice ? '공지 해제' : '공지 설정'}
            </button>
            <button
              onClick={handleToggleHidden}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                !post.isPublished
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {!post.isPublished ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
              {!post.isPublished ? '공개' : '숨김'}
            </button>
            <Link
              href={`/community/${post.categorySlug}/${post.uuid}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiEye className="w-4 h-4" />
              사용자 화면 보기
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ml-auto"
            >
              <FiTrash2 className="w-4 h-4" />
              삭제
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </AdminGuard>
  )
}
