'use client'

import { useState, useEffect, use, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  FiArrowLeft,
  FiHeart,
  FiBookmark,
  FiShare2,
  FiEye,
  FiCalendar,
  FiMapPin,
  FiPhone,
  FiMail,
  FiEdit2,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiStar,
  FiVideo,
  FiClock,
  FiDollarSign,
  FiHome,
  FiExternalLink,
} from 'react-icons/fi'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CompanyReviewsWrapper from '@/components/company/CompanyReviewsWrapper'
import {
  getPortfolio,
  deletePortfolio,
  toggleLike,
  toggleBookmark,
  type Portfolio,
} from '@/lib/api/portfolio'
import { useAuth } from '@/hooks/useAuth'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { getCdnUrl } from '@/lib/utils'

interface Props {
  params: Promise<{ uuid: string }>
}

export default function PortfolioDetailPage({ params }: Props) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showImageModal, setShowImageModal] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  // 썸네일 스크롤 관련
  const thumbnailContainerRef = useRef<HTMLDivElement>(null)
  const modalThumbnailContainerRef = useRef<HTMLDivElement>(null)
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [hasDragged, setHasDragged] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setIsLoading(true)
        const response = await getPortfolio(resolvedParams.uuid)
        if (response.success && response.data) {
          setPortfolio(response.data)
          setIsLiked(response.data.isLiked ?? false)
          setIsBookmarked(response.data.isBookmarked ?? false)
          setLikeCount(response.data.likeCount ?? 0)
        }
      } catch (error) {
        showErrorToast(error, '포트폴리오를 불러오는데 실패했습니다')
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPortfolio()
  }, [resolvedParams.uuid, router])

  const handleLike = async () => {
    if (!user) {
      showErrorToast(null, '로그인이 필요합니다')
      router.push('/login')
      return
    }

    try {
      const response = await toggleLike(resolvedParams.uuid)
      if (response.success) {
        const newIsLiked = response.data || false
        setIsLiked(newIsLiked)
        setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1)
        showSuccessToast(newIsLiked ? '좋아요를 눌렀습니다' : '좋아요를 취소했습니다')
      }
    } catch (error) {
      showErrorToast(error, '좋아요 처리에 실패했습니다')
    }
  }

  const handleBookmark = async () => {
    if (!user) {
      showErrorToast(null, '로그인이 필요합니다')
      router.push('/login')
      return
    }

    try {
      const response = await toggleBookmark(resolvedParams.uuid)
      if (response.success) {
        setIsBookmarked(response.data || false)
        showSuccessToast(response.data ? '북마크에 추가했습니다' : '북마크에서 제거했습니다')
      }
    } catch (error) {
      showErrorToast(error, '북마크 처리에 실패했습니다')
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: portfolio?.title,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      showSuccessToast('링크가 복사되었습니다')
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말로 이 포트폴리오를 삭제하시겠습니까?')) return

    try {
      await deletePortfolio(resolvedParams.uuid)
      showSuccessToast('포트폴리오가 삭제되었습니다')
      router.push('/')
    } catch (error) {
      showErrorToast(error, '삭제에 실패했습니다')
    }
  }

  const handlePrevImage = () => {
    if (!portfolio?.images) return
    setCurrentImageIndex(prev =>
      prev === 0 ? portfolio.images.length - 1 : prev - 1
    )
  }

  const handleNextImage = () => {
    if (!portfolio?.images) return
    setCurrentImageIndex(prev =>
      prev === portfolio.images.length - 1 ? 0 : prev + 1
    )
  }

  // 현재 이미지로 썸네일 스크롤
  useEffect(() => {
    const scrollToThumbnail = (container: HTMLDivElement | null) => {
      if (!container) return
      const thumbnails = container.children
      if (thumbnails[currentImageIndex]) {
        const thumbnail = thumbnails[currentImageIndex] as HTMLElement
        const containerWidth = container.offsetWidth
        const thumbnailLeft = thumbnail.offsetLeft
        const thumbnailWidth = thumbnail.offsetWidth
        const scrollPosition = thumbnailLeft - (containerWidth / 2) + (thumbnailWidth / 2)
        container.scrollTo({ left: scrollPosition, behavior: 'smooth' })
      }
    }
    scrollToThumbnail(thumbnailContainerRef.current)
    scrollToThumbnail(modalThumbnailContainerRef.current)
  }, [currentImageIndex])

  // 드래그 스크롤 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent, container: HTMLDivElement | null) => {
    if (!container) return
    setIsMouseDown(true)
    setHasDragged(false)
    setStartX(e.pageX - container.offsetLeft)
    setScrollLeft(container.scrollLeft)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent, container: HTMLDivElement | null) => {
    if (!isMouseDown || !container) return
    const x = e.pageX - container.offsetLeft
    const walk = x - startX
    // 5px 이상 움직였을 때만 드래그로 인식
    if (Math.abs(walk) > 5) {
      setHasDragged(true)
      container.style.cursor = 'grabbing'
    }
    if (hasDragged) {
      e.preventDefault()
      container.scrollLeft = scrollLeft - walk * 1.5
    }
  }, [isMouseDown, startX, scrollLeft, hasDragged])

  const handleMouseUp = useCallback((container: HTMLDivElement | null) => {
    setIsMouseDown(false)
    if (container) container.style.cursor = 'grab'
    // hasDragged는 클릭 핸들러에서 확인 후 리셋
    setTimeout(() => setHasDragged(false), 0)
  }, [])

  const handleMouseLeave = useCallback((container: HTMLDivElement | null) => {
    setIsMouseDown(false)
    setHasDragged(false)
    if (container) container.style.cursor = 'grab'
  }, [])

  // TODO: 서버에서 isOwner 반환하면 해당 값 사용
  // 현재는 관리자이거나 COMPANY 역할이면 수정/삭제 버튼 표시 (서버에서 권한 체크됨)
  const isOwner = user?.currentRole === 'ADMIN' || user?.currentRole === 'COMPANY'

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!portfolio) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-4">포트폴리오를 찾을 수 없습니다</p>
            <Link href="/" className="text-blue-600 hover:text-blue-700">
              메인으로 돌아가기
            </Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        {/* 뒤로가기 & 액션 버튼 */}
        <div className="bg-white border-b sticky top-0 z-30">
          <div className="container mx-auto px-4 py-3 max-w-6xl">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">돌아가기</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                    isLiked
                      ? 'bg-red-50 text-red-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <FiHeart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{likeCount}</span>
                </button>
                <button
                  onClick={handleBookmark}
                  className={`p-2 rounded-lg transition-colors ${
                    isBookmarked
                      ? 'bg-yellow-50 text-yellow-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <FiBookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <FiShare2 className="w-5 h-5" />
                </button>
                {(portfolio.company?.companyUuid || portfolio.company?.uuid) && (
                  <Link
                    href={`/?tab=portfolio&companyUuid=${portfolio.company.companyUuid || portfolio.company.uuid}&companyName=${encodeURIComponent(portfolio.company.companyName || '')}`}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <FiExternalLink className="w-4 h-4" />
                    <span className="text-sm font-medium">이 업체만 보기</span>
                  </Link>
                )}
                {isOwner && (
                  <>
                    <Link
                      href={`/portfolios/${portfolio.uuid}/edit`}
                      className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <FiEdit2 className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={handleDelete}
                      className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 왼쪽: 이미지 갤러리 */}
            <div className="lg:col-span-2">
              {/* 메인 이미지 */}
              <div
                className="relative aspect-[4/3] bg-gray-200 rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => setShowImageModal(true)}
              >
                {portfolio.images && portfolio.images.length > 0 ? (
                  <>
                    <Image
                      src={getCdnUrl(portfolio.images[currentImageIndex]?.fileUrl) || '/images/img-placeholder.png'}
                      alt={portfolio.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      className="object-cover"
                      priority={currentImageIndex === 0}
                      loading={currentImageIndex === 0 ? 'eager' : 'lazy'}
                    />
                    {/* 이미지 네비게이션 */}
                    {portfolio.images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePrevImage()
                          }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNextImage()
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiChevronRight className="w-6 h-6" />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                          {currentImageIndex + 1} / {portfolio.images.length}
                        </div>
                      </>
                    )}
                    {/* 우대 배지 */}
                    {portfolio.promotion && (
                      <span className={`absolute top-4 left-4 px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                        portfolio.promotion.promotionType === 'PREMIUM'
                          ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                      }`}>
                        {portfolio.promotion.promotionType === 'PREMIUM' ? 'PREMIUM' : '추천'}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    이미지가 없습니다
                  </div>
                )}
              </div>

              {/* 썸네일 리스트 */}
              {portfolio.images && portfolio.images.length > 1 && (
                <div
                  ref={thumbnailContainerRef}
                  className="flex gap-2 mt-4 overflow-x-auto pb-2 cursor-grab select-none scrollbar-hide"
                  onMouseDown={(e) => handleMouseDown(e, thumbnailContainerRef.current)}
                  onMouseMove={(e) => handleMouseMove(e, thumbnailContainerRef.current)}
                  onMouseUp={() => handleMouseUp(thumbnailContainerRef.current)}
                  onMouseLeave={() => handleMouseLeave(thumbnailContainerRef.current)}
                >
                  {portfolio.images.map((image, index) => (
                    <button
                      key={image.uuid}
                      onClick={() => !hasDragged && setCurrentImageIndex(index)}
                      className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                        index === currentImageIndex
                          ? 'ring-2 ring-blue-600 scale-105'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={getCdnUrl(image.thumbnailUrl || image.fileUrl) || '/images/img-placeholder.png'}
                        alt={`${portfolio.title} ${index + 1}`}
                        fill
                        sizes="80px"
                        className="object-cover pointer-events-none"
                        loading="lazy"
                        draggable={false}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* 포트폴리오 정보 */}
              <div className="bg-white rounded-2xl p-6 mt-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  {portfolio.title}
                </h1>

                {/* 메타 정보 */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
                  <span className="flex items-center gap-1.5">
                    <FiEye className="w-4 h-4" />
                    조회 {portfolio.viewCount}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FiHeart className="w-4 h-4" />
                    좋아요 {likeCount}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FiCalendar className="w-4 h-4" />
                    {new Date(portfolio.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                {/* 태그 */}
                {portfolio.tags && portfolio.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {portfolio.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 설명 */}
                {portfolio.description && (
                  <div className="prose max-w-none text-gray-700">
                    <p className="whitespace-pre-wrap">{portfolio.description}</p>
                  </div>
                )}

                {/* 상세 내용 */}
                {portfolio.content && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-3">상세 내용</h3>
                    <div className="prose max-w-none text-gray-700">
                      <p className="whitespace-pre-wrap">{portfolio.content}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 영상 섹션 */}
              {portfolio.videos && portfolio.videos.length > 0 && (
                <div className="bg-white rounded-2xl p-6 mt-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FiVideo className="w-5 h-5" />
                    영상 ({portfolio.videos.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {portfolio.videos.map((video, index) => (
                      <div key={video.uuid} className="aspect-video bg-gray-900 rounded-xl overflow-hidden">
                        <video
                          src={getCdnUrl(video.fileUrl)}
                          controls
                          className="w-full h-full object-contain"
                          poster={getCdnUrl(portfolio.thumbnailUrl) || undefined}
                        >
                          <source src={getCdnUrl(video.fileUrl)} type={video.mimeType} />
                          브라우저가 비디오를 지원하지 않습니다.
                        </video>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 프로젝트 정보 */}
              {(portfolio.projectType || portfolio.projectScale || portfolio.projectDuration || portfolio.projectDate || portfolio.budgetRange || portfolio.actualCost) && (
                <div className="bg-white rounded-2xl p-6 mt-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">프로젝트 정보</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {portfolio.projectType && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                          <FiHome className="w-4 h-4" />
                          프로젝트 유형
                        </div>
                        <p className="font-semibold text-gray-900">{portfolio.projectType}</p>
                      </div>
                    )}
                    {portfolio.projectScale && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                          <FiHome className="w-4 h-4" />
                          프로젝트 규모
                        </div>
                        <p className="font-semibold text-gray-900">
                          {portfolio.projectScale === 'SMALL' && '소형 (10평 미만)'}
                          {portfolio.projectScale === 'MEDIUM' && '중형 (10~30평)'}
                          {portfolio.projectScale === 'LARGE' && '대형 (30~50평)'}
                          {portfolio.projectScale === 'XLARGE' && '초대형 (50평 이상)'}
                        </p>
                      </div>
                    )}
                    {portfolio.projectDuration && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                          <FiClock className="w-4 h-4" />
                          시공 기간
                        </div>
                        <p className="font-semibold text-gray-900">{portfolio.projectDuration}일</p>
                      </div>
                    )}
                    {portfolio.projectDate && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                          <FiCalendar className="w-4 h-4" />
                          시공 완료일
                        </div>
                        <p className="font-semibold text-gray-900">
                          {new Date(portfolio.projectDate).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    )}
                    {portfolio.budgetRange && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                          <FiDollarSign className="w-4 h-4" />
                          예산 범위
                        </div>
                        <p className="font-semibold text-gray-900">
                          {(() => {
                            const [min, max] = portfolio.budgetRange.split('~')
                            const minVal = parseInt(min) || 0
                            const maxVal = parseInt(max) || null
                            if (maxVal) {
                              return `${minVal.toLocaleString()}만원 ~ ${maxVal.toLocaleString()}만원`
                            }
                            return `${minVal.toLocaleString()}만원 이상`
                          })()}
                        </p>
                      </div>
                    )}
                    {portfolio.actualCost && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                          <FiDollarSign className="w-4 h-4" />
                          실제 비용
                        </div>
                        <p className="font-semibold text-gray-900">{portfolio.actualCost.toLocaleString()}만원</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 리뷰 섹션 */}
              {portfolio.company && (portfolio.company.uuid || portfolio.company.companyUuid) && (
                <div className="bg-white rounded-2xl p-6 mt-6">
                  <CompanyReviewsWrapper
                    companyUuid={portfolio.company.uuid || portfolio.company.companyUuid || ''}
                    companyName={portfolio.company.companyName}
                    companyOwnerEmail={portfolio.company.contactEmail || ''}
                  />
                </div>
              )}
            </div>

            {/* 오른쪽: 업체 정보 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 sticky top-20">
                {portfolio.company ? (
                  <>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                        {portfolio.company.logoUrl ? (
                          <Image
                            src={getCdnUrl(portfolio.company.logoUrl) || '/images/img-placeholder.png'}
                            alt={portfolio.company.companyName}
                            width={64}
                            height={64}
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-gray-400">
                            {portfolio.company.companyName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          {portfolio.company.companyName}
                        </h3>
                        {portfolio.company.averageRating && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                            <FiStar className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span>{portfolio.company.averageRating.toFixed(1)}</span>
                            <span className="text-gray-400">
                              ({portfolio.company.reviewCount}개 리뷰)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {portfolio.company.address && (
                        <div className="flex items-start gap-3 text-sm">
                          <FiMapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">{portfolio.company.address}</span>
                        </div>
                      )}
                      {portfolio.company.contactPhone && (
                        <div className="flex items-center gap-3 text-sm">
                          <FiPhone className="w-4 h-4 text-gray-400" />
                          <a
                            href={`tel:${portfolio.company.contactPhone}`}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {portfolio.company.contactPhone}
                          </a>
                        </div>
                      )}
                      {portfolio.company.contactEmail && (
                        <div className="flex items-center gap-3 text-sm">
                          <FiMail className="w-4 h-4 text-gray-400" />
                          <a
                            href={`mailto:${portfolio.company.contactEmail}`}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {portfolio.company.contactEmail}
                          </a>
                        </div>
                      )}
                    </div>

                    {(portfolio.company.slug || portfolio.company.uuid || portfolio.company.companyUuid) && (
                      <Link
                        href={`/companies/${portfolio.company.slug || portfolio.company.uuid || portfolio.company.companyUuid}`}
                        className="block w-full py-3 text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                      >
                        업체 상세보기
                      </Link>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-8">업체 정보가 없습니다</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 이미지 모달 */}
      {showImageModal && portfolio.images && portfolio.images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black">
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
            {currentImageIndex + 1} / {portfolio.images.length}
          </div>

          <div className="h-full flex items-center justify-center p-4">
            <Image
              src={getCdnUrl(portfolio.images[currentImageIndex]?.fileUrl) || '/images/img-placeholder.png'}
              alt={portfolio.title}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          {portfolio.images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <FiChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <FiChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* 하단 썸네일 */}
          <div
            ref={modalThumbnailContainerRef}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto px-4 cursor-grab select-none scrollbar-hide"
            onMouseDown={(e) => handleMouseDown(e, modalThumbnailContainerRef.current)}
            onMouseMove={(e) => handleMouseMove(e, modalThumbnailContainerRef.current)}
            onMouseUp={() => handleMouseUp(modalThumbnailContainerRef.current)}
            onMouseLeave={() => handleMouseLeave(modalThumbnailContainerRef.current)}
          >
            {portfolio.images.map((image, index) => (
              <button
                key={image.uuid}
                onClick={() => !hasDragged && setCurrentImageIndex(index)}
                className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                  index === currentImageIndex
                    ? 'ring-2 ring-white scale-110'
                    : 'opacity-50 hover:opacity-100'
                }`}
              >
                <Image
                  src={getCdnUrl(image.thumbnailUrl || image.fileUrl) || '/images/img-placeholder.png'}
                  alt={`${portfolio.title} ${index + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover pointer-events-none"
                  loading="lazy"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}
