'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import DOMPurify from 'isomorphic-dompurify'
import {
  FiArrowLeft,
  FiThumbsUp,
  FiThumbsDown,
  FiEdit2,
  FiTrash2,
  FiMessageSquare,
  FiEye,
  FiClock,
  FiDownload,
  FiFile,
  FiImage,
  FiLoader,
} from 'react-icons/fi'
import {
  getCommunityPost,
  likeCommunityPost,
  dislikeCommunityPost,
  deleteCommunityPost,
  type CommunityPostDetail,
} from '@/lib/api/community'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { useAuth } from '@/hooks/useAuth'
import CommunityCommentSection from './CommunityCommentSection'

interface Props {
  uuid: string
  initialData?: CommunityPostDetail
}

export default function CommunityPostDetailClient({ uuid, initialData }: Props) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [post, setPost] = useState<CommunityPostDetail | null>(initialData || null)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [isLiked, setIsLiked] = useState(initialData?.isLiked || false)
  const [isDisliked, setIsDisliked] = useState(initialData?.isDisliked || false)
  const [likeCount, setLikeCount] = useState(initialData?.likeCount || 0)
  const [dislikeCount, setDislikeCount] = useState(initialData?.dislikeCount || 0)
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null)

  // 로그인한 사용자만 클라이언트에서 다시 fetch하여 isOwner 등 사용자별 데이터 갱신
  // 비로그인 사용자는 initialData 사용 (조회수 중복 방지)
  const [hasFetched, setHasFetched] = useState(false)

  useEffect(() => {
    // initialData가 없으면 무조건 fetch
    if (!initialData) {
      fetchPost()
      return
    }

    // 로그인한 사용자만 isOwner 확인을 위해 다시 fetch (단, 한 번만)
    if (isAuthenticated && !hasFetched) {
      fetchPostForAuth()
    }
  }, [uuid, isAuthenticated, hasFetched])

  const fetchPost = async () => {
    setIsLoading(true)
    try {
      const result = await getCommunityPost(uuid)
      if (result.success && result.data) {
        setPost(result.data)
        setIsLiked(result.data.isLiked)
        setIsDisliked(result.data.isDisliked)
        setLikeCount(result.data.likeCount)
        setDislikeCount(result.data.dislikeCount)
      }
    } catch (error) {
      showErrorToast(error, '게시글을 불러오는데 실패했습니다')
      router.push('/community')
    } finally {
      setIsLoading(false)
    }
  }

  // 로그인 사용자용: 로딩 표시 없이 isOwner 등 사용자 데이터만 갱신
  const fetchPostForAuth = async () => {
    try {
      const result = await getCommunityPost(uuid)
      if (result.success && result.data) {
        setPost(result.data)
        setIsLiked(result.data.isLiked)
        setIsDisliked(result.data.isDisliked)
        setLikeCount(result.data.likeCount)
        setDislikeCount(result.data.dislikeCount)
      }
    } catch (error) {
      // 인증용 fetch 실패는 조용히 처리 (initialData가 있으므로)
      console.error('사용자 데이터 갱신 실패:', error)
    } finally {
      setHasFetched(true)
    }
  }

  const handleLike = async () => {
    if (!isAuthenticated) {
      showErrorToast(null, '로그인이 필요합니다')
      router.push('/login')
      return
    }

    try {
      await likeCommunityPost(uuid)
      if (isLiked) {
        setIsLiked(false)
        setLikeCount((prev) => prev - 1)
      } else {
        setIsLiked(true)
        setLikeCount((prev) => prev + 1)
        if (isDisliked) {
          setIsDisliked(false)
          setDislikeCount((prev) => prev - 1)
        }
      }
    } catch (error) {
      showErrorToast(error, '좋아요 처리에 실패했습니다')
    }
  }

  const handleDislike = async () => {
    if (!isAuthenticated) {
      showErrorToast(null, '로그인이 필요합니다')
      router.push('/login')
      return
    }

    try {
      await dislikeCommunityPost(uuid)
      if (isDisliked) {
        setIsDisliked(false)
        setDislikeCount((prev) => prev - 1)
      } else {
        setIsDisliked(true)
        setDislikeCount((prev) => prev + 1)
        if (isLiked) {
          setIsLiked(false)
          setLikeCount((prev) => prev - 1)
        }
      }
    } catch (error) {
      showErrorToast(error, '싫어요 처리에 실패했습니다')
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return

    try {
      await deleteCommunityPost(uuid)
      showSuccessToast('게시글이 삭제되었습니다')
      router.push('/community')
    } catch (error) {
      showErrorToast(error, '삭제에 실패했습니다')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
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

  const handleDownload = async (fileUrl: string, fileName: string, fileUuid: string) => {
    try {
      setDownloadingFile(fileUuid)
      const response = await fetch(fileUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      showErrorToast(error, '파일 다운로드에 실패했습니다')
    } finally {
      setDownloadingFile(null)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary"></div>
        <p className="mt-4 text-gray-600">로딩 중...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600 text-lg">게시글을 찾을 수 없습니다</p>
        <Link href="/community" className="text-primary hover:text-primary-700 mt-4 inline-block">
          목록으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => router.push('/community')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <FiArrowLeft className="w-5 h-5" />
        <span className="text-sm md:text-base">목록으로</span>
      </button>

      {/* 게시글 카드 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="p-4 md:p-6 border-b border-gray-100">
          {/* 카테고리 및 배지 */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-sm text-primary font-medium">{post.categoryName}</span>
            {post.isPinned && (
              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded">고정</span>
            )}
            {post.isNotice && (
              <span className="px-2 py-0.5 bg-primary-100 text-primary text-xs font-bold rounded">공지</span>
            )}
          </div>

          {/* 제목 */}
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>

          {/* 메타 정보 */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm text-gray-500">
              <span className="font-medium text-gray-700">{post.authorName}</span>
              <span className="flex items-center gap-1">
                <FiClock className="w-4 h-4" />
                {formatDate(post.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <FiEye className="w-4 h-4" />
                조회 {post.viewCount}
              </span>
            </div>

            {/* 수정/삭제 버튼 */}
            {post.isOwner && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/community/posts/${uuid}/edit`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <FiEdit2 className="w-4 h-4" />
                  수정
                </Link>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 본문 */}
        <div className="p-4 md:p-6">
          <div className={`prose prose-sm md:prose max-w-none min-h-[200px] ${
            post.isHiddenByAdmin ? 'text-gray-400 italic' : ''
          }`}>
            {post.isHiddenByAdmin ? (
              <p>관리자에 의해 비공개 처리된 게시글입니다.</p>
            ) : post.contentType === 'HTML' ? (
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />
            ) : (
              <div className="whitespace-pre-wrap">{post.content}</div>
            )}
          </div>
        </div>

        {/* 첨부 이미지 */}
        {post.attachments && post.attachments.filter(f => f.attachmentType === 'IMAGE').length > 0 && (
          <div className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="space-y-4">
              {post.attachments
                .filter((file) => file.attachmentType === 'IMAGE')
                .map((file) => (
                  <div key={file.uuid} className="relative">
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Image
                        src={file.fileUrl}
                        alt={file.originalFilename}
                        width={800}
                        height={600}
                        className="w-full max-w-2xl mx-auto rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        style={{ height: 'auto' }}
                      />
                    </a>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 첨부파일 (이미지 외) */}
        {post.attachments && post.attachments.filter(f => f.attachmentType !== 'IMAGE').length > 0 && (
          <div className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <FiFile className="w-4 h-4" />
                첨부파일 ({post.attachments.filter(f => f.attachmentType !== 'IMAGE').length})
              </h4>
              <div className="space-y-2">
                {post.attachments
                  .filter((file) => file.attachmentType !== 'IMAGE')
                  .map((file) => (
                    <button
                      key={file.uuid}
                      onClick={() => handleDownload(file.fileUrl, file.originalFilename, file.uuid)}
                      disabled={downloadingFile === file.uuid}
                      className="w-full flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all text-left disabled:opacity-50"
                    >
                      <FiFile className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.originalFilename}
                        </p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</p>
                      </div>
                      {downloadingFile === file.uuid ? (
                        <FiLoader className="w-5 h-5 text-primary flex-shrink-0 animate-spin" />
                      ) : (
                        <FiDownload className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* 좋아요/싫어요 */}
        <div className="px-4 md:px-6 pb-6">
          <div className="flex justify-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 transition-all ${
                isLiked
                  ? 'border-primary bg-primary-50 text-primary'
                  : 'border-gray-200 text-gray-600 hover:border-primary-300 hover:bg-primary-50'
              }`}
            >
              <FiThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-bold">{likeCount}</span>
            </button>
            <button
              onClick={handleDislike}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 transition-all ${
                isDisliked
                  ? 'border-red-600 bg-red-50 text-red-600'
                  : 'border-gray-200 text-gray-600 hover:border-red-300 hover:bg-red-50'
              }`}
            >
              <FiThumbsDown className={`w-5 h-5 ${isDisliked ? 'fill-current' : ''}`} />
              <span className="font-bold">{dislikeCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 댓글 섹션 */}
      <CommunityCommentSection postUuid={uuid} />
    </div>
  )
}
