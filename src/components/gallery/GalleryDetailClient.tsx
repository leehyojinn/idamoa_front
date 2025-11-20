'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiEdit, FiTrash2, FiBookmark, FiEye, FiTag, FiInfo, FiExternalLink } from 'react-icons/fi'
import { getGallery, deleteGallery, toggleBookmark, type Gallery } from '@/lib/api/gallery'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { useAuth } from '@/hooks/useAuth'
import { getProfile } from '@/lib/api/profile'
import { Dialog } from '@/components/ui/Dialog'

interface GalleryDetailClientProps {
  uuid: string
}

export default function GalleryDetailClient({ uuid }: GalleryDetailClientProps) {
  const router = useRouter()
  const { user } = useAuth()

  const [gallery, setGallery] = useState<Gallery | null>(null)

  // 이미지 URL 헬퍼 함수
  const getImageUrl = (url: string | undefined) => {
    if (!url) return ''
    // 이미 http로 시작하는 절대 경로면 그대로 반환
    if (url.startsWith('http')) return url
    // 상대 경로면 백엔드 서버 URL 붙이기
    return `http://43.203.237.51:8080${url}`
  }
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)

  // 이미지 뷰어
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showImageViewer, setShowImageViewer] = useState(false)

  useEffect(() => {
    fetchGallery()
  }, [uuid])

  const fetchGallery = async () => {
    setIsLoading(true)
    try {
      const result = await getGallery(uuid)
      if (result.success && result.data) {
        setGallery(result.data)
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        showErrorToast(error, '갤러리를 찾을 수 없습니다')
        router.push('/photos')
      } else {
        showErrorToast(error, '갤러리를 불러오는데 실패했습니다')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!gallery) return

    setIsDeleting(true)
    try {
      await deleteGallery(gallery.uuid)
      showSuccessToast('갤러리가 삭제되었습니다')
      router.push('/photos')
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

  const openImageViewer = (index: number) => {
    setSelectedImageIndex(index)
    setShowImageViewer(true)
  }

  const closeImageViewer = () => {
    setShowImageViewer(false)
  }

  const nextImage = () => {
    if (gallery && selectedImageIndex < gallery.images.length - 1) {
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
          href="/photos"
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
            href="/photos"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft />
            목록으로
          </Link>

          <div className="flex items-center gap-2">
            {user && (
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
            )}
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
                {(gallery.companyName || gallery.userName)?.charAt(0) || 'U'}
              </div>
              <span>{gallery.companyName || gallery.userName || '알 수 없음'}</span>
            </div>
            <div className="text-gray-400">
              {new Date(gallery.createdAt).toLocaleDateString('ko-KR')}
            </div>
          </div>

          {/* 태그 */}
          {gallery.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {gallery.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                >
                  <FiTag className="text-xs" />
                  {tag}
                </span>
              ))}
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
            사진 ({gallery.images.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gallery.images.map((image, index) => (
              <div
                key={image.uuid}
                onClick={() => openImageViewer(index)}
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              >
                <img
                  src={image.fileUrl}
                  alt={image.originalFilename}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
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

          {selectedImageIndex < gallery.images.length - 1 && (
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
            <img
              src={gallery.images[selectedImageIndex].fileUrl}
              alt={gallery.images[selectedImageIndex].originalFilename}
              className="max-w-full max-h-screen object-contain"
            />
            <div className="text-center mt-4 text-white">
              {selectedImageIndex + 1} / {gallery.images.length}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
