'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { IoStar, IoStarOutline, IoStarHalf } from 'react-icons/io5'
import { getCompanyReviews, createReview, updateReview, deleteReview, createReply, updateReply, deleteReply, type ReviewResponse } from '@/lib/api/review'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { useDialogStore } from '@/stores/useDialogStore'
import Pagination from '@/components/ui/Pagination'
import ImageUpload from '@/components/ui/ImageUpload'

interface CompanyReviewsProps {
  companyUuid: string
  companyName: string
  isOwner?: boolean
  currentUserEmail: string | null
}

export default function CompanyReviews({ companyUuid, companyName, isOwner = false, currentUserEmail }: CompanyReviewsProps) {
  const router = useRouter()
  const { showDialog } = useDialogStore()

  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)

  // 리뷰 작성 폼
  const [isWriting, setIsWriting] = useState(false)
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 리뷰 수정
  const [editingReview, setEditingReview] = useState<string | null>(null)
  const [editRating, setEditRating] = useState(5)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editImages, setEditImages] = useState<string[]>([])
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)

  // 답변 작성/수정
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

  useEffect(() => {
    fetchReviews()
  }, [page, companyUuid])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const result = await getCompanyReviews(companyUuid, page, 10)
      if (result.success && result.data) {
        setReviews(result.data.content)
        setTotalPages(result.data.totalPages)
        setTotalElements(result.data.totalElements)
      }
    } catch (error) {
      showErrorToast(error, '리뷰를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    // 로그인 체크
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        showErrorToast(null, '로그인이 필요합니다')
        router.push('/login')
        return
      }
    }

    if (content.length < 10) {
      showErrorToast(null, '리뷰 내용은 최소 10자 이상이어야 합니다')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createReview(companyUuid, {
        rating,
        title: title || undefined,
        content,
        images: images.length > 0 ? images : undefined,
      })

      if (result.success) {
        showSuccessToast('리뷰가 등록되었습니다')
        setIsWriting(false)
        setRating(5)
        setTitle('')
        setContent('')
        setImages([])
        fetchReviews()
      }
    } catch (error) {
      showErrorToast(error, '리뷰 등록에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isReviewOwner = (reviewUserEmail: string) => {
    return currentUserEmail === reviewUserEmail
  }

  const handleEditReview = (review: ReviewResponse) => {
    setEditingReview(review.uuid)
    setEditRating(review.rating)
    setEditTitle(review.title || '')
    setEditContent(review.content)
    setEditImages(review.images || [])
  }

  const handleUpdateReview = async (reviewUuid: string) => {
    if (editContent.length < 10) {
      showErrorToast(null, '리뷰 내용은 최소 10자 이상이어야 합니다')
      return
    }

    setIsEditSubmitting(true)
    try {
      const result = await updateReview(reviewUuid, {
        rating: editRating,
        title: editTitle || undefined,
        content: editContent,
        images: editImages.length > 0 ? editImages : undefined,
      })

      if (result.success) {
        showSuccessToast('리뷰가 수정되었습니다')
        setEditingReview(null)
        setEditRating(5)
        setEditTitle('')
        setEditContent('')
        setEditImages([])
        fetchReviews()
      }
    } catch (error) {
      showErrorToast(error, '리뷰 수정에 실패했습니다')
    } finally {
      setIsEditSubmitting(false)
    }
  }

  const handleDeleteReview = (reviewUuid: string) => {
    showDialog({
      title: '리뷰 삭제',
      message: '정말로 이 리뷰를 삭제하시겠습니까?\n삭제된 리뷰는 복구할 수 없습니다.',
      type: 'confirm',
      confirmText: '삭제',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          const result = await deleteReview(reviewUuid)
          if (result.success) {
            showSuccessToast('리뷰가 삭제되었습니다')
            fetchReviews()
          }
        } catch (error) {
          showErrorToast(error, '리뷰 삭제에 실패했습니다')
        }
      },
    })
  }

  const handleSubmitReply = async (reviewUuid: string, existingReply?: string) => {
    if (!replyContent.trim()) {
      showErrorToast(null, '답변 내용을 입력해주세요')
      return
    }

    try {
      const result = existingReply
        ? await updateReply(reviewUuid, { reply: replyContent })
        : await createReply(reviewUuid, { reply: replyContent })

      if (result.success) {
        showSuccessToast(existingReply ? '답변이 수정되었습니다' : '답변이 등록되었습니다')
        setReplyingTo(null)
        setReplyContent('')
        fetchReviews()
      }
    } catch (error) {
      showErrorToast(error, '답변 처리에 실패했습니다')
    }
  }

  const handleDeleteReply = (reviewUuid: string) => {
    showDialog({
      title: '답변 삭제',
      message: '정말로 이 답변을 삭제하시겠습니까?',
      type: 'confirm',
      confirmText: '삭제',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          const result = await deleteReply(reviewUuid)
          if (result.success) {
            showSuccessToast('답변이 삭제되었습니다')
            fetchReviews()
          }
        } catch (error) {
          showErrorToast(error, '답변 삭제에 실패했습니다')
        }
      },
    })
  }

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < fullStars; i++) {
      stars.push(<IoStar key={i} className="text-yellow-400 text-xl" />)
    }
    if (hasHalfStar) {
      stars.push(<IoStarHalf key="half" className="text-yellow-400 text-xl" />)
    }
    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<IoStarOutline key={`empty-${i}`} className="text-gray-300 text-xl" />)
    }
    return stars
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          리뷰 ({totalElements})
        </h2>
        {!isOwner && !isWriting && (
          <button
            onClick={() => setIsWriting(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            리뷰 작성하기
          </button>
        )}
      </div>

      {/* 리뷰 작성 폼 */}
      {isWriting && (
        <form onSubmit={handleSubmitReview} className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">리뷰 작성</h3>

          {/* 별점 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">별점</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  {star <= rating ? (
                    <IoStar className="text-yellow-400 text-3xl" />
                  ) : (
                    <IoStarOutline className="text-gray-300 text-3xl hover:text-yellow-400" />
                  )}
                </button>
              ))}
              <span className="ml-2 text-lg font-semibold text-gray-900">{rating.toFixed(1)}</span>
            </div>
          </div>

          {/* 제목 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 (선택사항)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="리뷰 제목을 입력하세요"
            />
          </div>

          {/* 내용 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용 *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              minLength={10}
              maxLength={5000}
              rows={6}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="리뷰 내용을 입력하세요 (최소 10자)"
            />
            <p className="mt-1 text-sm text-gray-500">{content.length} / 5000</p>
          </div>

          {/* 이미지 업로드 */}
          <div className="mb-4">
            <ImageUpload
              label="리뷰 이미지 (선택사항)"
              value={images}
              onChange={(urls) => setImages(urls as string[])}
              multiple={true}
              maxFiles={5}
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setIsWriting(false)
                setRating(5)
                setTitle('')
                setContent('')
                setImages([])
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? '등록 중...' : '리뷰 등록'}
            </button>
          </div>
        </form>
      )}

      {/* 리뷰 목록 */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500">아직 등록된 리뷰가 없습니다</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.uuid} className="p-6 bg-white border border-gray-200 rounded-lg">
                {editingReview === review.uuid ? (
                  /* 리뷰 수정 폼 */
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">리뷰 수정</h3>

                    {/* 별점 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">별점</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setEditRating(star)}
                            className="focus:outline-none"
                          >
                            {star <= editRating ? (
                              <IoStar className="text-yellow-400 text-3xl" />
                            ) : (
                              <IoStarOutline className="text-gray-300 text-3xl hover:text-yellow-400" />
                            )}
                          </button>
                        ))}
                        <span className="ml-2 text-lg font-semibold text-gray-900">{editRating.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* 제목 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        제목 (선택사항)
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        maxLength={200}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="리뷰 제목을 입력하세요"
                      />
                    </div>

                    {/* 내용 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        내용 *
                      </label>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        minLength={10}
                        maxLength={5000}
                        rows={6}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="리뷰 내용을 입력하세요 (최소 10자)"
                      />
                      <p className="mt-1 text-sm text-gray-500">{editContent.length} / 5000</p>
                    </div>

                    {/* 이미지 업로드 */}
                    <div className="mb-4">
                      <ImageUpload
                        label="리뷰 이미지 (선택사항)"
                        value={editImages}
                        onChange={(urls) => setEditImages(urls as string[])}
                        multiple={true}
                        maxFiles={5}
                      />
                    </div>

                    {/* 버튼 */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingReview(null)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateReview(review.uuid)}
                        disabled={isEditSubmitting}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                      >
                        {isEditSubmitting ? '수정 중...' : '리뷰 수정'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 리뷰 헤더 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">{renderStars(review.rating)}</div>
                          <span className="font-semibold text-gray-900">{review.rating.toFixed(1)}</span>
                        </div>
                        {review.title && (
                          <h4 className="text-lg font-bold text-gray-900 mb-2">{review.title}</h4>
                        )}
                        <p className="text-sm text-gray-500">
                          {review.userEmail} · {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* 수정/삭제 버튼 (본인 리뷰만) */}
                      {isReviewOwner(review.userEmail) && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditReview(review)}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review.uuid)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 리뷰 내용 */}
                    <p className="text-gray-700 mb-4 whitespace-pre-wrap">{review.content}</p>

                    {/* 리뷰 이미지 */}
                    {review.images && review.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {review.images.map((image, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                            <Image
                              src={image}
                              alt={`리뷰 이미지 ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* 업체 답변 (리뷰 수정 모드가 아닐 때만) */}
                {editingReview !== review.uuid && (
                  <>
                    {review.reply && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{companyName} 답변</p>
                            <p className="text-xs text-gray-500">
                              {review.repliedAt ? new Date(review.repliedAt).toLocaleDateString() : ''}
                            </p>
                          </div>
                          {isOwner && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setReplyingTo(review.uuid)
                                  setReplyContent(review.reply || '')
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleDeleteReply(review.uuid)}
                                className="text-sm text-red-600 hover:text-red-700"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{review.reply}</p>
                      </div>
                    )}

                    {/* 답변 작성/수정 폼 */}
                    {isOwner && replyingTo === review.uuid && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={4}
                          placeholder="답변을 입력하세요 (10-2000자)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setReplyingTo(null)
                              setReplyContent('')
                            }}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
                          >
                            취소
                          </button>
                          <button
                            onClick={() => handleSubmitReply(review.uuid, review.reply)}
                            className="px-3 py-1 text-sm bg-primary text-white rounded-lg"
                          >
                            {review.reply ? '수정' : '등록'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 답변 작성 버튼 */}
                    {isOwner && !review.reply && replyingTo !== review.uuid && (
                      <button
                        onClick={() => {
                          setReplyingTo(review.uuid)
                          setReplyContent('')
                        }}
                        className="mt-4 text-sm text-blue-600 hover:text-blue-700"
                      >
                        답변 작성하기
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
