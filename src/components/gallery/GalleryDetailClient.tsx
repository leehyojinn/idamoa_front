'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FiArrowLeft, FiEdit, FiTrash2, FiBookmark, FiEye, FiTag, FiInfo, FiExternalLink, FiHeart, FiPhone, FiStar, FiFilter, FiSend } from 'react-icons/fi'
import { getGallery, deleteGallery, toggleBookmark, toggleLike, type Gallery } from '@/lib/api/gallery'
import { createReview, type CreateReviewRequest } from '@/lib/api/review'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { useAuth } from '@/hooks/useAuth'
import { getProfile } from '@/lib/api/profile'
import { Dialog } from '@/components/ui/Dialog'
import ImageUpload, { type ImageData } from '@/components/ui/ImageUpload'

interface GalleryDetailClientProps {
  uuid: string
  initialData?: Gallery
}

export default function GalleryDetailClient({ uuid, initialData }: GalleryDetailClientProps) {
  const router = useRouter()
  const { user } = useAuth()

  const [gallery, setGallery] = useState<Gallery | null>(initialData || null)

  // 이미지 URL 헬퍼 함수
  const getImageUrl = (url: string | undefined) => {
    if (!url) return ''
    // 이미 http로 시작하는 절대 경로면 그대로 반환
    if (url.startsWith('http')) return url
    // 상대 경로면 백엔드 서버 URL 붙이기
    return `http://43.203.237.51:8080${url}`
  }
  const [isLoading, setIsLoading] = useState(!initialData)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)
  const [isLiking, setIsLiking] = useState(false)

  // 리뷰 작성
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewContent, setReviewContent] = useState('')
  const [reviewImages, setReviewImages] = useState<ImageData[]>([])
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  // 이미지 뷰어
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showImageViewer, setShowImageViewer] = useState(false)

  const fetchGallery = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getGallery(uuid)
      if (result.success && result.data) {
        setGallery(result.data)
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        showErrorToast(error, '갤러리를 찾을 수 없습니다')
        router.push('/')
      } else {
        showErrorToast(error, '갤러리를 불러오는데 실패했습니다')
      }
    } finally {
      setIsLoading(false)
    }
  }, [uuid, router])

  useEffect(() => {
    // initialData가 있으면 fetch 건너뛰기 (SSR 데이터 사용)
    if (initialData) return
    fetchGallery()
  }, [fetchGallery, initialData])

  const handleDelete = async () => {
    if (!gallery) return

    setIsDeleting(true)
    try {
      await deleteGallery(gallery.uuid)
      showSuccessToast('갤러리가 삭제되었습니다')
      router.push('/')
    } catch (error: any) {
      if (error?.response?.status === 403) {
        showErrorToast(error, '삭제 권한이 없습니다')
      } else {
        showErrorToast(error, '갤러리 삭제에 실패했습니다')
      }
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleToggleBookmark = async () => {
    if (!gallery || !user) {
      showErrorToast(null, '로그인이 필요합니다')
      return
    }

    setIsBookmarking(true)
    try {
      const result = await toggleBookmark(gallery.uuid)
      if (result.success && result.data !== undefined) {
        // result.data는 직접 boolean 값 (true: 추가됨, false: 제거됨)
        const isBookmarked = result.data
        setGallery({
          ...gallery,
          isBookmarked: isBookmarked,
        })
        showSuccessToast(isBookmarked ? '북마크에 추가했습니다' : '북마크에서 제거했습니다')
      }
    } catch (error) {
      showErrorToast(error, '북마크 처리에 실패했습니다')
    } finally {
      setIsBookmarking(false)
    }
  }

  const handleToggleLike = async () => {
    if (!gallery || !user) {
      showErrorToast(null, '로그인이 필요합니다')
      return
    }

    setIsLiking(true)
    try {
      const result = await toggleLike(gallery.uuid)
      if (result.success && result.data !== undefined) {
        const isLiked = result.data
        setGallery({
          ...gallery,
          isLiked: isLiked,
          likeCount: isLiked ? gallery.likeCount + 1 : gallery.likeCount - 1,
        })
        showSuccessToast(isLiked ? '좋아요를 눌렀습니다' : '좋아요를 취소했습니다')
      }
    } catch (error) {
      showErrorToast(error, '좋아요 처리에 실패했습니다')
    } finally {
      setIsLiking(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!gallery?.company?.companyUuid) {
      showErrorToast(null, '업체 정보가 없어 리뷰를 작성할 수 없습니다')
      return
    }

    if (!user) {
      showErrorToast(null, '로그인이 필요합니다')
      return
    }

    if (!reviewContent.trim()) {
      showErrorToast(null, '리뷰 내용을 입력해주세요')
      return
    }

    if (reviewContent.trim().length < 10) {
      showErrorToast(null, '리뷰 내용은 최소 10자 이상이어야 합니다')
      return
    }

    setIsSubmittingReview(true)
    try {
      const result = await createReview(gallery.company.companyUuid, {
        rating: reviewRating,
        content: reviewContent.trim(),
        imageUuids: reviewImages.length > 0 ? reviewImages.map(img => img.uuid) : undefined,
      })

      if (result.success) {
        showSuccessToast('리뷰가 등록되었습니다')
        setReviewContent('')
        setReviewRating(5)
        setReviewImages([])
        setShowReviewForm(false)
        // 갤러리 새로고침하여 리뷰 목록 업데이트
        fetchGallery()
      }
    } catch (error) {
      showErrorToast(error, '리뷰 등록에 실패했습니다')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const openImageViewer = (index: number) => {
    setSelectedImageIndex(index)
    setShowImageViewer(true)
  }

  const closeImageViewer = () => {
    setShowImageViewer(false)
  }

  const nextImage = () => {
    if (gallery && gallery.images && selectedImageIndex < gallery.images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1)
    }
  }

  const prevImage = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-4 text-gray-600">갤러리를 불러오는 중...</p>
      </div>
    )
  }

  if (!gallery) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <p className="text-gray-500 text-lg">갤러리를 찾을 수 없습니다.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-6 text-blue-600 hover:text-blue-700"
        >
          <FiArrowLeft />
          목록으로 돌아가기
        </Link>
      </div>
    )
  }

  const isAuthor = user?.email === gallery.userEmail

  return (
    <>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft />
            목록으로
          </Link>

          <div className="flex items-center gap-2">
            {/* 좋아요 버튼 - 항상 표시 */}
            <button
              onClick={handleToggleLike}
              disabled={isLiking}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                gallery.isLiked
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiHeart className={gallery.isLiked ? 'fill-current' : ''} />
              {gallery.likeCount}
            </button>
            {/* 북마크 버튼 - 항상 표시 */}
            <button
              onClick={handleToggleBookmark}
              disabled={isBookmarking}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                gallery.isBookmarked
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiBookmark className={gallery.isBookmarked ? 'fill-current' : ''} />
              북마크
            </button>
            {isAuthor && (
              <>
                <Link
                  href={`/photos/${gallery.uuid}/edit`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <FiEdit />
                  수정
                </Link>
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <FiTrash2 />
                  삭제
                </button>
              </>
            )}
          </div>
        </div>

        {/* 갤러리 정보 */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{gallery.title}</h1>
            <p className="text-gray-600 whitespace-pre-wrap">{gallery.content || ''}</p>
          </div>

          {/* 메타 정보 */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 pb-6 border-b border-gray-200">
            {gallery.relatedLink && (
              <a
                href={gallery.relatedLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
              >
                <FiExternalLink />
                관련 링크
              </a>
            )}
            <div className="flex items-center gap-1">
              <FiEye />
              {gallery.viewCount} 조회
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                {(gallery.company?.companyName || gallery.userName)?.charAt(0) || 'U'}
              </div>
              <span>{gallery.company?.companyName || gallery.userName || '알 수 없음'}</span>
            </div>
            <div className="text-gray-400">
              {new Date(gallery.createdAt).toLocaleDateString('ko-KR')}
            </div>
          </div>

          {/* 필터 옵션 */}
          {gallery.filterOptions && gallery.filterOptions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FiFilter />
                <span>필터</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {gallery.filterOptions.map(filter => (
                  <span
                    key={filter.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-700"
                  >
                    {filter.icon && <span>{filter.icon}</span>}
                    {filter.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 태그 */}
          {gallery.tags && gallery.tags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FiTag />
                <span>태그</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {gallery.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 저작권 정보 */}
          {gallery.copyright && gallery.copyright.owner && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <FiInfo className="mt-0.5" />
                <div>
                  <span className="font-semibold">저작권 정보:</span>
                  <p className="mt-1">{gallery.copyright.owner}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 이미지 갤러리 */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            사진 ({gallery.images?.length || 0})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(gallery.images || []).map((image, index) => (
              <div
                key={image.uuid}
                onClick={() => openImageViewer(index)}
                className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              >
                <Image
                  src={image.fileUrl}
                  alt={image.originalFilename}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 업체 정보 */}
        {gallery.company && (
          <div className="bg-blue-50 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">시공 업체</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-blue-800">{gallery.company.companyName}</p>
                <p className="flex items-center gap-2 text-blue-600 mt-1">
                  <FiPhone />
                  {gallery.company.phone}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/companies/${gallery.company.companyUuid}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  업체 상세보기
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 리뷰 섹션 */}
        {gallery.company && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                고객 리뷰 {gallery.reviews && gallery.reviews.length > 0 && `(${gallery.reviews.length})`}
              </h2>
              {user && !showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  리뷰 작성
                </button>
              )}
            </div>

            {/* 리뷰 작성 폼 */}
            {showReviewForm && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">평점</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="text-2xl transition-colors"
                      >
                        <FiStar
                          className={star <= reviewRating ? 'fill-current text-yellow-500' : 'text-gray-300'}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">{reviewRating}점</span>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    리뷰 내용 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="서비스 이용 후기를 작성해주세요 (최소 10자)"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <p className="mt-1 text-sm text-gray-500">{reviewContent.length} / 5000</p>
                </div>
                <div className="mb-4">
                  <ImageUpload
                    label="리뷰 이미지 (선택사항)"
                    value={reviewImages}
                    onChange={(data) => setReviewImages(Array.isArray(data) ? data : data ? [data] : [])}
                    multiple={true}
                    maxFiles={5}
                    entityType="REVIEW"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowReviewForm(false)
                      setReviewContent('')
                      setReviewRating(5)
                      setReviewImages([])
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={isSubmittingReview || !reviewContent.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FiSend />
                    {isSubmittingReview ? '등록 중...' : '리뷰 등록'}
                  </button>
                </div>
              </div>
            )}

            {/* 리뷰 목록 */}
            {gallery.reviews && gallery.reviews.length > 0 ? (
              <div className="space-y-4">
                {gallery.reviews.map((review) => (
                  <div key={review.reviewUuid} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{review.userName}</span>
                        <div className="flex items-center text-yellow-500">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={i < Math.round(review.rating) ? 'fill-current' : ''}
                            />
                          ))}
                          <span className="ml-1 text-sm text-gray-600">{review.rating}</span>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <p className="text-gray-700">{review.content}</p>

                    {/* 리뷰 이미지 */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {review.images.map((image) => (
                          <div key={image.uuid} className="relative w-16 h-16 rounded overflow-hidden">
                            <Image src={image.fileUrl} alt="" fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 업체 답변 */}
                    {review.reply && (
                      <div className="mt-3 pl-4 border-l-2 border-blue-300 bg-blue-50 p-3 rounded">
                        <p className="text-sm text-blue-800 font-semibold mb-1">업체 답변</p>
                        <p className="text-sm text-gray-700">{review.reply}</p>
                        {review.repliedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(review.repliedAt).toLocaleDateString('ko-KR')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!</p>
            )}
          </div>
        )}
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <div
          className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">갤러리 삭제</h3>
          <div className="space-y-4">
            <p className="text-gray-600">
              정말로 이 갤러리를 삭제하시겠습니까?
              <br />
              삭제된 갤러리는 복구할 수 없습니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* 이미지 뷰어 */}
      {showImageViewer && gallery.images[selectedImageIndex] && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={closeImageViewer}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              closeImageViewer()
            }}
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
          >
            ×
          </button>

          {selectedImageIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                prevImage()
              }}
              className="absolute left-4 text-white text-4xl hover:text-gray-300"
            >
              ‹
            </button>
          )}

          {gallery.images && selectedImageIndex < gallery.images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                nextImage()
              }}
              className="absolute right-4 text-white text-4xl hover:text-gray-300"
            >
              ›
            </button>
          )}

          <div
            className="max-w-7xl max-h-screen p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={gallery.images[selectedImageIndex].fileUrl}
              alt={gallery.images[selectedImageIndex].originalFilename}
              width={1920}
              height={1080}
              className="max-w-full max-h-screen object-contain"
              unoptimized
            />
            <div className="text-center mt-4 text-white">
              {selectedImageIndex + 1} / {gallery.images?.length || 0}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
