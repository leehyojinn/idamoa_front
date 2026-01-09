'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  FiMessageSquare,
  FiThumbsUp,
  FiThumbsDown,
  FiCornerDownRight,
  FiTrash2,
  FiEdit2,
  FiX,
  FiCheck,
} from 'react-icons/fi'
import {
  getCommunityComments,
  createCommunityComment,
  updateCommunityComment,
  deleteCommunityComment,
  likeCommunityComment,
  dislikeCommunityComment,
  type CommunityComment,
} from '@/lib/api/community'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { useAuth } from '@/hooks/useAuth'
import Checkbox from '@/components/ui/Checkbox'

interface Props {
  postUuid: string
}

export default function CommunityCommentSection({ postUuid }: Props) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [replyAnonymous, setReplyAnonymous] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  useEffect(() => {
    fetchComments()
  }, [postUuid])

  const fetchComments = async () => {
    try {
      const result = await getCommunityComments(postUuid)
      if (result.success && result.data) {
        setComments(result.data)
      }
    } catch (error) {
      showErrorToast(error, '댓글을 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      showErrorToast(null, '로그인이 필요합니다')
      router.push('/login')
      return
    }

    if (!newComment.trim()) {
      showErrorToast(null, '댓글 내용을 입력해주세요')
      return
    }

    setIsSubmitting(true)
    try {
      await createCommunityComment(postUuid, {
        content: newComment,
        isAnonymous,
      })
      showSuccessToast('댓글이 작성되었습니다')
      setNewComment('')
      setIsAnonymous(false)
      fetchComments()
    } catch (error) {
      showErrorToast(error, '댓글 작성에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentUuid: string) => {
    if (!isAuthenticated) {
      showErrorToast(null, '로그인이 필요합니다')
      router.push('/login')
      return
    }

    if (!replyContent.trim()) {
      showErrorToast(null, '답글 내용을 입력해주세요')
      return
    }

    setIsSubmitting(true)
    try {
      await createCommunityComment(postUuid, {
        content: replyContent,
        parentUuid,
        isAnonymous: replyAnonymous,
      })
      showSuccessToast('답글이 작성되었습니다')
      setReplyTo(null)
      setReplyContent('')
      setReplyAnonymous(false)
      fetchComments()
    } catch (error) {
      showErrorToast(error, '답글 작성에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateComment = async (uuid: string) => {
    if (!editContent.trim()) {
      showErrorToast(null, '댓글 내용을 입력해주세요')
      return
    }

    try {
      await updateCommunityComment(uuid, { content: editContent })
      showSuccessToast('댓글이 수정되었습니다')
      setEditingId(null)
      setEditContent('')
      fetchComments()
    } catch (error) {
      showErrorToast(error, '댓글 수정에 실패했습니다')
    }
  }

  const handleDeleteComment = async (uuid: string) => {
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return

    try {
      await deleteCommunityComment(uuid)
      showSuccessToast('댓글이 삭제되었습니다')
      fetchComments()
    } catch (error) {
      showErrorToast(error, '댓글 삭제에 실패했습니다')
    }
  }

  const handleLikeComment = async (uuid: string) => {
    if (!isAuthenticated) {
      showErrorToast(null, '로그인이 필요합니다')
      router.push('/login')
      return
    }

    try {
      await likeCommunityComment(uuid)
      fetchComments()
    } catch (error) {
      showErrorToast(error, '좋아요 처리에 실패했습니다')
    }
  }

  const handleDislikeComment = async (uuid: string) => {
    if (!isAuthenticated) {
      showErrorToast(null, '로그인이 필요합니다')
      router.push('/login')
      return
    }

    try {
      await dislikeCommunityComment(uuid)
      fetchComments()
    } catch (error) {
      showErrorToast(error, '싫어요 처리에 실패했습니다')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTotalCommentCount = () => {
    let count = 0
    const countComments = (items: CommunityComment[]) => {
      items.forEach((item) => {
        count++
        if (item.children && item.children.length > 0) {
          countComments(item.children)
        }
      })
    }
    countComments(comments)
    return count
  }

  const renderComment = (comment: CommunityComment, isReply = false) => {
    const isEditing = editingId === comment.uuid

    return (
      <div key={comment.uuid} className={`${isReply ? 'ml-6 md:ml-10' : ''}`}>
        <div className={`p-4 rounded-lg ${isReply ? 'bg-gray-50' : 'bg-white border border-gray-200'}`}>
          {/* 헤더 */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              {isReply && <FiCornerDownRight className="w-4 h-4 text-gray-400" />}
              <span className="font-medium text-gray-900 text-sm md:text-base">
                {comment.authorName}
              </span>
              <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
            </div>
            {comment.isOwner && !comment.isDeleted && !comment.isHiddenByAdmin && (
              <div className="flex items-center gap-1">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => handleUpdateComment(comment.uuid)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                    >
                      <FiCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null)
                        setEditContent('')
                      }}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(comment.uuid)
                        setEditContent(comment.content)
                      }}
                      className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary-50 rounded transition-colors"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.uuid)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 내용 */}
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              rows={3}
            />
          ) : (
            <p
              className={`text-sm md:text-base ${
                comment.isDeleted || comment.isHiddenByAdmin ? 'text-gray-400 italic' : 'text-gray-700'
              }`}
            >
              {comment.content}
            </p>
          )}

          {/* 액션 버튼 */}
          {!comment.isDeleted && !comment.isHiddenByAdmin && !isEditing && (
            <div className="flex items-center gap-3 mt-3 text-sm">
              <button
                onClick={() => handleLikeComment(comment.uuid)}
                className={`flex items-center gap-1 ${
                  comment.isLiked ? 'text-primary' : 'text-gray-500 hover:text-primary'
                }`}
              >
                <FiThumbsUp className="w-4 h-4" />
                <span>{comment.likeCount}</span>
              </button>
              <button
                onClick={() => handleDislikeComment(comment.uuid)}
                className={`flex items-center gap-1 ${
                  comment.isDisliked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                }`}
              >
                <FiThumbsDown className="w-4 h-4" />
                <span>{comment.dislikeCount}</span>
              </button>
              {comment.depth === 0 && (
                <button
                  onClick={() => setReplyTo(replyTo === comment.uuid ? null : comment.uuid)}
                  className="text-gray-500 hover:text-primary"
                >
                  답글
                </button>
              )}
            </div>
          )}
        </div>

        {/* 답글 작성 폼 */}
        {replyTo === comment.uuid && (
          <div className="ml-6 md:ml-10 mt-2 p-4 bg-gray-50 rounded-lg">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="답글을 입력하세요..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              rows={2}
            />
            <div className="flex items-center justify-between mt-2">
              <Checkbox
                checked={replyAnonymous}
                onChange={(checked) => setReplyAnonymous(checked)}
                label="익명"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setReplyTo(null)
                    setReplyContent('')
                    setReplyAnonymous(false)
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => handleSubmitReply(comment.uuid)}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? '작성 중...' : '답글 작성'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 대댓글 */}
        {comment.children && comment.children.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.children.map((child) => renderComment(child, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="p-4 md:p-6 border-b border-gray-100">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <FiMessageSquare className="w-5 h-5" />
          댓글 {getTotalCommentCount()}개
        </h3>
      </div>

      {/* 댓글 작성 */}
      <div className="p-4 md:p-6 border-b border-gray-100">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={isAuthenticated ? '댓글을 입력하세요...' : '로그인 후 댓글을 작성할 수 있습니다'}
          disabled={!isAuthenticated}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 text-sm md:text-base"
          rows={3}
        />
        <div className="flex items-center justify-between mt-3">
          <Checkbox
            checked={isAnonymous}
            onChange={(checked) => setIsAnonymous(checked)}
            disabled={!isAuthenticated}
            label="익명"
          />
          <button
            onClick={handleSubmitComment}
            disabled={isSubmitting || !isAuthenticated}
            className="px-4 md:px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm md:text-base"
          >
            {isSubmitting ? '작성 중...' : '댓글 작성'}
          </button>
        </div>
      </div>

      {/* 댓글 목록 */}
      <div className="p-4 md:p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary"></div>
            <p className="mt-2 text-gray-600 text-sm">댓글 로딩 중...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">첫 번째 댓글을 작성해보세요!</p>
          </div>
        ) : (
          <div className="space-y-4">{comments.map((comment) => renderComment(comment))}</div>
        )}
      </div>
    </div>
  )
}
