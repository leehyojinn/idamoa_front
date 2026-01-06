'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FiArrowLeft, FiStar, FiEye, FiHeart, FiCalendar, FiEdit, FiRefreshCw } from 'react-icons/fi'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuthStore } from '@/stores/authStore'
import { getMyPromotedGalleries } from '@/lib/api/gallery-promotion'
import { showErrorToast } from '@/lib/errorHandler'
import type { GalleryImage } from '@/lib/api/gallery'
import type { GalleryPromotion } from '@/lib/api/gallery-promotion'

interface PromotedGalleryItem {
  uuid: string
  title: string
  images: GalleryImage[]
  promotion: GalleryPromotion
}

export default function PromotedGalleriesPage() {
  const router = useRouter()
  const { accessToken, _hasHydrated } = useAuthStore()
  const [galleries, setGalleries] = useState<PromotedGalleryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    if (!_hasHydrated) return

    if (!accessToken) {
      showErrorToast(null, '로그인이 필요합니다')
      router.push('/login')
      return
    }

    fetchPromotedGalleries()
  }, [accessToken, _hasHydrated, page])

  const fetchPromotedGalleries = async () => {
    try {
      setIsLoading(true)
      const response = await getMyPromotedGalleries({ page, size: 12 })
      if (response.success && response.data) {
        setGalleries(response.data.content)
        setTotalPages(response.data.totalPages)
      }
    } catch (error) {
      showErrorToast(error, '우대 갤러리 목록을 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const getPromotionTypeLabel = (type: string) => {
    switch (type) {
      case 'PREMIUM':
        return { label: '강력우대', color: 'bg-yellow-100 text-yellow-800' }
      case 'STANDARD':
        return { label: '일반우대', color: 'bg-primary-100 text-primary-800' }
      default:
        return { label: type, color: 'bg-gray-100 text-gray-800' }
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { label: '활성', color: 'bg-green-100 text-green-800' }
      case 'EXPIRED':
        return { label: '만료', color: 'bg-gray-100 text-gray-800' }
      case 'CANCELLED':
        return { label: '취소됨', color: 'bg-red-100 text-red-800' }
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800' }
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FiStar className="text-yellow-500" />
                내 우대 갤러리
              </h1>
              <p className="text-gray-600 mt-1">우대등록 중인 포트폴리오 목록입니다</p>
            </div>
          </div>
          <button
            onClick={fetchPromotedGalleries}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiRefreshCw className="w-4 h-4" />
            새로고침
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : galleries.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg mb-4">우대등록 중인 갤러리가 없습니다</p>
            <Link
              href="/photos/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-800 transition-colors"
            >
              포트폴리오 등록하기
            </Link>
          </div>
        ) : (
          <>
            {/* 갤러리 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleries.map((gallery) => {
                const typeInfo = getPromotionTypeLabel(gallery.promotion.promotionType)
                const statusInfo = getStatusLabel(gallery.promotion.status)
                const thumbnailUrl = gallery.images[0]?.thumbnailUrl || gallery.images[0]?.fileUrl || '/images/img-placeholder.png'

                return (
                  <div
                    key={gallery.uuid}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* 썸네일 */}
                    <div className="relative aspect-video">
                      <Image
                        src={thumbnailUrl}
                        alt={gallery.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* 콘텐츠 */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 line-clamp-1 mb-3">
                        {gallery.title}
                      </h3>

                      {/* 우대 정보 */}
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <FiCalendar className="w-4 h-4" />
                          <span>{gallery.promotion.startDate} ~ {gallery.promotion.endDate}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>월 가격</span>
                          <span className="font-medium text-gray-900">
                            {gallery.promotion.monthlyPrice.toLocaleString()}원
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>가중치</span>
                          <span className="font-medium text-gray-900">{gallery.promotion.weight}x</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>자동갱신</span>
                          <span className={`font-medium ${gallery.promotion.autoRenew ? 'text-green-600' : 'text-gray-500'}`}>
                            {gallery.promotion.autoRenew ? 'ON' : 'OFF'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>남은 기간</span>
                          <span className={`font-bold ${
                            gallery.promotion.remainingDays <= 3
                              ? 'text-red-600'
                              : gallery.promotion.remainingDays <= 7
                                ? 'text-yellow-600'
                                : 'text-green-600'
                          }`}>
                            {gallery.promotion.remainingDays}일
                          </span>
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex gap-2">
                        <Link
                          href={`/photos/${gallery.uuid}`}
                          className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-center text-sm font-medium transition-colors"
                        >
                          보기
                        </Link>
                        <Link
                          href={`/photos/${gallery.uuid}/edit`}
                          className="flex-1 py-2 px-4 bg-primary hover:bg-primary-800 text-white rounded-lg text-center text-sm font-medium transition-colors flex items-center justify-center gap-1"
                        >
                          <FiEdit className="w-4 h-4" />
                          관리
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  이전
                </button>
                <span className="px-4 py-2 text-gray-600">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
